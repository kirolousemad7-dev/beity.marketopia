# Beity Blade storefront

Standalone Laravel storefront converted from `../frontend`. It preserves the
original design tokens, CSS layouts, logo, background, locally hosted fonts,
and English/Arabic dictionaries. The existing Next.js frontend and Laravel
backend remain separate and unchanged by this conversion.

## How it works

Laravel serves Blade page shells and public configuration only. All catalog,
settings, profile, registration, login, coupon, checkout, and order requests
run in the browser using jQuery AJAX. No API credentials or customer data are
fetched by PHP. There is no frontend database and no Next.js/React runtime.
New product and bundle URLs work immediately without regenerating pages.

The storefront still needs PHP/Laravel hosting; Blade files cannot be served
as a plain static `out/` directory. Node.js and npm are used locally for asset
preparation and testing only. The uploaded application does not need them.

## Local setup

Requires PHP 8.3+, Composer, Node.js 22+ and npm. Run from `new_frontend`:

```sh
composer install
npm ci
cp .env.example .env
php artisan key:generate
npm run build
php artisan serve --host=127.0.0.1 --port=8001
```

Open `http://127.0.0.1:8001/ar` or `/en`. Set `STOREFRONT_API_URL` in `.env`
to the existing backend's public API base, including `/api/v1`. A local backend
can run separately on port 8000. No migrations, seeders, or queue worker are
required for this frontend.

## Configuration

| Variable | Purpose |
| --- | --- |
| `APP_ENV` | `local`, `staging`, or `production` |
| `APP_KEY` | Unique Laravel encryption key; keep private |
| `APP_DEBUG` | Enable only for local development |
| `APP_URL` | Public frontend URL, including a subdirectory if applicable |
| `STOREFRONT_API_URL` | Public browser-accessible Laravel API base URL |
| `STOREFRONT_DEFAULT_LOCALE` | Root redirect locale: `ar` or `en` |
| `SESSION_DRIVER` | `file` by default; no database required |
| `SESSION_COOKIE` | Unique cookie name so this app and backend do not collide |
| `CACHE_STORE` | `file` by default |

Separate example environment files are provided for local, staging, and
production. The API URL is public configuration. Never put API secrets in it.

Because API requests originate in the browser, the existing backend must
allow the frontend origin through CORS, including the `Authorization`,
`Accept-Language`, and `Content-Type` headers and GET/POST requests. Use HTTPS
for both production applications to avoid mixed-content restrictions. The
frontend does not proxy API requests through PHP.

## Pages and structure

All pages are available under `/ar` and `/en`: home, `/products`,
`/products/{slug}`, `/bundles`, `/bundles/{slug}`, `/cart`, `/login`,
`/register`, `/account`, and `/orders`.

```text
app/Actions/Storefront/           Local view composition; no HTTP calls
app/Http/Controllers/Storefront/ Thin page controller
config/storefront.php            API URL and locale configuration
resources/views/layouts/         Shared Blade layout
resources/views/partials/        Header, footer, forms, loading state
resources/views/pages/           Page shells
resources/views/errors/          Laravel 404 and 500 pages
resources/dictionaries/          Frontend JSON translations
public/assets/css/               Original CSS and scoped bundle styles
public/assets/js/core/           API, storage, cart, configuration, UI helpers
public/assets/js/components/     Product and bundle renderers
public/assets/js/features/       Browser behavior by page/domain
public/assets/vendor/            Locally hosted jQuery
public/assets/fonts/             Locally hosted original fonts
public/assets/images/            Original branding and hero image
scripts/                         Local build and syntax checks
tests/Feature/                  Laravel page tests
tests/js/                       API, cart, and rendering unit tests
tests/browser/                  Playwright integration/layout tests
```

CSS Modules from Next.js are converted to prefixed classes to preserve their
styles without collisions. The original plain CSS is retained. Page-specific
JavaScript is loaded through ES modules only when its page is visited.
UI translations stay in JSON; dynamic content translations come from the API.

## API and browser state

The central `core/api.js` client adds locale and bearer headers, uses a
12-second timeout, retries transient GET failures once, and never retries
checkout or other mutations. It preserves validation errors and clears expired
sessions on 401. List failures show explicit error states with retry controls.
Settings are requested once per page and shared by the footer and checkout.

