import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import jquery from "jquery";

const dictionary = JSON.parse(
  readFileSync(
    new URL("../../resources/dictionaries/en.json", import.meta.url),
  ),
);
const config = {
  locale: "en",
  baseUrl: "https://store.example.test",
  apiUrl: "https://api.example.test/api/v1",
  dictionary,
};
export const dom = new JSDOM(
  `<script id="storefront-config" type="application/json">${JSON.stringify(config)}</script><div id="toast-region"></div>`,
  { url: "https://store.example.test/en" },
);
for (const key of [
  "window",
  "document",
  "localStorage",
  "CustomEvent",
  "DOMParser",
  "location",
])
  globalThis[key] = dom.window[key];
globalThis.jQuery = jquery(dom.window);
