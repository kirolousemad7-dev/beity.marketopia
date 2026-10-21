# Audit findings

Audit date: 2026-10-21. Application code was not modified. Nothing in this file was executed against a database, a browser, or a payment provider.

Verification labels:

- **STATICALLY CONFIRMED** — read in the current source
- **VERIFIED BY AUTOMATED TEST** — not used; the suite was not run
- **VERIFIED IN BROWSER** — not used; the apps were not booted
- **SUSPECTED — NEEDS REPRODUCTION** — code points this way, runtime was not observed
- **BLOCKED** — could not be checked safely
- **NOT REVIEWED** — deliberately left out

## Project identity

This workspace is Beity, not TARWIQA. Findings below are about Beity. They are not a verdict on a maid, supporter, or partner system, because that system is not in the tree.

## 1. Confirmed defects

### B-01 Checkout lets the client lower the charged total

| | |
| --- | --- |
| Severity | High |
| Module | Orders |
| Location | `backend/app/Services/Api/V1/OrderService.php` `checkout`, lines 65–67 and 77. `CheckoutRequest::rules()` lines 27–38 do not include `total_amount`. |
| Evidence | After the server adds shipping and line prices, and after a coupon discount is calculated, the method does `if ($totalAmount > $request->total_amount) { $discount = $totalAmount - $request->total_amount; }`. The stored total is `$totalAmount - $discount`. |
| What is wrong | A smaller `total_amount` replaces the coupon discount and reduces what is stored and charged. The field is not validated. Both storefronts send it (`new_frontend/public/assets/js/features/cart.js` line 174, `frontend/src/lib/api.ts` line 222). A client that omits it or sends `0` takes the same branch: PHP numeric comparison treats null as 0, so a positive server total is fully discounted. |
| Impact | Orders can be stored below the catalog price. Stock is still decremented. Wallet/InstaPay screenshots are not checked against the original price. Bosta COD uses `orders.total_amount` (`BostaService` around line 78), so the underpaid total is what would be collected. |
| Suggested correction | Ignore client totals. Persist the server total minus a server-calculated coupon only. Reject checkout if you need the client to display a matching figure, instead of trusting it. |
| Verification | STATICALLY CONFIRMED |
| Blocks | Any order-total, coupon, or dashboard-revenue edit until this is fixed. Otherwise the KPI measures the manipulated number. |

### B-02 Inactive products stay on the API and can be purchased

| | |
| --- | --- |
| Severity | High |
| Module | Catalog / orders |
| Location | `ProductService::index` lines 13–23, `show` lines 26–33, `bestSelling` lines 36–38. `OrderService::checkout` lines 34–40. |
| Evidence | The admin table exposes `ToggleColumn::make('is_active')` (`ProductsTable.php` line 27). None of the three read methods add `where('is_active', true)`. Checkout loads by id and checks stock only. |
| What is wrong | Turning a product off in the admin does not hide it and does not stop checkout. |
| Impact | "Active" is not a sales control. `CommerceOverview` counts active products, which will not match the public catalog. |
| Suggested correction | Filter public list, show, and best-selling. Reject inactive ids in checkout inside the same transaction as the stock decrement. |
| Verification | STATICALLY CONFIRMED |
| Blocks | Any edit that assumes the Active toggle already matches the storefront. |

### B-03 Deleting a product or category deletes order lines

| | |
| --- | --- |
| Severity | High |
| Module | Catalog |
| Location | `database/migrations/2026_09_06_122026_create_catalog_tables.php` line 30 (`products.category_id` cascade). `2026_09_06_123801_create_order_management_tables.php` lines 26–27 (`order_items.product_id` cascade). `ProductsTable.php` lines 39–45. `CategoriesTable.php` lines 34–40. |
| Evidence | Bulk-delete failure titles say a product that is in an order cannot be deleted, and a category that contains products cannot be deleted. There is no `ProductPolicy`, no `CategoryPolicy`, and no `deleting` callback. The foreign keys cascade. |
| What is wrong | The UI copy describes a restrict rule. The schema deletes dependent rows. Deleting a category deletes its products, which deletes `order_items` and `bundle_items`. The order header remains, with a total that no longer matches its lines. |
| Impact | Historical orders lose their lines. Bundle membership disappears with the product. |
| Suggested correction | Change the product and category foreign keys to `restrictOnDelete`, or soft-delete catalog rows and point order lines at a snapshot that does not cascade. Keep the failure copy only if the database matches it. |
| Verification | STATICALLY CONFIRMED from migrations and the absence of a guard. The delete was not clicked. |
| Blocks | Catalog table or form work that invites deleting records. Fix the constraint before polishing those screens. |

