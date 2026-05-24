"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ComparatorProduct } from "@/lib/products";
import { toast } from "sonner";
import {
  getWatchlistAction,
  addToWatchlistAction,
  removeFromWatchlistAction,
} from "@/app/actions/user-actions";

interface WatchlistItem {
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
}

interface WatchlistContextType {
  watchlistItems: WatchlistItem[];
  isWatchlistOpen: boolean;
  isAuthenticated: boolean;
  addToWatchlist: (product: ComparatorProduct, currencySymbol?: string) => Promise<void>;
  removeFromWatchlist: (productId: string) => Promise<void>;
  toggleWatchlist: (product: ComparatorProduct, currencySymbol?: string) => Promise<void>;
  isWatched: (productId: string) => boolean;
  openWatchlist: () => void;
  closeWatchlist: () => void;
  refreshWatchlist: () => Promise<void>;
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(undefined);

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const refreshWatchlist = useCallback(async () => {
    try {
      const result = await getWatchlistAction();
      if (result.success) {
        setWatchlistItems(result.items as WatchlistItem[]);
        setIsAuthenticated(true);
      } else {
        setWatchlistItems([]);
        setIsAuthenticated(false);
      }
    } catch {
      setWatchlistItems([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    refreshWatchlist();
  }, [refreshWatchlist]);

  const addToWatchlist = async (product: ComparatorProduct, currencySymbol?: string) => {
    if (watchlistItems.some((item) => item.productId === product.id)) {
      toast.info("Product is already on your watchlist");
      return;
    }
    const result = await addToWatchlistAction(product, currencySymbol);
    if (result.success) {
      toast.success(`Added ${product.brand} product to your watchlist!`);
      await refreshWatchlist();
    } else if ((result as any).error === "Please log in to save to watchlist") {
      toast.error("Please log in to save products to your watchlist");
    } else {
      toast.info((result as any).message || "Already in watchlist");
    }
  };

  const removeFromWatchlist = async (productId: string) => {
    const item = watchlistItems.find((i) => i.productId === productId);
    if (item) toast.info(`Removed ${item.productBrand} product from watchlist`);
    const result = await removeFromWatchlistAction(productId);
    if (result.success) {
      await refreshWatchlist();
    } else {
      toast.error("Failed to remove from watchlist");
    }
  };

  const toggleWatchlist = async (product: ComparatorProduct, currencySymbol?: string) => {
    const exists = watchlistItems.some((item) => item.productId === product.id);
    if (exists) {
      await removeFromWatchlist(product.id);
    } else {
      await addToWatchlist(product, currencySymbol);
    }
  };

  const isWatched = (productId: string) => {
    return watchlistItems.some((item) => item.productId === productId);
  };

  const openWatchlist = () => setIsWatchlistOpen(true);
  const closeWatchlist = () => setIsWatchlistOpen(false);

  return (
    <WatchlistContext.Provider
      value={{
        watchlistItems,
        isWatchlistOpen,
        isAuthenticated,
        addToWatchlist,
        removeFromWatchlist,
        toggleWatchlist,
        isWatched,
        openWatchlist,
        closeWatchlist,
        refreshWatchlist,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (context === undefined) {
    throw new Error("useWatchlist must be used within a WatchlistProvider");
  }
  return context;
}
