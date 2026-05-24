"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Star, Heart, BarChart3 } from "lucide-react";
import { ComparatorProduct } from "@/lib/products";
import { useWatchlist } from "@/lib/watchlist-context";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  product: ComparatorProduct;
}

function MiniStoreLogo({ src, alt }: { src?: string; alt: string }) {
  const [errored, setErrored] = useState(false);
  if (!src || errored) {
    const initials = alt
      .replace(/[^a-z ]/gi, "")
      .split(" ")
      .slice(0, 1)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
    return (
      <span className="flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[7px] sm:text-[8px] font-black text-white flex-shrink-0">
        {initials || "S"}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setErrored(true)}
      className="h-4 w-4 sm:h-5 sm:w-5 rounded-full object-contain bg-white border border-zinc-100 flex-shrink-0 p-0.5"
    />
  );
}

export default function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toggleWatchlist, isWatched } = useWatchlist();

  const currentGl = searchParams.get("gl") || "us";

  const handleCardClick = () => {
    router.push(`/product/${encodeURIComponent(product.id)}?name=${encodeURIComponent(product.name)}&gl=${currentGl}`);
  };

  const handleWatchToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWatchlist(product);
  };

  const watched = isWatched(product.id);
  const sortedOffers = [...(product.offers || [])].sort((a, b) => a.price - b.price);
  const cheapestOffer = sortedOffers[0];
  const storesCount = sortedOffers.length;

  const isUSD = product.id.startsWith("serper-");
  const currencySymbol = product.currencySymbol || (isUSD ? "$" : "₹");

  const formatPrice = (p: number) => {
    if (currencySymbol === "₹" || currencySymbol === "¥") {
      return `${currencySymbol}${Math.round(p).toLocaleString()}`;
    }
    return `${currencySymbol}${p.toFixed(2)}`;
  };

  const priceLabel = formatPrice(cheapestOffer?.price ?? product.price);
  const origPriceLabel = formatPrice(cheapestOffer?.originalPrice ?? product.originalPrice);

  return (
    <Card
      onClick={handleCardClick}
      className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:border-[#2874f0]/40 dark:border-zinc-900 dark:bg-zinc-950 dark:hover:border-[#2874f0]/30 cursor-pointer font-sans h-full"
    >
      {/* Product Image */}
      <div className="relative aspect-[4/3] sm:aspect-square w-full overflow-hidden bg-gradient-to-br from-zinc-50/85 to-zinc-100/50 dark:from-zinc-900/60 dark:to-zinc-900/20">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-contain p-3 sm:p-4 transition-transform duration-300 group-hover:scale-105"
        />

        {/* Discount Badge */}
        {product.discount > 0 && (
          <Badge className="absolute left-2 top-2 rounded-md bg-emerald-600 hover:bg-emerald-600 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black text-white shadow-xs border-none select-none">
            -{product.discount}%
          </Badge>
        )}

        {/* Watchlist Button */}
        <button
          onClick={handleWatchToggle}
          className="absolute right-2 top-2 rounded-full bg-white/95 dark:bg-zinc-900/95 p-1.5 sm:p-2 shadow-xs hover:scale-110 active:scale-95 transition-all text-zinc-400 hover:text-red-500 cursor-pointer border border-zinc-100 dark:border-zinc-800"
        >
          <Heart className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${watched ? "fill-red-500 text-red-500" : ""}`} />
        </button>

        {/* Live Data Badge */}
        {isUSD && (
          <Badge className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs border border-zinc-200 dark:border-zinc-700 px-1.5 py-0.5 rounded-full select-none text-[7px] sm:text-[8px] font-bold text-zinc-600 dark:text-zinc-400 leading-none">
            <span className="h-1 w-1 rounded-full bg-green-500 animate-pulse"></span>
            <span>LIVE</span>
          </Badge>
        )}
      </div>

      {/* Product Info */}
      <CardContent className="p-3 sm:p-4 flex flex-col flex-1 bg-transparent justify-between">
        <div>
          {/* Brand */}
          <span className="text-[8px] sm:text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block leading-none">
            {product.brand}
          </span>

          {/* Name */}
          <h4 className="mt-1 line-clamp-2 text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 leading-snug group-hover:text-[#2874f0] transition-colors">
            {product.name}
          </h4>

          {/* Rating */}
          <div className="mt-1.5 flex items-center gap-1">
            <Badge className="flex items-center gap-0.5 bg-green-600 hover:bg-green-600 px-1.5 py-0 rounded text-[9px] sm:text-[10px] font-black text-white leading-none h-4 sm:h-4.5">
              {product.rating.toFixed(1)} <Star className="h-2 w-2 sm:h-2.5 sm:w-2.5 fill-current ml-0.5" />
            </Badge>
            <span className="text-[9px] sm:text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
              ({product.ratingCount.toLocaleString()})
            </span>
          </div>
        </div>

        <div>
          {/* Price */}
          <div className="mt-3">
            <span className="text-[8px] sm:text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-500 block mb-0.5">
              Cheapest Price
            </span>
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-sm sm:text-base font-black text-zinc-950 dark:text-zinc-50">
                {priceLabel}
              </span>
              {(cheapestOffer?.originalPrice ?? product.originalPrice) > (cheapestOffer?.price ?? product.price) && (
                <>
                  <span className="text-[10px] text-zinc-400 line-through dark:text-zinc-500">
                    {origPriceLabel}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-500">
                    {product.discount}% off
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Store Logos Row */}
          {storesCount > 0 && (
            <div className="mt-3 pt-2 sm:pt-2.5 border-t border-zinc-100 dark:border-zinc-900 flex items-center gap-1">
              <div className="flex -space-x-1">
                {sortedOffers.slice(0, 3).map((offer, i) => (
                  <MiniStoreLogo
                    key={i}
                    src={(offer as any).logoUrl}
                    alt={offer.source}
                  />
                ))}
              </div>
              <span className="text-[9px] sm:text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 truncate">
                {storesCount} stores compared
              </span>
            </div>
          )}
        </div>
      </CardContent>

      {/* Action Buttons */}
      <CardFooter className="px-3 pb-3 sm:px-4 sm:pb-4 pt-0 flex gap-1.5 border-t-0">
        <Button
          onClick={handleCardClick}
          size="sm"
          className="flex-1 rounded-lg bg-[#2874f0] hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 font-bold text-[10px] sm:text-[11px] cursor-pointer py-1.5 h-7 sm:h-8"
        >
          <BarChart3 className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
          Compare
        </Button>
        <Button
          onClick={handleWatchToggle}
          size="sm"
          variant={watched ? "default" : "outline"}
          className={`flex-1 rounded-lg font-bold text-[10px] sm:text-[11px] cursor-pointer border-zinc-200 dark:border-zinc-800 py-1.5 h-7 sm:h-8 ${
            watched
              ? "bg-red-50 hover:bg-red-100 border-red-200 text-red-600 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400"
              : "bg-white text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-850"
          }`}
        >
          <Heart className={`h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 ${watched ? "fill-red-500 text-red-650" : ""}`} />
          {watched ? "Watching" : "Watch"}
        </Button>
      </CardFooter>
    </Card>
  );
}
