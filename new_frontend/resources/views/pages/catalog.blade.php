@extends('layouts.storefront')
@section('title', $dict['product']['all_products'].' | Beity')
@section('content')
<div class="products-page"><div class="home-container">
    <div class="section-header"><div><span class="hero__eyebrow">{{ $dict['product']['catalog'] }}</span><h1 class="section-header__title">{{ $dict['product']['all_products'] }}</h1></div><span class="section-header__meta" data-product-count></span></div>
    <div class="catalog-filter"><div class="catalog-pills" data-category-filters aria-label="{{ $dict['product']['catalog'] }}"></div><div class="catalog-controls">
        <label class="sr-only" for="catalog-search">{{ $dict['ui']['search'] }}</label><input id="catalog-search" type="search" class="catalog-input" placeholder="{{ $dict['ui']['search'] }}" data-catalog-search>
        <label class="sr-only" for="catalog-sort">{{ $dict['ui']['sort'] }}</label><select id="catalog-sort" class="catalog-select" data-catalog-sort>@foreach(['featured' => 'featured', 'price-asc' => 'price_low', 'price-desc' => 'price_high', 'name' => 'name'] as $value => $key)<option value="{{ $value }}">{{ $dict['ui'][$key] }}</option>@endforeach</select>
    </div></div><div data-catalog-content>@include('partials.loading')</div>
</div></div>
@endsection
