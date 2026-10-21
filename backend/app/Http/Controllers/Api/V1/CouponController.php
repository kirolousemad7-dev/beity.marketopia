<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\ApiController;
use App\Http\Requests\Api\V1\Coupons\ApplyRequest;
use App\Models\Coupon;
use Illuminate\Support\Str;

class CouponController extends ApiController
{
    public function apply(ApplyRequest $request)
    {
        $coupon = Coupon::where('code', Str::upper($request->code))->first();
        $orderAmount = $request->order_amount;

        if (!$coupon->isValid($orderAmount)) {
            return $this->catchErrorResponse('Coupon is invalid, expired or not applicable for this order amount', 400);
        }

        $userUsedCount = $coupon->orders()->where('user_id', auth()->id())->count();
        if ($coupon->usage_limit_per_user && $userUsedCount >= $coupon->usage_limit_per_user) {
            return $this->catchErrorResponse('You have already used this coupon', 400);
        }

        $discount = $coupon->calculateDiscount($orderAmount);
        $newTotal = $orderAmount - $discount;

        return $this->successResponse([
            'coupon_id' => $coupon->id,
            'discount_amount' => round($discount, 2),
            'new_total' => round($newTotal, 2),
        ], 'Coupon applied successfully');
    }
}