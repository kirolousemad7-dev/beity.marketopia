import { execFileSync } from "node:child_process";
import { test, expect } from "@playwright/test";
import { fileURLToPath } from "node:url";

const API = "http://127.0.0.1:8000/api/v1";
const NOTICE =
  "للشحن إلى المحافظات خارج القاهرة والجيزة والإسكندرية، يُرجى التواصل معنا.";
const DATABASE = fileURLToPath(
  new URL(
    "../../../backend/storage/framework/testing/beity-qa-checkout.sqlite",
    import.meta.url,
  ),
);

test.describe.configure({ mode: "serial" });

let token = "";
let bundles = [];

test.beforeAll(async ({ request }) => {
  const login = await request.post(`${API}/auth/login`, {
    data: { email: "qa.customer@example.test", password: "password" },
  });
  expect(login.ok(), await login.text()).toBeTruthy();
  token = (await login.json()).data.token;
  const response = await request.get(`${API}/bundles`, {
    headers: { "Accept-Language": "en" },
  });
  expect(response.ok()).toBeTruthy();
  bundles = (await response.json()).data;
});

test.beforeEach(async ({ page }) => {
  await page.route("**/*", (route) => {
    const host = new URL(route.request().url()).hostname;
    return host === "127.0.0.1" ? route.continue() : route.abort();
  });
  await page.addInitScript((auth) => {
    localStorage.setItem("auth_token", auth);
  }, token);
  await page.goto("/en");
  await page.evaluate(() => localStorage.removeItem("beity_cart_items"));
});

function offer(title) {
  const bundle = bundles.find((item) => item.title === title);
  if (!bundle) throw new Error(`Missing QA package ${title}`);
  return bundle;
}

function productIn(bundle, slug) {
  const product = bundle.products.find((item) => item.slug === slug);
  if (!product) throw new Error(`Missing ${slug} in ${bundle.title}`);
  return product;
}

function query(sql) {
  const source = `
    $pdo = new PDO('sqlite:' . ${JSON.stringify(DATABASE)});
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_STRINGIFY_FETCHES, true);
    echo json_encode($pdo->query(${JSON.stringify(sql)})->fetchAll(PDO::FETCH_ASSOC));
  `;
  return JSON.parse(execFileSync("php", ["-r", source], { encoding: "utf8" }));
}

function money(value) {
  return Number(value).toFixed(2);
}

function stock(slug) {
  return Number(query(`select stock from products where slug = '${slug}'`)[0].stock);
}

function orderCount() {
  return query("select id from orders").length;
}

test("A and J: one package checks out against the real API with the shipping notice", async ({
  page,
}) => {
  const bundle = offer("QA Kitchen Set");
  const before = orderCount();
  const mixerBefore = stock("qa-mixer");
  const kettleBefore = stock("qa-kettle");
  await page.goto(`/en/bundles/${bundle.slug}`);
  await expect(page.locator(".bundle-detail__productQty")).toHaveText([
    "Quantity: 2",
    "Quantity: 1",
  ]);
  await expect(page.locator(".quantity-control")).toHaveCount(0);
  await page.getByRole("button", { name: "Add bundle to cart", exact: true }).click();
  await page.goto("/en/cart");
  await expect(page.locator(".cart-package .quantity-control")).toHaveCount(0);
  await expect(page.locator(".cart-package__qty").first()).toHaveText("Quantity: 2");
  const notice = page.locator(".shipping-notice").first();
  await expect(notice).toHaveText(NOTICE);
  await expect(notice).toHaveAttribute("dir", "rtl");
  await expect(notice.locator("a")).toHaveAttribute("href", "tel:01055550123");
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator(".cart-package .quantity-control")).toHaveCount(0);
    await expect(notice).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
  }
  const response = await submitCheckout(page);
  expect(response.url()).toContain("http://127.0.0.1:8000/api/v1/orders/checkout");
  const order = query(
    "select id, total_amount, discount_amount from orders order by id desc limit 1",
  )[0];
  const items = query(
    `select bundle_id, quantity, price, line_total from order_items where order_id = ${Number(order.id)} order by id`,
  );
  expect(orderCount()).toBe(before + 1);
  expect(money(order.total_amount)).toBe("200.00");
  expect(money(order.discount_amount)).toBe("0.00");
  expect(items.map((item) => [String(item.quantity), money(item.line_total), String(item.bundle_id)])).toEqual([
    ["2", "100.00", String(bundle.id)],
    ["1", "50.00", String(bundle.id)],
  ]);
  expect(stock("qa-mixer")).toBe(mixerBefore - 2);
  expect(stock("qa-kettle")).toBe(kettleBefore - 1);
  console.log(`QA order A: ${order.id}`);
});

