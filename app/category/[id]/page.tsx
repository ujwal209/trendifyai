"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Toaster, toast } from "sonner";
import { SlidersHorizontal, ArrowUpDown, X } from "lucide-react";

import Header from "@/components/Header";
import CategoryBar from "@/components/CategoryBar";
import Filters from "@/components/Filters";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";

import { fetchProductsAction } from "@/app/actions/fetch-products";
import { ComparatorProduct } from "@/lib/products";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAi } from "@/lib/ai-context";
import { cn } from "@/lib/utils";

function CategoryContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const categoryId = (params.id as string) || "all";
  const currentGl = searchParams.get("gl") || "us";
  const { isOpen } = useAi();

  // Dynamic products list
  const [products, setProducts] = useState<ComparatorProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Filtering State
  const [maxPrice, setMaxPrice] = useState(150000);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [minDiscount, setMinDiscount] = useState(0);

  // Extended Filtering State
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [freeDeliveryOnly, setFreeDeliveryOnly] = useState(false);
  const [assuredOnly, setAssuredOnly] = useState(false);

  // Sorting State
  const [sortBy, setSortBy] = useState("popularity");

  // Mobile Filters toggle
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch initial category products when category or country changes
  useEffect(() => {
    async function loadCategoryProducts() {
      setLoading(true);
      setPage(1);
      setHasMore(true);
      try {
        const results = await fetchProductsAction("", categoryId, currentGl, 1);
        setProducts(results);
        setHasMore(results.length >= 10);
      } catch (err) {
        console.error("Failed to load category products from Server Action:", err);
        toast.error("Error fetching live category deals. Simulated fallback applied.");
      }
      setLoading(false);
    }
    loadCategoryProducts();
  }, [categoryId, currentGl]);

  // Fetch more category products when page increases
  useEffect(() => {
    if (page === 1) return;

    async function loadMoreCategoryProducts() {
      setLoadingMore(true);
      try {
        const results = await fetchProductsAction("", categoryId, currentGl, page);
        if (results.length > 0) {
          setProducts((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newItems = results.filter((p) => !existingIds.has(p.id));
            return [...prev, ...newItems];
          });
          setHasMore(results.length >= 10);
        } else {
          setHasMore(false);
          toast.info("No more deals found in this category.");
        }
      } catch (err) {
        console.error("Failed to load more category products:", err);
        setHasMore(false);
      }
      setLoadingMore(false);
    }
    loadMoreCategoryProducts();
  }, [page, categoryId, currentGl]);

  // Determine if loaded products are in decimal currencies (non-INR) or INR
  const isUSD = currentGl !== "in";

  // Derived filters properties from search results
  const minProductPrice = useMemo(() => {
    if (products.length === 0) return 0;
    return Math.min(...products.map((p) => p.price));
  }, [products]);

  const maxProductPrice = useMemo(() => {
    if (products.length === 0) return isUSD ? 2000 : 150000;
    return Math.max(...products.map((p) => p.price));
  }, [products, isUSD]);

  // Derive only brands that exist in this category search results
  const allBrands = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.brand))).sort();
  }, [products]);

  const allStores = useMemo(() => {
    const storesSet = new Set<string>();
    products.forEach((p) => {
      p.offers.forEach((o) => {
        if (o.source) storesSet.add(o.source);
      });
    });
    return Array.from(storesSet).sort();
  }, [products]);

  // Dynamically set default maxPrice when products list changes
  useEffect(() => {
    if (products.length > 0) {
      setMaxPrice(Math.ceil(maxProductPrice));
    } else {
      setMaxPrice(isUSD ? 2000 : 150000);
    }
  }, [products, maxProductPrice, isUSD]);

  // Filtered Products for this category
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Price Filter
      if (product.price > maxPrice) {
        return false;
      }
      // Brand Filter
      if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) {
        return false;
      }
      // Rating Filter
      if (product.rating < minRating) {
        return false;
      }
      // Discount Filter
      if (product.discount < minDiscount) {
        return false;
      }
      // Free Delivery Filter
      if (freeDeliveryOnly && !product.freeDelivery) {
        return false;
      }
      // Assured Filter
      if (assuredOnly && !product.isAssured) {
        return false;
      }
      // Store/Seller Filter
      if (selectedStores.length > 0) {
        const matchesStore = product.offers.some((offer) =>
          selectedStores.includes(offer.source)
        );
        if (!matchesStore) return false;
      }
      return true;
    });
  }, [products, maxPrice, selectedBrands, minRating, minDiscount, freeDeliveryOnly, assuredOnly, selectedStores]);

  // Sorted Products
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "discount":
          return b.discount - a.discount;
        case "popularity":
        default:
          return b.rating - a.rating;
      }
    });
  }, [filteredProducts, sortBy]);

  const handleClearFilters = () => {
    setMaxPrice(isUSD ? 2000 : 150000);
    setSelectedBrands([]);
    setMinRating(0);
    setMinDiscount(0);
    setSelectedStores([]);
    setFreeDeliveryOnly(false);
    setAssuredOnly(false);
    toast.info("Filters cleared for this category");
  };

  const categoryName = categoryId.charAt(0).toUpperCase() + categoryId.slice(1);

  return (
    <div className="min-h-screen bg-[#f1f3f6] dark:bg-black font-sans pb-0 flex flex-col justify-between transition-colors duration-200">
      <div className="flex-1">
        <Toaster position="bottom-center" richColors />
        
        {/* Header */}
        <Header />

        {/* Category Navigation Bar */}
        <CategoryBar selectedCategory={categoryId} />

        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 dark:text-zinc-500 mb-4 px-1">
            <span>Home</span>
            <span>&gt;</span>
            <span className="text-zinc-600 dark:text-zinc-300 font-bold">{categoryName}</span>
          </div>

          {/* Catalog Section */}
          <div className="flex gap-4 items-start">
            
            {/* Left Sidebar: Filters (Hidden on Mobile) */}
            <div className={cn(
              "w-72 flex-shrink-0",
              isOpen ? "hidden xl:block" : "hidden lg:block"
            )}>
              <Filters
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                selectedBrands={selectedBrands}
                setSelectedBrands={setSelectedBrands}
                minRating={minRating}
                setMinRating={setMinRating}
                minDiscount={minDiscount}
                setMinDiscount={setMinDiscount}
                allBrands={allBrands}
                isUSD={isUSD}
                minProductPrice={minProductPrice}
                maxProductPrice={maxProductPrice}
                allStores={allStores}
                selectedStores={selectedStores}
                setSelectedStores={setSelectedStores}
                freeDeliveryOnly={freeDeliveryOnly}
                setFreeDeliveryOnly={setFreeDeliveryOnly}
                assuredOnly={assuredOnly}
                setAssuredOnly={setAssuredOnly}
                onClearAll={handleClearFilters}
              />
            </div>

            {/* Right Area: Products Grid & Sort Tabs */}
            <div className="flex-1 flex flex-col min-w-0">
              
              {/* Sorting Tabs & Mobile Filters Toggle */}
              <div className="flex flex-col gap-3 rounded-md border border-zinc-200 bg-white p-3 shadow-xs dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between mb-4">
                {/* Count / Title */}
                <div className="flex items-baseline gap-2">
                  <h2 className="text-base font-black text-zinc-900 dark:text-zinc-50">
                    Shop {categoryName} Comparisons
                  </h2>
                  <span className="text-xs font-semibold text-zinc-400">
                    ({sortedProducts.length} items found)
                  </span>
                </div>

                {/* Sorting Options */}
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  {/* Mobile Filter Button */}
                  <button
                    onClick={() => setShowMobileFilters(true)}
                    className={cn(
                      "flex items-center gap-1.5 rounded border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900 cursor-pointer",
                      isOpen ? "xl:hidden" : "lg:hidden"
                    )}
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filters
                  </button>

                  {/* Sort Select Dropdown */}
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="text-zinc-400 flex items-center gap-1">
                      <ArrowUpDown className="h-3 w-3" /> Sort:
                    </span>
                    <Select value={sortBy} onValueChange={(val) => setSortBy(val)}>
                      <SelectTrigger className="w-[150px] h-8 bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-[11px] font-bold cursor-pointer rounded-lg">
                        <SelectValue placeholder="Sort options" />
                      </SelectTrigger>
                      <SelectContent position="popper" align="end" className="dark:bg-zinc-950 dark:border-zinc-800">
                        <SelectItem value="popularity" className="text-[11px] font-semibold cursor-pointer">Popularity</SelectItem>
                        <SelectItem value="price-asc" className="text-[11px] font-semibold cursor-pointer">Price: Low to High</SelectItem>
                        <SelectItem value="price-desc" className="text-[11px] font-semibold cursor-pointer">Price: High to Low</SelectItem>
                        <SelectItem value="discount" className="text-[11px] font-semibold cursor-pointer">Discount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Products Grid / Skeletons */}
              {loading ? (
                <div className={cn(
                  "grid grid-cols-1 gap-4 sm:grid-cols-2",
                  isOpen 
                    ? "lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3" 
                    : "lg:grid-cols-2 xl:grid-cols-3"
                )}>
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <div
                      key={num}
                      className="flex flex-col justify-between overflow-hidden rounded-md border border-zinc-200 bg-white p-4 shadow-sm animate-pulse dark:border-zinc-800 dark:bg-zinc-950 h-80"
                    >
                      <div className="aspect-square w-full bg-zinc-100 rounded-sm dark:bg-zinc-900 p-2"></div>
                      <div className="space-y-2 mt-4 flex-1">
                        <div className="h-3 bg-zinc-200 dark:bg-zinc-850 rounded w-1/3"></div>
                        <div className="h-4 bg-zinc-200 dark:bg-zinc-850 rounded w-5/6"></div>
                        <div className="h-4 bg-zinc-200 dark:bg-zinc-850 rounded w-2/3"></div>
                        <div className="h-3 bg-zinc-200 dark:bg-zinc-850 rounded w-1/2 mt-2"></div>
                      </div>
                      <div className="mt-4 pt-3 flex gap-2 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="h-8 bg-zinc-200 dark:bg-zinc-850 rounded flex-1"></div>
                        <div className="h-8 bg-zinc-200 dark:bg-zinc-850 rounded flex-1"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : sortedProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-950 rounded-md border border-zinc-200 dark:border-zinc-800 text-center shadow-xs">
                  <img
                    src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400&auto=format&fit=crop&q=80"
                    alt="No Results"
                    className="w-36 h-36 object-cover rounded-full opacity-60"
                  />
                  <h3 className="mt-4 text-base font-black">No Products Match Your Filters!</h3>
                  <p className="mt-1 text-xs text-zinc-500 max-w-sm dark:text-zinc-400">
                    Try adjusting your price slider, selecting different brands, or clearing active filters to browse the full catalog.
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="mt-6 rounded bg-[#2874f0] px-6 py-2.5 text-xs font-bold text-white shadow hover:bg-blue-600 transition-all cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <>
                  <div className={cn(
                    "grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-2",
                    isOpen 
                      ? "lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3" 
                      : "lg:grid-cols-2 xl:grid-cols-3"
                  )}>
                    {sortedProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {/* Load More Button */}
                  {hasMore && (
                    <div className="mt-8 flex justify-center">
                      <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={loadingMore}
                        className="flex items-center gap-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-900 px-8 py-2.5 text-xs font-black text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        {loadingMore ? (
                          <>
                            <div className="h-3 w-3 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
                            Loading more...
                          </>
                        ) : (
                          "Load More Deals"
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>

        {/* Mobile Drawer Filters */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 overflow-hidden lg:hidden">
            <div
              onClick={() => setShowMobileFilters(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            />
            <div className="absolute inset-y-0 left-0 flex max-w-full pr-10">
              <div className="w-screen max-w-xs transform bg-white dark:bg-zinc-950 transition-transform duration-300 ease-in-out shadow-2xl flex flex-col h-full animate-in slide-in-from-left">
                <div className="bg-[#2874f0] text-white px-4 py-4 flex items-center justify-between shadow-sm">
                  <h2 className="text-base font-bold">Filters</h2>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="rounded-full hover:bg-white/10 p-1.5 transition-colors text-white cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <Filters
                    maxPrice={maxPrice}
                    setMaxPrice={setMaxPrice}
                    selectedBrands={selectedBrands}
                    setSelectedBrands={setSelectedBrands}
                    minRating={minRating}
                    setMinRating={setMinRating}
                    minDiscount={minDiscount}
                    setMinDiscount={setMinDiscount}
                    allBrands={allBrands}
                    isUSD={isUSD}
                    minProductPrice={minProductPrice}
                    maxProductPrice={maxProductPrice}
                    allStores={allStores}
                    selectedStores={selectedStores}
                    setSelectedStores={setSelectedStores}
                    freeDeliveryOnly={freeDeliveryOnly}
                    setFreeDeliveryOnly={setFreeDeliveryOnly}
                    assuredOnly={assuredOnly}
                    setAssuredOnly={setAssuredOnly}
                    onClearAll={handleClearFilters}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Massive Footer */}
      <Footer />
    </div>
  );
}

export default function CategoryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f1f3f6] dark:bg-black font-sans flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 border-4 border-[#2874f0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-semibold text-zinc-500">Loading products...</p>
          </div>
        </div>
      </div>
    }>
      <CategoryContent />
    </Suspense>
  );
}
