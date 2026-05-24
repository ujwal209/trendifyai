"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  User, Heart, Clock, LogOut, Trash2, Eye, ArrowLeft,
  MapPin, Tag, Store, RefreshCw, X, Settings, ChevronRight,
  ShoppingBag, History, LogIn, Star, Edit, Save, Globe, Info,
  Smartphone, Laptop, Headphones, Shirt, Plug, BookOpen, Globe2, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useWatchlist } from "@/lib/watchlist-context";
import { getCurrentUserAction, logoutAction, updateOnboardingAction } from "@/app/actions/auth-actions";
import {
  getHistoryAction,
  removeFromHistoryAction,
  clearHistoryAction,
} from "@/app/actions/user-actions";

type HistoryItem = {
  productId: string;
  productName: string;
  productBrand: string;
  productImage: string;
  productPrice: number;
  currencySymbol?: string;
  viewedAt: number;
};

type UserProfile = {
  id: string;
  email: string;
  onboarded: boolean;
  country?: string;
  categories?: string[];
  brands?: string[];
};

type Tab = "profile" | "watchlist" | "history";

const COUNTRIES = [
  { code: "us", name: "United States", currency: "USD ($)" },
  { code: "in", name: "India", currency: "INR (₹)" },
  { code: "uk", name: "United Kingdom", currency: "GBP (£)" },
  { code: "ca", name: "Canada", currency: "CAD ($)" },
  { code: "au", name: "Australia", currency: "AUD ($)" },
  { code: "de", name: "Germany", currency: "EUR (€)" },
  { code: "fr", name: "France", currency: "EUR (€)" },
  { code: "jp", name: "Japan", currency: "JPY (¥)" },
];

const CATEGORIES = [
  { id: "mobiles", label: "Mobiles", icon: Smartphone, desc: "Smartphones & cases" },
  { id: "laptops", label: "Laptops", icon: Laptop, desc: "Notebooks & monitors" },
  { id: "headphones", label: "Headphones", icon: Headphones, desc: "Audio & speakers" },
  { id: "fashion", label: "Fashion", icon: Shirt, desc: "Apparel & footwear" },
  { id: "appliances", label: "Appliances", icon: Plug, desc: "Kitchen & smart home" },
  { id: "books", label: "Books", icon: BookOpen, desc: "Fiction & academic" },
];

const BRANDS = [
  { id: "apple", label: "Apple", category: "Electronics" },
  { id: "samsung", label: "Samsung", category: "Electronics" },
  { id: "sony", label: "Sony", category: "Audio" },
  { id: "dell", label: "Dell", category: "Electronics" },
  { id: "hp", label: "HP", category: "Electronics" },
  { id: "nike", label: "Nike", category: "Fashion" },
  { id: "adidas", label: "Adidas", category: "Fashion" },
  { id: "bose", label: "Bose", category: "Audio" },
  { id: "philips", label: "Philips", category: "Appliances" },
];

const COUNTRY_NAMES: Record<string, string> = {
  us: "United States",
  in: "India",
  uk: "United Kingdom",
  ca: "Canada",
  au: "Australia",
  de: "Germany",
  fr: "France",
  jp: "Japan",
};

function formatPrice(price: number, symbol?: string) {
  const s = symbol || "₹";
  if (s === "₹" || s === "¥") return `${s}${Math.round(price).toLocaleString()}`;
  return `${s}${price.toFixed(2)}`;
}