test("B: standalone quantity stays independent from the same packaged product", async ({
  page,
}) => {
  const bundle = offer("QA Kitchen Set");
  const mixerBefore = stock("qa-mixer");
  await page.goto("/en/products/qa-mixer");
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.goto(`/en/bundles/${bundle.slug}`);
  await page.getByRole("button", { name: "Add bundle to cart", exact: true }).click();
  await page.goto("/en/cart");
  await page.locator(".cart-table__row .quantity-control__btn").last().click();
  await expect(page.locator(".cart-table__row .quantity-control__value")).toHaveText("2");
  await expect(page.locator(".cart-package__qty").first()).toHaveText("Quantity: 2");
  await submitCheckout(page);
  const order = query(
    "select id, total_amount from orders order by id desc limit 1",
  )[0];
  const items = query(
    `select bundle_id, quantity, line_total from order_items where order_id = ${Number(order.id)} order by bundle_id is null desc, id`,
  );
  expect(money(order.total_amount)).toBe("360.00");
  expect(items[0].bundle_id).toBeNull();
  expect(String(items[0].quantity)).toBe("2");
  expect(money(items[0].line_total)).toBe("160.00");
  expect(items.filter((item) => item.bundle_id !== null).map((item) => String(item.quantity))).toEqual([
    "2",
    "1",
  ]);
  expect(stock("qa-mixer")).toBe(mixerBefore - 4);
  console.log(`QA order B: ${order.id}`);
});

test("C: two complete packages keep the saved composition and total", async ({
  page,
}) => {
  const bundle = offer("QA Kitchen Set");
  await page.goto(`/en/bundles/${bundle.slug}`);
  await page.getByRole("button", { name: "Add bundle to cart", exact: true }).click();
  await page.getByRole("button", { name: "Add bundle to cart", exact: true }).click();
  await page.goto("/en/cart");
  await expect(page.locator(".cart-package__count")).toHaveText("2 package");
  await expect(page.locator(".cart-package__qty")).toHaveText([
    "Quantity: 4",
    "Quantity: 2",
  ]);
  await submitCheckout(page);
  const order = query(
    "select id, total_amount from orders order by id desc limit 1",
  )[0];
  const items = query(
    `select quantity, line_total, bundle_id from order_items where order_id = ${Number(order.id)} order by id`,
  );
  expect(money(order.total_amount)).toBe("350.00");
  expect(items.map((item) => [String(item.quantity), money(item.line_total), String(item.bundle_id)])).toEqual([
    ["4", "200.00", String(bundle.id)],
    ["2", "100.00", String(bundle.id)],
  ]);
  console.log(`QA order C: ${order.id}`);
});

test("D: a remainder package stores an exact line total", async ({ page }) => {
  const bundle = offer("QA Remainder Set");
  await page.goto(`/en/bundles/${bundle.slug}`);
  await expect(page.locator(".bundle-detail__productQty")).toHaveText("Quantity: 3");
  await page.getByRole("button", { name: "Add bundle to cart", exact: true }).click();
  await page.goto("/en/cart");
  await expect(page.locator(".cart-package__qty")).toHaveText("Quantity: 3");
  await expect(page.locator(".cart-package .quantity-control")).toHaveCount(0);
  await submitCheckout(page);
  const order = query(
    "select id, total_amount, discount_amount from orders order by id desc limit 1",
  )[0];
  const line = query(
    `select quantity, price, line_total, bundle_id from order_items where order_id = ${Number(order.id)}`,
  )[0];
  expect(String(line.quantity)).toBe("3");
  expect(money(line.price)).toBe("3.33");
  expect(money(line.line_total)).toBe("10.00");
  expect(String(line.bundle_id)).toBe(String(bundle.id));
  expect(money(order.total_amount)).toBe("60.00");
  expect(money(order.discount_amount)).toBe("0.00");
  console.log(`QA order D: ${order.id}`);
});

test("E: an existing fixed coupon is discounted once", async ({ page }) => {
  const bundle = offer("QA Remainder Set");
  await page.goto(`/en/bundles/${bundle.slug}`);
  await page.getByRole("button", { name: "Add bundle to cart", exact: true }).click();
  await page.goto("/en/cart");
  await page.locator("#coupon_code").fill("SAVE10");
  await page.locator("[data-coupon-form] [type=submit]").click();
  await expect(page.locator("[data-discount-row]")).toBeVisible();
  await submitCheckout(page);
  const order = query(
    "select id, total_amount, discount_amount, coupon_id from orders order by id desc limit 1",
  )[0];
  const line = query(
    `select line_total from order_items where order_id = ${Number(order.id)}`,
  )[0];
  expect(money(line.line_total)).toBe("10.00");
  expect(money(order.discount_amount)).toBe("10.00");
  expect(money(order.total_amount)).toBe("50.00");
  expect(Number(query("select used_count from coupons where code = 'SAVE10'")[0].used_count)).toBe(1);
  console.log(`QA order E: ${order.id}`);
});

test("F: a tampered package does not create an order", async ({ request }) => {
  const bundle = offer("QA Kitchen Set");
  const mixer = productIn(bundle, "qa-mixer");
  const before = orderCount();
  const mixerBefore = stock("qa-mixer");
  const response = await request.post(`${API}/orders/checkout`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    data: {
      customer_name: "QA Recipient",
      customer_phone: "01012345678",
      shipping_address: "10 QA Street",
      payment_method: "cash_on_delivery",
      total_amount: 1,
      bundles: [
        {
          bundle_id: bundle.id,
          quantity: 1,
          bundle_price: 1,
          products: [{ product_id: mixer.id, quantity: 99 }],
        },
      ],
    },
  });
  expect(response.status()).toBe(422);
  expect(orderCount()).toBe(before);
  expect(stock("qa-mixer")).toBe(mixerBefore);
});

