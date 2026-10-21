@extends('layouts.storefront')
@section('content')<div class="bundle-detail__mainContainer"><a class="product-detail__back" href="{{ url($locale.'/bundles') }}">{{ $dict['bundles']['backToBundles'] }}</a><div data-bundle-content>@include('partials.loading')</div></div>@endsection
