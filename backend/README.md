<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## Order customer information

`GET /api/v1/products/{slug}` returns HTTP 404 for missing products and HTTP 500
for unexpected failures. The storefront checks this endpoint on cart entry to
remove deleted products while keeping saved items during temporary failures.

`POST /api/v1/orders/checkout` requires `customer_name` (up to 100 characters)
and `customer_phone`. `additional_phone` is optional and stored as `null` when
omitted or blank. Phone numbers must be strings to preserve leading zeroes,
contain 7–15 digits, and have no more than 30 characters including formatting.
An optional leading `+`, spaces, parentheses, and hyphens are accepted.
The request trims values before validation. Customer details belong to the
order recipient and do not overwrite the signed-in account's profile.

Both checkout and `GET /api/v1/orders` return these fields through the order
resource. The order list is scoped to the authenticated user. Administrators
can view recipient contact details in Filament; historical orders show empty
values. The API contract is documented in [openapi.yaml](openapi.yaml).

Deploy the backend migration before the updated storefront:

```sh
php artisan migrate --force
```

The new columns are nullable so existing orders remain valid; new checkout
requests require customer name and primary phone. Rolling back the migration
deletes these customer fields, so use a forward migration to preserve captured
details in production. All checkout clients must send the two required fields.

Run tests against a dedicated MySQL test database. The existing slug migration
is incompatible with SQLite; CI uses MySQL 8. Never use a development database
for tests, because Laravel refreshes it:

```sh
DB_CONNECTION=mysql DB_DATABASE=bety_testing DB_HOST=127.0.0.1 \
DB_USERNAME=bety_test DB_PASSWORD="$BETY_TEST_DB_PASSWORD" DB_SOCKET='' DB_URL='' \
php artisan test --compact
```

Provide the test user's credentials through environment variables. No seed
data or external services are required. Laravel Boost is installed as a
development dependency as required by this backend's agent setup instructions.

## User management

Administrators manage customer accounts at `/admin/users`: search, create,
edit, delete, restore, and permanently delete. Administrator accounts are
excluded from the list and protected by policies, including direct actions.
Deleting a customer uses soft deletion, revokes API tokens, and preserves
their order history. Use the deleted-users filter to restore accounts.
Permanent deletion requires confirmation and is available only for deleted
accounts without orders, preventing the database from deleting order history.

Passwords are required when creating an account; leaving the password blank
when editing keeps it unchanged. Changing a password revokes API tokens.
Email addresses remain reserved while accounts are deleted. Changes are
recorded in `audit_logs` with the administrator, affected user, action, IP,
and timestamp; password values are never recorded.

Deploy the soft-delete migration with `php artisan migrate --force` before
using this feature. Its tests are in `tests/Feature/Users` and use the isolated
MySQL configuration described above. No new public API endpoints are added.

## Bosta shipping

The Filament **Accept Order** dialog requires the administrator to select a Bosta pickup location, city,
deliverable district, recipient details, and street address. Pickup locations
are loaded from the authenticated business account and cached for five minutes.
The chosen pickup ID and name are saved per order and retained in retry dialogs. The application
validates the district against its city and caches Bosta locations for 12 hours.
Approval records an audit entry and moves the order to processing. Creating the
shipment runs in `SendOrderToBosta` through `BostaService`, using Laravel's HTTP
client without an SDK or new packages. The storefront remains unchanged.

Set these environment variables on the server (keep the API key secret):

```dotenv
BOSTA_API_KEY=your-read-write-api-key
BOSTA_BASE_URL=https://app.bosta.co/api/v2
BOSTA_BUSINESS_LOCATION_ID=
BOSTA_QUEUE_CONNECTION=database
BOSTA_QUEUE=shipping
```

Create your pickup locations in Bosta before accepting orders. New acceptances
and retries require an explicit location selection; `BOSTA_BUSINESS_LOCATION_ID`
is only a fallback for older jobs queued before this update. The order's selected
location always takes precedence over that environment variable. For staging, use the base URL and key issued by
Bosta for that environment. This feature requires a database queue using the
same database as orders so acceptance and enqueueing commit together. The job
uses the dedicated queue even when the application's default is `sync`.

Deploy and start a persistent worker with Supervisor or your hosting panel:

```sh
php artisan migrate --force
php artisan optimize:clear
php artisan queue:work database --queue=shipping --timeout=45 --tries=1
```

For shared hosting without a persistent worker, run the following every minute
with a cron lock to prevent overlapping runs (use your server's PHP 8.3 path):

```sh
php artisan queue:work database --queue=shipping --stop-when-empty --max-time=50 --timeout=45 --tries=1
```

Restart persistent workers after uploads with `php artisan queue:restart`.
Keep queue `retry_after` above 45 seconds (the default is 90). Acceptance does
not wait for shipment creation, but loading uncached cities/districts requires
short metadata requests. Cash-on-delivery sends the order total as COD and
keeps payment pending; approved Wallet/InstaPay sends COD zero. Packages use
`Parcel`, size `MEDIUM`, and item count from order quantities.

The table and order details show submission state, tracking number, and safe
failure information. A confirmed API rejection can be resubmitted with **Retry
Bosta submission**, including corrected address/contact details. Timeout, HTTP
5xx/408/409, incomplete confirmation, or an interrupted worker is marked for
review: check the order reference in Bosta before creating another shipment.
The job does not blindly retry a creation request. Atomic state claims prevent
repeat jobs from creating another shipment, and `uniqueBusinessReference` uses
the stable order number. Do not use `queue:retry` as a shipment resubmission;
use the authorized Filament action for confirmed rejections. A successful
submission leaves the order processing: delivery webhooks, pickup scheduling,
shipment cancellation, and automatically marking delivered are outside this
integration. Orders with shipment activity cannot be edited/deleted locally.

Official contract: [Bosta OpenAPI](https://docs.bosta.co/api/api.yaml),
[address format](https://docs.bosta.co/docs/how-to/format-bosta-address/), and
[API keys](https://docs.bosta.co/docs/how-to/get-your-api-key/).
Tests in `tests/Feature/Shipping` fake every HTTP request and use an isolated
MySQL database; they never create live shipments. Rolling back the migration
removes shipment references, so prefer a forward fix in production.

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

In addition, [Laracasts](https://laracasts.com) contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

You can also watch bite-sized lessons with real-world projects on [Laravel Learn](https://laravel.com/learn), where you will be guided through building a Laravel application from scratch while learning PHP fundamentals.

## Agentic Development

Laravel's predictable structure and conventions make it ideal for AI coding agents like Claude Code, Cursor, and GitHub Copilot. Install [Laravel Boost](https://laravel.com/docs/ai) to supercharge your AI workflow:

```bash
composer require laravel/boost --dev

php artisan boost:install
```

Boost provides your agent 15+ tools and skills that help agents build Laravel applications while following best practices.

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
