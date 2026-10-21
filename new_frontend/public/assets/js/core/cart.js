import { readStorage, writeStorage } from "./storage.js";
import { productPrice } from "./pricing.js";

export const CART_KEY = "beity_cart_items";

function componentList(value) {
  if (!Array.isArray(value)) return null;
  const components = [];
  for (const component of value) {
    const quantity = Number(component?.quantity);
    if (
      !component ||
      component.id === undefined ||
      typeof component.name !== "string" ||
      typeof component.slug !== "string" ||
      !component.slug.trim() ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1
    )
      return null;
    components.push({
      id: component.id,
      name: component.name,
      slug: component.slug,
      quantity,
      imageUrl: component.imageUrl ?? null,
    });
  }
  return components;
}

function signature(components) {
  return components
    .map((component) => `${component.id}:${component.quantity}`)
    .sort()
    .join("|");
}

export function includedQuantity(product) {
  const quantity = Number(product?.pivot?.quantity);
  if (!Number.isSafeInteger(quantity) || quantity < 1)
    throw new Error("bundle_unavailable");
  return quantity;
}

export function normalizeCart(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (
      !item ||
      !Number.isFinite(Number(item.price)) ||
      Number(item.price) < 0 ||
      !Number.isSafeInteger(Number(item.quantity)) ||
      Number(item.quantity) < 1
    )
      return [];
    const quantity = Number(item.quantity);
    const price = Number(item.price);
    const components = componentList(item.components);
    if (
      item.bundleId &&
      (item.kind === "bundle" || components || item.needsReselection)
    ) {
      if (
        typeof item.name !== "string" ||
        typeof item.slug !== "string" ||
        !item.slug.trim() ||
        !components
      ) {
        return [
          {
            key: `bundle:${item.bundleId}`,
            kind: "bundle",
            id: item.bundleId,
            bundleId: item.bundleId,
            name: typeof item.name === "string" ? item.name : "",
            slug: typeof item.slug === "string" ? item.slug : "",
            price,
            quantity,
            components: components ?? [],
            needsReselection: true,
          },
        ];
      }
      return [
        {
          key: `bundle:${item.bundleId}`,
          kind: "bundle",
          id: item.bundleId,
          bundleId: item.bundleId,
          name: item.name,
          slug: item.slug,
          price,
          quantity,
          components,
          needsReselection: Boolean(item.needsReselection),
        },
      ];
    }
    if (item.bundleId) {
      if (
        typeof item.name !== "string" ||
        typeof item.slug !== "string" ||
        !item.slug.trim() ||
        item.id === undefined
      )
        return [];
      return [
        {
          key: String(item.key ?? `bundle:${item.bundleId}:${item.id}`),
          kind: "legacy-bundle",
          id: item.id,
          bundleId: item.bundleId,
          name: item.name,
          slug: item.slug,
          price,
          quantity,
          imageUrl: item.imageUrl ?? null,
          spec: typeof item.spec === "string" ? item.spec : undefined,
        },
      ];
    }
    if (
      item.id === undefined ||
      typeof item.name !== "string" ||
      typeof item.slug !== "string" ||
      !item.slug.trim()
    )
      return [];
    return [
      {
        key: `product:${item.id}`,
        kind: "product",
        id: item.id,
        name: item.name,
        slug: item.slug,
        price,
        quantity,
        stock: item.stock,
        imageUrl: item.imageUrl ?? null,
      },
    ];
  });
}

/** @returns {import('./types.js').CartItem[]} */
export function cartItems() {
  return normalizeCart(readStorage(CART_KEY, []));
}

function persist(items) {
  writeStorage(CART_KEY, items);
  document.dispatchEvent(new CustomEvent("cart:changed"));
}

function usedQuantity(items, productId, exceptKey) {
  return items.reduce((sum, item) => {
    if (item.key === exceptKey) return sum;
    if (item.kind === "bundle") {
      return (
        sum +
        item.components.reduce(
          (componentSum, component) =>
            String(component.id) === String(productId)
              ? componentSum + component.quantity * item.quantity
              : componentSum,
          0,
        )
      );
    }
    return String(item.id) === String(productId) ? sum + item.quantity : sum;
  }, 0);
}

export function addProduct(product, { quantity = 1 } = {}) {
  const items = cartItems();
  const stock = Number(product.stock);
  const requested = usedQuantity(items, product.id) + quantity;
  if (
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    !Number.isFinite(stock) ||
    requested > stock
  )
    throw new Error("out_of_stock");
  const key = `product:${product.id}`;
  const existing = items.find((item) => item.key === key);
  if (existing) {
    existing.quantity += quantity;
    existing.price = productPrice(product);
    existing.stock = stock;
  } else
    items.push({
      key,
      kind: "product",
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: productPrice(product),
      quantity,
      stock,
      imageUrl: product.image,
    });
  persist(items);
}

