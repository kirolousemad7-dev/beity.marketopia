<!DOCTYPE html>
<html lang="{{ $locale }}" dir="{{ $locale === 'ar' ? 'rtl' : 'ltr' }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="{{ $dict['footer']['tagline'] }}">
    <meta name="referrer" content="strict-origin-when-cross-origin">
    <title>@yield('title', 'Beity — بيتي')</title>
    <link rel="icon" href="{{ asset('assets/images/logo.png') }}">
    @foreach(['fonts', 'storefront', 'bundle_card', 'bundle_section', 'bundle_slider', 'bundle-detail', 'blade'] as $stylesheet)
        <link rel="stylesheet" href="{{ asset('assets/css/'.$stylesheet.'.css') }}">
    @endforeach
    @if($page === 'cart')
        <link rel="stylesheet" href="{{ asset('assets/css/cart.css') }}">
    @endif
    <script type="application/json" id="storefront-config">{!! json_encode(['locale' => $locale, 'page' => $page, 'slug' => $slug, 'apiUrl' => config('storefront.api_url'), 'baseUrl' => url('/'), 'dictionary' => $dict], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_UNESCAPED_UNICODE) !!}</script>
    <script defer src="{{ asset('assets/vendor/jquery.min.js') }}"></script>
    <script type="module" src="{{ asset('assets/js/app.js') }}"></script>
</head>
<body>
    <a href="#main-content" class="skip-link">{{ $dict['common']['skipToContent'] }}</a>
    @include('partials.header')
    <main id="main-content" tabindex="-1">@yield('content')</main>
    @include('partials.footer')
    <div id="toast-region" class="toast-region" aria-live="polite" aria-atomic="true"></div>
    <noscript><p class="auth-alert auth-alert--error">{{ $locale === 'ar' ? 'يرجى تفعيل جافاسكريبت لعرض المنتجات واستخدام المتجر.' : 'Enable JavaScript to load products and use the store.' }}</p></noscript>
</body>
</html>
