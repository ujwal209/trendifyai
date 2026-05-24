"use client";

import React from "react";
import { X, Trash2, ShieldCheck, Heart, Eye } from "lucide-react";
import { useWatchlist } from "@/lib/watchlist-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function WatchlistSheet() {
  const router = useRouter();
  const {
    isWatchlistOpen,
    closeWatchlist,
    watchlistItems,
    removeFromWatchlist,
  } = useWatchlist();

  if (!isWatchlistOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        onClick={closeWatchlist}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      {/* Drawer Container */}
      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md transform bg-[#f1f3f6] dark:bg-zinc-950 transition-transform duration-300 ease-in-out shadow-2xl flex flex-col h-full animate-in slide-in-from-right">
          
          {/* Header */}
          <div className="bg-[#2874f0] text-white px-4 py-4 flex items-center justify-between shadow-sm">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Heart className="h-4.5 w-4.5 fill-white text-white" />
              My Price Watchlist ({watchlistItems.length} items)
            </h2>
            <button
              onClick={closeWatchlist}
              className="rounded-full hover:bg-white/10 p-1.5 transition-colors text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Watchlist Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {watchlistItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 rounded-md p-6 text-center shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1557821552-17105176677c?w=400&auto=format&fit=crop&q=80"
                  alt="Empty Watchlist"
                  className="w-32 h-32 object-cover rounded-full opacity-70"
                />
                <h3 className="mt-4 text-base font-bold">Watchlist is Empty!</h3>
                <p className="mt-1.5 text-xs text-zinc-500 max-w-xs dark:text-zinc-400">
                  Save deals while searching to track their compared prices across multiple platforms.
                </p>
                <Button
                  onClick={closeWatchlist}
                  size="sm"
                  className="mt-5 rounded-lg bg-[#2874f0] hover:bg-blue-600 font-bold text-xs px-6 py-2 shadow-xs cursor-pointer"
                >
                  Browse Deals
                </Button>
              </div>
            ) : (
              watchlistItems.map((product) => {
                const sortedOffers = [...product.offers].sort((a, b) => a.price - b.price);
                const bestOffer = sortedOffers[0];
                const symbol = product.currencySymbol || "₹";
                const formattedPrice = symbol === "₹" || symbol === "¥"
                  ? `${symbol}${Math.round(product.productPrice).toLocaleString()}`
                  : `${symbol}${product.productPrice.toFixed(2)}`;

                return (
                  <div
                    key={product.productId}
                    className="flex gap-4 rounded-md border border-zinc-200 bg-white p-4 shadow-xs dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    {/* Thumbnail */}
                    <div className="h-20 w-20 flex-shrink-0 bg-zinc-50 dark:bg-zinc-950 p-1 rounded">
                      <img
                        src={product.productImage}
                        alt={product.productName}
                        className="h-full w-full object-contain"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-tight">
                          {product.productName}
                        </h4>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 uppercase font-semibold">
                          Brand: {product.productBrand}
                        </p>
                      </div>

                      {/* Lowest Price and Compare Action */}
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">
                            Lowest Price
                          </span>
                          <span className="text-sm font-black text-zinc-900 dark:text-white">
                            {formattedPrice}
                          </span>
                          {bestOffer && (
                            <span className="text-[9px] text-zinc-400">
                              on {bestOffer.source}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => {
                              closeWatchlist();
                              router.push(`/product/${product.productId}?name=${encodeURIComponent(product.productName)}`);
                            }}
                            className="flex items-center gap-1 rounded-lg bg-[#2874f0] hover:bg-blue-600 text-[10px] font-bold text-white shadow-xs cursor-pointer h-8 px-2.5"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Compare
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => removeFromWatchlist(product.productId)}
                            className="text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Secure watchlist info footer */}
          <div className="bg-zinc-100 dark:bg-zinc-950 px-4 py-3 flex items-center gap-2 justify-center text-[10px] text-zinc-500 font-semibold border-t border-zinc-200 dark:border-zinc-900 mt-auto">
            <ShieldCheck className="h-4 w-4 text-zinc-400" />
            <span>Tracking live compared prices across 4+ merchants.</span>
          </div>

        </div>
      </div>
    </div>
  );
}
