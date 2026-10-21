import "./environment.mjs";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  descriptionHtml,
  escapeHtml,
  safeUrl,
} from "../../public/assets/js/core/ui.js";

test("API text and descriptions cannot inject scripts or event handlers", () => {
  assert.equal(
    escapeHtml('<img onerror="x">'),
    "&lt;img onerror=&quot;x&quot;&gt;",
  );
  const html = descriptionHtml(
    '<p onclick="x">Safe <strong>text</strong><script>alert(1)</script><img src=x onerror=x></p>',
  );
  assert.equal(html, "<p>Safe <strong>text</strong></p>");
});

test("only HTTP and HTTPS image URLs are accepted", () => {
  assert.equal(safeUrl("javascript:alert(1)"), "");
  assert.equal(safeUrl("data:text/html,<script>x</script>"), "");
  assert.equal(
    safeUrl("https://example.test/image.jpg"),
    "https://example.test/image.jpg",
  );
});
