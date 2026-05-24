"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Trash2, Heart, Eye, ArrowLeft, ShoppingBag, LogIn, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getWatchlistAction, removeFromWatchlistAction } from "@/app/actions/user-actions";
import { getCurrentUserAction } from "@/app/actions/auth-actions";
import { toast } from "sonner";

type WatchlistItem = {
  _id: string;
  productId: string;
  productName: string;
  productBrand: string;
  productImage: string;
  productPrice: number;
  productOriginalPrice: number;
  productDiscount: number;
  productRating: number;
  currencySymbol?: string;
  offers: {
    source: string;
    price: number;
    originalPrice: number;
    link: string;
    delivery: string;
    logoUrl?: string;
  }[];
  addedAt: number;
};

function WatchlistContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentGl = searchParams.get("gl") || "us";

  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    const user = await getCurrentUserAction();
    if (!user) {
      setIsLoggedIn(false);
      setLoading(false);
      return;
    }
    setIsLoggedIn(true);
    const result = await getWatchlistAction();
    if (result.success) {
      setItems(result.items as WatchlistItem[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleRemove = async (productId: string, brandName: string) => {
    setRemovingId(productId);
    const result = await removeFromWatchlistAction(productId);
    if (result.success) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      toast.success(`Removed ${brandName} from watchlist`);
    } else {
      toast.error("Failed to remove item");
    }
    setRemovingId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f1f3f6] dark:bg-black font-sans">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-10 w-10 border-4 border-[#2874f0] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-zinc-500">Loading your watchlist...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f1f3f6] dark:bg-black font-sans">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-10 max-w-sm w-full text-center shadow-sm">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-full inline-flex mb-5">
              <Heart className="size-10 text-[#2874f0]" />
            </div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white">Sign in to view your Watchlist</h2>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Your saved products are stored securely in the cloud. Log in to access them anytime.
            </p>
            <Button
              onClick={() => router.push("/auth")}
              className="mt-6 w-full bg-[#2874f0] hover:bg-blue-600 text-white font-bold rounded-lg cursor-pointer"
            >
              <LogIn className="size-4 mr-2" />
              Sign In
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f3f6] dark:bg-black font-sans">
      <Header />
      
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 md:py-12">
        {/* Back navigation */}
        <div className="mb-6">
          <Link
            href={`/?gl=${currentGl}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="size-4" />
            Back to Shopping
          </Link>
        </div>

        {/* Title */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#2874f0]/10 dark:bg-[#ffe500]/10 rounded-xl text-[#2874f0] dark:text-[#ffe500]">
              <Heart className="size-6 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
                My Price Watchlist
              </h1>
              <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">
                {items.length} {items.length === 1 ? "item" : "items"} saved · synced to your account
              </p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
            title="Refresh"
          >
            <RefreshCw className="size-4" />
          </button>
        </div>

        {/* Watchlist Body */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-xl p-8 text-center shadow-sm max-w-xl mx-auto">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-full mb-6">
              <ShoppingBag className="size-16 text-zinc-400" />
            </div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white">Your watchlist is empty</h3>
            <p className="mt-2 text-xs md:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">
              Start searching for products and click the heart icon on any deal to save it here and monitor prices across different stores!
            </p>
            <Button
              onClick={() => router.push(`/?gl=${currentGl}`)}
              className="mt-6 rounded-lg bg-[#2874f0] hover:bg-[#2874f0]/90 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-bold px-6 py-2.5 cursor-pointer shadow-md"
            >
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((product) => {
              const sortedOffers = [...product.offers].sort((a, b) => a.price - b.price);
              const bestOffer = sortedOffers[0];
              const symbol = product.currencySymbol || "₹";
              const formattedPrice = symbol === "₹" || symbol === "¥"
                ? `${symbol}${Math.round(product.productPrice).toLocaleString()}`
                : `${symbol}${product.productPrice.toFixed(2)}`;
              const isRemoving = removingId === product.productId;

              return (
                <div
                  key={product.productId}
                  className={`flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 group relative ${isRemoving ? "opacity-50 scale-95" : ""}`}
                >
                  {/* Delete button top right */}
                  <button
                    onClick={() => handleRemove(product.productId, product.productBrand)}
                    disabled={isRemoving}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-zinc-100/50 hover:bg-red-50 text-zinc-400 hover:text-red-600 dark:bg-zinc-900/50 dark:hover:bg-red-950/30 transition-colors z-10 cursor-pointer disabled:cursor-not-allowed"
                    title="Remove from watchlist"
                  >
                    <Trash2 className="size-4" />
                  </button>

                  {/* Thumbnail section */}
                  <div className="h-48 w-full bg-zinc-50 dark:bg-zinc-900/40 p-6 flex items-center justify-center border-b border-zinc-100 dark:border-zinc-900">
                    <img
                      src={product.productImage}
                      alt={product.productName}
                      className="h-full max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-103 transition-transform duration-300"
                    />
                  </div>

                  {/* Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded uppercase tracking-wider">
                          {product.productBrand}
                        </span>
                        {bestOffer && (
                          <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-450 uppercase tracking-wider">
                            Best: {bestOffer.source}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs md:text-sm font-bold text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-snug mb-3">
                        {product.productName}
                      </h3>
                    </div>

                    <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-900 flex items-end justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide block mb-0.5">
                          Lowest Price
                        </span>
                        <span className="text-lg font-black text-zinc-900 dark:text-white leading-none">
                          {formattedPrice}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => router.push(`/product/${product.productId}?name=${encodeURIComponent(product.productName)}`)}
                        className="flex items-center gap-1.5 rounded-lg bg-[#2874f0] hover:bg-[#2874f0]/90 text-[10px] font-bold text-white shadow-xs cursor-pointer h-9 px-3.5"
                      >
                        <Eye className="size-4" />
                        Compare Prices
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function WatchlistPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f1f3f6] dark:bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-500"></div>
      </div>
    }>
      <WatchlistContent />
    </Suspense>
  );
}
