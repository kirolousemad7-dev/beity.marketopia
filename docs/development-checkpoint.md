# Development checkpoint

This commit is a source checkpoint. It is not a verified production release.

- The Blade storefront in `new_frontend/` is the checkout client that was exercised against the real Laravel API.
- The older Next.js client in `frontend/` still does not collect `customer_name` and `customer_phone`, so its checkout cannot place an order. That client was not verified in the latest pass.
- Package checkout writes `order_items.bundle_id` and `order_items.line_total`. Those columns come from:
  - `backend/database/migrations/2026_10_21_161500_add_bundle_id_to_order_items_table.php`
  - `backend/database/migrations/2026_10_21_162000_add_line_total_to_order_items_table.php`
- Those migrations were applied only to an isolated QA database. The working database still needs this schema before the updated checkout is used there. Uploading these files does not apply them.
- MySQL was not available during the latest QA pass, so that pass does not verify MySQL.
