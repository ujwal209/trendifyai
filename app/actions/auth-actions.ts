"use server";

import { cookies } from "next/headers";
import nodemailer from "nodemailer";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: process.env.SMTP_PORT === "465" || process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

// Securely hash password using Web Crypto API with email as salt
async function hashPassword(password: string, email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + email.toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateSessionToken(): string {
  return crypto.randomUUID();
}

// ─────────────── OTP / SIGNUP ───────────────

export async function sendOtpAction(email: string, password?: string) {
  try {
    const db = await getDb();
    const emailLower = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await db.collection("users").findOne({ email: emailLower });
    if (existing) {
      return { success: false, error: "An account with this email already exists." };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    let pendingPasswordHash: string | undefined;
    if (password) {
      pendingPasswordHash = await hashPassword(password, emailLower);
    }

    // Upsert OTP record
    await db.collection("otps").updateOne(
      { email: emailLower, type: "signup" },
      {
        $set: {
          email: emailLower,
          code,
          expiresAt,
          type: "signup",
          pendingPasswordHash,
          createdAt: Date.now(),
        },
      },
      { upsert: true }
    );

    const smtpUser = process.env.SMTP_USER || "";
    const smtpPass = process.env.SMTP_PASS || "";
    const isSmtpConfigured =
      smtpUser &&
      smtpUser !== "your-gmail-address@gmail.com" &&
      smtpPass &&
      smtpPass !== "your-google-app-password";

    if (isSmtpConfigured) {
      await transporter.sendMail({
        from: `"Trendify Support" <${smtpUser}>`,
        to: emailLower,
        subject: "Trendify Email Verification Code",
        html: `
          <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #0f172a;">
            <h2 style="color: #4f46e5; text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 24px;">Welcome to Trendify!</h2>
            <p style="font-size: 16px; line-height: 1.5; color: #334155;">Thank you for signing up. Please verify your email address to complete your registration. Use the following 6-digit verification code:</p>
            <div style="text-align: center; margin: 32px 0;">
              <span style="font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4f46e5; background-color: #f1f5f9; padding: 16px 32px; border-radius: 8px; display: inline-block;">${code}</span>
            </div>
            <p style="font-size: 14px; line-height: 1.5; color: #64748b; text-align: center;">This code will expire in 10 minutes. If you did not make this request, you can safely ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 12px; color: #94a3b8; text-align: center;">Trendify Price Comparator - Compare Prices Instantly</p>
          </div>
        `,
      });
    } else {
      console.log(`\n========================================\n[AUTH OTP] Signup code for ${emailLower}: ${code}\n========================================\n`);
    }

    return {
      success: true,
      email: emailLower,
      deliveryMethod: isSmtpConfigured ? "email" : "console",
    };
  } catch (error: any) {
    console.error("Error in sendOtpAction:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

export async function verifyOtpAction(email: string, code: string) {
  try {
    const db = await getDb();
    const emailLower = email.toLowerCase().trim();

    const otpRecord = await db.collection("otps").findOne({
      email: emailLower,
      type: "signup",
    });

    if (!otpRecord) return { success: false, error: "No OTP found. Please request a new one." };
    if (Date.now() > otpRecord.expiresAt) return { success: false, error: "OTP has expired. Please request a new one." };
    if (otpRecord.code !== code) return { success: false, error: "Invalid verification code." };

    if (!otpRecord.pendingPasswordHash) {
      return { success: false, error: "Missing password hash. Please try signing up again." };
    }

    // Register user
    const now = Date.now();
    const userResult = await db.collection("users").insertOne({
      email: emailLower,
      onboarded: false,
      createdAt: now,
    });

    await db.collection("auth").insertOne({
      userId: userResult.insertedId,
      passwordHash: otpRecord.pendingPasswordHash,
      createdAt: now,
    });

    // Delete OTP record
    await db.collection("otps").deleteOne({ email: emailLower, type: "signup" });

    // Create session
    const token = generateSessionToken();
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    await db.collection("sessions").insertOne({
      userId: userResult.insertedId,
      token,
      expiresAt,
    });

    const cookieStore = await cookies();
    cookieStore.set("trendify_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return { success: true, userId: userResult.insertedId.toString(), onboarded: false };
  } catch (error: any) {
    console.error("Error in verifyOtpAction:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

export async function loginAction(email: string, password?: string) {
  try {
    const db = await getDb();
    const emailLower = email.toLowerCase().trim();

    if (!password) return { success: false, error: "Password is required" };

    const user = await db.collection("users").findOne({ email: emailLower });
    if (!user) return { success: false, error: "Invalid email or password." };

    const authRecord = await db.collection("auth").findOne({ userId: user._id });
    if (!authRecord) return { success: false, error: "Invalid email or password." };

    const inputHash = await hashPassword(password, emailLower);
    if (inputHash !== authRecord.passwordHash) {
      return { success: false, error: "Invalid email or password." };
    }

    // Delete old sessions for this user
    await db.collection("sessions").deleteMany({ userId: user._id });

    // Create session
    const token = generateSessionToken();
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    await db.collection("sessions").insertOne({ userId: user._id, token, expiresAt });

    const cookieStore = await cookies();
    cookieStore.set("trendify_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return { success: true, userId: user._id.toString(), onboarded: user.onboarded };
  } catch (error: any) {
    console.error("Error in loginAction:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

export async function sendResetOtpAction(email: string) {
  try {
    const db = await getDb();
    const emailLower = email.toLowerCase().trim();

    const user = await db.collection("users").findOne({ email: emailLower });
    if (!user) return { success: false, error: "No account found with this email address." };

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;

    await db.collection("otps").updateOne(
      { email: emailLower, type: "reset" },
      { $set: { email: emailLower, code, expiresAt, type: "reset", createdAt: Date.now() } },
      { upsert: true }
    );

    const smtpUser = process.env.SMTP_USER || "";
    const smtpPass = process.env.SMTP_PASS || "";
    const isSmtpConfigured =
      smtpUser &&
      smtpUser !== "your-gmail-address@gmail.com" &&
      smtpPass &&
      smtpPass !== "your-google-app-password";

    if (isSmtpConfigured) {
      await transporter.sendMail({
        from: `"Trendify Support" <${smtpUser}>`,
        to: emailLower,
        subject: "Trendify Password Reset Code",
        html: `
          <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #0f172a;">
            <h2 style="color: #ef4444; text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 24px;">Reset Your Password</h2>
            <p style="font-size: 16px; line-height: 1.5; color: #334155;">A request was made to reset your password. Use the following 6-digit code to complete the verification:</p>
            <div style="text-align: center; margin: 32px 0;">
              <span style="font-family: monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ef4444; background-color: #fef2f2; padding: 16px 32px; border-radius: 8px; display: inline-block;">${code}</span>
            </div>
            <p style="font-size: 14px; line-height: 1.5; color: #64748b; text-align: center;">This code will expire in 10 minutes. If you did not request a password reset, you can safely ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 12px; color: #94a3b8; text-align: center;">Trendify Price Comparator - Compare Prices Instantly</p>
          </div>
        `,
      });
    } else {
      console.log(`\n========================================\n[AUTH OTP] Reset password code for ${emailLower}: ${code}\n========================================\n`);
    }

    return { success: true, email: emailLower, deliveryMethod: isSmtpConfigured ? "email" : "console" };
  } catch (error: any) {
    console.error("Error in sendResetOtpAction:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

export async function resetPasswordAction(email: string, code: string, password?: string) {
  try {
    const db = await getDb();
    const emailLower = email.toLowerCase().trim();

    if (!password) return { success: false, error: "New password is required" };

    const otpRecord = await db.collection("otps").findOne({ email: emailLower, type: "reset" });
    if (!otpRecord) return { success: false, error: "No OTP found. Please request a new one." };
    if (Date.now() > otpRecord.expiresAt) return { success: false, error: "OTP has expired. Please request a new one." };
    if (otpRecord.code !== code) return { success: false, error: "Invalid verification code." };

    const user = await db.collection("users").findOne({ email: emailLower });
    if (!user) return { success: false, error: "User not found." };

    const newHash = await hashPassword(password, emailLower);
    await db.collection("auth").updateOne({ userId: user._id }, { $set: { passwordHash: newHash } });
    await db.collection("otps").deleteOne({ email: emailLower, type: "reset" });

    return { success: true };
  } catch (error: any) {
    console.error("Error in resetPasswordAction:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("trendify_session")?.value;

    if (token) {
      const db = await getDb();
      await db.collection("sessions").deleteOne({ token });
    }

    cookieStore.delete("trendify_session");
    return { success: true };
  } catch (error: any) {
    console.error("Error in logoutAction:", error);
    try {
      const cookieStore = await cookies();
      cookieStore.delete("trendify_session");
    } catch {}
    return { success: true };
  }
}

export async function getCurrentUserAction() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("trendify_session")?.value;
    if (!token) return null;

    const db = await getDb();
    const session = await db.collection("sessions").findOne({ token });
    if (!session) {
      cookieStore.delete("trendify_session");
      return null;
    }
    if (Date.now() > session.expiresAt) {
      await db.collection("sessions").deleteOne({ token });
      cookieStore.delete("trendify_session");
      return null;
    }

    const user = await db.collection("users").findOne({ _id: session.userId });
    if (!user) return null;

    return {
      id: user._id.toString(),
      email: user.email,
      onboarded: user.onboarded,
      country: user.country,
      categories: user.categories,
      brands: user.brands,
    };
  } catch (error) {
    console.error("Error in getCurrentUserAction:", error);
    return null;
  }
}

export async function updateOnboardingAction(country: string, categories: string[], brands: string[]) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("trendify_session")?.value;
    if (!token) return { success: false, error: "Not authenticated" };

    const db = await getDb();
    const session = await db.collection("sessions").findOne({ token });
    if (!session) return { success: false, error: "Invalid session" };

    await db.collection("users").updateOne(
      { _id: session.userId },
      { $set: { onboarded: true, country, categories, brands } }
    );

    return { success: true };
  } catch (error: any) {
    console.error("Error in updateOnboardingAction:", error);
    return { success: false, error: error.message || "An unexpected error occurred." };
  }
}
