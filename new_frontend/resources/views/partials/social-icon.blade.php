<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
    @switch($name)
        @case('Facebook')
            <path d="M13.5 22v-9h3l.5-3.5h-3.5V7.25c0-1 .3-1.75 1.75-1.75H17V2.3c-.8-.1-1.6-.3-2.75-.3C11.5 2 10 3.7 10 7v2.5H7V13h3v9z"/>
            @break
        @case('Instagram')
            <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/>
            <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/>
            <circle cx="17.5" cy="6.5" r="1.25"/>
            @break
        @case('TikTok')
            <path d="M16.5 2c.3 2.7 1.8 4.3 4.5 4.5V10a9 9 0 0 1-4.5-1.4V16a6 6 0 1 1-6-6h1v3.5h-1a2.5 2.5 0 1 0 2.5 2.5V2z"/>
            @break
    @endswitch
</svg>
