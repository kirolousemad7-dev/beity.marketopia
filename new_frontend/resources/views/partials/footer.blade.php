<footer class="footer"><div class="footer__inner">
    <div class="footer__top">
        <div class="footer__brand">
            <a href="{{ url($locale) }}" class="footer__logo-link"><img src="{{ asset('assets/images/logo.png') }}" alt="Beity | بيتي" width="120" height="40" class="footer__logo" loading="lazy"></a>
            <p class="footer__tagline">{{ $dict['footer']['tagline'] }}</p>
            <div class="footer__social">
                @foreach(['Facebook' => 'https://www.facebook.com/profile.php?id=61593908945987', 'Instagram' => 'https://www.instagram.com/beity.home.eg/', 'TikTok' => 'https://www.tiktok.com/@beityhomestore'] as $name => $href)
                    <a href="{{ $href }}" class="footer__social-link" target="_blank" rel="noopener noreferrer" aria-label="{{ $name }}">@include('partials.social-icon', ['name' => $name])</a>
                @endforeach
            </div>
        </div>
        <nav class="footer__col" aria-label="{{ $dict['footer']['shop'] }}"><h2 class="footer__heading">{{ $dict['footer']['shop'] }}</h2><ul class="footer__list">
            @foreach(['products' => 'catalog', 'cart' => 'cart', 'orders' => 'orders'] as $path => $key)<li><a href="{{ url($locale.'/'.$path) }}" class="footer__link">{{ $dict['footer'][$key] }}</a></li>@endforeach
        </ul></nav>
        <div class="footer__col"><h2 class="footer__heading">{{ $dict['footer']['contacts'] }}</h2><ul class="footer__list" data-footer-contacts><li class="footer__link">{{ $dict['ui']['loading'] }}</li></ul></div>
    </div>
    <div class="footer__bottom"><p class="footer__copyright">&copy; {{ date('Y') }} Marketopia. {{ $dict['footer']['copyright'] }}</p></div>
</div></footer>
