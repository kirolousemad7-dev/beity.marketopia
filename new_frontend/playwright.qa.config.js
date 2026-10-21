import { defineConfig } from "@playwright/test";

const backend = new URL("../backend/", import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  "$1",
);

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "checkout-live.spec.js",
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  expect: { timeout: 30000 },
  use: {
    baseURL: "http://127.0.0.1:8012",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  webServer: [
    {
      command: "php scripts/serve-qa-checkout.php",
      cwd: backend,
      url: "http://127.0.0.1:8000/up",
      reuseExistingServer: false,
      timeout: 120000,
    },
    {
      command: "php artisan serve --host=127.0.0.1 --port=8012 --no-reload",
      url: "http://127.0.0.1:8012/up",
      reuseExistingServer: false,
      timeout: 120000,
      env: {
        APP_ENV: "local",
        APP_KEY: "base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        APP_URL: "http://127.0.0.1:8012",
        STOREFRONT_API_URL: "http://127.0.0.1:8000/api/v1",
        SESSION_DRIVER: "file",
        CACHE_STORE: "file",
      },
    },
  ],
});
