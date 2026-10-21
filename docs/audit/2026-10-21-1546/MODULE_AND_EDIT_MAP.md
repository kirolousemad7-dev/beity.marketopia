# Module and edit map

Audit date: 2026-10-21. Paths are relative to `beity-main/beity-main/` (the nested project root).

Filament URLs below are the paths implied by `AdminPanelProvider::path('admin')` and each resource's `getPages()`. `php artisan route:list` was not run because `vendor/` is not installed.

## 0. Modules that are not in this project

The audit request listed TARWIQA workspaces. None of these exist as routes, models, migrations, views, or tests. Do not add them by editing a file that is not here.

| Requested module | In this tree |
| --- | --- |
| Super Admin / Supporter / Partner workspaces | No. One Filament panel. One `users.is_admin` flag. |
| Sidebar/header shared admin layout | No custom admin shell. Filament vendor layout. Storefront headers are separate (section 2 and 16). |
| Maids and documents | No |
| Scheduled orders and booking settings | No. Closest concept is product `stock` and Bosta shipment state. |
| Locations and customer addresses as entities | No address book. Checkout stores one `orders.shipping_address` string. Bosta city/district are chosen at accept time and stored in `orders.bosta_address`. |
| Full Con, widgets, custom packages | No. Catalog entities are categories, products, and bundles. |
| Extras and add-on products | No |
| Inquiry logs and funnel | No |
| Reviews | No |
| Inbox and outbound messaging | No |
| Partner operations and chat | No |
| Supporter permissions and attendance | No |
| Shares / referrals | No |
| Slider ads and ads history | No |
| Wallets as a ledger | No balance, deposit, or ledger tables. `wallet` is a payment-method string. |
| Export logs | No export endpoint. `audit_logs` is write-only from PHP. |
| Dashboard profit / payable KPIs | No formulas. Two widgets exist (section 4). |

## 1. Authentication and role dashboards

**Purpose.** Customers register and call the API with a Sanctum token. Admins use Filament. The dashboard is Filament's default dashboard plus two stat widgets and the account widget.

**Roles.** `is_admin = true` can open `/admin`. Everyone else is a customer. Soft-deleted users fail `canAccessPanel` only after the session user can no longer be loaded; the method itself checks `is_admin` only (`User.php` lines 41–44). Policies separately reject trashed actors.

**Pages and routes.**

- `GET /` → redirect `/admin` (`routes/web.php`)
- `GET /admin/login`, `GET /admin` (dashboard)
- `GET /admin/locale/{locale}` name `admin.locale`
- API: `auth/login`, `auth/register`, `auth/profile`, `auth/logout`, `auth/delete-account`
- Blade: `/{locale}/login`, `/register`, `/account`
- Next: `/{lang}/login`, `/register`, `/account`

**Write paths.**

- `AuthController` → `AuthService` (`login`, `register`, `profile`, `updateProfile`, `logout`, `deleteAccount`)
- Validation: `LoginRequest`, `RegisterRequest`, `UpdateProfileRequest`
- Admin accounts are not created through the public register path. `AuthService::register` does not set `is_admin` (column default `false`).

**Models.** `User`. Fillable: `name`, `email`, `password`, `is_admin`. Hidden: `password`, `remember_token`. Casts: `password` hashed, `is_admin` boolean, `email_verified_at` datetime. Soft deletes. `orders()` hasMany.

**Tables.** `users`, `password_reset_tokens`, `sessions`, `personal_access_tokens`.

**UI.** Filament login and profile (`->profile(isSimple: false)`). No custom profile page class. Blade `pages/login.blade.php`, `register.blade.php`, `account.blade.php` plus `public/assets/js/features/auth.js` and `account.js`. Next: `login-form.tsx`, `register-form.tsx`, `account-view.tsx`.

**Permissions.** Panel gate is `canAccessPanel`. Profile update validation allows only `name`, `email`, `password`. `is_admin` is fillable but is not in `UpdateProfileRequest::rules()`, and the controller passes `$request->validated()` only. A customer cannot change their own admin flag through this endpoint.

**Tests.** No dedicated auth feature test for login/register. User-management tests cover admin protection. Blade browser tests are described as mocking auth; they were not run.

**External.** None.

**Edit here.** Login rules: `LoginRequest`. Registration fields: `RegisterRequest` and `AuthService::register`. Profile fields: `UpdateProfileRequest` and `AuthService::updateProfile`. Who may open the admin: `User::canAccessPanel`. Dashboard contents: section 4.

## 2. Storefront header, footer, and layout

**Purpose.** Two customer shells plus the Filament admin shell.