test("G: combined stock failure leaves stock and orders unchanged", async ({
  request,
}) => {
  const bundle = offer("QA Limited Set");
  const limited = productIn(bundle, "qa-limited");
  const before = orderCount();
  const response = await request.post(`${API}/orders/checkout`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    data: {
      customer_name: "QA Recipient",
      customer_phone: "01012345678",
      shipping_address: "10 QA Street",
      payment_method: "cash_on_delivery",
      items: [{ product_id: limited.id, quantity: 1 }],
      bundles: [{ bundle_id: bundle.id, quantity: 1 }],
    },
  });
  expect(response.status()).toBe(400);
  expect(orderCount()).toBe(before);
  expect(stock("qa-limited")).toBe(2);
});

test("H: removing a package leaves the standalone product", async ({ page }) => {
  const bundle = offer("QA Kitchen Set");
  await page.goto("/en/products/qa-mixer");
  await page.getByRole("button", { name: /add to cart/i }).click();
  await page.goto(`/en/bundles/${bundle.slug}`);
  await page.getByRole("button", { name: "Add bundle to cart", exact: true }).click();
  await page.goto("/en/cart");
  await page.locator(".cart-package [data-remove]").click();
  await expect(page.locator(".cart-package")).toHaveCount(0);
  await expect(page.locator(".cart-table__row")).toHaveCount(1);
  await expect(page.locator(".quantity-control")).toHaveCount(1);
});

test("I: a legacy exploded package stays blocked and does not change other items", async ({
  page,
}) => {
  const mixer = productIn(offer("QA Kitchen Set"), "qa-mixer");
  const before = orderCount();
  await page.addInitScript((stored) => {
    localStorage.setItem("beity_cart_items", JSON.stringify(stored));
  }, [
    {
      id: mixer.id,
      name: mixer.name,
      slug: mixer.slug,
      price: 80,
      quantity: 1,
      stock: mixer.stock,
    },
    {
      id: mixer.id,
      name: mixer.name,
      slug: mixer.slug,
      price: 45,
      quantity: 2,
      bundleId: 99999,
      spec: "Old package",
    },
  ]);
  await page.goto("/en/cart");
  await expect(page.locator(".cart-package--blocked")).toBeVisible();
  await expect(page.locator(".cart-package .quantity-control")).toHaveCount(0);
  await expect(page.locator(".cart-table__row .quantity-control")).toHaveCount(1);
  await page.locator(".cart-table__row .quantity-control__btn").last().click();
  await expect(page.locator(".cart-package__qty")).toHaveText("Quantity: 2");
  await expect(page.locator(".cart-table__row .quantity-control__value")).toHaveText("2");
  await page.getByLabel("Customer name", { exact: true }).fill("QA Recipient");
  await page.getByLabel("Phone number", { exact: true }).fill("01012345678");
  await page.getByLabel("Shipping address").fill("10 QA Street");
  await page.getByRole("radio", { name: "Cash", exact: true }).check();
  await page.getByRole("button", { name: "Proceed to Checkout" }).click();
  await expect(page.locator("[data-checkout-errors]")).toContainText(
    "This package must be added again before checkout.",
  );
  expect(orderCount()).toBe(before);
  await page.locator("[data-remove-package]").click();
  await expect(page.locator(".cart-package")).toHaveCount(0);
  await expect(page.locator(".cart-table__row")).toHaveCount(1);
});

test("admin order details show the reconciled remainder", async ({ page }) => {
  const order = query(
    "select id from orders where total_amount = '60.00' order by id limit 1",
  )[0];
  await page.goto("http://127.0.0.1:8000/admin/login");
  await page.locator("input[type=email], input[name=email]").first().fill(
    "qa.admin@example.test",
  );
  await page.locator("input[type=password]").fill("password");
  await Promise.all([
    page.waitForURL(/\/admin(?!\/login)/),
    page.locator("button[type=submit]").click(),
  ]);
  await page.goto(`http://127.0.0.1:8000/admin/orders/${order.id}`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByText("QA Scale")).toBeVisible();
  await expect(page.getByText("EGP 10.00").or(page.getByText("10.00"))).toBeVisible();
  console.log(`QA admin order: ${order.id}`);
});

async function submitCheckout(page) {
  await page.getByLabel("Customer name", { exact: true }).fill("QA Recipient");
  await page.getByLabel("Phone number", { exact: true }).fill("01012345678");
  await page.getByLabel("Shipping address").fill("10 QA Street");
  await page.getByRole("radio", { name: "Cash", exact: true }).check();
  const submitted = page.waitForResponse(
    (response) =>
      response.url().includes("/orders/checkout") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Proceed to Checkout" }).click();
  const response = await submitted;
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = await response.json();
  expect(body.success).toBe(true);
  await expect(
    page.getByRole("heading", { name: "Your Shopping Cart is Empty" }),
  ).toBeVisible();
  return response;
}