### B-04 Payment screenshots are not placed on a private disk

| | |
| --- | --- |
| Severity | High |
| Module | Orders / media |
| Location | `PaymentTransaction::registerMediaCollections` lines 30–35. Contrast `ProductForm.php` lines 28–29, which set `disk('public')`. |
| Evidence | The screenshot collection sets single-file and mime types only. `config/media-library.php` is not in the repo. `.env.example` has no `MEDIA_DISK`. Spatie Media Library 11 defaults that collection to the `public` disk when the app does not choose one. The orders table and infolist render `getFirstMediaUrl('payment_screenshot')` inside the modal HTML (`OrdersTable.php` lines 52–60). |
| What is wrong | Wallet and InstaPay proof images are customer payment documents. Nothing in the app forces a private disk or a short-lived signed URL. |
| Impact | If `storage:link` is in place, the file URL is fetchable without the Filament session. |
| Suggested correction | `useDisk('local')` or a private disk, and serve the preview through an authorized response. Do not embed a public URL. |
| Verification | STATICALLY CONFIRMED that the collection does not choose a disk. The public URL was not requested, because the app is not running and no files exist in this copy. |
| Blocks | Orders-table screenshot UI. Do not add more public previews first. |

### B-05 Next.js checkout does not send the required recipient fields

| | |
| --- | --- |
| Severity | High for the Next app. The Blade cart is not affected. |
| Module | Next storefront / checkout |
| Location | `frontend/src/lib/api.ts` `checkoutOrder` lines 209–222. Search of `frontend/` found no `customer_name` or `customer_phone`. `CheckoutRequest` lines 28–30 require both. |
| Evidence | The helper appends address, payment method, items, coupon, screenshot, and `total_amount` only. Blade `cart.js` lines 155–156 trims and sends the recipient fields. |
| What is wrong | Against the current API, Next checkout fails validation before an order is created. |
| Impact | The Next storefront cannot complete a purchase. CI does not build `frontend/` (workflows cover `backend` and `new_frontend` only). |
| Suggested correction | Either add the fields to the Next cart and request, or stop shipping that client. Do not relax the API to match the older client. |
| Verification | STATICALLY CONFIRMED |
| Blocks | Any assumption that both storefronts are on the same checkout contract. |

### B-06 Checkout success arguments are reversed

| | |
| --- | --- |
| Severity | Medium |
| Module | Orders API |
| Location | `OrderController::checkout` lines 45–47. `ApiResponse::successResponse` lines 28–30. |
| Evidence | Signature is `successResponse($data, $message = 'Success', $meta = null)`. The checkout call passes the sentence first and `['order' => $order]` second. Every other controller in `app/Http/Controllers` passes data first. `new_frontend/README.md` already says the checkout envelope is wrong and that the Blade client tolerates it. |
| What is wrong | JSON `data` becomes the string "Order placed successfully." and `message` becomes the order payload. |
| Impact | Blade ignores the body (`cart.js` 184–191) and shows its own toast. Next does `text: res.message` and renders it in `Alert` (`cart_components.tsx` lines 127–133). An object child is not a string. |
| Suggested correction | Call `successResponse(['order' => $order], 'Order placed successfully.')`. |
| Verification | STATICALLY CONFIRMED |
| Blocks | Clients that will start reading `data.order`. Fix the call before documenting the response. |

### B-07 `is_paid` does not read the payment row

