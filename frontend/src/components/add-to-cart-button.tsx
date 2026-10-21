"use client";

import { useState } from "react";
import { Product } from "@/lib/types";
import { useCart } from "@/context/cart-context";
import { Dictionary } from "@/i18n/getDictionary";

export function AddToCartButton({ product, dict }: { product: Product, dict: Dictionary }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const inStock = product.inStock ?? true;

  const handleClick = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!inStock}
      className="product-detail__add-btn"
    >
      {added ? `${dict.product.addToCart} ✓` : inStock ? dict.product.addToCart : dict.product.outOfStock}
    </button>
  );
}