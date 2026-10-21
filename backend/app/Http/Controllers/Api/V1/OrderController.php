<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\InvalidCouponCodeException;
use App\Exceptions\InvalidProductStockException;
use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Api\V1\Order\CheckoutRequest;
use App\Http\Resources\V1\OrderResource;
use App\Interfaces\OrderInterface;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class OrderController extends ApiController
{
    public function __construct(
        protected OrderInterface $orderService
    ){}

    public function index()
    {
        $response = $this->orderService->index();

        return $this->successResponse(OrderResource::collection($response), 'Orders fetched successfully.', [
            'current_page' => $response->currentPage(),
            'last_page' => $response->lastPage(),
            'per_page' => $response->perPage(),
            'total' => $response->total(),
        ]);
    }

    public function checkout(CheckoutRequest $request)
    {
        $validatedData = $request->validated();

        try {
            $order = $this->orderService->checkout($validatedData, $request);
        } catch (InvalidProductStockException $e) {
            return $this->catchErrorResponse($e->getMessage(), 400);
        } catch (InvalidCouponCodeException $e) {
            return $this->catchErrorResponse($e->getMessage(), 422);
        } catch (ValidationException $e) {
            return $this->errorResponse(__('The given data was invalid.'), $e->errors(), 422);
        } catch (\Exception $e) {
            return $this->catchErrorResponse('An error occurred during checkout.', 500);
        }

        return $this->successResponse('Order placed successfully.', [
            'order' => $order
        ]);
    }
}
