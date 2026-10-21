<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $url = $this->getFirstMediaUrl('product-images');
        
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'stock' => $this->stock,
            'inStock' => $this->stock > 0,
            'category' => CategoryResource::make($this->whenLoaded('category')),
            'description' => $this->description,
            'price' => $this->price,
            'price_after_discount' => $this->price_after_discount,
            'image' => $url ?: null,
            'pivot' => $this->when(
                isset($this->pivot) && $this->pivot !== null,
                fn (): array => ['quantity' => (int) $this->pivot->quantity],
            ),
        ];
    }
}
