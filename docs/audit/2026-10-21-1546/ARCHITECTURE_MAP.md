# Architecture map

Audit date: 2026-10-21. Source of truth: the opened workspace. No application files were modified.

## 1. What this workspace actually is

The opened folder `C:\Users\kiro7\Downloads\beity-main` contains one nested copy of the application at `beity-main\`. That nested directory is the project root. It is **Beity** (`marketopia/beity-storefront` in `new_frontend/composer.json`), a bilingual home-goods storefront plus a Filament admin.

It is **not** TARWIQA. A workspace search for `TARWIQA`, `tarwiqa`, `maid`, and `Super Admin` returned no matches. There is no Super Admin / Supporter / Partner split, no workforce records, no scheduled-booking module, no inbox, no referrals, and no ads module. Those names in the audit request are prior context, not the current implementation.

Three applications sit side by side:

| App | Path | Role |
| --- | --- | --- |
| Backend | `backend/` | Laravel 13 API (`/api/v1`) and Filament admin (`/admin`) |
| Blade storefront | `new_frontend/` | Laravel 13 page shells. The browser calls the backend API with jQuery. No storefront database. |
| Next.js storefront | `frontend/` | Static-export Next.js 16 app. Separate, older client of the same API. No GitHub workflow covers it. |

`new_frontend/README.md` says the Next.js app and the Laravel backend stay separate. Both clients are still in the tree.

## 2. Baseline that was inspected

### Runtime and locks

| Item | Evidence |
| --- | --- |
| PHP on this machine | 8.4.24 CLI. `backend/composer.json` and `new_frontend/composer.json` require `php: ^8.3`. CI (`.github/workflows/backend.yml`, `new-frontend.yml`) installs PHP 8.3. |
| Composer | 2.8.11 |
| Node | v22.15.0. CI uses Node 24. `new_frontend/README.md` asks for Node 22+. |
| Laravel | `v13.34.0` in both `composer.lock` files |
| Filament | `v4.14.0` (`backend/composer.lock`) |
| Sanctum | `v4.3.3` |
| Spatie Media Library | `11.23.8` |
| Astrotomic Translatable | `v11.17.1` |
| Next.js | `16.3.4`, React `19.2.8` (`frontend/package.json`) |
| Storefront JS | jQuery `3.7.1`, Playwright tests (`new_frontend/package.json`) |

### Not installed in this copy

Missing, and left missing:

- `backend/vendor`, `backend/node_modules`, `backend/.env`
- `frontend/node_modules`, `frontend/.env`, `frontend/.env.local`
- `new_frontend/vendor`, `new_frontend/node_modules`, `new_frontend/.env`

There is no working database file in `backend/database/` and no `.env` to point at one. Runtime schema was not read. Schema statements below come from migrations and models.

### Git

- Workspace root: no `.git`
- Nested project root: no `.git`
- `backend/.gitignore` and `backend/.gitattributes` exist, and `.github/workflows/` exists, so this tree was prepared to live in Git. This copy has no repository, no branch, no remotes, and no commit history.
- Historical changed-file attribution **cannot** be established.
- `git status`, `git diff`, and `git log` were not meaningful to run.

Every file under the nested project was timestamped `2026-10-21 03:30 PM`, which matches a copied or extracted tree rather than an active checkout.

### Documentation inspected

- `backend/README.md` (checkout customer fields, user soft delete, Bosta shipping, test database warning)
- `new_frontend/README.md` (Blade storefront contract and known backend limitations)
- `frontend/README.md` (static export)
- `backend/AGENTS.md` and `frontend/AGENTS.md` exist; behavior below is taken from code, not from those agent notes
- `backend/openapi.yaml` exists and was not treated as proof of runtime behavior
- No `docs/qa/` directory and no earlier audit documents
- `new_frontend/Archive.zip` (about 3 MB) was not extracted

### Tooling that exists but was not executed

`php artisan`, PHPUnit, Pint, npm, Vite, and Playwright cannot run until dependencies are installed. Installing them was out of scope. See `AUDIT_FINDINGS.md` for why the suite was not started.

## 3. How a request travels

### Admin (Filament)

```text
GET /  → redirect /admin                         routes/web.php
GET /admin/...
  → Filament panel middleware                    AdminPanelProvider::panel()
      EncryptCookies, StartSession, SetFilamentLocale,
      AuthenticateSession, VerifyCsrfToken, SubstituteBindings
  → Filament Authenticate
  → User::canAccessPanel()  (is_admin && not the guest path)
  → Resource page (List/Create/Edit/View) or ManageSettings
  → Filament form/table, sometimes a Form Request reused as a rules source
  → ManageUsers / AcceptOrder, or direct Eloquent on catalog models
  → MySQL or SQLite via DB_CONNECTION
  → Filament Blade (vendor views) + one custom view for settings
