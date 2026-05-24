"use client";

import React, { useState } from "react";
import { X, CreditCard, Home, CheckCircle2, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { toast } from "sonner";

export default function CheckoutModal() {
  const {
    isCheckoutOpen,
    closeCheckout,
    totalAmount,
    clearCart,
  } = useCart();

  if (!isCheckoutOpen) return null;

  const [step, setStep] = useState<"checkout" | "success">("checkout");
  const [address, setAddress] = useState({
    name: "John Doe",
    phone: "9876543210",
    street: "123, Park Avenue",
    city: "Mumbai",
    state: "Maharashtra",
    zip: "400001",
  });
  const [paymentMethod, setPaymentMethod] = useState("upi");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("success");
    toast.success("Payment successful! Order placed.");
  };

  const handleFinish = () => {
    clearCart(); // Clears cart
    closeCheckout();
    setStep("checkout"); // reset for next time
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      
      {/* Modal Container */}
      <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl dark:bg-zinc-950 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        {step === "checkout" && (
          <button
            onClick={closeCheckout}
            className="absolute right-4 top-4 rounded-full bg-zinc-100 p-1.5 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        )}

        {step === "checkout" ? (
          <form onSubmit={handleSubmit} className="space-y-5 text-zinc-900 dark:text-zinc-50">
            {/* Title */}
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#2874f0]" />
                Secure Checkout
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Complete your details to place the order
              </p>
            </div>

            {/* Address Details */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Home className="h-3.5 w-3.5" />
                Delivery Address
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-zinc-600 dark:text-zinc-400">Full Name</label>
                  <input
                    type="text"
                    required
                    value={address.name}
                    onChange={(e) => setAddress({ ...address, name: e.target.value })}
                    className="rounded border border-zinc-200 p-2 focus:ring-1 focus:ring-[#2874f0] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-zinc-600 dark:text-zinc-400">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="rounded border border-zinc-200 p-2 focus:ring-1 focus:ring-[#2874f0] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <label className="font-semibold text-zinc-600 dark:text-zinc-400">Street Address</label>
                  <input
                    type="text"
                    required
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    className="rounded border border-zinc-200 p-2 focus:ring-1 focus:ring-[#2874f0] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-zinc-600 dark:text-zinc-400">City</label>
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="rounded border border-zinc-200 p-2 focus:ring-1 focus:ring-[#2874f0] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold text-zinc-600 dark:text-zinc-400">Pincode</label>
                  <input
                    type="text"
                    required
                    value={address.zip}
                    onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                    className="rounded border border-zinc-200 p-2 focus:ring-1 focus:ring-[#2874f0] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900"
                  />
                </div>
              </div>
            </div>

            {/* Payment Option */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Payment Options
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: "upi", label: "UPI / Google Pay" },
                  { id: "card", label: "Credit / Debit Card" },
                  { id: "netbanking", label: "Net Banking" },
                  { id: "cod", label: "Cash on Delivery" },
                ].map((pm) => (
                  <label
                    key={pm.id}
                    className={`flex items-center gap-2.5 rounded border p-3 cursor-pointer text-xs font-bold transition-all ${
                      paymentMethod === pm.id
                        ? "border-[#2874f0] bg-blue-50/50 dark:bg-blue-950/20 text-[#2874f0]"
                        : "border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === pm.id}
                      onChange={() => setPaymentMethod(pm.id)}
                      className="h-4.5 w-4.5 text-[#2874f0] focus:ring-[#2874f0] dark:border-zinc-700"
                    />
                    <span>{pm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Bar */}
            <div className="border-t border-zinc-100 pt-4 dark:border-zinc-900 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-400 font-semibold uppercase">Total to Pay</span>
                <span className="text-lg font-black">₹{totalAmount.toLocaleString()}</span>
              </div>
              <button
                type="submit"
                className="rounded bg-[#fb641b] px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-[#fb641b]/95 hover:shadow transition-all active:scale-98 cursor-pointer"
              >
                Pay & Confirm
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-900 dark:text-zinc-50 animate-in zoom-in-95">
            <CheckCircle2 className="h-16 w-16 text-green-600 animate-bounce" />
            <h2 className="mt-4 text-xl font-black">Order Placed Successfully!</h2>
            <p className="mt-1 text-xs text-zinc-500 max-w-xs dark:text-zinc-400">
              Thank you for shopping with us! Your order has been placed. You will receive a confirmation message shortly.
            </p>

            <div className="mt-6 rounded-md border border-zinc-100 bg-zinc-50 p-4 text-left w-full max-w-sm dark:border-zinc-900 dark:bg-zinc-900/40 text-xs">
              <h4 className="font-bold text-zinc-400 uppercase text-[10px] tracking-wider mb-2">Delivery Summary</h4>
              <p className="font-bold">{address.name}</p>
              <p className="text-zinc-600 dark:text-zinc-400 mt-1">{address.street}, {address.city}, {address.state} - {address.zip}</p>
              <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">Phone: {address.phone}</p>
              <p className="font-bold text-green-600 mt-3 pt-2.5 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                Amount Paid: ₹{totalAmount.toLocaleString()} (via {paymentMethod.toUpperCase()})
              </p>
            </div>

            <button
              onClick={handleFinish}
              className="mt-8 flex items-center justify-center gap-1.5 rounded bg-[#2874f0] px-8 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-600 transition-all cursor-pointer"
            >
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
