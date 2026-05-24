"use client";

import React, { useState } from "react";
import { X, Star, ShoppingCart, Zap, Percent, ShieldCheck } from "lucide-react";
import { Product } from "@/lib/products";

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export default function ProductDetailModal({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
}: ProductDetailModalProps) {
  if (!product) return null;

  const [activeImage, setActiveImage] = useState(product.images[0] || product.image);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Container */}
      <div className="relative flex h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-white shadow-2xl dark:bg-zinc-950 md:flex-row overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-50 rounded-full bg-zinc-100 p-2 text-zinc-500 hover:bg-zinc-200 hover:text-black dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Left Side: Images & Actions */}
        <div className="flex flex-col p-6 md:w-5/12 border-r border-zinc-100 dark:border-zinc-900 h-full overflow-y-auto">
          {/* Main Image */}
          <div className="relative flex aspect-square w-full items-center justify-center bg-zinc-50 rounded-md p-4 dark:bg-zinc-900/40">
            <img
              src={activeImage}
              alt={product.name}
              className="h-full max-h-[300px] w-full object-contain"
            />
            {product.isAssured && (
              <div className="absolute left-4 top-4 flex items-center gap-0.5 rounded-sm bg-white/90 px-1.5 py-0.5 shadow-sm dark:bg-zinc-900/90">
                <span className="text-[10px] font-black italic tracking-tighter text-[#2874f0]">
                  f
                </span>
                <span className="text-[9px] font-bold italic tracking-tighter text-[#ffe500] bg-[#2874f0] px-1 rounded-sm">
                  Assured
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails Row */}
          {product.images && product.images.length > 1 && (
            <div className="mt-4 flex gap-2 justify-center overflow-x-auto py-1">
              {product.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(img)}
                  className={`h-16 w-16 flex-shrink-0 rounded border-2 p-1 bg-white dark:bg-zinc-900 transition-all ${
                    activeImage === img
                      ? "border-[#2874f0]"
                      : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                onAddToCart(product);
                onClose();
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded bg-[#ff9f00] py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#ff9f00]/95 hover:shadow active:scale-98"
            >
              <ShoppingCart className="h-4.5 w-4.5" />
              Add to Cart
            </button>
            <button
              onClick={() => {
                onBuyNow(product);
                onClose();
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded bg-[#fb641b] py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#fb641b]/95 hover:shadow active:scale-98"
            >
              <Zap className="h-4.5 w-4.5" />
              Buy Now
            </button>
          </div>
        </div>

        {/* Right Side: Product Details */}
        <div className="flex-1 p-6 overflow-y-auto h-full text-zinc-900 dark:text-zinc-50">
          {/* Brand & Name */}
          <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
            {product.brand}
          </span>
          <h2 className="mt-1 text-lg font-semibold leading-snug sm:text-xl">
            {product.name}
          </h2>

          {/* Ratings & Reviews Row */}
          <div className="mt-2.5 flex items-center gap-3">
            <span className="flex items-center gap-0.5 bg-green-600 px-2 py-0.5 rounded text-[11px] font-extrabold text-white leading-none">
              {product.rating} <Star className="h-3 w-3 fill-current" />
            </span>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              {product.ratingCount.toLocaleString()} Ratings & {product.reviewsCount.toLocaleString()} Reviews
            </span>
          </div>

          {/* Pricing Row */}
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-black">
              ₹{product.price.toLocaleString()}
            </span>
            {product.originalPrice > product.price && (
              <>
                <span className="text-sm text-zinc-400 line-through dark:text-zinc-500">
                  ₹{product.originalPrice.toLocaleString()}
                </span>
                <span className="text-sm font-extrabold text-green-600 dark:text-green-500">
                  {product.discount}% off
                </span>
              </>
            )}
          </div>

          {/* Available Offers */}
          <div className="mt-5 rounded border border-zinc-100 p-4 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20">
            <h4 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-zinc-500 mb-3">
              <Percent className="h-3.5 w-3.5 text-green-600" />
              Available Offers
            </h4>
            <ul className="flex flex-col gap-2.5">
              {product.offers.map((offer, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  <span className="text-green-600 font-bold mt-0.5">✓</span>
                  <span>{offer}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Product Highlights */}
          <div className="mt-6">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-2.5">
              Product Highlights
            </h4>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {product.highlights.map((highlight, index) => (
                <li key={index} className="flex items-start gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  <span className="text-[#2874f0] font-black">•</span>
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Technical Specifications */}
          <div className="mt-6">
            <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-3 border-b border-zinc-100 pb-1.5 dark:border-zinc-800">
              Technical Specifications
            </h4>
            <div className="rounded border border-zinc-100 overflow-hidden dark:border-zinc-900">
              <table className="w-full text-xs">
                <tbody>
                  {Object.entries(product.specifications).map(([key, val], idx) => (
                    <tr
                      key={key}
                      className={idx % 2 === 0 ? "bg-zinc-50/50 dark:bg-zinc-900/10" : "bg-white dark:bg-zinc-950"}
                    >
                      <td className="w-1/3 px-4 py-2.5 font-semibold text-zinc-400 dark:text-zinc-500 border-r border-zinc-100 dark:border-zinc-900">
                        {key}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-zinc-700 dark:text-zinc-300">
                        {val}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Warranty Trust tag */}
          <div className="mt-6 flex items-center gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
            <div className="flex items-center gap-1.5 font-semibold text-green-600">
              <ShieldCheck className="h-5 w-5" />
              <span>Genuine Product</span>
            </div>
            <span>•</span>
            <span>Easy 7-day Replacement</span>
            <span>•</span>
            <span>Secure Payments</span>
          </div>

        </div>

      </div>
    </div>
  );
}
