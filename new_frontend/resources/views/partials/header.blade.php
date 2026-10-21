<header class="header">
    <div class="header__inner">
        <a href="{{ url($locale) }}" class="header__brand" aria-label="Beity — بيتي">
            <img src="{{ asset('assets/images/logo.png') }}" alt="Beity | بيتي" width="120" height="40"
                class="header__logo">
        </a>
        <nav class="header__nav" aria-label="{{ $dict['header']['pages'] }}">
            <a href="{{ url($locale . '/products') }}" class="header__nav-link"
                @if (in_array($page, ['catalog', 'product'])) aria-current="page" @endif>{{ $dict['header']['catalog'] }}</a>
            <a href="{{ url($locale . '/account') }}" class="header__nav-link"
                @if ($page === 'account') aria-current="page" @endif>{{ $dict['header']['account'] }}</a>
            <a class="header__lang-btn" data-language-switch
                href="{{ url(($locale === 'en' ? 'ar' : 'en') . '/' . implode('/', array_slice(request()->segments(), 1))) }}{{ request()->getQueryString() ? '?' . request()->getQueryString() : '' }}"
                aria-label="{{ $dict['ui']['language'] }}">{{ $locale === 'en' ? 'ع' : 'EN' }}</a>
            <a href="{{ url($locale . '/cart') }}" class="header__cart-btn" data-cart-link
                aria-label="{{ str_replace('{count}', '0', $dict['header']['cartAriaLabel']) }}">@include('partials.icon', ['icon' => 'cart'])<span>{{ $dict['header']['cart'] }}</span><span
                    class="header__cart-count" data-cart-count>0</span></a>
        </nav>
        <div class="header__mobile-actions">
            <a href="{{ url($locale . '/cart') }}" class="header__cart-btn header__cart-btn--mobile" data-cart-link
                aria-label="{{ $dict['header']['cart'] }}">@include('partials.icon', ['icon' => 'cart'])<span class="header__cart-count"
                    data-cart-count>0</span></a>
            <button type="button" class="header__hamburger" data-menu-toggle aria-controls="mobile-menu"
                aria-expanded="false" aria-label="{{ $dict['ui']['menu'] }}">@include('partials.icon', ['icon' => 'menu'])</button>
        </div>
    </div>
    <nav id="mobile-menu" class="header__mobile-drawer" aria-label="{{ $dict['header']['pages'] }}" hidden>
        <a href="{{ url($locale . '/products') }}" class="header__mobile-link">{{ $dict['header']['catalog'] }}</a>
        <a href="{{ url($locale . '/account') }}" class="header__mobile-link">{{ $dict['header']['account'] }}</a>
        <div class="header__mobile-footer"><a class="header__lang-btn header__lang-btn--full" data-language-switch
                href="{{ url(($locale === 'en' ? 'ar' : 'en') . '/' . implode('/', array_slice(request()->segments(), 1))) }}{{ request()->getQueryString() ? '?' . request()->getQueryString() : '' }}">{{ $locale === 'en' ? 'العربية' : 'English' }}</a>
        </div>
    </nav>
</header>