| | |
| --- | --- |
| Severity | Medium |
| Module | Orders API |
| Location | `OrderResource.php` line 23. Relationship is `Order::transaction()` lines 55–58. |
| Evidence | The resource evaluates `whenLoaded('payment_transactions.status') == 'completed'`. There is no `payment_transactions` relationship. `whenLoaded` on a missing name returns a missing value, and that comparison is false. |
| What is wrong | `is_paid` is false even after `AcceptOrder` marks a wallet or InstaPay transaction completed. |
| Impact | Any client that trusts `is_paid` will show unpaid for paid-on-accept orders. The Blade README already warns about this field. |
| Suggested correction | Load `transaction` and compare `transaction.status` to `completed`. |
| Verification | STATICALLY CONFIRMED |
| Blocks | Storefront paid badges. |

### B-08 Per-user coupon limit is not applied at checkout

| | |
| --- | --- |
| Severity | Medium |
| Module | Coupons |
| Location | `Coupon::isValid` lines 27–34. `CouponController::apply` lines 21–24. `OrderService::checkout` lines 56–71. |
| Evidence | `usage_limit_per_user` defaults to 1 in the migration and in `CouponSeeder`. `isValid` never reads it. Checkout never counts the user's earlier orders. Only the preview endpoint does. |
| What is wrong | A client can skip the preview and post `coupon_code` until the global `usage_limit` stops it. A null global limit means no stop. |
| Impact | One-per-customer coupons are not one per customer. |
| Suggested correction | Use the same per-user count inside `checkout`, in the transaction, with a lock on the coupon row. |
| Verification | STATICALLY CONFIRMED |
| Blocks | Coupon form changes that assume the per-user field already works. |

### B-09 Best-selling list is ordered ascending

| | |
| --- | --- |
| Severity | Medium |
| Module | Catalog |
| Location | `ProductService::bestSelling` line 38. Route `GET /api/v1/products/best-selling`. |
| Evidence | `orderBy('orders_count')` defaults to ascending, then `limit(6)`. |
| What is wrong | The endpoint returns the six products with the fewest related order rows, including inactive products. |
| Impact | Home or merchandising blocks that call this route show the wrong products. |
| Suggested correction | `orderByDesc('orders_count')` and the same `is_active` rule as the rest of the public catalog. |
| Verification | STATICALLY CONFIRMED |
| Blocks | Home-page product sections that use this endpoint. |

### B-10 Category show turns "not found" into 500, and the list filter names a missing column

| | |
| --- | --- |
| Severity | Medium |
| Module | Categories |
| Location | `CategoryController::show` lines 29–37. `CategoryService::index` lines 17–18. `create_catalog_tables.php` categories columns are `id` and timestamps only. |
| Evidence | `show` uses `findOrFail` inside `catch (\Exception)` and always returns the generic 500 helper. Product show specially catches `NotFoundHttpException` and returns 404. The index adds `where('category_id', ...)` when that query key is present. `categories` has no `category_id`. |
| What is wrong | Unknown category ids respond 500. A `category_id` query on the category index is an SQL error, also caught as 500. |
| Impact | Storefront category error states cannot tell "missing" from "broken". |
| Suggested correction | Map `ModelNotFoundException` to 404. Delete the category_id filter or filter a column that exists. |
| Verification | STATICALLY CONFIRMED |
| Blocks | Category page error handling. |

### B-11 `PaymentMethod::getLabel()` has no InstaPay arm

| | |
| --- | --- |
| Severity | Medium |
| Module | Orders admin |
| Location | `app/Enums/PaymentMethod.php` lines 13–19. `OrdersTable.php` lines 74–77 pass `PaymentMethod::class` to the payment-method filter. |
| Evidence | The match returns labels for `Wallet` and `Cash` only. `InstaPay` is a case. Checkout and the column both use the string `instapay`. |
| What is wrong | Calling `getLabel()` on InstaPay throws `UnhandledMatchError`. Filament enum filters call `getLabel()`. Whether the orders index builds those options during the first render was not executed. |
| Impact | The payment-method filter, and possibly the orders index, cannot render that option. |
| Suggested correction | Add an InstaPay label. The status badge column prints the raw string and is not this bug. |
| Verification | STATICALLY CONFIRMED for the match. Page failure is SUSPECTED — NEEDS REPRODUCTION. |
| Blocks | Orders table filter work. |

