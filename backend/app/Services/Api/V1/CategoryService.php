<?php

namespace App\Services\Api\V1;

use App\Http\Resources\V1\CategoryResource;
use App\Interfaces\CategoryInterface;
use App\Models\Categories\Category;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryService implements CategoryInterface
{
    public function index()
    {
        $query = Category::query();

        $query->when(request('category_id'), function ($q) {
            $q->where('category_id', request('category_id'));
        });
        
        $query->orderBy('created_at', 'desc');
        $categories = $query->with('products')->get();
        return $categories;
    }

    public function show($id): JsonResource
    {
        $category = Category::with('products')->findOrFail($id);
        return CategoryResource::make($category);
    }
}