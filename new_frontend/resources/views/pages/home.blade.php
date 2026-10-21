@extends('layouts.storefront')
@section('content')
<div class="home-container">
    <section class="hero"><div class="hero__content"><p class="hero__eyebrow">{{ $dict['home']['eyebrow'] }}</p><h1 class="hero__title">{{ $dict['home']['title'] }}</h1><p class="hero__description">{{ $dict['home']['description'] }}</p><div class="hero__actions"><a href="{{ url($locale.'/products') }}" class="hero__btn">{{ $dict['home']['browseCatalog'] }}</a></div></div></section>
    <div data-home-content>@include('partials.loading')</div>
</div>
@endsection
