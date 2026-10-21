import { test, expect } from "@playwright/test";
import { mockApi } from "./fixtures.js";

test.beforeEach(async ({ page }) => {
  await page.route("**/*", (route) => {
    const host = new URL(route.request().url()).hostname;
    if (["127.0.0.1", "api.example.test"].includes(host))
      return route.fallback();
    return route.abort();
  });
  await mockApi(page);
});

test("catalog filters, searches, sorts and persists cart additions", async ({
  page,
}) => {
  await page.goto("/en/products");
  await expect(page.locator(".card")).toHaveCount(2);
  await page.getByRole("button", { name: "Kitchen", exact: true }).click();
  await expect(page.locator(".card")).toHaveCount(1);
  await page.getByRole("button", { name: "All", exact: true }).click();
  await page.locator("[data-catalog-sort]").selectOption("price-desc");
  await expect(page.locator(".card__title").first()).toHaveText(
    "Washing Machine",
  );
  await page.getByRole("searchbox").fill("coffee");
  await expect(page.locator(".card")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Add Coffee Machine to cart" })
    .click();
  await expect(page.locator("[data-cart-count]").first()).toHaveText("1");
  await page.reload();
  await expect(page.locator("[data-cart-count]").first()).toHaveText("1");
});

test("new detail slugs are requested in the browser and 404s have retry controls", async ({
  page,
}) => {
  await page.goto("/en/products/coffee-machine");
  await expect(
    page.getByRole("heading", { name: "Coffee Machine", exact: true }),
  ).toBeVisible();
  await page.goto("/en/products/nonexistent");
  await expect(
    page.getByRole("heading", { name: "This item is no longer available." }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});

test("login, account profile and logout use browser API requests", async ({
  page,
}) => {
  await page.goto("/en/login");
  await page.getByLabel("Email").fill("customer@example.test");
  await page.getByLabel("Password", { exact: false }).first().fill("Password1");
  await page.locator("[data-auth-form] button[type=submit]").click();
  await expect(page).toHaveURL(/\/en\/account/);
  await expect(
    page.getByRole("heading", { name: "Customer", exact: true }),
  ).toBeVisible();
  let logoutCalled = false;
  page.on("request", (request) => {
    if (request.url().endsWith("/auth/logout") && request.method() === "POST")
      logoutCalled = true;
  });
  await page.getByRole("button", { name: "Sign Out", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/login/);
  expect(logoutCalled).toBe(true);
  expect(
    await page.evaluate(() => localStorage.getItem("auth_token")),
  ).toBeNull();
});

test("registration displays backend validation and preserves user input", async ({
  page,
}) => {
  await mockApi(page, (path) =>
    path === "auth/register"
      ? {
          status: 422,
          body: JSON.stringify({
            success: false,
            message: "Please check your details",
            errors: { email: ["Email is already registered"] },
          }),
        }
      : null,
  );
  await page.goto("/en/register");
  await page.getByLabel("Full Name").fill("Customer");
  await page.getByLabel("Email").fill("customer@example.test");
  await page.locator("#password").fill("Password1");
  await page.locator("#password_confirmation").fill("Password1");
  await page.locator("[data-auth-form] button[type=submit]").click();
  await expect(page.locator("#email-error")).toHaveText(
    "Email is already registered",
  );
  await expect(page.locator("#email")).toHaveValue("customer@example.test");
});

test("coupon checkout submits product lines and clears the cart after success", async ({
  page,
}) => {
  await page.goto("/en/products");
  await page
    .getByRole("button", { name: "Add Coffee Machine to cart" })
    .click();
  await page.evaluate(() => localStorage.setItem("auth_token", "test-token"));
  await page.goto("/en/cart");
  await page.getByLabel("Coupon code").fill("SAVE100");
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.locator("[data-remove-coupon]")).toBeVisible();
  await page.getByRole("radio", { name: "Cash", exact: true }).check();
  await page.getByLabel("Customer name", { exact: true }).fill("Test Customer");
  await page.getByLabel("Phone number", { exact: true }).fill("01012345678");
  await page.getByLabel("Shipping address").fill("10 Example Street");
  const checkout = page.waitForRequest(
    (request) =>
      request.url().endsWith("/orders/checkout") && request.method() === "POST",
  );
  await page.getByRole("button", { name: "Proceed to Checkout" }).click();
  const request = await checkout;
  expect(request.postData()).toContain("items[0][product_id]");
  expect(request.postData()).toContain("coupon_code");
  await expect(
    page.getByRole("heading", { name: "Your Shopping Cart is Empty" }),
  ).toBeVisible();
  await expect(page.locator("[data-cart-count]").first()).toHaveText("0");
});

test("order history paginates and expired tokens show the sign-in prompt", async ({
  page,
}) => {
  await page.goto("/en");
  await page.evaluate(() => localStorage.setItem("auth_token", "test-token"));
  await page.goto("/en/orders");
  await expect(page.locator(".order-card__id")).toHaveText("Order #1");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator(".order-card__id")).toHaveText("Order #2");
  await mockApi(page, (path) =>
    path === "orders"
      ? {
          status: 401,
          body: JSON.stringify({ success: false, message: "Unauthenticated." }),
        }
      : null,
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Sign In to Your Account" }),
  ).toBeVisible();
});

for (const locale of ["en", "ar"]) {
  test(`${locale} checkout requires customer details and validates an optional phone`, async ({
    page,
  }) => {
    const submissions = [];
    await mockApi(page, (path, request) => {
      if (path === "orders/checkout") submissions.push(request.postData());
    });
    await page.goto(`/${locale}/products`);
    await page.locator("[data-add-product]").first().click();
    await page.evaluate(() => localStorage.setItem("auth_token", "test-token"));
    await page.goto(`/${locale}/cart`);
    const name = page.locator("[name=customer_name]");
    const phone = page.locator("[name=customer_phone]");
    const additional = page.locator("[name=additional_phone]");
    const submit = page.locator("[data-checkout-form] [type=submit]");
    await page.locator("[name=payment_method][value=cash_on_delivery]").check();
    await page.locator("[name=shipping_address]").fill("10 Example Street");
    await submit.click();
    await expect(name).toBeFocused();
    expect(submissions).toHaveLength(0);
    await name.fill("  ");
    await phone.fill("01012345678");
    await submit.click();
    await expect(name).toBeFocused();
    expect(submissions).toHaveLength(0);
    await name.fill("  Test Customer  ");
    await phone.fill("");
    await submit.click();
    await expect(phone).toBeFocused();
    expect(submissions).toHaveLength(0);
    await phone.fill("invalid");
    await submit.click();
    await expect(phone).toBeFocused();
    expect(submissions).toHaveLength(0);
    await phone.fill("01012345678");
    await additional.fill("invalid");
    await submit.click();
    await expect(additional).toBeFocused();
    expect(submissions).toHaveLength(0);
    await additional.fill(locale === "ar" ? "01098765432" : "");
    await submit.click();
    await expect(page.locator("[data-checkout-form]")).toHaveCount(0);
    expect(submissions).toHaveLength(1);
    expect(submissions[0]).toContain(
      'name="customer_name"\r\n\r\nTest Customer',
    );
    expect(submissions[0]).toContain(
      'name="customer_phone"\r\n\r\n01012345678',
    );
    if (locale === "ar")
      expect(submissions[0]).toContain(
        'name="additional_phone"\r\n\r\n01098765432',
      );
    else expect(submissions[0]).not.toContain('name="additional_phone"');
  });
}

for (const width of [375, 768, 1280, 1920]) {
  test(`English and Arabic layouts fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const locale of ["en", "ar"]) {
      await page.goto(`/${locale}`);
      await expect(
        page.locator("[data-home-content] .card").first(),
      ).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute(
        "dir",
        locale === "ar" ? "rtl" : "ltr",
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      if (width === 375) {
        await page.locator("[data-menu-toggle]").click();
        await expect(page.locator("#mobile-menu")).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(page.locator("#mobile-menu")).toBeHidden();
      }
      await page.screenshot({
        path: `test-results/${locale}-${width}.png`,
        fullPage: true,
      });
    }
  });
}

test("bundle additions keep standalone items separate", async ({ page }) => {
  await page.goto("/en/products");
  await page
    .getByRole("button", { name: "Add Coffee Machine to cart" })
    .click();
  await page.goto("/en/bundles/home-essentials");
  await expect(
    page.getByRole("heading", { name: "Home Essentials", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".bundle-detail__productQty")).toHaveText([
    "Quantity: 2",
    "Quantity: 1",
  ]);
  await expect(page.locator(".quantity-control")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Add bundle to cart", exact: true })
    .click();
  await page.goto("/en/cart");
  await expect(page.locator(".cart-table__row")).toHaveCount(1);
  await expect(page.locator(".cart-package")).toHaveCount(1);
  await expect(page.locator(".cart-package .quantity-control")).toHaveCount(0);
  await expect(page.locator(".cart-package__qty").first()).toHaveText("Quantity: 2");
  await expect(page.locator(".cart-table__row .quantity-control")).toHaveCount(1);
  await expect(page.locator("[data-cart-count]").first()).toHaveText("2");
  await page.reload();
  await expect(page.locator(".cart-package__qty").first()).toHaveText("Quantity: 2");
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator(".cart-package .quantity-control")).toHaveCount(0);
    await expect(page.locator(".cart-table__row .quantity-control")).toHaveCount(1);
    await expect(page.locator(".shipping-notice").first()).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
    ).toBe(true);
  }
  await expect(page.locator(".shipping-notice").first()).toHaveText(
    "للشحن إلى المحافظات خارج القاهرة والجيزة والإسكندرية، يُرجى التواصل معنا.",
  );
  await expect(page.locator(".shipping-notice a").first()).toHaveAttribute(
    "href",
    "tel:01000000000",
  );
  await page.locator(".cart-table__row .quantity-control__btn").last().click();
  await expect(page.locator(".cart-package__qty").first()).toHaveText("Quantity: 2");
  await page.locator(".cart-package [data-remove]").click();
  await expect(page.locator(".cart-package")).toHaveCount(0);
  await expect(page.locator(".cart-table__row")).toHaveCount(1);
});

test("Instapay requires and submits a payment screenshot", async ({ page }) => {
  await page.goto("/en/products");
  await page
    .getByRole("button", { name: "Add Coffee Machine to cart" })
    .click();
  await page.evaluate(() => localStorage.setItem("auth_token", "test-token"));
  await page.goto("/en/cart");
  await page.getByRole("radio", { name: "Instapay", exact: true }).check();
  await page.getByLabel("Customer name", { exact: true }).fill("Test Customer");
  await page.getByLabel("Phone number", { exact: true }).fill("01012345678");
  await page.getByLabel("Shipping address").fill("10 Example Street");
  await expect(
    page.getByLabel("Payment screenshot", { exact: true }),
  ).toHaveJSProperty("required", true);
  await page.getByLabel("Payment screenshot", { exact: true }).setInputFiles({
    name: "receipt.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a6VEAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  const submitted = page.waitForRequest(
    (request) =>
      request.url().endsWith("/orders/checkout") && request.method() === "POST",
  );
  await page.getByRole("button", { name: "Proceed to Checkout" }).click();
  expect((await submitted).postData()).toContain("receipt.png");
  await expect(
    page.getByRole("heading", { name: "Your Shopping Cart is Empty" }),
  ).toBeVisible();
});

test("failed catalog requests display a recoverable error state", async ({
  page,
}) => {
  let unavailable = true;
  await mockApi(page, (path) =>
    path === "products" && unavailable
      ? {
          status: 503,
          body: JSON.stringify({
            success: false,
            message: "Temporarily unavailable",
          }),
        }
      : null,
  );
  await page.goto("/en/products");
  await expect(
    page.getByRole("heading", {
      name: "We could not load this page. Please try again.",
    }),
  ).toBeVisible();
  unavailable = false;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.locator(".card")).toHaveCount(2);
});