**Admin.** Do not look for a sidebar PHP partial. Change groups and icons on each `*Resource::getNavigationGroup()` / `navigationIcon`. Change the accent in `AdminPanelProvider` colors (line 46–48). A Filament theme does not exist yet; adding one would be a new `resources/css/filament` theme and a panel `->viteTheme()`, which is new work, not an edit of an existing theme.

**Blade.** 

- Header: `new_frontend/resources/views/partials/header.blade.php`
- Footer: `partials/footer.blade.php`
- Layout: `resources/views/layouts/storefront.blade.php`
- Global color/type: `public/assets/css/storefront.css` and `fonts.css`
- Strings: `resources/dictionaries/en.json`, `ar.json`

**Next.**

- Header: `frontend/src/layouts/header.tsx`
- A sidebar component exists: `frontend/src/layouts/sidebar.tsx` (storefront, not admin)
- Footer: `frontend/src/layouts/footer.tsx`
- Tokens: `frontend/src/app/globals.css` lines 3–38 (`--color-canvas`, `--color-volt`, `--header-height`, `--container-max`)

Changing Blade CSS does not change Next or Filament.

## 3. Users, profiles, and account lifecycle

**Purpose.** Admins manage customer accounts. Customers edit their own name, email, and password and can soft-delete themselves.

**Roles.** Admin for `/admin/users`. The resource query forces `where('is_admin', false)` (`UserResource::getEloquentQuery`, lines 42–45), so administrator rows are not in the list. Direct edit of an admin is what `UserManagementTest::test_direct_admin_edit_links_are_not_found_and_customers_are_forbidden` is written to cover. That test was not executed in this audit.

**Pages.** `/admin/users`, `/admin/users/create`, `/admin/users/{record}/edit`.

**Controller methods.** No hand-written user controller. Filament pages:

- `CreateUser::handleRecordCreation` → `ManageUsers::create`
- `EditUser::handleRecordUpdate` → `ManageUsers::update`. Header actions on that page are `UserActions::make()`.
- Row actions in `UserActions::make`: delete, restore, force delete → `ManageUsers`

**Validation.** `app/Http/Requests/Admin/Users/SaveUserRequest.php` `rulesFor()`. `UserForm` reuses those rules per field. Password required on create, nullable on edit, minimum 8 via `Password::min(8)`, confirmed.

**Service.** `app/Services/Users/ManageUsers.php`.

- Create sets `is_admin` to false explicitly (line 22).
- Update changes name/email and, when a password is present, rotates `remember_token` and deletes Sanctum tokens (lines 36–39). Email change nulls `email_verified_at`.
- Delete and force delete revoke tokens and rotate `remember_token`, then call the Eloquent method (lines 74–78).
- Restore does not revoke tokens.
- Every successful change writes `audit_logs` through `UserAuditLog`. Password values are not in `details`; `changed_fields` lists the field name `password` when that attribute was dirty.

**API self-service** does not use `ManageUsers`.

- `AuthService::updateProfile` calls `$user->update($data)` and does not revoke tokens when the password changes.
- `AuthService::deleteAccount` calls `$user->delete()` only. No audit row. Tokens are not deleted in this method. Soft-delete global scope then hides the user from a normal `tokenable` lookup; that runtime effect was not executed. Restoring the user later does not clear those leftover tokens, because `ManageUsers::restore` skips token deletion.

**Tables / fields.** `users`: `id`, `name`, `email` unique, `email_verified_at` nullable, `password`, `is_admin` default false, `remember_token`, timestamps, `deleted_at` (migration `2026_10_06_161956_add_soft_deletes_to_users_table.php`).

**UI files.**

- Columns and filters: `app/Filament/Resources/Users/Tables/UsersTable.php`
- Form: `app/Filament/Resources/Users/Schemas/UserForm.php`
- Actions: `app/Filament/Resources/Users/Actions/UserActions.php`
- No custom CSS and no table-specific JavaScript. Density, column width, and action menus are Filament defaults unless a column method is added in `UsersTable`.

**Columns today.** `name`, `email` (searchable, copyable, `dir=ltr`), `orders_count`, `created_at` (toggleable), `deleted_at` (hidden by default). Filter: `TrashedFilter`. Actions: Edit, Delete, Restore, Force delete. Default sort `created_at` desc.

**Policies.** `UserPolicy` as described in the architecture map.

**Tests.** `tests/Feature/Users/UserManagementTest.php`, `tests/Feature/Users/UserPolicyTest.php`. They use `LazilyRefreshDatabase`.

**There is no maids table.** A "change the maids table" edit has no target file.

## 4. Dashboard metrics

**Purpose.** Show order counts and a payment total on `/admin`.

**Widgets.**