function samePackage(existing, components, price) {
  return (
    existing.price === price &&
    signature(existing.components) === signature(components)
  );
}

/** @param {import('./types.js').Bundle} bundle */
export function addBundle(bundle) {
  const products = bundle.products;
  const price = Number(bundle.bundle_price);
  if (
    !Array.isArray(products) ||
    !products.length ||
    typeof bundle.slug !== "string" ||
    !bundle.slug.trim() ||
    typeof bundle.title !== "string" ||
    !Number.isFinite(price) ||
    price < 0
  )
    throw new Error("bundle_unavailable");
  const components = products.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    imageUrl: product.image ?? null,
    quantity: includedQuantity(product),
    stock: Number(product.stock),
  }));
  const items = cartItems();
  const key = `bundle:${bundle.id}`;
  const existing = items.find((item) => item.key === key);
  if (
    existing &&
    (existing.kind !== "bundle" ||
      existing.needsReselection ||
      !samePackage(existing, components, price))
  )
    throw new Error("bundle_reselect");
  const packageCount = (existing?.quantity ?? 0) + 1;
  for (const component of components) {
    const already = usedQuantity(items, component.id, existing?.key);
    if (
      !Number.isFinite(component.stock) ||
      already + component.quantity * packageCount > component.stock
    )
      throw new Error("out_of_stock");
  }
  if (existing) existing.quantity = packageCount;
  else
    items.push({
      key,
      kind: "bundle",
      id: bundle.id,
      bundleId: bundle.id,
      name: bundle.title,
      slug: bundle.slug,
      price,
      quantity: 1,
      components: components.map(({ stock, ...component }) => component),
      needsReselection: false,
    });
  persist(items);
}

export function packageMatchesOffer(item, bundle) {
  try {
    const components = (bundle.products ?? []).map((product) => ({
      id: product.id,
      quantity: includedQuantity(product),
    }));
    return (
      item.kind === "bundle" &&
      String(item.bundleId) === String(bundle.id) &&
      Number(item.price) === Number(bundle.bundle_price) &&
      signature(item.components) === signature(components)
    );
  } catch {
    return false;
  }
}

export function flagBundleNeedsReselection(key) {
  const items = cartItems();
  const item = items.find((entry) => entry.key === key);
  if (!item || item.kind !== "bundle" || item.needsReselection) return false;
  item.needsReselection = true;
  persist(items);
  return true;
}

export function updateQuantity(key, quantity) {
  const items = cartItems();
  const item = items.find((entry) => entry.key === key);
  if (!item || item.kind === "bundle" || item.kind === "legacy-bundle") return;
  if (!Number.isSafeInteger(quantity) || quantity < 1) return removeItem(key);
  const otherQuantity = usedQuantity(items, item.id, key);
  if (item.stock !== undefined && otherQuantity + quantity > item.stock)
    throw new Error("out_of_stock");
  item.quantity = quantity;
  persist(items);
}

export function removeItem(key) {
  persist(cartItems().filter((item) => item.key !== key));
}

export function removeLegacyBundle(bundleId) {
  persist(
    cartItems().filter(
      (item) =>
        item.kind !== "legacy-bundle" ||
        String(item.bundleId) !== String(bundleId),
    ),
  );
}

export function legacyBundleGroups(items = cartItems()) {
  const groups = new Map();
  for (const item of items) {
    if (item.kind !== "legacy-bundle") continue;
    const id = String(item.bundleId);
    groups.set(id, [...(groups.get(id) ?? []), item]);
  }
  return [...groups.entries()].map(([bundleId, lines]) => ({
    bundleId,
    lines,
  }));
}

export function cartHasBlockedPackages(items = cartItems()) {
  return items.some(
    (item) =>
      item.kind === "legacy-bundle" ||
      (item.kind === "bundle" && item.needsReselection),
  );
}

export function removeProducts(ids) {
  const missing = new Set(ids.map(String));
  const items = cartItems();
  const removedBundles = new Set(
    items
      .filter(
        (item) =>
          item.kind === "bundle" &&
          item.components.some((component) => missing.has(String(component.id))),
      )
      .map((item) => item.key),
  );
  const removedLegacy = new Set(
    items
      .filter(
        (item) =>
          item.kind === "legacy-bundle" && missing.has(String(item.id)),
      )
      .map((item) => String(item.bundleId)),
  );
  const remaining = items.filter((item) => {
    if (item.kind === "bundle") return !removedBundles.has(item.key);
    if (item.kind === "legacy-bundle")
      return !removedLegacy.has(String(item.bundleId));
    return !missing.has(String(item.id));
  });
  const removed = items.length - remaining.length;
  if (removed) persist(remaining);
  return removed;
}

export function clearCart() {
  persist([]);
}

export function subtotal(items = cartItems()) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}
