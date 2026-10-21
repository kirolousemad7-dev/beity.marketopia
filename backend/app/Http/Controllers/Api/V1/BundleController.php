<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Resources\V1\ProductResource;
use App\Models\Bundles\Bundle;
use Illuminate\Http\JsonResponse;

class BundleController extends ApiController
{
    public function index(): JsonResponse
    {
        $bundles = Bundle::active()
            ->with('products')
            ->get()
            ->map(function ($bundle) {
                return $this->customResponse($bundle);
            });

        return $this->successResponse($bundles);
    }

    public function show(string $slug): JsonResponse
    {
        $bundle = Bundle::where('slug', $slug)
            ->where('is_active', true)
            ->with('products')
            ->firstOrFail();

        return $this->successResponse($this->customResponse($bundle));
    }

    private function customResponse(Bundle $bundle)
    {
        // $url = $bundle->getFirstTemporaryUrl(now()->addMinutes(10));
        $url = $bundle->getFirstMediaUrl();

        return [
            'id' => $bundle->id,
            'title' => $bundle->title,
            'slug' => $bundle->slug,
            'description' => $bundle->description,
            'image' => $url,
            'bundle_price' => $bundle->bundle_price,
            'original_price' => $bundle->original_total,
            'savings' => round($bundle->original_total - $bundle->bundle_price, 2),
            'products' => ProductResource::collection($bundle->products),
        ];
    }
}