- `app/Filament/Widgets/OrderStatusStats.php` — one stat per `OrderStatus` case, `Order::where('status', $status->value)->count()`. Polls every 15 seconds. No `canView` override.
- `app/Filament/Widgets/CommerceOverview.php` — polls every 60 seconds. `canView()` returns true.
  - "Paid revenue": `PaymentTransaction::where('status', 'completed')->sum('amount')`, formatted as EGP. Description text: "Captured checkout revenue".
  - "Active products": `Product::where('is_active', true)->count()`.
  - "Failed payments": `PaymentTransaction::where('status', 'failed')->count()`.
- `AccountWidget` is registered on the panel. Filament's default stats widget is not additionally registered.

**What the money number is.** It is the sum of `payment_transactions.amount` where `status = completed`. It is not order `total_amount`. It is not profit. Nothing in the code computes cost, commission, salary, or payables.

**When a transaction becomes completed.**

- Checkout always inserts `status = pending` (`OrderService` lines 87–91).
- `AcceptOrder` sets `completed` only when `payment_method` is not `cash_on_delivery` (lines 68–70).
- `OrderForm` lets an admin set the transaction status to any `PaymentStatus` while `OrderPolicy::update` allows the edit (no Bosta submission yet).

COD therefore stays pending unless an admin edits it. "Failed" is never written by checkout, accept, or the Bosta job. The failed-payment stat counts only rows an admin (or a future writer) marked failed.

**No other financial KPI exists.** Adding profit or payable requires a written formula first. Do not invent one in the widget.

**Edit here.** `CommerceOverview::getStats` and `OrderStatusStats::getStats`. Labels are plain strings, not translation keys, except order-status labels which go through `OrderStatus::getLabel()`.

## 5. Orders and money

**Purpose.** A signed-in customer checks out a list of products. An admin accepts the order into Bosta or edits status before a shipment exists.

**Roles.** Checkout and order list: the token's user, own orders only. Admin: all orders, via `OrderPolicy`.

**API.**

- `POST /api/v1/orders/checkout` — `OrderController@checkout` → `CheckoutRequest` → `OrderService::checkout`
- `GET /api/v1/orders` — paginate 10, `OrderResource` collection, meta `current_page`, `last_page`, `per_page`, `total`

**Admin.**

- List `OrdersTable`, view `OrderInfolist`, edit `OrderForm` (order status + transaction status only)
- `AcceptOrderAction` → `AcceptOrder::handle` → `SendOrderToBosta`

**Validation.**

- `CheckoutRequest`: `customer_name` required max 100; `customer_phone` required; `additional_phone` optional; both phones use `App\Rules\Orders\PhoneNumber` (7–15 digits, optional leading `+`, spaces, parentheses, hyphens, max 30 characters). `shipping_address` required max 255. `coupon_code` nullable exists on `coupons.code`. `payment_method` in `cash_on_delivery,wallet,instapay`. Screenshot required unless COD, image png/jpg/jpeg/webp, max 5120 KB. `items` min 1, `product_id` exists, `quantity` min 1.
- `total_amount` is **not** in the rules. The service still reads `$request->total_amount`. See findings.
- `AcceptOrderRequest::acceptanceRules()` validates pickup, city, district, and recipient fields. Read that class before changing accept.

**Price calculation that is actually in `OrderService::checkout` (lines 28–98).**

1. Start from `Setting::get('shipping_cost')`.
2. For each item, load the product, reject when `stock < quantity`, `decrement` stock, take `price_after_discount ?? price` (zero is kept; only null falls back), add `price * quantity`.
3. If `coupon_code` is filled, load `Coupon` by uppercased code, `isValid($totalAmount)`, then `calculateDiscount`.
4. If `$totalAmount > $request->total_amount`, **replace** `$discount` with the difference.
5. Increment `coupons.used_count` when a coupon row was loaded.
6. Store `total_amount - discount`, status `pending`, create items, create a pending `payment_transactions` row, attach the screenshot if present.
7. The whole block is one `DB::transaction`.

`free_shipping_min` is seeded (`SettingSeeder`, value `500`) and is not read by checkout. The settings form leaves that input commented out (`ManageSettings` lines 45–47).

**Coupon rules in code.**

- `Coupon::isValid`: active, not expired, global `usage_limit` vs `used_count`, `min_order_amount`.
- `Coupon::calculateDiscount`: `fixed` or `percent`, optional `max_discount_amount`, never above the amount passed in.
- Per-user limit is checked only in `CouponController::apply` (lines 21–24), **not** in `OrderService::checkout`.

