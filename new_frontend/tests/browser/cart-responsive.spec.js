import { test, expect } from "@playwright/test";
import { mockApi } from "./fixtures.js";

for (const locale of ["en", "ar"]) {
  for (const width of [320, 375, 390, 768, 1024, 1280, 1440, 1920]) {
    test(`${locale} cart controls fit at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.route("**/*", (route) => {
        const host = new URL(route.request().url()).hostname;
        return ["127.0.0.1", "api.example.test"].includes(host)
          ? route.fallback()
          : route.abort();
      });
      await mockApi(page);
      await page.addInitScript(() => {
        localStorage.setItem("auth_token", "test-token");
        localStorage.setItem(
          "beity_cart_items",
          JSON.stringify([
            {
              id: 1,
              name: "Coffee Machine with additional accessories and warranty",
              slug: "coffee-machine",
              price: 1234567.89,
              quantity: 2,
              stock: 5,
            },
          ]),
        );
      });
      await page.goto(`/${locale}/cart`);
      await expect(page.locator(".shipping-notice").first()).toHaveText(
        "للشحن إلى المحافظات خارج القاهرة والجيزة والإسكندرية، يُرجى التواصل معنا.",
      );
      await expect(page.locator("[data-total]")).not.toBeEmpty();
      await page.locator('[name="payment_method"][value="instapay"]').check();
      await expect(page.locator("[data-payment-proof]")).toBeVisible();
      await page.locator("#coupon_code").fill("SAVE100");
      await page.locator("[data-coupon-form] [type=submit]").click();
      await expect(page.locator("[data-discount-row]")).toBeVisible();
      await page.locator("#shipping_address").fill("A long shipping address");
      const layout = await page.evaluate(() => {
        const summary = document
          .querySelector(".summary-card")
          .getBoundingClientRect();
        const main = document
          .querySelector(".cart-layout__main")
          .getBoundingClientRect();
        const controls = Array.from(
          document.querySelectorAll(
            ".summary-card input, .summary-card button, .payment-btn, .summary-card__row > *, .shipping-notice",
          ),
        )
          .filter((element) => element.getClientRects().length)
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return { left: rect.left, right: rect.right };
          });
        return {
          overflow: document.documentElement.scrollWidth > window.innerWidth,
          summary: {
            left: summary.left,
            right: summary.right,
            top: summary.top,
          },
          mainBottom: main.bottom,
          controls,
        };
      });
      expect(layout.overflow).toBe(false);
      for (const control of layout.controls) {
        expect(control.left).toBeGreaterThanOrEqual(layout.summary.left);
        expect(control.right).toBeLessThanOrEqual(layout.summary.right);
      }
      if (width < 1200)
        expect(layout.summary.top).toBeGreaterThanOrEqual(layout.mainBottom);
      await page.locator("#shipping_address").blur();
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: `test-results/cart-${locale}-${width}.png`,
        fullPage: true,
      });
    });
  }
}
