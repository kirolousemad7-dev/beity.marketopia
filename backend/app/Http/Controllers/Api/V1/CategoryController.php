<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\CategoryResource;
use App\Interfaces\CategoryInterface;
use App\Support\ApiResponse;

class CategoryController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected CategoryInterface $categoryService
    ){}

    public function index()
    {
        try {
            $response = $this->categoryService->index();
        } catch (\Exception $e) {
            return $this->catchErrorResponse('An error occurred while fetching categories.', 500);
        }

        return $this->successResponse(CategoryResource::collection($response), 'Categories fetched successfully.');
    }

    public function show($id)
    {
        try {
            $response = $this->categoryService->show($id);
        } catch (\Exception $e) {
            return $this->catchErrorResponse('An error occurred while fetching the category.', 500);
        }

        return $this->successResponse($response, 'Category fetched successfully.');
    }
}
