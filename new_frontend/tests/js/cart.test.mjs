import "./environment.mjs";
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  addBundle,
  addProduct,
  cartItems,
  normalizeCart,
  removeItem,
  removeProducts,
  subtotal,
  updateQuantity,
} from "../../public/assets/js/core/cart.js";

const product = {
  id: 1,
  name: "Coffee machine",
  slug: "coffee",
  stock: 5,
  price: "100",
  price_after_discount: "80",
};
beforeEach(() => localStorage.clear());

test("corrupt storage and invalid quantities do not break the cart", () => {
  localStorage.setItem("beity_cart_items", "{broken");
  assert.deepEqual(cartItems(), []);
  assert.deepEqual(
    normalizeCart([
      { id: 1, name: "Unsafe", slug: "unsafe", price: "100", quantity: -1 },
    ]),
    [],
  );
});

test("discounted products persist, update, and remove correctly", () => {
  addProduct(product);
  addProduct(product);
  assert.equal(subtotal(), 160);
  updateQuantity("product:1", 3);
  assert.equal(subtotal(), 240);
  removeItem("product:1");
  assert.deepEqual(cartItems(), []);
});

test("cart uses available discount prices, including zero", () => {
  for (const discounted of ["80", 0, "120"]) {
    localStorage.clear();
    addProduct({ ...product, price_after_discount: discounted });
    assert.equal(cartItems()[0].price, Number(discounted));
    assert.equal(subtotal(), Number(discounted));
  }
});

test("missing or invalid discounts fall back to the product price", () => {
  for (const discounted of [
    null,
    undefined,
    "",
    " ",
    "invalid",
    -1,
    Infinity,
  ]) {
    localStorage.clear();
    addProduct({ ...product, price_after_discount: discounted });
    assert.equal(subtotal(), 100);
  }
});

test("adding an existing product refreshes its stored discount price", () => {
  addProduct({ ...product, price_after_discount: null });
  addProduct(product);
  assert.equal(cartItems()[0].price, 80);
  assert.equal(cartItems()[0].quantity, 2);
  assert.equal(subtotal(), 160);
});

const bundle = {
  id: 2,
  title: "Kitchen set",
  slug: "kitchen-set",
  bundle_price: "90",
  products: [{ ...product, pivot: { quantity: 2 } }],
};

test("standalone and bundle lines remain separate and stock is shared", () => {
  addProduct(product);
  addBundle(bundle);
  const items = cartItems();
  assert.equal(items.length, 2);
  assert.equal(subtotal(), 170);
  assert.equal(items.find((item) => item.kind === "bundle").components[0].quantity, 2);
  updateQuantity("bundle:2", 9);
  assert.equal(cartItems().find((item) => item.kind === "bundle").quantity, 1);
  assert.equal(cartItems().find((item) => item.kind === "bundle").components[0].quantity, 2);
  assert.throws(() => updateQuantity("product:1", 4), /out_of_stock/);
  assert.equal(cartItems().find((item) => item.kind === "product").quantity, 1);
});

test("adding a package again adds a complete package without changing its contents", () => {
  addBundle(bundle);
  addBundle(bundle);
  const stored = cartItems()[0];
  assert.equal(stored.quantity, 2);
  assert.equal(stored.components[0].quantity, 2);
  assert.equal(subtotal(), 180);
});

test("a changed offer is not merged into a saved package", () => {
  addBundle(bundle);
  assert.throws(
    () => addBundle({ ...bundle, bundle_price: "70" }),
    /bundle_reselect/,
  );
  assert.equal(cartItems()[0].price, 90);
  assert.equal(cartItems()[0].quantity, 1);
});

test("old exploded package lines stay read-only until removed", () => {
  localStorage.setItem(
    "beity_cart_items",
    JSON.stringify([
      {
        key: "product:9",
        id: 9,
        name: "Lamp",
        slug: "lamp",
        price: 25,
        quantity: 1,
      },
      {
        key: "bundle:2:1",
        id: 1,
        bundleId: 2,
        name: "Coffee machine",
        slug: "coffee",
        price: 45,
        quantity: 2,
        spec: "Kitchen set",
      },
    ]),
  );
  assert.equal(cartItems()[1].kind, "legacy-bundle");
  assert.equal(cartItems()[1].price, 45);
  updateQuantity("bundle:2:1", 8);
  assert.equal(cartItems()[1].quantity, 2);
  assert.equal(subtotal(), 115);
});

test("out of stock bundle fails atomically without adding partial items", () => {
  assert.throws(
    () =>
      addBundle({
        ...bundle,
        products: [
          { ...product, pivot: { quantity: 1 } },
          {
            ...product,
            id: 2,
            name: "Washer",
            slug: "washer",
            stock: 0,
            pivot: { quantity: 1 },
          },
        ],
      }),
    /out_of_stock/,
  );
  assert.deepEqual(cartItems(), []);
});

test("removing a missing package product removes that whole package only", () => {
  addProduct(product);
  addProduct({
    ...product,
    id: 3,
    name: "Lamp",
    slug: "lamp",
    price_after_discount: null,
    price: "25",
    stock: 4,
  });
  addBundle({
    ...bundle,
    products: [
      { ...product, pivot: { quantity: 1 } },
      {
        ...product,
        id: 2,
        name: "Washer",
        slug: "washer",
        pivot: { quantity: 1 },
      },
    ],
  });
  assert.equal(removeProducts(["1"]), 2);
  assert.deepEqual(
    cartItems().map((item) => item.id),
    [3],
  );
  assert.equal(subtotal(), 25);
  assert.equal(removeProducts([999]), 0);
  assert.equal(subtotal(), 25);
});