```

There is no application sidebar component. Navigation is Filament's sidebar, grouped in each resource's `getNavigationGroup()`.

Panel registration: `backend/app/Providers/Filament/AdminPanelProvider.php` (`path('admin')`, `login()`, primary color Amber). Providers: `backend/bootstrap/providers.php`.

Locale switch: `GET /admin/locale/{locale}` (`routes/web.php`, name `admin.locale`) writes `session('filament_locale')` and `redirect()->back()`. Middleware `SetFilamentLocale` reads that session. Supported locales are `en` and `ar`.

### Customer API

```text
/api/v1/...                          routes/api.php
  → Laravel api middleware group (stateless, no CSRF)
  → guest redirect overridden for api/* to JSON 401     bootstrap/app.php
  → optional auth:sanctum (Bearer token)
  → api.locale (SetApiLocale) on catalog, coupons, orders
  → Controller
  → Form Request when present
  → Interface bound to a service in AppServiceProvider, or the controller itself
  → Eloquent model
  → ApiResponse JSON { success, message, data|errors, meta? }
```

Bindings in `AppServiceProvider::register()`:

- `AuthInterface` → `AuthService`
- `ProductInterface` → `ProductService`
- `CategoryInterface` → `CategoryService`
- `OrderInterface` → `OrderService`

Bundles, coupons, and settings do not use those interfaces. Their controllers query models directly.

### Blade storefront

```text
GET /{locale}/...                    new_frontend/routes/web.php
  → PageController
  → RenderPage (local view data only; no HTTP and no database)
  → Blade layout + page shell
  → ES module under public/assets/js/features/
  → jQuery request() in public/assets/js/core/api.js
  → backend /api/v1
```

Auth token key used by the Blade app is described in its README as `auth_token` / `auth_user` in `localStorage`. Cart key: `beity_cart_items`. PHP does not hold the customer session for the API.

### Next.js storefront

```text
frontend/src/app/[lang]/...  (output: 'export' in next.config.ts)
  → React server/client components
  → frontend/src/lib/api.ts
  → same backend /api/v1
```

Product detail routes are generated at build time from the products API (`frontend/README.md`). This client does not send `customer_name` or `customer_phone`. The current checkout request requires both. See findings.

## 4. Route files

| File | Contents |
| --- | --- |
| `backend/routes/api.php` | All customer API routes under `v1` |
| `backend/routes/web.php` | `/` redirect, admin locale switch |
| `backend/routes/console.php` | Demo `inspire` command only. No schedule. |
| `backend/bootstrap/app.php` | `health: '/up'`, API JSON exceptions, `api.locale` alias |
| `new_frontend/routes/web.php` | Locale-prefixed storefront pages |
| Filament | Routes are registered by the panel, not hand-written. Slugs below are the conventional Filament paths from `->path('admin')` and each `getPages()`. `route:list` was not run. |

### API routes (`backend/routes/api.php`)

| Method | Path | Auth | Controller |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/login` | public | `AuthController@login` |
| POST | `/api/v1/auth/register` | public | `AuthController@register` |
| GET | `/api/v1/auth/profile` | sanctum | `AuthController@profile` |
| PUT | `/api/v1/auth/profile` | sanctum | `AuthController@updateProfile` |
| POST | `/api/v1/auth/logout` | sanctum | `AuthController@logout` |
| DELETE | `/api/v1/auth/delete-account` | sanctum | `AuthController@deleteAccount` |
| GET | `/api/v1/settings` | public | `SettingController@index` |
| GET | `/api/v1/products` | public + locale | `ProductController@index` |
| GET | `/api/v1/products/best-selling` | public + locale | `ProductController@bestSelling` |
| GET | `/api/v1/products/{slug}` | public + locale | `ProductController@show` |
| GET | `/api/v1/categories` | public + locale | `CategoryController@index` |
| GET | `/api/v1/categories/{id}` | public + locale | `CategoryController@show` |
| GET | `/api/v1/bundles` | public + locale | `BundleController@index` |
| GET | `/api/v1/bundles/{slug}` | public + locale | `BundleController@show` |
| POST | `/api/v1/coupons/apply` | sanctum + locale | `CouponController@apply` |
| GET | `/api/v1/orders` | sanctum + locale | `OrderController@index` |
| POST | `/api/v1/orders/checkout` | sanctum + locale | `OrderController@checkout` |

### Admin pages (Filament conventions, not executed)

| URL | Source |
| --- | --- |
| `/admin/login` | `AdminPanelProvider` `->login()` |
| `/admin` | Filament `Dashboard` |
| `/admin/users`, `/create`, `/{record}/edit` | `UserResource::getPages()` |
| `/admin/orders`, `/{record}`, `/{record}/edit` | `OrderResource::getPages()` |
| `/admin/products` | `ProductResource` list only. Create/edit are header/record modals (`ListProducts`, `ProductsTable`). |
| `/admin/categories` | `CategoryResource` list only, same modal pattern |
| `/admin/bundles`, `/{record}/edit` | `BundleResource`. Create is a list-page action (`ListBundles`). |
| `/admin/coupons`, `/create`, `/{record}`, `/{record}/edit` | `CouponResource` |
| `/admin/manage-settings` | `ManageSettings` has no custom `$slug`. Filament's default slug is the kebab-case class name. Not confirmed with `route:list`. |

### Blade storefront URLs

Prefix `ar` or `en`. Names: `storefront.{page}`.

`/`, `/products`, `/products/{slug}`, `/bundles`, `/bundles/{slug}`, `/cart`, `/login`, `/register`, `/account`, `/orders`.

Root `/` redirects to `STOREFRONT_DEFAULT_LOCALE` (`ar` in `.env.example`).

### Next.js URLs

`frontend/src/app/[lang]/`: home, `products`, `products/[slug]`, `cart`, `orders`, `account`, `(auth)/login`, `(auth)/register`, `bundles/[slug]`. There is no bundles index page in this client.

## 5. Authentication and authorization

### Mechanisms

- **Admin:** session guard `web` (`config/auth.php`), Filament login, `User::canAccessPanel()` returns `(bool) $this->is_admin` (`app/Models/User.php`).
- **Customer API:** Sanctum personal access tokens. Login and register create a token named `auth_token` (`AuthService`). Logout deletes all of the user's tokens.
- **Storefronts:** bearer token in browser storage. The Blade app does not use Laravel auth for customers. The Next app reads `localStorage` `auth_token` (`frontend/src/lib/api.ts`).
- **Email verification:** `MustVerifyEmail` is commented out on `User`. Verification is not enforced.
- **Roles:** one boolean, `users.is_admin`. There is no permission table, no Spatie Permission package, and no supporter/partner scope.

### Policies

| Policy | Model | Registered? |
| --- | --- | --- |
| `app/Policies/UserPolicy.php` | `App\Models\User` | Yes, by Laravel's conventional guess |
| `app/Policies/OrderPolicy.php` | `App\Models\Orders\Order` | Yes. Laravel `v13.34.0` `Gate::guessPolicyName` checks nested `Policies` paths first, then `App\Policies\OrderPolicy`, which exists. Confirmed against the framework source for the locked version. Not confirmed by booting the app. |

No policy exists for `Product`, `Category`, `Bundle`, `Coupon`, or `Setting`. Any user who can open the panel (an admin who is not soft-deleted) can create, edit, and delete those records. That matches a single admin flag. It is not per-record isolation.

`UserPolicy` allows customer management only when the actor is an admin, is not trashed, and the target is not an admin. Permanent delete requires the target to already be soft-deleted and to have zero orders.

`OrderPolicy` denies create. Update and delete require `bosta_submission_status === null`. Accept requires `status === pending` and no submission status. Retry requires `processing`, submission `failed`, and an empty `bosta_delivery_id`.

Customer orders on the API are scoped with `$user->orders()` in `OrderService::index()`. There is no order-show-by-id route.

### Account states that exist

| State | Exists? |
| --- | --- |
| `is_admin` true/false | Yes |
| Soft-deleted (`deleted_at`) | Yes, admin delete and `DELETE /api/v1/auth/delete-account` |
| Restored | Yes, admin only (`ManageUsers::restore`) |
| Permanently deleted | Yes, admin only, and only with no orders |
| `active` / `inactive` flag on users | No |
| `restricted` | No |
| Temporary or permanent ban | No |
| Ban expiry | No |

`products.is_active` and `bundles.is_active` are catalog flags, not account states. `coupons.is_active` is a coupon flag.

## 6. Where business logic lives

| Concern | Location |
| --- | --- |
| Registration, login, profile, self-delete | `app/Services/Api/V1/AuthService.php` |
| Admin user create/update/delete/restore/force delete and audit | `app/Services/Users/ManageUsers.php` |
| Checkout pricing, stock decrement, coupon, order + payment row | `app/Services/Api/V1/OrderService.php` |
| Coupon preview | `CouponController::apply` (not the order service) |
| Accept order, mark non-COD paid, queue Bosta | `app/Services/Orders/AcceptOrder.php` |
| Bosta HTTP | `app/Services/Shipping/BostaService.php` |
| Bosta job | `app/Jobs/Shipping/SendOrderToBosta.php` |
| Catalog reads | `ProductService`, `CategoryService`, `BundleController` |
| Settings read/write | `Setting` model; admin page `ManageSettings` |
| Dashboard numbers | `CommerceOverview`, `OrderStatusStats` |

There is no repository layer. Interfaces exist only for auth, products, categories, and orders.

### Model callbacks (not a listener directory)

- `Order::booted` creating: sets `order_number` to `DC-{ymd}-{8 random chars}`
- `Product::booted` creating: `Str::slug($product->name)` when slug is empty
- `Bundle::booted` saving: regenerates slug from the English title when the slug is empty or the model is dirty
- `CategoryTranslation::booted` saving: regenerates slug from the translated name

No `app/Observers`, no `app/Events`, no `app/Listeners`. `routes/console.php` does not schedule work.

### Queues

- Default in `.env.example`: `QUEUE_CONNECTION=database`
- Jobs table migration: `database/migrations/0001_01_01_000002_create_jobs_table.php`
- The only job is `SendOrderToBosta` (`tries = 1`, `timeout = 45`)
- It is dispatched on `BOSTA_QUEUE_CONNECTION` (default `database`) and `BOSTA_QUEUE` (default `shipping`), with `beforeCommit()`
- Nothing in the app starts a worker. `backend/README.md` documents Supervisor or a cron `queue:work`.
- PHPUnit sets `QUEUE_CONNECTION=sync`, but Bosta acceptance explicitly selects the configured connection. Tests cover that. They were not re-run here.

### Cache

- `Setting::get()` uses `Cache::rememberForever("setting_{$key}")`. `Setting::set()` forgets that key. Admin save goes through `Setting::set()`.
- `.env.example` uses `CACHE_STORE=database`. PHPUnit uses `array`. The Blade app uses `file`.
- `BostaService` caches pickup locations for 5 minutes and city/district metadata for 12 hours (`Cache::remember` at the lines found in that class).

### Storage and uploads

- Laravel default disk: `FILESYSTEM_DISK=local` in `.env.example`, rooted at `storage/app/private` (`config/filesystems.php`). The `local` disk has `'serve' => true`.
- Product, category, and bundle uploads in Filament forms call `->disk('public')->visibility('public')`.
- Payment screenshots use `PaymentTransaction::registerMediaCollections()` and do **not** set a disk. Spatie Media Library's own default applies. `config/media-library.php` is not published, and `MEDIA_DISK` is not in `.env.example`.
- No `storage:link` was created during this audit.

### External integrations

| Integration | What exists |
| --- | --- |
| Bosta | Real HTTP client in `BostaService`. Config keys: `BOSTA_API_KEY`, `BOSTA_BASE_URL`, `BOSTA_QUEUE_CONNECTION`, `BOSTA_QUEUE`. `BOSTA_BUSINESS_LOCATION_ID` is described in the README as a legacy fallback and is **not** read from `config/services.php` (that file has no such key). |
| Mail | `config/mail.php` and `.env.example` `MAIL_MAILER=log`. No Mailable classes and no `Mail::` calls in `app/`. |
| Postmark, Resend, SES, Slack | Keys only, in `config/services.php`. No application calls. |
| AWS S3 | Disk defined. Not selected by the forms that upload images. |
| WhatsApp | No |
| Push notifications | No |
| Payment gateway | No. `wallet` and `instapay` mean "customer uploads a screenshot". `cash_on_delivery` means collect on delivery. |

### CORS

`backend/config/` has no `cors.php`. `bootstrap/app.php` does not add a CORS middleware alias or allowed origins. The Blade README says the backend must allow the storefront origin, including `Authorization`, `Accept-Language`, and `Content-Type`. That configuration is not in this tree.

## 7. Database configuration

`config/database.php` default: `env('DB_CONNECTION', 'sqlite')`.

`.env.example` sets `DB_CONNECTION=sqlite` and comments out MySQL host, port, database, username, and password. No `.env` is present, so this copy has no configured working database.

`backend/README.md` says:

- Deploy and test with MySQL 8
- The slug migration is incompatible with SQLite
- Tests refresh the database, so they must not use a development database
- CI (`.github/workflows/backend.yml`) runs MySQL 8 service `bety_testing` with user `root`

`phpunit.xml` sets `DB_CONNECTION=sqlite` and `DB_DATABASE=:memory:` **without** `force="true"`. PHPUnit will not override variables already in the environment. CI exports MySQL variables, so CI does not use the sqlite values. A local shell that already has `DB_*` pointing at a real database would cause `LazilyRefreshDatabase` to migrate that database.

Feature tests that use `LazilyRefreshDatabase`: user policy, user management, Bosta, product availability, order customer information, checkout customer information. `tests/Feature/ExampleTest.php` and `tests/Unit/ExampleTest.php` do not refresh the database. `PhoneNumberTest.php` does not.

The Blade PHPUnit file forces `SESSION_DRIVER=array`, `CACHE_STORE=array`, and a fake `STOREFRONT_API_URL`. It does not configure a database. Those tests render views only (`new_frontend/README.md`).

## 8. Frontend architecture that actually renders

### Admin

Filament 4 vendor UI. Application styling hooks:

- Primary color Amber in `AdminPanelProvider` (line 47)
- One Blade view: `resources/views/filament/pages/manage-settings.blade.php`
- `resources/css/app.css` and `resources/js/app.js` are the Laravel/Vite stubs (`backend/vite.config.js`). They are not the admin table implementation.
- No `resources/css/filament` theme.

Tables, modals, filters, and row actions are PHP table/form classes under `app/Filament/`. There is no custom users-table stylesheet to retune.

### Blade storefront (the client the newer README describes)

- Layout: `new_frontend/resources/views/layouts/storefront.blade.php`
- Partials: `header.blade.php`, `footer.blade.php`, `auth-form.blade.php`, `icon.blade.php`, `loading.blade.php`, `social-icon.blade.php`
- Pages: `resources/views/pages/*.blade.php`
- Dictionaries: `resources/dictionaries/en.json`, `ar.json`
- CSS: `public/assets/css/storefront.css` (design system), `blade.css`, `fonts.css`, bundle CSS files, `cart.css`
- JS: `public/assets/js/core/` (`api.js`, `cart.js`, `pricing.js`, `storage.js`, `ui.js`, `config.js`, `types.js`), `components/`, `features/`
- `!important` count from a search: 4 matches in `storefront.css`, 2 in `blade.css`. Not a broad `!important` layer.
- Page JS is loaded per page (README). Event binding is jQuery inside each feature file (`cart.js` binds checkout and coupon on the cart page).

### Next.js storefront

- Tokens and most visual rules: `frontend/src/app/globals.css` (`--color-volt`, `--header-height`, `--container-max`, and the rest of that file)
- Layout pieces: `src/layouts/header.tsx`, `sidebar.tsx`, `footer.tsx`, `src/components/top-bar.tsx`
- Bundle CSS modules under `src/components/bundles/`
- Cart UI: `src/components/cart_components.tsx`
- No Tailwind utility sprawl was fully inventoried. Tailwind 4 is wired through `postcss.config.mjs`.

Shared visual changes do **not** automatically cross the three UIs. Admin, Blade, and Next each own their styles.

## 9. Impact map (actual relations)

```text
User
  ├─ orders (hasMany Order, order belongsTo user withTrashed)
  ├─ personal_access_tokens (Sanctum; not a custom model)
  ├─ sessions (framework table; user_id nullable, no FK in the users migration)
  └─ audit_logs.user_id stored as a string, no FK

Order
  ├─ order_items → Product (FK cascade delete both ways: deleting the order or the product removes lines)
  ├─ payment_transactions (hasOne transaction(); FK cascade from order)
  ├─ coupon (nullable FK, nullOnDelete)
  ├─ media via PaymentTransaction (payment_screenshot)
  └─ Bosta columns on the order row itself

Category
  └─ products (FK cascadeOnDelete) → product_translations, media, order_items, bundle_items

Product
  ├─ category
  ├─ order_items
  ├─ bundle_items
  └─ translations (name, description). Slug lives on products after the 2026-10-01 migration.

Bundle
  ├─ bundle_translations (title, description; slug column removed from translations)
  └─ bundle_items (product_id + quantity)

Coupon
  └─ orders

Setting
  └─ key/value rows. No FK. Read by checkout (shipping_cost) and by both storefronts.
```

Deleting a category cascades to its products. Deleting a product cascades to `order_items` and `bundle_items`. The Filament bulk-delete failure titles say the opposite (a product in an order, or a category with products, cannot be deleted). There is no policy or model event that blocks those deletes. See findings.

`orders.user_id` is also `cascadeOnDelete`. Soft delete does not fire that constraint. `UserPolicy::forceDelete` refuses users who still have orders, which is what keeps order history if the policy runs.
