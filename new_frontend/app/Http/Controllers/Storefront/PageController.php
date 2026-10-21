<?php

namespace App\Http\Controllers\Storefront;

use App\Actions\Storefront\RenderPage;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;

class PageController
{
    public function __invoke(Request $request, RenderPage $render): View
    {
        return $render->handle(
            $request->route('locale'),
            $request->route('page'),
            $request->route('slug'),
        );
    }
}
