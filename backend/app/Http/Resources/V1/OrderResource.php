<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user' => UserResource::make($this->whenLoaded('user')),
            'total_amount' => $this->total_amount,
            'discount_amount' => $this->discount_amount,
            'status' => $this->status,
            'is_paid' => $this->whenLoaded('payment_transactions.status') == 'completed',
            'shipping_address' => $this->shipping_address,
            'customer_name' => $this->customer_name,
            'customer_phone' => $this->customer_phone,
            'additional_phone' => $this->additional_phone,
            'created_at' => $this->created_at,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
        ];
    }
}
