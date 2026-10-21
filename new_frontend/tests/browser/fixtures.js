export const products = [
  {
    id: 1,
    name: "Coffee Machine",
    slug: "coffee-machine",
    price: "2000",
    price_after_discount: "1800",
    stock: 5,
    inStock: true,
    description: "<p>Daily coffee <strong>made easy.</strong></p>",
    category: { id: 1, name: "Kitchen", slug: "kitchen" },
    image: null,
  },
  {
    id: 2,
    name: "Washing Machine",
    slug: "washing-machine",
    price: "8000",
    price_after_discount: null,
    stock: 3,
    inStock: true,
    description: "Efficient laundry",
    category: { id: 2, name: "Laundry", slug: "laundry" },
    image: null,
  },
];
export const bundle = {
  id: 1,
  title: "Home Essentials",
  slug: "home-essentials",
  bundle_price: "8500",
  original_price: "10000",
  savings: "1500",
  description: "A complete home set.",
  products: products.map((product, index) => ({
    ...product,
    pivot: { quantity: index === 0 ? 2 : 1 },
  })),
  image: null,
};
export const storeSettings = {
  shipping_cost: "50",
  instapay_number: "01000000000",
  contact_phone: "01000000000",
  contact_email: "hello@example.test",
};

export async function mockApi(page, override) {
  await page.route("https://api.example.test/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api/v1/", "");
    const headers = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers":
        "Authorization, Content-Type, Accept, Accept-Language",
      "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
    };
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers });
      return;
    }
    const custom = await override?.(path, request);
    if (custom) {
      await route.fulfill({
        headers,
        contentType: "application/json",
        ...custom,
      });
      return;
    }
    let data;
    if (path === "settings") data = storeSettings;
    else if (path === "categories")
      data = products.map((product) => product.category);
    else if (path === "products" || path === "products/best-selling")
      data = products;
    else if (path.startsWith("products/"))
      data = products.find((product) => product.slug === path.split("/")[1]);
    else if (path === "bundles") data = [bundle];
    else if (path === "bundles/home-essentials") data = bundle;
    else if (path === "auth/login")
      data = {
        token: "test-token",
        user: { id: 1, name: "Customer", email: "customer@example.test" },
      };
    else if (path === "auth/register")
      data = { token: "registration-token", user: { id: 1 } };
    else if (path === "auth/profile")
      data = { id: 1, name: "Customer", email: "customer@example.test" };
    else if (path === "auth/logout") data = null;
    else if (path === "coupons/apply")
      data = { coupon_id: 1, discount_amount: 100 };
    else if (path === "orders/checkout") data = { id: 1 };
    else if (path === "orders") {
      const current = Number(url.searchParams.get("page") || 1);
      await route.fulfill({
        headers,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          message: "OK",
          data: [
            {
              id: current,
              status: "pending",
              total_amount: "1850",
              discount_amount: "0",
              items: [
                { id: 1, product: products[0], quantity: 1, price: "1800" },
              ],
            },
          ],
          meta: { current_page: current, last_page: 2 },
        }),
      });
      return;
    }
    const status = data === undefined ? 404 : 200;
    await route.fulfill({
      status,
      headers,
      contentType: "application/json",
      body: JSON.stringify({
        success: status === 200,
        message: status === 200 ? "OK" : "Not found",
        data,
      }),
    });
  });
}
