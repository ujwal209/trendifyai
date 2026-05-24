"use client";

import React from "react";
import { X, Trash2, Plus, Minus, ShieldCheck, ShoppingBag, Zap } from "lucide-react";
import { useCart } from "@/lib/cart-context";

export default function CartSheet() {
  const {
    isCartOpen,
    closeCart,
    cartItems,
    updateQuantity,
    removeFromCart,
    openCheckout,
  } = useCart();

  if (!isCartOpen) return null;

  // Calculate prices
  const totalMRP = cartItems.reduce(
    (sum, item) => sum + item.product.originalPrice * item.quantity,
    0
  );
  const totalDiscounted = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const discount = totalMRP - totalDiscounted;
  
  // Trendify delivery charge
  const deliveryCharges =
    cartItems.length > 0 && totalDiscounted > 1000 ? 0 : cartItems.length > 0 ? 40 : 0;

  const totalAmount = totalDiscounted + deliveryCharges;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        onClick={closeCart}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      {/* Drawer Container */}
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md transform bg-[#f1f3f6] dark:bg-zinc-950 transition-transform duration-300 ease-in-out shadow-2xl flex flex-col h-full animate-in slide-in-from-right">
          
          {/* Header */}
          <div className="bg-[#2874f0] text-white px-4 py-4 flex items-center justify-between shadow-sm">
            <h2 className="text-base font-bold flex items-center gap-2">
              <ShoppingBag className="h-4.5 w-4.5" />
              My Cart ({cartItems.length} items)
            </h2>
            <button
              onClick={closeCart}
              className="rounded-full hover:bg-white/10 p-1.5 transition-colors text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 rounded-md p-6 text-center shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1557821552-17105176677c?w=400&auto=format&fit=crop&q=80"
                  alt="Empty Cart"
                  className="w-32 h-32 object-cover rounded-full opacity-70"
                />
                <h3 className="mt-4 text-base font-bold">Your Cart is Empty!</h3>
                <p className="mt-1.5 text-xs text-zinc-500 max-w-xs dark:text-zinc-400">
                  Explore top deals and add items to your cart to see them here.
                </p>
                <button
                  onClick={closeCart}
                  className="mt-5 rounded bg-[#2874f0] px-6 py-2 text-xs font-bold text-white shadow hover:bg-blue-600 transition-all cursor-pointer"
                >
                  Shop Now
                </button>
              </div>
            ) : (
              cartItems.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex gap-4 rounded-md border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {/* Thumbnail */}
                  <div className="h-20 w-20 flex-shrink-0 bg-zinc-50 dark:bg-zinc-950 p-1 rounded">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-tight">
                        {product.name}
                      </h4>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 uppercase font-semibold">
                        Brand: {product.brand}
                      </p>
                    </div>

                    {/* Price & Quantity Controls */}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-zinc-900 dark:text-white">
                          ₹{(product.price * quantity).toLocaleString()}
                        </span>
                        {product.originalPrice > product.price && (
                          <span className="text-[10px] text-zinc-400 line-through dark:text-zinc-500">
                            ₹{(product.originalPrice * quantity).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-950 px-1 py-0.5">
                        <button
                          onClick={() => updateQuantity(product.id, -1)}
                          disabled={quantity <= 1}
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-500 disabled:opacity-30 transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-bold w-6 text-center">
                          {quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(product.id, 1)}
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-500 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Trash */}
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing Details Summary */}
          {cartItems.length > 0 && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-lg space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                Price Details
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between font-medium">
                  <span>Price ({cartItems.reduce((acc, item) => acc + item.quantity, 0)} items)</span>
                  <span>₹{totalMRP.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium text-green-600 dark:text-green-500">
                  <span>Discount</span>
                  <span>- ₹{discount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Delivery Charges</span>
                  <span>{deliveryCharges === 0 ? "FREE" : `₹${deliveryCharges}`}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-2.5 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                  <span>Total Amount</span>
                  <span>₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {discount > 0 && (
                <div className="rounded bg-green-50/80 dark:bg-green-950/25 p-2 text-center text-xs font-bold text-green-600 dark:text-green-500 leading-snug">
                  You will save ₹{discount.toLocaleString()} on this order! 🎉
                </div>
              )}

              {/* Checkout Button */}
              <button
                onClick={() => {
                  closeCart();
                  openCheckout();
                }}
                className="w-full flex items-center justify-center gap-1.5 rounded bg-[#fb641b] py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#fb641b]/95 hover:shadow active:scale-98 cursor-pointer"
              >
                <Zap className="h-4 w-4" />
                Place Order
              </button>
            </div>
          )}

          {/* Secure transaction info footer */}
          <div className="bg-zinc-100 dark:bg-zinc-950 px-4 py-2 flex items-center gap-2 justify-center text-[10px] text-zinc-500 font-semibold border-t border-zinc-200 dark:border-zinc-900">
            <ShieldCheck className="h-4 w-4 text-zinc-400" />
            <span>Safe and Secure Payments. Easy returns.</span>
          </div>

        </div>
      </div>
    </div>
  );
}