Authentication follows the existing API contract: `auth_token` and `auth_user`
are stored in browser localStorage. Logout calls `/auth/logout` before clearing
the session. Registration displays validation errors and directs the user to
sign in. User profile data is verified through `/auth/profile` on the account
page. No Laravel frontend user model or duplicated authentication is used.

Cart data uses the original `beity_cart_items` storage key. Stored data is
validated on read; product and bundle lines have separate keys, share stock
limits, and update badges across tabs. A bundle is added atomically. Prices
and stock are refreshed when fetching catalog data; the backend remains the
source of truth during checkout. Uploaded payment proof is sent as multipart
FormData. Order history supports the backend pagination metadata.

Opening the cart checks each distinct saved product slug through the product
detail API, with up to four requests at once. Confirmed HTTP 404 responses
remove that product's standalone and bundle lines from browser storage and
update totals and cart badges. Other request failures preserve the items and
show a retry message. The cart displays its empty state if no products remain.

Product names and text are escaped. Rich descriptions allow only basic
formatting, with scripts, event attributes and embedded content removed.
Image URLs accept HTTP/HTTPS only.

### Existing backend contract limitations

Checkout sends `customer_name` (required, up to 100 characters),
`customer_phone` (required), and `additional_phone` (optional, omitted when
blank) with the multipart `POST /api/v1/orders/checkout` request. Phone numbers
accept 7–15 digits, an optional leading `+`, spaces, parentheses, and hyphens;
input fields allow up to 30 characters including formatting. Names and phone
numbers are trimmed before submission. These details stay in the form rather
than browser storage. The backend validates and stores these fields after its
customer-information migration is applied; order responses include them.

Other existing backend contract limitations:

- Checkout currently expects product IDs, quantities, payment method, shipping
  address, optional coupon/payment proof, and `total_amount`. The reviewed
  backend trusts that submitted total. Authoritative server-side pricing needs
  a separate backend fix before production use.
- Bundle responses currently omit pivot quantities; the browser uses them when
  provided and otherwise falls back to one of each product. Bundle identity is
  not accepted by the existing checkout endpoint.
- The current backend's `is_paid` resource field and checkout response envelope
  have the issues identified in the earlier review. The storefront tolerates
  the checkout message shape, but cannot correct backend payment status.
- Inactive products and invalid slugs should be corrected in the backend. This
  frontend excludes list entries without a usable slug.

## Verification

```sh
composer format:check
composer test
npm run format:check
npm run check
npm run lint
npm test
npm run build
php artisan view:cache
npx playwright install chromium
npm run test:browser
```

PHP tests render all page shells without making HTTP requests. Browser tests
mock every API call, so tests never create real customers or orders. They cover
catalog interactions, authentication, validation, checkout, order pagination,
and LTR/RTL layouts at 375, 768, 1280, and 1920px. API shapes are documented
with JSDoc in `core/types.js`. CI runs these checks for
changes to this folder.

On systems that cannot install Playwright's bundled Chromium, use an installed
Chrome executable for local browser checks:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH='/path/to/chrome' npm run test:browser
```

## Deployment without Node.js on the server

1. Prepare a separate release copy locally and set its production `.env` from
   `.env.production.example`. Set `APP_URL`, `STOREFRONT_API_URL`, `APP_DEBUG=false`,
   and a unique `APP_KEY`.
2. In that release copy, run `composer install --no-dev --optimize-autoloader`,
   `npm ci`, and `npm run build` locally. The generated jQuery file is also
   included in `public/assets/vendor` for convenience.
3. Upload the application **including `vendor/`**. Exclude `node_modules`, tests,
   reports, and development cache files. Do not upload development `.env`.
4. Set the server document root to `new_frontend/public`. The project root and
   `.env` must not be publicly accessible. Enable Laravel's normal Apache/Nginx
   routing and make `storage/` and `bootstrap/cache/` writable by PHP.
5. If PHP CLI is available, run `php artisan optimize` on the server. Otherwise
   leave generated config/route/view caches out of the uploaded release;
   Laravel can run without CLI optimization. Do not upload cached configuration
   or compiled views containing local machine paths.

Catalog/admin changes appear through fresh browser API requests. Re-upload
only when changing frontend templates, styles, scripts, or configuration.
