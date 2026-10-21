@extends('layouts.storefront')
@section('title', $dict['orders']['title'].' | Beity')
@section('content')<div class="home-container orders-page"><div class="orders-page__header"><h1>{{ $dict['orders']['title'] }}</h1><p class="orders-page__subtitle">{{ $dict['orders']['subtitle_empty'] }}</p></div><div data-orders-content>@include('partials.loading')</div></div>@endsection