### B-12 Stock check is not locked

| | |
| --- | --- |
| Severity | Medium |
| Module | Orders |
| Location | `OrderService::checkout` lines 34–39, inside `DB::transaction`. |
| Evidence | `findOrFail`, then a PHP comparison, then `decrement`. No `lockForUpdate`. |
| What is wrong | Two concurrent checkouts can both pass the comparison before either decrement. `decrement` itself is atomic, so stock will not go negative from the update statement alone, but both orders can be accepted for the last units if both read the old stock first. |
| Impact | Oversell under concurrent checkout. |
| Suggested correction | `lockForUpdate()` before the comparison, and re-read stock inside the transaction. |
| Verification | STATICALLY CONFIRMED as a missing lock. The race was not reproduced. |
| Blocks | Nothing visual. It should land with the checkout pricing fix so stock and money change together. |

### B-13 Admin user lifecycle and API self-delete do different things

| | |
| --- | --- |
| Severity | Medium |
| Module | Users |
| Location | `ManageUsers::changeLifecycle` lines 69–84. `AuthService::deleteAccount` lines 64–68. `AuthService::updateProfile` lines 51–56. |
| Evidence | Admin delete revokes tokens, rotates `remember_token`, and writes `audit_logs`. API delete calls `delete()` only. Admin password change revokes tokens. API password change does not. Admin restore does not revoke tokens that the API delete left in place. |
| What is wrong | "Delete account" is a soft delete, which matches the backend README for the admin path, but the API path skips audit and token cleanup. There is no inactive flag, no ban, and no expiry. The TARWIQA wording "deactivate instead of deleting" is not implemented, and this app's own README intentionally uses soft delete plus a permanent delete for customers with no orders. |
| Impact | A restored self-deleted account can keep API tokens created before the delete. Password changes on the API leave other devices logged in. Self-delete is invisible in `audit_logs`. |
| Suggested correction | Route API delete and password change through the same token and audit behavior as `ManageUsers`, without granting the customer admin-only operations. If the product requirement is "inactive" rather than soft delete, that is a new column and a new rule, not a rename of `delete()`. |
| Verification | STATICALLY CONFIRMED |
| Blocks | User-form and account-page edits that are supposed to define one lifecycle. |

### B-14 `ExampleTest` expects 200 for a redirect

| | |
| --- | --- |
| Severity | Low |
| Module | Tests |
| Location | `tests/Feature/ExampleTest.php` lines 15–17. `routes/web.php` lines 6–8. |
| Evidence | The test requests `GET /` and asserts 200. The route returns `redirect('/admin')`, which is 302. The test does not follow redirects. |
| What is wrong | The example test does not match the route. |
| Impact | `php artisan test` fails on this case even when the app is fine. It is not evidence that `/admin` is down. |
| Suggested correction | Assert 302 and the redirect target, or delete the example test. |
| Verification | STATICALLY CONFIRMED. The test was not run. |
| Blocks | Treating a red example test as an application outage. |

## 2. Security and data-integrity risks

### S-01 Seeded administrator with a fixed password

| | |
| --- | --- |
| Severity | High if `DatabaseSeeder` is run on a reachable database. Not a running-site finding, because this copy has no `.env` and seeders were not run. |
| Module | Auth |
| Location | `database/seeders/AdminSeeder.php` `run` |
| Evidence | `User::create` sets `is_admin` true, a fixed email, and a plaintext password. The `hashed` cast stores it as a hash. The password literal is not repeated in this audit. |
| What is wrong | Anyone with the source knows the seeded login. |
| Impact | Full Filament access on any database that was seeded and not rotated. |
| Suggested correction | Read the password from an environment variable, or create the admin once with a generated password. Do not seed it in production. |
| Verification | STATICALLY CONFIRMED |
| Blocks | Any deployment or demo that runs `db:seed` first. |

