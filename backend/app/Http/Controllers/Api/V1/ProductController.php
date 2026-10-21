<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\ProductResource;
use App\Interfaces\ProductInterface;
use App\Support\ApiResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class ProductController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected ProductInterface $productService
    ) {}

    public function index()
    {
        try {
            $response = $this->productService->index();
        } catch (\Exception $e) {
            return $this->catchErrorResponse('An error occurred while fetching products.', 500);
        }

        return $this->successResponse(ProductResource::collection($response), 'Products fetched successfully.');
    }

    public function show(string $slug)
    {
        try {
            $response = $this->productService->show($slug);
        } catch (NotFoundHttpException $e) {
            return $this->catchErrorResponse($e->getMessage(), 404);
        } catch (\Exception $e) {
            return $this->catchErrorResponse('An error occurred while fetching the product.', 500);
        }

        return $this->successResponse($response, 'Product fetched successfully.');
    }

    public function bestSelling()
    {
        $response = $this->productService->bestSelling();

        return $this->successResponse(ProductResource::collection($response), 'Products fetched successfully.');
    }
}
