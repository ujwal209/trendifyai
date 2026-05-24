"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "./products";
import { toast } from "sonner";

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  cartItems: CartItem[];
  isCartOpen: boolean;
  isCheckoutOpen: boolean;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  openCheckout: () => void;
  closeCheckout: () => void;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Load cart from localStorage on mount (client-side only)
  useEffect(() => {
    const savedCart = localStorage.getItem("trendify_cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart items from localStorage", e);
      }
    }
  }, []);

  // Save cart to localStorage when it changes
  const saveCart = (items: CartItem[]) => {
    setCartItems(items);
    localStorage.setItem("trendify_cart", JSON.stringify(items));
  };

  const addToCart = (product: Product) => {
    const existingIndex = cartItems.findIndex((item) => item.product.id === product.id);
    let newItems: CartItem[];
    if (existingIndex > -1) {
      newItems = cartItems.map((item, index) =>
        index === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
      );
      toast.success(`Increased quantity of ${product.brand} in cart!`);
    } else {
      newItems = [...cartItems, { product, quantity: 1 }];
      toast.success(`Added ${product.name.split(" (")[0]} to cart!`);
    }
    saveCart(newItems);
  };

  const removeFromCart = (productId: string) => {
    const item = cartItems.find((i) => i.product.id === productId);
    if (item) {
      toast.info(`Removed ${item.product.brand} product from cart`);
    }
    const newItems = cartItems.filter((i) => i.product.id !== productId);
    saveCart(newItems);
  };

  const updateQuantity = (productId: string, delta: number) => {
    const newItems = cartItems
      .map((item) => {
        if (item.product.id === productId) {
          const nextQty = item.quantity + delta;
          return { ...item, quantity: nextQty };
        }
        return item;
      })
      .filter((item) => item.quantity > 0);
    saveCart(newItems);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const openCheckout = () => setIsCheckoutOpen(true);
  const closeCheckout = () => setIsCheckoutOpen(false);

  const totalAmount = React.useMemo(() => {
    const discountedSum = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const delivery = cartItems.length > 0 && discountedSum > 1000 ? 0 : cartItems.length > 0 ? 40 : 0;
    return discountedSum + delivery;
  }, [cartItems]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isCartOpen,
        isCheckoutOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        openCheckout,
        closeCheckout,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
