<?php

namespace App\Http\Requests\Api\V1\Order;

use App\Rules\Orders\PhoneNumber;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class CheckoutRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'customer_name' => ['bail', 'required', 'string', 'max:100'],
            'customer_phone' => ['bail', 'required', 'string', 'max:30', new PhoneNumber],
            'additional_phone' => ['bail', 'nullable', 'string', 'max:30', new PhoneNumber],
            'shipping_address' => ['required', 'string', 'max:255'],
            'coupon_code' => ['nullable', 'string', 'exists:coupons,code'],
            'payment_method' => ['required', 'in:cash_on_delivery,wallet,instapay'],
            'payment_screenshot' => [Rule::requiredIf(fn () => $this->payment_method != 'cash_on_delivery'), 'image', 'mimes:png,jpg,jpeg,webp', 'max:5120'],
            'items' => ['sometimes', 'array'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'bundles' => ['sometimes', 'array'],
            'bundles.*.bundle_id' => ['required', 'integer', 'exists:bundles,id'],
            'bundles.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $items = $this->input('items', []);
            $bundles = $this->input('bundles', []);
            $itemCount = is_array($items) ? count($items) : 0;
            $bundleCount = is_array($bundles) ? count($bundles) : 0;

            if ($itemCount + $bundleCount < 1) {
                $validator->errors()->add('items', __('Add a product or a package.'));
            }
        });
    }

    public function messages(): array
    {
        return [
            'customer_name.required' => __('Customer name is required.'),
            'customer_phone.required' => __('Customer phone number is required.'),
            'payment_screenshot.required' => 'Payment screenshot is required for wallet and instapay.',
        ];
    }

    public function attributes(): array
    {
        return [
            'customer_name' => __('Customer name'),
            'customer_phone' => __('Phone number'),
            'additional_phone' => __('Additional phone number'),
        ];
    }
}
