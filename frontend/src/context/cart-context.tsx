"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Bundle, CartItem } from "@/lib/types";

// Accepts price as number | string so API response objects pass without TypeScript errors
export type AddCartItemInput = Omit<CartItem, "quantity" | "price"> & {
  price: number | string;
};

interface CartContextType {
  items: CartItem[];
  addItem: (product: AddCartItemInput) => void;
  addPackage: (bundle: Bundle) => void;
  removeItem: (id: number | string) => void;
  removePackage: (key: string) => void;
  updateQuantity: (id: number | string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "beity_cart_items";

function normalizeStoredItem(item: CartItem): CartItem {
  if (item.kind === "bundle" || (item.bundleId && Array.isArray(item.components))) {
    return { ...item, kind: "bundle", key: item.key ?? `bundle:${item.bundleId}` };
  }
  if (item.bundleId) {
    return {
      ...item,
      kind: "legacy-bundle",
      key: item.key ?? `bundle:${item.bundleId}:${item.id}`,
    };
  }
  return { ...item, kind: "product", key: item.key ?? `product:${item.id}` };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        setItems(Array.isArray(parsed) ? parsed.map(normalizeStoredItem) : []);
      }
    } catch (error) {
      console.error("Failed to load cart from localStorage:", error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save cart to localStorage on changes
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
        console.error("Failed to save cart to localStorage:", error);
      }
    }
  }, [items, isInitialized]);

  // Add item & convert price string to number
  const addItem = (product: AddCartItemInput) => {
    const numericPrice =
      typeof product.price === "string"
        ? parseFloat(product.price) || 0
        : product.price;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.kind !== "bundle" && item.kind !== "legacy-bundle" && !item.bundleId && item.id === product.id
      );

      if (existingIndex > -1) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + 1,
        };
        return updated;
      }

      return [
        ...prevItems,
        {
          ...product,
          kind: "product",
          key: `product:${product.id}`,
          price: numericPrice,
          quantity: 1,
        },
      ];
    });
  };

  const addPackage = (bundle: Bundle) => {
    const components = bundle.products.map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      quantity: Number(product.pivot?.quantity),
      imageUrl: product.image,
    }));
    if (
      components.length === 0 ||
      components.some((component) => !Number.isInteger(component.quantity) || component.quantity < 1)
    ) {
      return;
    }
    const price = Number(bundle.bundle_price);
    if (!Number.isFinite(price) || price < 0) return;
    const signature = components
      .map((component) => `${component.id}:${component.quantity}`)
      .sort()
      .join("|");

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.kind === "bundle" && item.bundleId === bundle.id
      );
      if (existingIndex > -1) {
        const existing = prevItems[existingIndex];
        const existingSignature = (existing.components ?? [])
          .map((component) => `${component.id}:${component.quantity}`)
          .sort()
          .join("|");
        if (existing.needsReselection || existing.price !== price || existingSignature !== signature) {
          return prevItems;
        }
        const updated = [...prevItems];
        updated[existingIndex] = { ...existing, quantity: existing.quantity + 1 };
        return updated;
      }
      return [
        ...prevItems,
        {
          kind: "bundle",
          key: `bundle:${bundle.id}`,
          id: `bundle:${bundle.id}`,
          bundleId: bundle.id,
          name: bundle.title,
          slug: bundle.slug,
          price,
          quantity: 1,
          components,
        },
      ];
    });
  };

  const removeItem = (id: number | string) => {
    setItems((prevItems) =>
      prevItems.filter(
        (item) => item.kind === "bundle" || item.kind === "legacy-bundle" || item.bundleId || item.id !== id
      )
    );
  };

  const removePackage = (key: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.key !== key && !(item.kind === "legacy-bundle" && String(item.bundleId) === key)));
  };

  const updateQuantity = (id: number | string, quantity: number) => {
    setItems((prevItems) =>
      prevItems.flatMap((item) => {
        if (item.kind === "bundle" || item.kind === "legacy-bundle" || item.bundleId) return [item];
        if (item.id !== id) return [item];
        if (quantity < 1) return [];
        return [{ ...item, quantity }];
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  const totalPrice = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        addPackage,
        removeItem,
        removePackage,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}