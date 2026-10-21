@extends('layouts.storefront')
@section('content')<div class="home-container product-detail-page"><a href="{{ url($locale.'/products') }}" class="product-detail__back">{{ $dict['product']['back_to_catalog'] }}</a><div data-product-content>@include('partials.loading')</div></div>@endsection
