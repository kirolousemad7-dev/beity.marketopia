<?php

return [
    'api_url' => rtrim((string) env('STOREFRONT_API_URL', 'http://localhost:8000/api/v1'), '/'),
    'default_locale' => env('STOREFRONT_DEFAULT_LOCALE', 'ar'),
    'locales' => ['ar', 'en'],
];
