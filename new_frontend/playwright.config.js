import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  use: {
    baseURL: "http://127.0.0.1:8011",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : {},
  },
  webServer: {
    command: "php artisan serve --host=127.0.0.1 --port=8011 --no-reload",
    url: "http://127.0.0.1:8011/up",
    reuseExistingServer: false,
    env: {
      APP_ENV: "testing",
      APP_KEY: "base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
      STOREFRONT_API_URL: "https://api.example.test/api/v1",
      APP_URL: "http://127.0.0.1:8011",
    },
  },
});
