import { request } from "../../core/api.js";
import { cartItems, removeProducts } from "../../core/cart.js";

export async function validateCartProducts() {
  const products = new Map();
  for (const item of cartItems()) {
    if (item.kind !== "product") continue;
    const ids = products.get(item.slug) ?? [];
    ids.push(item.id);
    products.set(item.slug, ids);
  }
  const entries = [...products.entries()];
  const missing = [];
  let failed = false;
  // Bound concurrent requests and check shared standalone/bundle products once.
  for (let index = 0; index < entries.length; index += 4) {
    const batch = entries.slice(index, index + 4);
    const results = await Promise.allSettled(
      batch.map(([slug]) => request(`products/${encodeURIComponent(slug)}`)),
    );
    for (const [offset, result] of results.entries()) {
      if (result.status === "fulfilled") continue;
      if (result.reason.status === 404) missing.push(...batch[offset][1]);
      else failed = true;
    }
  }
  return { removed: removeProducts(missing), failed };
}
