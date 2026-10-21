import { test, expect } from "@playwright/test";
import { mockApi } from "./fixtures.js";

test.beforeEach(async ({ page }) => {
  await page.route("**/*", (route) => {
    const host = new URL(route.request().url()).hostname;
    return ["127.0.0.1", "api.example.test"].includes(host)
      ? route.fallback()
      : route.abort();
  });
});

async function seedCart(page, items) {
  await page.addInitScript((items) => {
    localStorage.setItem("beity_cart_items", JSON.stringify(items));
  }, items);
}
const item = {
  id: 1,
  name: "Coffee Machine",
  slug: "coffee-machine",
  price: 1800,
  quantity: 1,
};

for (const locale of ["en", "ar"]) {
  test(`${locale} cart removes missing standalone and bundle lines together`, async ({
    page,
  }) => {
    let missingRequests = 0;
    await mockApi(page, (path) => {
      if (path === "products/deleted-product") missingRequests++;
    });
    await seedCart(page, [
      item,
      { ...item, id: 3, slug: "deleted-product", name: "Deleted Product" },
      {
        ...item,
        id: 3,
        slug: "deleted-product",
        name: "Deleted Product",
        bundleId: 2,
      },
    ]);
    await page.goto(`/${locale}/cart`);
    await expect(page.locator(".cart-table__row")).toHaveCount(1);
    await expect(page.locator("[data-cart-count]").first()).toHaveText("1");
    expect(missingRequests).toBe(1);
    expect(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem("beity_cart_items")).map(
          (entry) => entry.id,
        ),
      ),
    ).toEqual([1]);
    await expect(page.locator(".toast")).toBeVisible();
  });
}

test("cart becomes empty when its last product no longer exists", async ({
  page,
}) => {
  await mockApi(page);
  await seedCart(page, [{ ...item, id: 3, slug: "deleted-product" }]);
  await page.goto("/en/cart");
  await expect(
    page.getByRole("heading", { name: "Your Shopping Cart is Empty" }),
  ).toBeVisible();
  await expect(page.locator("[data-cart-count]").first()).toHaveText("0");
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("beity_cart_items")),
    ),
  ).toEqual([]);
});

test("temporary product failures keep saved cart items and show a message", async ({
  page,
}) => {
  await mockApi(page, (path) =>
    path === "products/coffee-machine"
      ? {
          status: 503,
          body: JSON.stringify({
            success: false,
            message: "Temporary failure",
          }),
        }
      : undefined,
  );
  await seedCart(page, [item]);
  await page.goto("/en/cart");
  await expect(page.locator(".cart-table__row")).toHaveCount(1);
  await expect(page.locator(".toast")).toContainText("Your items were kept");
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("beity_cart_items"))[0].id,
    ),
  ).toBe(1);
});
