<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
@if($icon === 'cart')<path d="M3 3h2l3 12h10l3-8H6"/><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/>
@elseif($icon === 'menu')<path d="M3 6h18M3 12h18M3 18h18"/>
@else<path d="M5 12h14m-6-6 6 6-6 6"/>
@endif
</svg>