function timeAgo(timestamp: number) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return "Just now";
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1: PROFILE & INLINE PREFERENCES EDITING
// ─────────────────────────────────────────────────────────────────────────────
function ProfileTab({ user, onProfileUpdate }: { user: UserProfile; onProfileUpdate: () => void }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit State Form fields
  const [editCountry, setEditCountry] = useState(user.country || "us");
  const [editCategories, setEditCategories] = useState<string[]>(user.categories || []);
  const [editBrands, setEditBrands] = useState<string[]>(user.brands || []);
  const [saving, setSaving] = useState(false);

  // Sync state if user changes
  useEffect(() => {
    setEditCountry(user.country || "us");
    setEditCategories(user.categories || []);
    setEditBrands(user.brands || []);
  }, [user]);

  const handleLogout = async () => {
    setSigningOut(true);
    const res = await logoutAction();
    if (res.success) {
      toast.success("Successfully signed out");
      router.push("/");
      router.refresh();
    }
    setSigningOut(false);
  };

  const toggleCategory = (catLabel: string) => {
    if (editCategories.includes(catLabel)) {
      setEditCategories(editCategories.filter((c) => c !== catLabel));
    } else {
      setEditCategories([...editCategories, catLabel]);
    }
  };

  const toggleBrand = (brandLabel: string) => {
    if (editBrands.includes(brandLabel)) {
      setEditBrands(editBrands.filter((b) => b !== brandLabel));
    } else {
      setEditBrands([...editBrands, brandLabel]);
    }
  };

  const handleSave = async () => {
    if (!editCountry) {
      toast.error("Please select a target country");
      return;
    }
    if (editCategories.length === 0) {
      toast.error("Please select at least one preferred category");
      return;
    }

    setSaving(true);
    const toastId = toast.loading("Updating your shopping preferences...");
    try {
      const res = await updateOnboardingAction(editCountry, editCategories, editBrands);
      if (res.success) {
        toast.success("Preferences updated successfully!", { id: toastId });
        setIsEditing(false);
        onProfileUpdate(); // Reload parent data
        router.refresh();
      } else {
        toast.error(res.error || "Failed to update preferences", { id: toastId });
      }
    } catch (e: any) {
      toast.error(`An unexpected error occurred: ${e.message || e}`, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Account Identity Card */}
      <div className="bg-gradient-to-br from-blue-600 via-[#2874f0] to-indigo-700 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg border border-white/10">
        <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-white/5 blur-xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/5 blur-xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div className="h-20 w-20 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl font-black border border-white/20 shadow-inner">
            {user.email[0].toUpperCase()}
          </div>
          <div className="flex-1 space-y-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white border border-white/10 backdrop-blur-xs uppercase tracking-wider">
              Verified Shopper
            </span>
            <h2 className="text-xl font-black mt-1 leading-none">{user.email.split("@")[0]}</h2>
            <p className="text-white/60 text-xs font-semibold">{user.email}</p>
          </div>
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <Button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-white hover:bg-zinc-100 text-[#2874f0] font-bold text-xs rounded-xl shadow-xs border border-transparent dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white cursor-pointer"
            >
              {isEditing ? (
                <>
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Edit Preferences
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Preferences Container */}
      <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-900 overflow-hidden shadow-xs">
        
        {/* Title bar */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            <Settings className="h-4.5 w-4.5 text-[#2874f0] dark:text-[#ffe500]" />
            <h3 className="text-sm font-black text-zinc-900 dark:text-white">Shopping Settings</h3>
          </div>
          {isEditing && (
            <span className="text-[10px] bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 font-bold px-2 py-0.5 rounded border border-amber-100 dark:border-amber-900 animate-pulse">
              UNSAVED CHANGES
            </span>
          )}
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">

          {/* 1. Country Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" /> Target Shopping Country
            </label>
            
            {isEditing ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setEditCountry(c.code)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                      editCountry === c.code 
                        ? "border-[#2874f0] bg-[#2874f0]/5 text-[#2874f0] dark:border-[#ffe500] dark:bg-[#ffe500]/5 dark:text-[#ffe500] font-bold shadow-xs"
                        : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                    }`}
                  >
                    <Globe2 className="h-5 w-5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate leading-tight">{c.name}</p>
                      <p className="text-[9px] text-zinc-400 mt-0.5">{c.currency}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-100 dark:border-zinc-900">
                <div className="p-2.5 bg-blue-50 dark:bg-zinc-900 text-[#2874f0] dark:text-[#ffe500] rounded-xl flex-shrink-0">
                  <Globe2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-black text-zinc-800 dark:text-zinc-150">
                    {COUNTRY_NAMES[user.country || ""] || "Not configured"}
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                    Currency, stores, and price feeds are localized to this region.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 2. Favorite Categories */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" /> Favorite Categories
            </label>

            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => {
                  const active = editCategories.includes(cat.label);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.label)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                        active
                          ? "border-[#2874f0] bg-[#2874f0]/5 text-[#2874f0] dark:border-[#ffe500] dark:bg-[#ffe500]/5 dark:text-[#ffe500] font-bold"
                          : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {(() => {
                        const Icon = cat.icon;
                        return <Icon className="h-5 w-5 text-zinc-550 mr-1.5 flex-shrink-0" />;
                      })()}
                      <div>
                        <p className="text-xs font-bold leading-tight">{cat.label}</p>
                        <p className="text-[9px] text-zinc-450 dark:text-zinc-500 mt-0.5">{cat.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user.categories && user.categories.length > 0 ? (
                  user.categories.map((cat) => {
                    const CatIcon = CATEGORIES.find(c => c.label === cat)?.icon || Tag;
                    return (
                      <span key={cat} className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50/50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-150 dark:border-zinc-800">
                        <CatIcon className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 mr-1.5" />
                        <span className="ml-1.5">{cat}</span>
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-zinc-450 italic">No preferred categories chosen</span>
                )}
              </div>
            )}
          </div>

          {/* 3. Favorite Brands */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5" /> Favorite Brands
            </label>

            {isEditing ? (
              <div className="flex flex-wrap gap-2">
                {BRANDS.map((brand) => {
                  const active = editBrands.includes(brand.label);
                  return (
                    <button
                      key={brand.id}
                      onClick={() => toggleBrand(brand.label)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-150 cursor-pointer ${
                        active
                          ? "bg-[#2874f0] border-[#2874f0] text-white dark:bg-[#ffe500] dark:border-[#ffe500] dark:text-black shadow-xs"
                          : "bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100"
                      }`}
                    >
                      {brand.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {user.brands && user.brands.length > 0 ? (
                  user.brands.map((brand) => (
                    <span key={brand} className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-250 border border-zinc-200 dark:border-zinc-800">
                      {brand}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-zinc-450 italic">No favorite brands chosen</span>
                )}
              </div>
            )}
          </div>

          {/* Save Button */}
          {isEditing && (
            <div className="flex items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-900 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditCountry(user.country || "us");
                  setEditCategories(user.categories || []);
                  setEditBrands(user.brands || []);
                }}
                disabled={saving}
                className="rounded-xl border-zinc-200 dark:border-zinc-800 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#2874f0] hover:bg-blue-600 text-white font-bold rounded-xl px-5 cursor-pointer dark:bg-[#ffe500] dark:hover:bg-[#e6cf00] dark:text-black"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1.5" />
                    Save Preferences
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Account Settings Action Card */}
      <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-900 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-900">
          <h3 className="text-sm font-black text-zinc-900 dark:text-white">Account Safety</h3>
        </div>
        <div className="p-4">
          <button
            onClick={handleLogout}
            disabled={signingOut}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-2xl hover:bg-red-50/50 dark:hover:bg-red-950/10 transition-all text-left disabled:opacity-50 border border-transparent hover:border-red-100 dark:hover:border-red-950/20 cursor-pointer"
          >
            <div className="p-2.5 bg-red-50 dark:bg-red-950/25 rounded-xl">
              <LogOut className="h-5 w-5 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-red-600 dark:text-red-400">{signingOut ? "Signing out..." : "Sign Out"}</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-550 mt-0.5">Logout from this browser session</p>
            </div>
            <ChevronRight className="h-4 w-4 text-red-300 dark:text-red-900" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2: WATCHLIST
// ─────────────────────────────────────────────────────────────────────────────
function WatchlistTab() {
  const router = useRouter();
  const { watchlistItems, removeFromWatchlist, refreshWatchlist } = useWatchlist();
  const [clearing, setClearing] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (productId: string, brand: string) => {
    setRemovingId(productId);
    try {
      await removeFromWatchlist(productId);
    } catch {
      toast.error("Failed to remove item");
    } finally {
      setRemovingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear your entire watchlist?")) return;
    setClearing(true);
    const toastId = toast.loading("Clearing watchlist...");
    const { clearWatchlistAction } = await import("@/app/actions/user-actions");
    const res = await clearWatchlistAction();
    if (res.success) {
      toast.success("Watchlist cleared!", { id: toastId });
      await refreshWatchlist();
    } else {
      toast.error(res.error || "Failed to clear watchlist", { id: toastId });
    }
    setClearing(false);
  };

  if (watchlistItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-900 text-center px-8 shadow-xs">
        <div className="p-5 bg-blue-50 dark:bg-zinc-900 rounded-full mb-5">
          <Heart className="size-10 text-blue-550 dark:text-zinc-650" />
        </div>
        <h3 className="text-base font-black text-zinc-900 dark:text-white">Watchlist is Empty</h3>
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500 max-w-xs leading-normal">
          Explore the catalog and tap the heart icon on any product page to save details here.
        </p>
        <Button
          onClick={() => router.push("/")}
          className="mt-6 bg-[#2874f0] hover:bg-blue-600 text-white font-bold text-xs rounded-xl px-5 h-10 shadow-xs cursor-pointer"
        >
          Browse Hot Deals
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{watchlistItems.length} Saved Product{watchlistItems.length !== 1 && "s"}</p>
        <button
          onClick={handleClearAll}
          disabled={clearing}
          className="text-xs font-bold text-red-500 hover:text-red-600 disabled:opacity-50 cursor-pointer flex items-center gap-1 hover:underline"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {clearing ? "Clearing..." : "Clear Watchlist"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
        {watchlistItems.map((item) => {
          const sortedOffers = item.offers ? [...item.offers].sort((a, b) => a.price - b.price) : [];
          const bestStore = sortedOffers[0]?.source;
          const isRemoving = removingId === item.productId;

          return (
            <div
              key={item.productId}
              className={`group bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-900 p-4 shadow-xs hover:shadow-md transition-all duration-200 flex gap-4 items-center ${
                isRemoving ? "opacity-30 scale-95" : ""
              }`}
            >
              {/* Product Thumbnail */}
              <div className="h-16 w-16 bg-zinc-50 dark:bg-zinc-900 rounded-xl p-1 flex items-center justify-center flex-shrink-0 border border-zinc-100 dark:border-zinc-900 overflow-hidden">
                <img src={item.productImage} alt={item.productName} className="h-full w-full object-contain mix-blend-multiply dark:mix-blend-normal" />
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none block">
                  {item.productBrand}
                </span>
                <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1 leading-tight mt-1">
                  {item.productName}
                </h4>
                
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  <span className="text-xs font-black text-zinc-900 dark:text-white">
                    {formatPrice(item.productPrice, item.currencySymbol)}
                  </span>
                  {bestStore && (
                    <span className="text-[9px] font-bold text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 px-1.5 py-0.5 rounded">
                      Cheapest on {bestStore}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-zinc-50 dark:border-zinc-900">
                  <button
                    onClick={() => router.push(`/product/${item.productId}?name=${encodeURIComponent(item.productName)}`)}
                    className="flex items-center gap-1 text-[10px] font-bold text-[#2874f0] hover:text-blue-700 cursor-pointer hover:underline"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Compare
                  </button>
                  <span className="text-zinc-200 dark:text-zinc-800">|</span>
                  <button
                    onClick={() => handleRemove(item.productId, item.productBrand)}
                    disabled={isRemoving}
                    className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-red-500 cursor-pointer disabled:cursor-not-allowed hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3: HISTORY
// ─────────────────────────────────────────────────────────────────────────────
function HistoryTab({ initialItems }: { initialItems: HistoryItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>(initialItems);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const handleRemove = async (productId: string) => {
    setRemovingId(productId);
    const res = await removeFromHistoryAction(productId);
    if (res.success) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      toast.success("Removed from history");
    } else toast.error("Failed to remove");
    setRemovingId(null);
  };

  const handleClear = async () => {
    if (!confirm("Are you sure you want to clear your entire browse history?")) return;
    setClearing(true);
    const res = await clearHistoryAction();
    if (res.success) {
      setItems([]);
      toast.success("Browse history cleared!");
    } else toast.error("Failed to clear history");
    setClearing(false);
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-900 text-center px-8 shadow-xs">
        <div className="p-5 bg-zinc-50 dark:bg-zinc-900 rounded-full mb-5">
          <History className="size-10 text-zinc-300 dark:text-zinc-650" />
        </div>
        <h3 className="text-base font-black text-zinc-900 dark:text-white">Browsing History is Empty</h3>
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500 max-w-xs leading-normal">
          Products you compare will be logged here so you can trace them back quickly later.
        </p>
        <Button
          onClick={() => router.push("/")}
          className="mt-6 bg-[#2874f0] hover:bg-blue-600 text-white font-bold text-xs rounded-xl px-5 h-10 shadow-xs cursor-pointer"
        >
          Explore Catalogs
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{items.length} Product{items.length !== 1 && "s"} Visited</p>
        <button
          onClick={handleClear}
          disabled={clearing}
          className="text-xs font-bold text-red-500 hover:text-red-600 disabled:opacity-50 cursor-pointer flex items-center gap-1 hover:underline"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {clearing ? "Clearing..." : "Clear History"}
        </button>
      </div>

      <div className="space-y-3 animate-in fade-in duration-200">
        {items.map((item) => {
          const isRemoving = removingId === item.productId;
          return (
            <div
              key={item.productId}
              className={`bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-900 p-4 shadow-xs hover:shadow-md transition-all duration-200 flex gap-4 items-center ${
                isRemoving ? "opacity-30 scale-95" : ""
              }`}
            >
              {/* Product image */}
              <div className="h-14 w-14 bg-zinc-50 dark:bg-zinc-900 rounded-xl p-1 flex items-center justify-center flex-shrink-0 border border-zinc-100 dark:border-zinc-900 overflow-hidden">
                <img src={item.productImage} alt={item.productName} className="h-full w-full object-contain mix-blend-multiply dark:mix-blend-normal" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block leading-none">
                      {item.productBrand}
                    </span>
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1 leading-tight mt-1">
                      {item.productName}
                    </h4>
                  </div>
                  <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-55/60 dark:bg-zinc-900 px-2 py-0.5 rounded flex items-center gap-1 flex-shrink-0">
                    <Clock className="h-2.5 w-2.5" />
                    {timeAgo(item.viewedAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-50 dark:border-zinc-900/60">
                  <span className="text-xs font-black text-zinc-900 dark:text-white">
                    {formatPrice(item.productPrice, item.currencySymbol)}
                  </span>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => router.push(`/product/${item.productId}?name=${encodeURIComponent(item.productName)}`)}
                      className="flex items-center gap-1 text-[10px] font-bold text-[#2874f0] hover:text-blue-700 cursor-pointer hover:underline"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Again
                    </button>
                    <span className="text-zinc-200 dark:text-zinc-800">|</span>
                    <button
                      onClick={() => handleRemove(item.productId)}
                      disabled={isRemoving}
                      className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-red-500 cursor-pointer disabled:cursor-not-allowed hover:underline"
                    >
                      <X className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PROFILE PAGE CONTENT
// ─────────────────────────────────────────────────────────────────────────────
function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentGl = searchParams.get("gl") || "us";
  const { watchlistItems } = useWatchlist();

  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadUserData() {
    const u = await getCurrentUserAction();
    setUser(u);
  }

  async function loadHistoryData() {
    const hist = await getHistoryAction();
    if (hist.success) setHistory(hist.items as HistoryItem[]);
  }

  async function loadAll() {
    setRefreshing(true);
    const [u, hist] = await Promise.all([
      getCurrentUserAction(),
      getHistoryAction(),
    ]);
    setUser(u);
    if (hist.success) setHistory(hist.items as HistoryItem[]);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f1f3f6] dark:bg-black font-sans">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="relative mx-auto h-12 w-12">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-zinc-900 animate-pulse"></div>
              <div className="absolute inset-0 rounded-full border-4 border-[#2874f0] border-t-transparent animate-spin"></div>
            </div>
            <p className="text-xs font-black text-zinc-550 tracking-wide uppercase">Syncing account profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f1f3f6] dark:bg-black font-sans">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-md relative overflow-hidden">
            <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-blue-500/5 blur-xl pointer-events-none" />
            <div className="p-4 bg-blue-50 dark:bg-zinc-900 rounded-full inline-flex mb-5 border border-blue-100 dark:border-zinc-800">
              <User className="size-10 text-[#2874f0] dark:text-[#ffe500]" />
            </div>
            <h2 className="text-lg font-black text-zinc-900 dark:text-white">Account Authentication Required</h2>
            <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500 leading-relaxed">
              Login to access saved watchlists, localized market parameters, and price comparison history logs.
            </p>
            <Button
              onClick={() => router.push("/auth")}
              className="mt-6 w-full bg-[#2874f0] hover:bg-blue-600 text-white font-bold rounded-xl h-11 cursor-pointer dark:bg-[#ffe500] dark:text-black dark:hover:bg-[#e6cf00]"
            >
              <LogIn className="size-4 mr-2" />
              Sign In to Account
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const tabList: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "profile", label: "Preferences & Settings", icon: User },
    { id: "watchlist", label: "Saved Watchlist", icon: Heart, count: watchlistItems.length },
    { id: "history", label: "Browsing Logs", icon: Clock, count: history.length },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f3f6] dark:bg-black font-sans transition-colors duration-200">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 md:py-12">
        {/* Back and Refresh Controls */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={`/?gl=${currentGl}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors uppercase tracking-wider"
          >
            <ArrowLeft className="size-4" />
            Back to Shopping
          </Link>
          
          <button
            onClick={async () => {
              await loadAll();
              toast.success("Account data updated!");
            }}
            disabled={refreshing}
            className="p-2 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-900 border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 transition-colors text-zinc-500 disabled:opacity-50 cursor-pointer shadow-xs"
            title="Refresh Account Data"
          >
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Dashboard layout structure */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Side Navigation Panel (Desktop only) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Desktop Navigation Box */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl p-3.5 shadow-xs">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-4 py-2.5">
                Dashboard Menu
              </p>
              
              <div className="space-y-1">
                {tabList.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        if (tab.id === "history") loadHistoryData();
                        if (tab.id === "profile") loadUserData();
                      }}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-zinc-100 text-[#2874f0] dark:bg-zinc-900 dark:text-[#ffe500]"
                          : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4.5 w-4.5 ${isActive ? "text-[#2874f0] dark:text-[#ffe500]" : "text-zinc-400"}`} />
                        <span>{tab.label}</span>
                      </div>
                      {tab.count !== undefined && tab.count > 0 && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive 
                            ? "bg-[#2874f0]/10 text-[#2874f0] dark:bg-[#ffe500]/10 dark:text-[#ffe500]" 
                            : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500"
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Assistant Promotional Box */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-zinc-900/50 dark:to-zinc-950 border border-indigo-100 dark:border-zinc-900 rounded-3xl p-5 shadow-xs flex flex-col justify-between h-[150px]">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-650 dark:text-[#ffe500] uppercase tracking-wide">
                  <Sparkles className="h-4 w-4 text-indigo-600 dark:text-[#ffe500]" /> AI Assistant Enabled
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal font-semibold">
                  Get customized product suggestions, price trends, and automated queries directly.
                </p>
              </div>
              <Link 
                href="/ai-assistant"
                className="text-[10px] font-black text-[#2874f0] hover:text-blue-700 dark:text-[#ffe500] inline-flex items-center gap-1 cursor-pointer group hover:underline"
              >
                Launch Dedicated Chat Console
                <ChevronRight className="h-3 w-3 transform group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Column: Tab Viewport Container */}
          <div className="lg:col-span-8">
            <div className="animate-in fade-in duration-200">
              {activeTab === "profile" && <ProfileTab user={user} onProfileUpdate={loadUserData} />}
              {activeTab === "watchlist" && <WatchlistTab />}
              {activeTab === "history" && <HistoryTab initialItems={history} />}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f1f3f6] dark:bg-black">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2874f0]"></div>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  );
}
