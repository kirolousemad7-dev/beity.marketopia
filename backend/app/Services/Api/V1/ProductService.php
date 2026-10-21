<?php

namespace App\Services\Api\V1;

use App\Http\Resources\V1\ProductResource;
use App\Interfaces\ProductInterface;
use App\Models\Products\Product;
use Illuminate\Http\Resources\Json\JsonResource;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ProductService implements ProductInterface
{
    public function index()
    {
        $query = Product::query();

        $query->when(request('category_id'), function ($q) {
            $q->where('category_id', request('category_id'));
        });
        
        $query->orderBy('created_at', 'desc');
        $products = $query->with('category')->get();
        return $products;
    }

    public function show(string $slug): JsonResource
    {
        $product = Product::with('category')->where('slug', $slug)->first();
        if (!$product) {
            throw new NotFoundHttpException('This product doesn\'t exist');
        }

        return ProductResource::make($product);
    }

    public function bestSelling()
    {
        return Product::withCount('orders')->with('category')->orderBy('orders_count')->limit(6)->get();
    }
}