**Payment methods.** Enum `PaymentMethod`: `wallet`, `instapay`, `cash_on_delivery`. `getLabel()` matches Wallet and Cash only. InstaPay has no arm.

**Order status values.** `pending`, `processing`, `shipped`, `delivered`, `cancelled` (`OrderStatus` and the orders enum column). Accept sets `processing`. The edit form can set any of the five. No other transition table exists. Bosta success does not set `shipped` or `delivered` (`SendOrderToBosta` only fills submission columns). The README says delivery webhooks are out of scope.

**Assignment.** There is no maid/driver assignment. "Assignment" in this app is the Bosta pickup location saved on the order.

**Repeated submit.** Checkout has no idempotency key. Two submits create two orders. Accept locks the order row and re-checks the policy inside the transaction. The job claims `queued` → `submitting` with a conditional update so a second worker no-ops.

**Stock.** The check and `decrement` are two statements, with no `lockForUpdate`.

**Inactive products.** Checkout does not read `is_active`.

**Models.** `Order`, `OrderItem`, `PaymentTransaction`, `Coupon`.

**Tables.**

- `orders`: `order_number` unique, `user_id` FK cascade, `total_amount`, status enum, `shipping_address`, timestamps; later `coupon_id`, `discount_amount`, `customer_name`, `customer_phone`, `additional_phone`, Bosta JSON/status/ids, pickup id and name
- `order_items`: `order_id`, `product_id`, `quantity`, `price` (the unit price copied at checkout)
- `payment_transactions`: `order_id`, `amount`, status enum `pending|completed|failed`, method enum
- `coupons`: see migration `2026_09_27_083718_create_coupons_table.php`
- `media`: Spatie table

**Order fillable** does not include Bosta columns. Accept and the job use `forceFill`.

**UI.**

- Admin table: `OrdersTable.php` (order number, account name, customer name, phone, total, status, payment status, method, screenshot modal, Bosta status, tracking, created_at). Filters: order status, transaction status, payment method.
- Screenshot modal builds an `<img src>` with `getFirstMediaUrl('payment_screenshot')` (lines 52–60). Same pattern in `OrderInfolist.php`.
- Blade cart: `public/assets/js/features/cart.js` and `pages/cart.blade.php`. Sends customer fields and `total_amount`. Payment radios in the cart script are `instapay` and `cash_on_delivery` only (line 71).
- Next cart: `frontend/src/components/cart_components.tsx` and `frontend/src/lib/api.ts` `checkoutOrder`. Sends `total_amount`. Does not send `customer_name` or `customer_phone`. Wallet button is commented out (cart component around line 146); the API helper still allows `wallet`.

**Resources.** `OrderResource` includes `is_paid` computed as `whenLoaded('payment_transactions.status') == 'completed'`. The relationship method is `transaction()`, not `payment_transactions`. See findings.

**Checkout response.** `OrderController::checkout` calls `successResponse('Order placed successfully.', ['order' => $order])`. The trait's first parameter is `$data` and the second is `$message` (`ApiResponse.php` lines 28–30). The arguments are reversed relative to every other controller. The Blade cart ignores the body and shows its own toast (`cart.js` lines 184–191). The Next cart puts `json.message` into an `Alert` (`cart_components.tsx` lines 127–133).

**Tests.** `CheckoutCustomerInformationTest`, `OrderCustomerInformationTest`, `PhoneNumberTest`. They assert recipient fields, not the client-total discount branch. Bosta tests fake HTTP and cover accept/queue. No test was executed in this audit.

## 6. Catalog: categories, products, bundles

**Purpose.** Sellable products belong to a category. Bundles are a priced group of products shown on the storefront. Checkout does not accept a bundle id; clients expand bundles into product lines (stated in `new_frontend/README.md` and matched by the checkout rules, which only accept `items.*.product_id`).

### Categories

- Admin: `/admin/categories` modal create/edit. `CategoryForm`, `CategoriesTable`.
- API: `GET /categories`, `GET /categories/{id}` → `CategoryService`.
- Model translated attributes: `name`, `slug` (`Category.php` line 18). Slug is rewritten on every translation save (`CategoryTranslation`).
- Table `categories` has no `category_id` column. `CategoryService::index` still applies `where('category_id', request('category_id'))` when that query parameter is present (lines 17–18). That filter is copied from products and does not match this table.
- `CategoryController::show` catches `\Exception`. `findOrFail` throws `ModelNotFoundException`, which is an `Exception`, so a missing id becomes HTTP 500 from the controller instead of 404.
- Form translations: name only. `CategoriesTable::withTranslations` also asks for `description`, `meta_title`, `meta_description`, which are not columns and are not form fields.
- Delete: `DeleteAction` / `DeleteBulkAction`. Bulk failure title says a category with products cannot be deleted. The FK is `cascadeOnDelete` (`create_catalog_tables.php` line 30). No policy blocks the delete.

