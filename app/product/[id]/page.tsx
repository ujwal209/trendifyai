"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Star, Heart, ShieldCheck, ArrowLeft, ExternalLink,
  TrendingDown, Package, Clock, BarChart3
} from "lucide-react";
import { Toaster, toast } from "sonner";

import Header from "@/components/Header";
import CategoryBar from "@/components/CategoryBar";
import Footer from "@/components/Footer";
import { useAi } from "@/lib/ai-context";
import { cn } from "@/lib/utils";

import { PRODUCTS } from "@/lib/products";
import { useWatchlist } from "@/lib/watchlist-context";
import { fetchProductsAction } from "@/app/actions/fetch-products";
import { recordViewAction } from "@/app/actions/user-actions";
import { ComparatorProduct, SellerOffer } from "@/lib/products";
import { getSimulatedOffers, getCurrencySymbol } from "@/lib/comparator-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

// --------------------------------------------------------------------------
// Store logo with graceful fallback
// --------------------------------------------------------------------------
function StoreLogo({ src, alt }: { src?: string; alt: string }) {
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    // Fallback: initials badge
    const initials = alt
      .replace(/[^a-z ]/gi, "")
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-black text-white flex-shrink-0">
        {initials || "S"}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setErrored(true)}
      className="h-7 w-7 rounded-full object-contain bg-white border border-zinc-100 dark:border-zinc-800 flex-shrink-0 p-0.5"
    />
  );
}

// --------------------------------------------------------------------------
// Price savings bar
// --------------------------------------------------------------------------
function SavingsBar({ offers, currencySymbol }: { offers: SellerOffer[]; currencySymbol: string }) {
  if (offers.length < 2) return null;
  const sorted = [...offers].sort((a, b) => a.price - b.price);
  const lowest = sorted[0].price;
  const highest = sorted[sorted.length - 1].price;
  const savings = highest - lowest;
  const pct = Math.round((savings / highest) * 100);
  if (savings <= 0) return null;

  const formatP = (p: number) => {
    if (currencySymbol === "₹" || currencySymbol === "¥") {
      return `${currencySymbol}${Math.round(p).toLocaleString()}`;
    }
    return `${currencySymbol}${p.toFixed(2)}`;
  };

  return (
    <div className="rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 dark:from-emerald-950/30 dark:to-green-950/30 dark:border-emerald-900 p-4">
      <div className="flex items-center gap-2 mb-1">
        <TrendingDown className="h-4 w-4 text-emerald-600" />
        <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
          Best Price Alert
        </span>
      </div>
      <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
        Save <span className="text-base font-black">{formatP(savings)}</span> ({pct}% less) by choosing the cheapest store!
      </p>
      <p className="text-[11px] text-emerald-600 dark:text-emerald-500 mt-0.5">
        Price range: {formatP(lowest)} – {formatP(highest)} across {sorted.length} stores
      </p>
    </div>
  );
}