### S-02 No CORS configuration for the split storefront

| | |
| --- | --- |
| Severity | High for the documented two-origin setup. Irrelevant if the API and the storefront are same-origin. |
| Module | HTTP |
| Location | `backend/config/` has no `cors.php`. `bootstrap/app.php` does not allow an origin. `new_frontend/README.md` requires the backend to allow the storefront origin and the `Authorization` header. |
| Evidence | Browser calls go from the storefront origin to `STOREFRONT_API_URL` or `NEXT_PUBLIC_API_URL`. |
| What is wrong | This tree does not allow that cross-origin call. |
| Impact | The browser storefront cannot call the API until CORS is configured on the server by some means outside this repo. |
| Suggested correction | Add `config/cors.php` (or an equivalent middleware) for the storefront origins and the headers the clients send. Do not use `*` together with credentialed requests. |
| Verification | STATICALLY CONFIRMED as missing from the repo. A live server might inject CORS another way. That was NOT REVIEWED. |
| Blocks | Browser verification of either storefront against this backend. |

### S-03 Login can return an unexpected exception message

| | |
| --- | --- |
| Severity | Low |
| Module | Auth |
| Location | `AuthController::login` lines 30–31 |
| Evidence | The generic `catch (Exception)` concatenates `$e->getMessage()` into the JSON message. Register and profile catches do not. |
| What is wrong | A database or mail error during login is returned to the client. |
| Impact | Internal error text leaves the server. |
| Suggested correction | Log the exception and return a fixed message, as `register` already does. |
| Verification | STATICALLY CONFIRMED |
| Blocks | No |

### S-04 Customer order isolation is real on the list; catalog writes are not per-admin

| | |
| --- | --- |
| Severity | Informational, not a defect against the current one-admin model |
| Module | Authorization |
| Location | `OrderService::index` lines 18–24. Missing policies for product, category, bundle, coupon, setting. |
| Evidence | The order list is `$request` user `orders()`. There is no order id route. `UserPolicy` blocks non-admins and blocks managing admin rows. `OrderPolicy` is discovered by Laravel 13.34 `Gate::guessPolicyName` (framework source checked for tag `v13.34.0`): nested guesses miss, then `App\Policies\OrderPolicy` exists. There is no partner id, so "Partner A cannot read Partner B" has no representation to verify. |
| What is wrong | Nothing in that partner sense. Every `is_admin` user can change catalog, coupons, and settings, and can see every order. |
| Impact | A second admin is not a restricted staff account. |
| Suggested correction | Only if a staff role is specified. Do not add supporter/partner checks with no model to hang them on. |
| Verification | STATICALLY CONFIRMED |
| Blocks | Permission edits. They need a role design first. |

### S-05 Settings endpoint is public and returns every row

| | |
| --- | --- |
| Severity | Low, given the current keys |
| Module | Settings |
| Location | `SettingController::index` |
| Evidence | `Setting::pluck('value', 'key')` with no auth. Keys today are site name, tagline, contact, shipping, Instapay number, and the unused free-shipping threshold. |
| What is wrong | A future secret stored in `settings` would be public. |
| Impact | None for the current seed keys. The Instapay number is meant to be shown at checkout. |
| Suggested correction | Keep an allow-list when the next setting is added. |
| Verification | STATICALLY CONFIRMED |
| Blocks | No |

### S-06 `orders.user_id` cascades on hard delete

| | |
| --- | --- |
| Severity | Low while `UserPolicy::forceDelete` runs |
| Module | Users / orders |
| Location | `create_order_management_tables.php` line 17. `UserPolicy::forceDelete` lines 39–42. |
| Evidence | The policy counts orders and refuses force delete when the count is not zero. Soft delete does not trigger `ON DELETE CASCADE`. A query that bypasses the policy would delete the user's orders. |
| Impact | Order history is safe on the Filament button. It is not safe against a manual SQL delete or a future action that calls `forceDelete` without the policy. |
| Suggested correction | `nullOnDelete` or `restrictOnDelete` on `orders.user_id`, matching the policy. |
| Verification | STATICALLY CONFIRMED |
| Blocks | User delete-button redesigns. |