### Products

- Admin: `/admin/products` modal create/edit. `ProductForm`, `ProductsTable`.
- API: index, show by slug, best-selling.
- Fields: `slug`, `category_id`, `price`, `price_after_discount` nullable, `stock`, `is_active`, `sku` unique. Translations: `name`, `description`.
- `ProductService::index` returns every product (`get()`, no pagination) and does not filter `is_active`. Optional `category_id` filter is valid on this table.
- `show` returns the product for any slug, including inactive. Missing slug throws `NotFoundHttpException`, and the controller maps that to 404.
- `bestSelling` is `orderBy('orders_count')` which is ascending, `limit(6)`, no `is_active` filter (`ProductService.php` lines 37–38).
- Images: collection `product-images`, Filament disk `public`.
- Delete: same cascade issue as categories, via `order_items.product_id` and `bundle_items.product_id`.
- Tests: `ProductAvailabilityTest` covers missing vs existing slug and a forced 500. It does not cover `is_active`.

### Bundles

- Admin: `/admin/bundles` and `/admin/bundles/{record}/edit`. Form repeater `bundleItems` with `product_id` and `quantity` (`BundleForm` lines 61–87).
- `ProductsRelationManager` is imported in `BundleResource` and is **not** returned from `getRelations()` (the array is empty). The repeater is the editor that actually runs.
- API: active bundles only. Response includes `bundle_price`, `original_price` (sum of product `price` times pivot quantity, not `price_after_discount`), `savings`, and `ProductResource` collection.
- Slug: `generateSlug` of the English title (`helpers.php` and `Bundle::booted`).
- Public images: `getFirstMediaUrl()` with no temporary URL. The form sets disk `public`.
- Checkout does not take bundle ids.

**Edit catalog fields.** Product columns and inputs: `ProductForm` and `ProductsTable`. A new persisted attribute needs the model `$fillable`, a migration, the form, the API resource if customers should see it, and both storefront renderers if it is visible (`ProductResource` plus `new_frontend/public/assets/js/components/products.js` and `frontend/src/components/product-card.tsx`).

## 7. Coupons

**Admin.** `/admin/coupons` plus create, view, edit. Relation manager `OrdersRelationManager` is registered. Form: `CouponForm`. Table: `CouponsTable`.

**API.** `POST /api/v1/coupons/apply` with `ApplyRequest`. Returns `coupon_id`, `discount_amount`, `new_total`. The client sends `order_amount`; the server does not recompute it.

**Enforcement gap.** Preview checks `usage_limit_per_user`. Checkout does not. Global `usage_limit` is checked in both places via `isValid`.

**Edit here.** Rules: `Coupon` model and both call sites. Fields: `CouponForm` and the coupons migration.

## 8. Settings

**Admin.** `ManageSettings` page. Fields saved: `site_name`, `site_tagline`, `contact_email`, `contact_phone`, `instapay_number`, `shipping_cost`. Each key is `Setting::set`, which clears `setting_{key}`.

**API.** `GET /api/v1/settings` is public and returns every key/value pair (`Setting::pluck`).

**Table.** `settings.key` is not unique. `updateOrCreate(['key' => ...])` can attach to one of several duplicates. `get()` uses `value()`, which returns a single arbitrary row.

**Seed defaults** (`SettingSeeder`): site name `BEITY`, a tagline, `contact_email`, placeholder phone `01000000000`, `shipping_cost` `15`, `free_shipping_min` `500`, placeholder `instapay_number`. These are seed literals, not live customer data.

**Edit here.** Add a field in `ManageSettings::form` and read it with `Setting::get` where the behavior should change. Checkout shipping is the `shipping_cost` read in `OrderService`. Storefronts also read the public settings payload (Next `instapay_number` in `frontend/src/lib/types.ts`).

## 9. Shipping (Bosta)

**Purpose.** After an admin accepts an order, a queued job creates a Bosta delivery.

**Code.** `AcceptOrder`, `BostaService`, `SendOrderToBosta`, `AcceptOrderAction`, `AcceptOrderRequest`, `OrderPolicy`, enums `BostaSubmissionStatus`.

**Config names.** `BOSTA_API_KEY`, `BOSTA_BASE_URL`, `BOSTA_QUEUE_CONNECTION`, `BOSTA_QUEUE`. Do not put key values in docs or chat.

