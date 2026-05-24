"use server";

import { cookies } from "next/headers";
import { getDb } from "@/lib/mongodb";
import { ComparatorProduct } from "@/lib/products";
import { ObjectId } from "mongodb";

// Helper to get current user's MongoDB ObjectId from session
async function getCurrentUserId(): Promise<ObjectId | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("trendify_session")?.value;
    if (!token) return null;

    const db = await getDb();
    const session = await db.collection("sessions").findOne({ token });
    if (!session || Date.now() > session.expiresAt) return null;

    return session.userId as ObjectId;
  } catch {
    return null;
  }
}

// ─────────────── WATCHLIST ACTIONS ───────────────

export async function getWatchlistAction() {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated", items: [] };
  try {
    const db = await getDb();
    const items = await db
      .collection("watchlist")
      .find({ userId })
      .sort({ addedAt: -1 })
      .toArray();
    
    // Serialize MongoDB ObjectIds to strings
    const serializedItems = items.map((item) => ({
      ...item,
      _id: item._id.toString(),
      userId: item.userId.toString(),
    }));

    return { success: true, items: serializedItems };
  } catch (e: any) {
    return { success: false, error: e.message, items: [] };
  }
}

export async function addToWatchlistAction(product: ComparatorProduct, currencySymbol?: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Please log in to save to watchlist" };
  try {
    const db = await getDb();
    // Check if already exists
    const existing = await db
      .collection("watchlist")
      .findOne({ userId, productId: product.id });
    if (existing) return { success: false, message: "Already in watchlist" };

    await db.collection("watchlist").insertOne({
      userId,
      productId: product.id,
      productName: product.name,
      productBrand: product.brand,
      productImage: product.image,
      productPrice: product.price,
      productOriginalPrice: product.originalPrice,
      productDiscount: product.discount,
      productRating: product.rating,
      currencySymbol,
      offers: product.offers.map((o) => ({
        source: o.source,
        price: o.price,
        originalPrice: o.originalPrice,
        link: o.link,
        delivery: o.delivery,
        logoUrl: o.logoUrl,
      })),
      addedAt: Date.now(),
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function removeFromWatchlistAction(productId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };
  try {
    const db = await getDb();
    const result = await db
      .collection("watchlist")
      .deleteOne({ userId, productId });
    return { success: result.deletedCount > 0 };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function isInWatchlistAction(productId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return false;
  try {
    const db = await getDb();
    const existing = await db
      .collection("watchlist")
      .findOne({ userId, productId });
    return existing !== null;
  } catch {
    return false;
  }
}

export async function clearWatchlistAction() {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };
  try {
    const db = await getDb();
    await db.collection("watchlist").deleteMany({ userId });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// ─────────────── HISTORY ACTIONS ───────────────

export async function getHistoryAction() {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated", items: [] };
  try {
    const db = await getDb();
    const items = await db
      .collection("history")
      .find({ userId })
      .sort({ viewedAt: -1 })
      .limit(50)
      .toArray();

    // Serialize MongoDB ObjectIds to strings
    const serializedItems = items.map((item) => ({
      ...item,
      _id: item._id.toString(),
      userId: item.userId.toString(),
    }));

    return { success: true, items: serializedItems };
  } catch (e: any) {
    return { success: false, error: e.message, items: [] };
  }
}

export async function recordViewAction(product: {
  id: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  currencySymbol?: string;
}) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false }; // silent fail if not logged in
  try {
    const db = await getDb();
    const existing = await db
      .collection("history")
      .findOne({ userId, productId: product.id });

    if (existing) {
      // Update timestamp to move to top
      await db
        .collection("history")
        .updateOne({ userId, productId: product.id }, { $set: { viewedAt: Date.now() } });
    } else {
      await db.collection("history").insertOne({
        userId,
        productId: product.id,
        productName: product.name,
        productBrand: product.brand,
        productImage: product.image,
        productPrice: product.price,
        currencySymbol: product.currencySymbol,
        viewedAt: Date.now(),
      });
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function removeFromHistoryAction(productId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };
  try {
    const db = await getDb();
    const result = await db
      .collection("history")
      .deleteOne({ userId, productId });
    return { success: result.deletedCount > 0 };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function clearHistoryAction() {
  const userId = await getCurrentUserId();
  if (!userId) return { success: false, error: "Not authenticated" };
  try {
    const db = await getDb();
    await db.collection("history").deleteMany({ userId });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