## 3. UI and maintainability

### U-01 Three frontends, no shared table or theme

Admin tables are Filament PHP (`UsersTable`, `ProductsTable`, `OrdersTable`). Blade CSS is `new_frontend/public/assets/css/`. Next CSS is `frontend/src/app/globals.css` plus CSS modules. `!important` in the Blade CSS search was 4 hits in `storefront.css` and 2 in `blade.css`. No action-menu clipping bug was identified in application CSS, because the admin menus are vendor Filament. There is no prototype `super-admin/` directory in this workspace.

### U-02 Users table has no custom density, widths, or dropdown script

Edits belong in `UsersTable.php` column methods. There is no JS redraw and no duplicated click handler for that table. Products are the same pattern in `ProductsTable.php`. Create and edit for products and categories are Filament modals on the list page (`ListProducts` only registers the index route). Users and coupons use full pages.

### U-03 Bundle relation manager is unused

`BundleResource` imports `ProductsRelationManager` and `getRelations()` returns an empty array (lines 56–61). The working editor is the `bundleItems` repeater in `BundleForm`. Editing the relation manager does nothing until it is registered.

### U-04 Category edit helper asks for columns that do not exist

`CategoriesTable::withTranslations` requests `description`, `meta_title`, and `meta_description` (lines 31–32). `Category::$translatedAttributes` is `name` and `slug`. The form only has name. Harmless extra `only()` keys, confusing on the next edit.

### U-05 Bundle slug changes when any attribute is dirty

`Bundle::booted` saving (lines 61–66) regenerates the slug from the English title whenever `isDirty()` is true. Price edits keep the same slug only if the title is unchanged. Title edits change the public `/bundles/{slug}` URL with no redirect. `generateSlug` does not check uniqueness.

### U-06 `settings.key` is not unique

Migration `2026_09_27_083620_update_tables.php` lines 14–17. `Setting::set` uses `updateOrCreate`. Duplicates make `get()` and the public pluck ambiguous.

### U-07 Login response serializes `is_admin`

`AuthService::login` and `register` return the `User` model. `UserResource` (used by profile) omits `is_admin`. The model hidden array omits it too, so login JSON includes the flag. Not a privilege escalation. It tells the client whether the account is an admin.

### U-08 `free_shipping_min` is stored and unused

Seeded, commented out of `ManageSettings`, never read in `OrderService`. Shipping is always `shipping_cost`. Turning the threshold on is a product decision. See section 5.

## 4. Missing verification

| Item | Status |
| --- | --- |
| `backend/vendor` and `new_frontend/vendor` | Not installed. Not installed during this audit. |
| PHPUnit | Not run. `composer test` also runs `php artisan config:clear`, which this audit was not allowed to do. Feature tests use `LazilyRefreshDatabase`. `phpunit.xml` sqlite memory is **not** `force="true"`, and the README says the slug migration cannot run on SQLite. CI overrides to MySQL `bety_testing` and migrates it. Running that against a non-test database would wipe it. |
| Browser | Not opened. No `.env`, no server, and a login would write a session. |
| Previous test counts or "parity" claims | Not reused. |
| `new_frontend/Archive.zip` | NOT REVIEWED. Not extracted. |
| `backend/openapi.yaml` versus every response field | NOT REVIEWED line by line. Code wins where they differ. |
| Live Bosta, mail, and storage URLs | BLOCKED. No credentials were read. `.env` is absent. |
| Git history | BLOCKED. No `.git` directory. |

`tests/Feature/Shipping/BostaIntegrationTest.php` is written to fake HTTP. That is mocked integration, not evidence of a delivery. This audit did not re-run it, so it is not current execution evidence.

## 5. Undefined business requirements

These are not bugs until someone states the rule.