**Behavior in code.** Accept validates pickup/city/district against cached Bosta metadata, locks the order, requires a payment row whose method is one of the three known methods, refuses COD totals `<= 0` or `> 30000`, requires at least one item, stores address and pickup, sets status `processing` and submission `queued`, marks non-COD payments `completed`, writes an audit row, dispatches the job before commit. The job claims the row, calls `createDelivery`, stores `bosta_delivery_id` and tracking number, or marks `failed` vs `needs_review`. `failed()` distinguishes "never left the queue" from "interrupted while submitting".

**Tests.** `tests/Feature/Shipping/BostaIntegrationTest.php` fakes HTTP. Not run here. Do not point this job at a live key during a UI edit.

## 10. Audit log

**Table.** `audit_logs`: `action`, `user_id` (string, no FK), `ip_address`, `details` text cast to array, timestamps.

**Writers.** `ManageUsers` (`user.created`, `user.updated`, `user.delete`, `user.restore`, `user.forceDelete`) and `AcceptOrder` (`order.accepted`, `order.bosta_requeued`). Order status edits through `OrderForm` do not write this table. API self-delete does not either.

**No reader and no export.** There is no Filament resource and no CSV/export route.

## 11. Media

| Collection | Model | Disk set in app code |
| --- | --- | --- |
| `product-images` | `Product` | `public` on the Filament upload |
| `category-images` | `Category` | `public` |
| bundle image | `Bundle` | `public` |
| `payment_screenshot` | `PaymentTransaction` | not set |

Payment proofs are the sensitive collection. See findings before changing the orders table to show more of them.

## 12. Locales

- Admin: session `filament_locale`, middleware `SetFilamentLocale`, lang files `backend/lang/en.json` and `ar.json`.
- API catalog/orders/coupons: `Accept-Language` via `SetApiLocale`, limited to `en` and `ar`.
- Product and category and bundle copy: Astrotomic translations.
- Blade: URL prefix and JSON dictionaries.
- Next: `[lang]` segment and `src/i18n/`.

`settings` and `auth` routes are outside the `api.locale` group. Auth validation messages that use `__()` therefore follow `config('app.locale')` unless something else sets it. Checkout customer-name messages are inside the locale group. `CheckoutCustomerInformationTest` includes an Arabic message test; it was not run.

## 13. Database notes for future migrations

Migration order is the filename order. Notable dependencies:

1. `0001_01_01_000000_create_users_table.php` — users, sessions, password resets. No `deleted_at` yet.
2. `0001_01_01_000001_create_cache_table.php`, `0001_01_01_000002_create_jobs_table.php`
3. `2026_09_06_121656_create_personal_access_tokens_table.php`
4. `2026_09_06_122026_create_catalog_tables.php` — categories, translations with `slug`, products **without** `slug` or `price_after_discount`, product translations **with** `slug`
5. `2026_09_06_123801_create_order_management_tables.php` — orders, items, payments. `user_id` and `product_id` cascade on delete.
6. `2026_09_06_124346_create_logs_tables.php` — `audit_logs`
7. `2026_09_07_132225_create_media_table.php`
8. `2026_09_27_083620_update_tables.php` — `settings`, `products.price_after_discount`. Uses `->after('price')` (MySQL positioning).
9. `2026_09_27_083718_create_coupons_table.php` — coupons plus `orders.coupon_id` / `discount_amount`. Uses `->after()`.
10. `2026_09_29_132040_create_bundles_table.php` — `bundle_price` is `decimal()` with no precision (MySQL default 8,2). Translation `slug` is created here and dropped later.
11. `2026_10_01_083836_update_slug_products_bundles.php` — copies English translation slugs onto `products.slug` and `bundles.slug`, then drops translation slugs. `backend/README.md` says this migration is incompatible with SQLite. It was not executed here. `phpunit.xml` still defaults to sqlite memory.
12. `2026_10_06_150744_add_customer_information_to_orders_table.php` — nullable recipient columns
13. `2026_10_06_161956_add_soft_deletes_to_users_table.php`
14. `2026_10_06_175330_add_bosta_shipping_to_orders_table.php`
15. `2026_10_06_183132_add_bosta_pickup_location_to_orders_table.php`

`orders.status` and payment enums are MySQL `enum` columns. SQLite will not enforce those the same way. JSON `bosta_address` is a MySQL JSON column; the model casts it to array.

No migration was run. Do not run `migrate` or `db:seed` against a database you care about. `AdminSeeder` inserts an administrator with a hardcoded email and password. The password string is intentionally not copied into this audit. Replace it before any shared database is seeded.

Fresh-install risk: the slug migration reads `bundle_translations.slug` and `product_translations.slug` and then drops them. On an empty database the copy loop is a no-op and the drop still has to succeed. SQLite `dropColumn` of a unique column, plus `->after()`, is the documented failure mode.