// --------------------------------------------------------------------------
// Main Detail Content
// --------------------------------------------------------------------------
function ProductDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toggleWatchlist, isWatched } = useWatchlist();
  const { isOpen } = useAi();

  const rawId = decodeURIComponent(params.id as string);
  const nameParam = searchParams.get("name") || "";
  const currentGl = searchParams.get("gl") || "us";

  const [product, setProduct] = useState<ComparatorProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState("");
  const [activeTab, setActiveTab] = useState<"comparison" | "specs" | "highlights">("comparison");

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        // 1. Check local catalog (static products)
        const localProd = PRODUCTS.find((p) => p.id === rawId);
        if (localProd) {
          const getConversionRate = (targetGl: string) => {
            switch (targetGl.toLowerCase()) {
              case "us": return 1 / 83; // 1 USD = 83 INR
              case "uk": return 1 / 105; // 1 GBP = 105 INR
              case "ca": return 1 / 61; // 1 CAD = 61 INR
              case "au": return 1 / 55; // 1 AUD = 55 INR
              case "de":
              case "fr": return 1 / 90; // 1 EUR = 90 INR
              case "jp": return 1.8; // 1 JPY = 0.55 INR
              case "in":
              default: return 1.0;
            }
          };

          const rate = getConversionRate(currentGl);
          const currencySymbol = getCurrencySymbol(currentGl);
          const convertedPrice = Math.round(localProd.price * rate);
          const convertedOriginalPrice = Math.round(localProd.originalPrice * rate);

          const simulatedOffers = getSimulatedOffers(
            convertedPrice,
            convertedOriginalPrice,
            localProd.name,
            currentGl
          ).sort((a, b) => a.price - b.price);

          setProduct({
            ...localProd,
            price: simulatedOffers[0].price,
            originalPrice: simulatedOffers[0].originalPrice,
            discount: Math.round(
              ((simulatedOffers[0].originalPrice - simulatedOffers[0].price) /
                simulatedOffers[0].originalPrice) * 100
            ),
            offers: simulatedOffers,
            currencySymbol,
          });
          setLoading(false);
          return;
        }

        // 2. Re-fetch live from Serper using the product name and country code
        const searchTerm = nameParam || rawId.replace(/^serper-/, "").replace(/-/g, " ");
        if (searchTerm) {
          const results = await fetchProductsAction(searchTerm, "all", currentGl);
          // Match closest or take first
          const matched =
            results.find((r) =>
              r.name.toLowerCase().includes(searchTerm.toLowerCase().slice(0, 20))
            ) || results[0];
          if (matched) {
            setProduct(matched);
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error("Failed loading product details", e);
        toast.error("Failed to load live comparison. Try again.");
      }
      setLoading(false);
    }
    loadProduct();
  }, [rawId, nameParam, currentGl]);

  useEffect(() => {
    if (product) {
      setActiveImage(product.images[0] || product.image);
      // Record view in DB (silent, only if logged in)
      recordViewAction({
        id: product.id,
        name: product.name,
        brand: product.brand,
        image: product.image,
        price: product.price,
        currencySymbol: product.currencySymbol,
      }).catch(() => {});
    }
  }, [product]);

  // ---------- Loading State ----------
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f1f3f6] dark:bg-black font-sans flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="relative mx-auto mb-6 h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-blue-950"></div>
              <div className="absolute inset-0 rounded-full border-4 border-[#2874f0] border-t-transparent animate-spin"></div>
              <BarChart3 className="absolute inset-0 m-auto h-6 w-6 text-[#2874f0]" />
            </div>
            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Comparing prices across stores...</p>
            <p className="text-xs text-zinc-400 mt-1">Fetching live data from Google Shopping</p>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Not Found State ----------
  if (!product) {
    return (
      <div className="min-h-screen bg-[#f1f3f6] dark:bg-black font-sans flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-10 max-w-md shadow-sm">
            <div className="h-16 w-16 rounded-full bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-orange-400" />
            </div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50">Product Not Found</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
              We couldn&apos;t retrieve price comparisons for this product. It may have been removed or the search returned no results.
            </p>
            <Link
              href={`/?gl=${currentGl}`}
              className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-[#2874f0] px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-600 transition-all"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Comparator
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const watched = isWatched(product.id);
  const sortedOffers = [...product.offers].sort((a, b) => a.price - b.price);
  const categoryName = product.category.charAt(0).toUpperCase() + product.category.slice(1);
  const currencySymbol = product.currencySymbol || "$";

  const formatPrice = (p: number) => {
    if (currencySymbol === "₹" || currencySymbol === "¥") {
      return `${currencySymbol}${Math.round(p).toLocaleString()}`;
    }
    return `${currencySymbol}${p.toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-[#f1f3f6] dark:bg-black font-sans pb-0 flex flex-col justify-between transition-colors duration-200">
      <div className="flex-1">
        <Toaster position="bottom-center" richColors />
        <Header />
        <CategoryBar selectedCategory={product.category} />

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500 mb-4 flex-wrap">
          <Link href={`/?gl=${currentGl}`} className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">Home</Link>
          <span>›</span>
          <Link href={`/category/${product.category}?gl=${currentGl}`} className="hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">{categoryName}</Link>
          <span>›</span>
          <span className="text-zinc-600 dark:text-zinc-300 font-bold truncate max-w-[200px] sm:max-w-xs">
            {product.name.split("(")[0].trim()}
          </span>
        </div>

        <div className={cn(
           "rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 flex flex-col gap-8",
           isOpen ? "xl:flex-row" : "lg:flex-row"
         )}>

          {/* ═══ LEFT COLUMN: IMAGE ═══ */}
          <div className={cn(
             "flex flex-col",
             isOpen ? "xl:w-5/12" : "lg:w-5/12"
           )}>
            <div className="lg:sticky lg:top-20 space-y-4">
              {/* Main Image */}
              <div className="relative aspect-square w-full flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-900/50 rounded-xl overflow-hidden border border-zinc-100 dark:border-zinc-900">
                <img
                  src={activeImage}
                  alt={product.name}
                  className="h-full max-h-[380px] w-full object-contain p-6"
                />
                {/* Live badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700 rounded-full px-2.5 py-1 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400">LIVE PRICES</span>
                </div>
              </div>

              {/* Thumbnails */}
              {product.images && product.images.length > 1 && (
                <div className="flex gap-2 justify-center overflow-x-auto py-1">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(img)}
                      className="h-16 w-16 flex-shrink-0 rounded-lg border-2 p-1.5 bg-white dark:bg-zinc-900 transition-all cursor-pointer border-zinc-200 dark:border-zinc-800 hover:border-zinc-400"
                    >
                      <img src={img} alt="" className="h-full w-full object-contain" />
                    </button>
                  ))}
                </div>
              )}

              {/* Watchlist Button */}
              <Button
                onClick={() => {
                  toggleWatchlist(product);
                  toast.success(watched ? "Removed from watchlist" : "Added to watchlist!");
                }}
                variant={watched ? "default" : "outline"}
                className={`w-full flex items-center justify-center gap-2 py-5 rounded-xl font-bold cursor-pointer text-xs ${
                  watched
                    ? "bg-red-50 hover:bg-red-100 border-red-200 text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400"
                    : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300"
                }`}
              >
                <Heart className={`h-4 w-4 ${watched ? "fill-red-500 text-red-650" : ""}`} />
                {watched ? "Remove from Watchlist" : "Add to Watchlist"}
              </Button>
            </div>
          </div>

          {/* ═══ RIGHT COLUMN: DETAILS ═══ */}
          <div className="flex-1 min-w-0 text-zinc-900 dark:text-zinc-50 space-y-5">

            {/* Title + Brand */}
            <div>
              <Badge variant="outline" className="border-blue-150 dark:border-blue-900 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 font-black text-[10px] tracking-widest uppercase mb-2">
                {product.brand}
              </Badge>
              <h1 className="text-xl font-bold leading-snug sm:text-2xl text-zinc-900 dark:text-zinc-50">
                {product.name}
              </h1>

              {/* Ratings */}
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <Badge className="flex items-center gap-0.5 bg-green-600 hover:bg-green-600 px-2.5 py-0.5 rounded-md text-[11px] font-black text-white leading-none">
                  {product.rating.toFixed(1)} <Star className="h-3 w-3 fill-current ml-0.5" />
                </Badge>
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  {product.ratingCount.toLocaleString()} Ratings &middot; {product.reviewsCount.toLocaleString()} Reviews
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-zinc-400">
                  <Clock className="h-3 w-3" /> Updated live
                </span>
              </div>
            </div>

            {/* Savings Alert */}
            <SavingsBar offers={sortedOffers} currencySymbol={currencySymbol} />

            <Tabs defaultValue="comparison" className="w-full">
              <TabsList className="grid grid-cols-3 w-full bg-zinc-50 dark:bg-zinc-900/40 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <TabsTrigger value="comparison" className="text-xs font-bold py-2 rounded-lg cursor-pointer">Price Comparison</TabsTrigger>
                <TabsTrigger value="specs" className="text-xs font-bold py-2 rounded-lg cursor-pointer">Specifications</TabsTrigger>
                <TabsTrigger value="highlights" className="text-xs font-bold py-2 rounded-lg cursor-pointer">Highlights</TabsTrigger>
              </TabsList>

              {/* ─── TAB: Price Comparison ─── */}
              <TabsContent value="comparison" className="mt-4 space-y-3">
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">
                  {sortedOffers.length} stores compared · Sorted cheapest first
                </p>

                <div className="rounded-xl border border-zinc-200 dark:border-zinc-900 overflow-hidden bg-white dark:bg-zinc-950/40">
                  <Table>
                    <TableHeader className="bg-zinc-50 dark:bg-zinc-900/60">
                      <TableRow className="border-b border-zinc-200 dark:border-zinc-800 hover:bg-transparent">
                        <TableHead className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 py-3.5 pl-4">Retailer</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 py-3.5">Delivery</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 py-3.5 text-right">Price</TableHead>
                        <TableHead className="text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 py-3.5 text-right pr-4">Link</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-zinc-150 dark:divide-zinc-900">
                      {sortedOffers.map((offer, index) => {
                        const isCheapest = index === 0;
                        const logoUrl = (offer as any).logoUrl as string | undefined;
                        return (
                          <TableRow
                            key={index}
                            className={`border-b last:border-b-0 border-zinc-100 dark:border-zinc-900/80 transition-colors ${
                              isCheapest
                                ? "bg-emerald-50/30 hover:bg-emerald-50/55 dark:bg-emerald-950/5 dark:hover:bg-emerald-950/10"
                                : "hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20"
                            }`}
                          >
                            <TableCell className="py-3.5 pl-4 flex items-center gap-2.5">
                              <StoreLogo src={logoUrl} alt={offer.source} />
                              <div className="min-w-0">
                                <span className="font-bold text-zinc-850 dark:text-zinc-200 block truncate text-xs">
                                  {offer.source}
                                </span>
                                {isCheapest && (
                                  <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white font-black text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-md mt-0.5 leading-none">
                                    Cheapest
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-3.5 text-zinc-500 dark:text-zinc-400 font-medium text-xs">
                              {offer.delivery}
                            </TableCell>
                            <TableCell className="py-3.5 text-right">
                              <div className="flex flex-col items-end">
                                <span className={`font-black text-xs ${isCheapest ? "text-emerald-600 dark:text-emerald-450" : "text-zinc-850 dark:text-zinc-200"}`}>
                                  {formatPrice(offer.price)}
                                </span>
                                {offer.originalPrice > offer.price && (
                                  <span className="text-[10px] text-zinc-400 line-through dark:text-zinc-550">
                                    {formatPrice(offer.originalPrice)}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-3.5 text-right pr-4">
                              <Button
                                size="sm"
                                asChild
                                className={`h-8 font-bold text-[10px] cursor-pointer ${
                                  isCheapest
                                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                    : "bg-[#2874f0] hover:bg-blue-600 text-white shadow-xs"
                                }`}
                              >
                                <a href={offer.link} target="_blank" rel="noopener noreferrer">
                                  Buy
                                  <ExternalLink className="h-2.5 w-2.5 ml-1" />
                                </a>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* ─── TAB: Specifications ─── */}
              <TabsContent value="specs" className="mt-4">
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-900 overflow-hidden bg-white dark:bg-zinc-950/40">
                  <Table className="text-xs">
                    <TableBody>
                      {Object.entries(product.specifications).map(([key, val], idx) => (
                        <TableRow
                          key={key}
                          className={`border-b last:border-b-0 border-zinc-150 dark:border-zinc-900/80 hover:bg-transparent ${
                            idx % 2 === 0 ? "bg-zinc-50/50 dark:bg-zinc-900/20" : ""
                          }`}
                        >
                          <TableCell className="w-2/5 font-semibold text-zinc-400 dark:text-zinc-500 border-r border-zinc-100 dark:border-zinc-900 pl-4 py-3">
                            {key}
                          </TableCell>
                          <TableCell className="font-bold text-zinc-700 dark:text-zinc-300 py-3">
                            {val}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* ─── TAB: Highlights ─── */}
              <TabsContent value="highlights" className="mt-4">
                <Card className="border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/40 rounded-xl">
                  <CardContent className="p-5">
                    <ul className="space-y-3.5">
                      {product.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-3.5 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40 text-[10px] font-black text-[#2874f0]">
                            {i + 1}
                          </span>
                          <span className="mt-0.5">{h}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Trust Footer */}
            <div className="flex items-center gap-4 flex-wrap border-t border-zinc-100 dark:border-zinc-800 pt-4 text-xs text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-1.5 font-bold text-green-600">
                <ShieldCheck className="h-4 w-4" />
                <span>Trendify Verified</span>
              </div>
              <span>·</span>
              <span>Real merchant links</span>
              <span>·</span>
              <span>Prices from Google Shopping</span>
            </div>
          </div>

        </div>
      </main>
      </div>
      <Footer />
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f1f3f6] dark:bg-black font-sans flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="h-8 w-8 border-4 border-[#2874f0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm font-semibold text-zinc-500">Loading comparison...</p>
            </div>
          </div>
        </div>
      }
    >
      <ProductDetailContent />
    </Suspense>
  );
}