| Topic | What the code does | Clarification needed |
| --- | --- | --- |
| Deactivate versus delete | Admin "Delete user" soft-deletes, keeps orders, revokes tokens. Permanent delete exists for soft-deleted users with no orders. API delete soft-deletes without audit. | Is soft delete the intended "deactivate"? If a hidden-but-restorable account is wrong, the replacement status has to be specified. |
| Revenue | Widget sums `payment_transactions.amount` where status is `completed`. Non-COD becomes completed at accept. COD stays pending unless an admin edits the order. | Is "paid revenue" accepted wallet/Instapay only, or delivered COD as well? |
| Profit and payables | No cost, commission, salary, or payout fields exist. | Do not add a profit card without a formula and a data source. |
| Failed payments | Nothing in checkout or Bosta sets `failed`. Admins can set it on `OrderForm`. | Should a rejected screenshot or a failed shipment mark the payment failed? |
| Free shipping | `free_shipping_min` is seeded at 500 and unused. | Should shipping drop to 0 at that threshold, and is the threshold compared to merchandise only or merchandise plus shipping? |
| Bundles at checkout | API accepts product ids only. Bundle price is display data. | Should the server price a bundle id, or is exploding into products correct? |
| Best sellers | Count of `order_items` rows via `belongsToMany`, ascending. | Count orders, or sum quantity, and should cancelled orders count? |
| Ads, WhatsApp, push, email campaigns, attendance, inquiry funnels, export of activity logs | Not implemented. Mail config is `log` and unused by `app/`. | Do not treat a missing adapter as a missing API key. There is no adapter. |
| `BOSTA_BUSINESS_LOCATION_ID` | Documented in `backend/README.md` as a legacy fallback. Not present in `config/services.php`. | Is the env var still required? The accept dialog requires a selected pickup. |

## 6. External channels

| Channel | UI | Stored dispatch | Provider adapter | Tests | Configured delivery | Verified delivery |
| --- | --- | --- | --- | --- | --- | --- |
| Bosta shipping | Accept and retry actions, status and tracking columns | Order columns and the `jobs` table | `BostaService` HTTP | Feature test fakes HTTP. Not run here. | Only if `BOSTA_API_KEY` is set on a server. Not visible in this copy. | No |
| Email | Contact email is a setting string | No | Laravel mail config only. No Mailable. | No | `MAIL_MAILER=log` in the example env | No |
| WhatsApp | No | No | No | No | No | No |
| Push | No | No | No | No | No | No |
| Wallet / InstaPay | Method plus screenshot | `payment_transactions` and `media` | No gateway. An admin accepts the order. | Bosta test covers COD vs wallet amounts with HTTP faked. Not run. | No | No |

## 7. Suggested edit order

Do not start this sequence until a change is requested.

1. Confirm the workspace is the intended product. TARWIQA edits do not belong in this tree.
2. Replace the seeded admin password before any shared database is seeded (S-01).
3. Stop trusting `total_amount` (B-01) and lock stock in the same checkout transaction (B-12). Add tests that the suite does not have.
4. Enforce `is_active` on public reads and checkout (B-02).
5. Stop catalog deletes from cascading into `order_items` (B-03).
6. Put payment screenshots on a private disk (B-04) before any orders-table visual work.
7. Fix the checkout response call (B-06) and `is_paid` (B-07) before storefronts start depending on them.
8. Apply the per-user coupon rule inside checkout (B-08).
9. Add the missing InstaPay label (B-11) before editing the orders table filters.
10. Decide whether the Next app is still a supported client (B-05). Add recipient fields or leave it untouched.
11. Add CORS only when the real storefront origin is known (S-02).
12. UI layout (users table, colors, header) after the data rules above, because those screens display the values those bugs distort.
13. Dashboard copy after the payment-status rule is chosen (section 5). Do not add profit.

## 8. What was not found, so it is not listed as broken

No evidence in this tree of: maids, booking calendars, partner data leaks, supporter attendance, ad trackers, inquiry funnels, referral shares, wallet ledgers, refund jobs, or prototype routes mounted on the live app. Absence is the finding. It is not a list of defects inside those features.