## 14. Tests that exist (not run)

Backend feature tests worth naming before an edit:

| File | What it claims to cover |
| --- | --- |
| `tests/Feature/Users/UserManagementTest.php` | List hiding admins, create, password rotation, soft delete, restore, force delete, reserved email |
| `tests/Feature/Users/UserPolicyTest.php` | Policy matrix |
| `tests/Feature/Orders/CheckoutCustomerInformationTest.php` | Recipient fields, stock unchanged on 422, auth 401 |
| `tests/Feature/Orders/OrderCustomerInformationTest.php` | Owner scoping, admin view escaping |
| `tests/Feature/Orders/PhoneNumberTest.php` | Phone rule cases |
| `tests/Feature/Products/ProductAvailabilityTest.php` | Slug 404 / 200 / 500 |
| `tests/Feature/Shipping/BostaIntegrationTest.php` | Accept, queue, fake HTTP, policy denials |
| `tests/Feature/ExampleTest.php` | `GET /` expects 200. `routes/web.php` redirects `/` to `/admin` (302). This assertion does not match the route. |

Blade: `new_frontend/tests/Feature/StorefrontPagesTest.php`, `tests/js/*.test.mjs`, `tests/browser/*.spec.js`. They are written to avoid real orders (`new_frontend/README.md`). Not run.

Next.js: no test script in `frontend/package.json`.

## 15. Modification guide

"Migration needed" means a new column or table. "UI only" means the data already exists and only Filament or storefront presentation changes.

