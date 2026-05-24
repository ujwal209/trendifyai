"use client";

import React from "react";
import { Star, RefreshCw } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface FiltersProps {
  maxPrice: number;
  setMaxPrice: (price: number) => void;
  selectedBrands: string[];
  setSelectedBrands: (brands: string[] | ((prev: string[]) => string[])) => void;
  minRating: number;
  setMinRating: (rating: number) => void;
  minDiscount: number;
  setMinDiscount: (discount: number) => void;
  allBrands: string[];
  
  // New props for extensive filtering
  isUSD: boolean;
  minProductPrice: number;
  maxProductPrice: number;
  allStores: string[];
  selectedStores: string[];
  setSelectedStores: (stores: string[] | ((prev: string[]) => string[])) => void;
  freeDeliveryOnly: boolean;
  setFreeDeliveryOnly: (val: boolean) => void;
  assuredOnly: boolean;
  setAssuredOnly: (val: boolean) => void;
  
  onClearAll: () => void;
}

export default function Filters({
  maxPrice,
  setMaxPrice,
  selectedBrands,
  setSelectedBrands,
  minRating,
  setMinRating,
  minDiscount,
  setMinDiscount,
  allBrands,
  
  isUSD,
  minProductPrice,
  maxProductPrice,
  allStores,
  selectedStores,
  setSelectedStores,
  freeDeliveryOnly,
  setFreeDeliveryOnly,
  assuredOnly,
  setAssuredOnly,
  onClearAll,
}: FiltersProps) {
  const handleBrandChange = (brand: string) => {
    setSelectedBrands((prev: string[]) => {
      if (prev.includes(brand)) {
        return prev.filter((b) => b !== brand);
      } else {
        return [...prev, brand];
      }
    });
  };

  const handleStoreChange = (store: string) => {
    setSelectedStores((prev: string[]) => {
      if (prev.includes(store)) {
        return prev.filter((s) => s !== store);
      } else {
        return [...prev, store];
      }
    });
  };

  // Determine pricing limits for the UI slider
  const sliderMin = isUSD ? Math.floor(minProductPrice) || 0 : 1000;
  // If max product price is 0 or NaN, fall back to default limits
  const sliderMax = isUSD 
    ? Math.max(Math.ceil(maxProductPrice), 100) 
    : Math.max(Math.ceil(maxProductPrice), 150000);
  const sliderStep = isUSD ? 5 : 1000;
  const currencySymbol = isUSD ? "$" : "₹";

  return (
    <div className="w-full rounded-xl border border-zinc-200 bg-white p-5 shadow-xs dark:border-zinc-800 dark:bg-zinc-950/60 dark:backdrop-blur-md">
      {/* Filter Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
        <h3 className="text-sm font-black tracking-wide text-zinc-900 dark:text-zinc-50 uppercase">Filters</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="text-[11px] font-bold text-[#2874f0] hover:text-[#2874f0]/80 dark:text-blue-400 dark:hover:bg-zinc-900/50 cursor-pointer h-7 px-2"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Clear All
        </Button>
      </div>

      {/* Price Slider */}
      <div className="py-4 border-b border-zinc-100 dark:border-zinc-800">
        <Label className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block mb-3.5">Price Range</Label>
        <div className="flex flex-col gap-3 px-1">
          <Slider
            min={sliderMin}
            max={sliderMax}
            step={sliderStep}
            value={[maxPrice > sliderMax ? sliderMax : maxPrice]}
            onValueChange={(val) => setMaxPrice(val[0])}
            className="w-full"
          />
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-1">
            <span>Min: {currencySymbol || ""}{(sliderMin || 0).toLocaleString()}</span>
            <span className="font-black text-[#2874f0] dark:text-blue-400">
              Max: {currencySymbol || ""}{(maxPrice || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Preferences (Free Delivery / Assured) */}
      <div className="py-4 border-b border-zinc-100 dark:border-zinc-800">
        <Label className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block mb-3">Preferences</Label>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <Checkbox
              id="free-delivery"
              checked={freeDeliveryOnly}
              onCheckedChange={(checked) => setFreeDeliveryOnly(!!checked)}
            />
            <Label htmlFor="free-delivery" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
              Free Delivery
            </Label>
          </div>
          <div className="flex items-center gap-2.5">
            <Checkbox
              id="assured-only"
              checked={assuredOnly}
              onCheckedChange={(checked) => setAssuredOnly(!!checked)}
            />
            <Label htmlFor="assured-only" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
              Trendify Assured
            </Label>
          </div>
        </div>
      </div>

      {/* Brand Filters */}
      {allBrands.length > 0 && (
        <div className="py-4 border-b border-zinc-100 dark:border-zinc-800">
          <Label className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block mb-3">Brand</Label>
          <div className="flex max-h-40 flex-col gap-2.5 overflow-y-auto pr-1">
            {allBrands.map((brand) => (
              <div key={brand} className="flex items-center gap-2.5">
                <Checkbox
                  id={`brand-${brand}`}
                  checked={selectedBrands.includes(brand)}
                  onCheckedChange={() => handleBrandChange(brand)}
                />
                <Label htmlFor={`brand-${brand}`} className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer select-none truncate">
                  {brand}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Store/Seller Filters */}
      {allStores.length > 0 && (
        <div className="py-4 border-b border-zinc-100 dark:border-zinc-800">
          <Label className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block mb-3">Store / Seller</Label>
          <div className="flex max-h-40 flex-col gap-2.5 overflow-y-auto pr-1">
            {allStores.map((store) => (
              <div key={store} className="flex items-center gap-2.5">
                <Checkbox
                  id={`store-${store}`}
                  checked={selectedStores.includes(store)}
                  onCheckedChange={() => handleStoreChange(store)}
                />
                <Label htmlFor={`store-${store}`} className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer select-none truncate">
                  {store}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rating Filters */}
      <div className="py-4 border-b border-zinc-100 dark:border-zinc-800">
        <Label className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block mb-3">Customer Rating</Label>
        <div className="flex flex-col gap-2">
          {[4, 3, 2].map((rating) => (
            <Button
              key={rating}
              onClick={() => setMinRating(rating)}
              variant={minRating === rating ? "default" : "outline"}
              size="sm"
              className={`w-full justify-start text-xs font-semibold cursor-pointer border-zinc-200 dark:border-zinc-800 ${
                minRating === rating
                  ? "bg-[#2874f0] text-white hover:bg-blue-600 border-[#2874f0] dark:bg-blue-600 dark:hover:bg-blue-500"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }`}
            >
              <span className="flex items-center gap-0.5 bg-green-600 px-1.5 py-0.5 rounded text-[10px] font-bold text-white leading-none mr-2">
                {rating} <Star className="h-2.5 w-2.5 fill-current" />
              </span>
              <span>& above</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Discount Filters */}
      <div className="py-4">
        <Label className="text-[11px] font-black uppercase tracking-wider text-zinc-400 block mb-3">Discount</Label>
        <div className="flex flex-col gap-2">
          {[30, 20, 10].map((discount) => (
            <Button
              key={discount}
              onClick={() => setMinDiscount(discount)}
              variant={minDiscount === discount ? "default" : "outline"}
              size="sm"
              className={`w-full justify-start text-xs font-semibold cursor-pointer border-zinc-200 dark:border-zinc-800 ${
                minDiscount === discount
                  ? "bg-[#2874f0] text-white hover:bg-blue-600 border-[#2874f0] dark:bg-blue-600 dark:hover:bg-blue-500"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900"
              }`}
            >
              <span>{discount}% or more</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
