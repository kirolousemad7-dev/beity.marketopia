@extends('layouts.storefront')
@section('title', $dict['bundles']['allBundles'].' | Beity')
@section('content')<div class="home-container products-page"><div class="section-header"><h1 class="section-header__title">{{ $dict['bundles']['allBundles'] }}</h1></div><div data-bundles-content>@include('partials.loading')</div></div>@endsection
