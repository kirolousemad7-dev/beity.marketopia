<?php

namespace App\Http\Requests\Admin\Orders;

use App\Models\Orders\Order;
use App\Rules\Orders\PhoneNumber;
use Illuminate\Foundation\Http\FormRequest;

class AcceptOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        $order = $this->route('order');

        return $order instanceof Order && ($this->user()?->can('accept', $order) ?? false);
    }

    public function rules(): array
    {
        return self::acceptanceRules();
    }

    public static function acceptanceRules(): array
    {
        return [
            'pickup_location_id' => ['required', 'string', 'max:100'],
            'city_id' => ['required', 'string', 'max:100'],
            'district_id' => ['required', 'string', 'max:100'],
            'shipping_address' => ['required', 'string', 'min:6', 'max:255'],
            'customer_name' => ['required', 'string', 'max:100'],
            'customer_phone' => ['required', 'string', 'max:30', new PhoneNumber],
            'additional_phone' => ['nullable', 'string', 'max:30', new PhoneNumber],
        ];
    }
}