| Requested change | Primary files | Related files | Affected routes | Data / relationships | Permissions to preserve | Tests to run | Regression risks |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Change the Users table layout | `backend/app/Filament/Resources/Users/Tables/UsersTable.php` `configure()` columns (lines 16–22) | `UserResource.php` query (`orders_count`, hides admins); `UserActions.php` if actions move | Filament `/admin/users` only | None if columns already exist. `orders_count` comes from `withCount('orders')`. | Keep `getEloquentQuery()` admin exclusion and `TrashedFilter`. Do not add `is_admin` as an editable column. | `tests/Feature/Users/UserManagementTest.php` | Filament column names must match attributes. Searchable email is what the list-search test uses. No shared CSS; this does not restyle products. |
| Change a Maids table | No file | — | — | — | — | — | The module is absent. Do not invent it inside `UsersTable`. |
| Add a field to Add User | `UserForm.php`; `SaveUserRequest::rulesFor()`; `ManageUsers::create` and `update` (`Arr::only` lists) | `User` `$fillable` and casts; a new migration on `users` if it must be stored | `/admin/users/create` and `.../edit`. API profile stays unchanged unless `UpdateProfileRequest` is also edited. | New column if persisted. Create currently copies only `name`, `email`, `password` plus forced `is_admin=false`. | Never accept `is_admin` from either form. Password must stay optional on edit and must keep token revocation on the admin path. | `UserManagementTest`, `UserPolicyTest` | API `updateProfile` uses a different whitelist. A form field that is not added to `ManageUsers` is silently dropped. |
| Modify order creation | `CheckoutRequest::rules()`; `OrderService::checkout()` | `Order` fillable; `OrderResource`; `OrderItem`; Blade `public/assets/js/features/cart.js` `bindCheckout`; Next `frontend/src/lib/api.ts` `checkoutOrder` and `cart_components.tsx` | `POST /api/v1/orders/checkout` | `orders`, `order_items`, `payment_transactions`, `products.stock`, `coupons.used_count` | Customer must stay authenticated. Do not trust a client total. Keep the transaction. Do not let profile or checkout set prices by mass assignment. | `CheckoutCustomerInformationTest`, `PhoneNumberTest`. Add a test for the total and for inactive products; neither exists. | Both storefronts. Next currently omits recipient fields, so it already fails validation. Blade sends them. Changing the JSON envelope (`OrderController` lines 45–47) changes what Next treats as `message`. |
| Modify order editing | `OrderForm.php`; `OrderPolicy::update` | `OrdersTable.php`, `OrderInfolist.php`, `EditOrder.php` | `/admin/orders/{record}/edit` | `orders.status`, `payment_transactions.status` | Keep the "no edit after Bosta submission status is set" rule unless the new rule is explicit. Customers have no edit route. | `BostaIntegrationTest` cases that assert update/delete denial after submission (`test_customer_cannot_access` neighbors around the Gate assertions) | Editing payment status changes "Paid revenue" with no audit row today. |
| Change booking availability | No booking module | Closest: `products.stock`, `products.is_active`, `ProductService`, `OrderService` stock check | Product API and checkout | `products` | Decide whether `is_active` must block checkout. Today it does not. That decision is a requirement, not an assumption. | `ProductAvailabilityTest` plus a new checkout test | Storefronts display `stock` / `inStock` from `ProductResource`. |
| Add or change a dashboard KPI | `CommerceOverview.php` `getStats()` or `OrderStatusStats.php` | The model query it sums. `PaymentStatus`, `OrderStatus`. | `/admin` | Read-only unless the definition needs a new column | Admins only, because the panel is admin-only. `canView(): true` does not add a second check. | None exist for widgets. Add one if the number is financial. | Polling (15s / 60s) will repeat a heavy query. Do not label a completed-payment sum as profit. |
| Change Partner or Supporter permissions | No such roles | Closest: `User::canAccessPanel`, `UserPolicy`, `OrderPolicy` | `/admin/*` and the policies' abilities | `users.is_admin` only | A new role needs a column or table, a migration, and checks on every write, not only the sidebar. | `UserPolicyTest`, `UserManagementTest`, Bosta authorization tests | Filament resources without policies (catalog, coupons, settings) are open to every admin. |
| Change Inbox or partner chat | No file | — | — | — | — | — | Absent. |
| Modify Full Con / package fields | No Full Con model | Closest catalog: `ProductForm.php`, `BundleForm.php` | `/admin/products`, `/admin/bundles`, public product and bundle APIs | `products`, `bundles`, `bundle_items` | Bundle checkout still cannot receive a bundle id unless the API is extended on purpose. | None for bundle CRUD | `Bundle::booted` rewrites slugs. Public URLs change when the English title changes. |
| Update ad presentation or tracking | No file | — | — | — | — | — | Absent. Do not store ads in `settings` without a spec. |
| Change shipping cost behavior | `OrderService.php` line 31; `ManageSettings.php` shop section | `Setting` model; both carts that display shipping from `/settings` | Checkout and `GET /settings` | `settings` row `shipping_cost` | Keep cache forget in `Setting::set`. | Checkout tests that fix a shipping figure. `CheckoutCustomerInformationTest` uses `total_amount` 210 in at least one case; read it before changing the formula. | `free_shipping_min` is unused. Turning it on is a behavior change, not a bugfix, until the rule is specified. |
| Change Bosta accept fields | `AcceptOrderRequest`, `AcceptOrder::handle`, `AcceptOrderAction` | `BostaService`, `SendOrderToBosta`, `OrderPolicy` | Admin accept/retry actions only. Storefront checkout does not call Bosta. | Order Bosta columns and payment status | Keep the lock, the claim update, and `tries = 1`. Do not retry uncertain submissions by re-queueing blindly. | `tests/Feature/Shipping/BostaIntegrationTest.php` with HTTP faked | Live `BOSTA_API_KEY` would create shipments. Tests must keep faking HTTP. |
| Change storefront colors or header | Blade: `storefront.css`, `partials/header.blade.php`. Next: `globals.css`, `layouts/header.tsx`. Admin: `AdminPanelProvider` colors. | Dictionaries / i18n if labels change | The matching app's pages only | None | — | Blade: `npm test` and `npm run test:browser` in `new_frontend` after install. Next has no test script. | The three UIs do not share a stylesheet. |
| Change users/products table density | Filament column methods on `UsersTable` or `ProductsTable` | None | That resource's index | None | Same as the users-table row | Corresponding feature test if it asserts visible text | Filament's dropdown clipping is inside vendor CSS. There is no app selector to patch. A theme would be new code. |

### API consumers that move together

Any checkout or catalog contract change hits:

1. `new_frontend/public/assets/js/core/api.js` and the feature file for that page
2. `frontend/src/lib/api.ts` and the React component
3. `backend/openapi.yaml` if that file is meant to stay accurate (it was not verified line by line)

Blade and Next do not share components. Fixing one leaves the other stale.

### Shared components

- `ApiResponse::successResponse` argument order affects every endpoint if the signature is "fixed" in place. Today only checkout calls it backwards. Change the call, not the trait, unless every caller is updated.
- `Setting::get` is cached forever. Writers must use `Setting::set`.
- `generateSlug` is used by bundles and category translations. Products use `Str::slug` on create. They are not the same function.
- Product price fields are read by checkout, `ProductResource`, bundle `original_total`, and both carts.

### Tests that do not protect an edit

- Client-supplied `total_amount`
- `is_active` on list, show, or checkout
- Per-user coupon at checkout
- Best-selling sort direction
- Category 404
- Dashboard sums
- Payment-screenshot visibility
- CORS
- Next.js checkout body
- Widget `PaymentMethod::getLabel` for InstaPay
