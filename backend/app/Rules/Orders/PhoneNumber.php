<?php

namespace App\Rules\Orders;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Translation\PotentiallyTranslatedString;

class PhoneNumber implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  Closure(string, ?string=): PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value)) {
            $fail(__('Enter a valid phone number with 7 to 15 digits.'));

            return;
        }

        $digits = preg_replace('/[^0-9]/', '', $value);

        if (! preg_match('/\A\+?[0-9 ()-]+\z/', $value) || strlen($digits) < 7 || strlen($digits) > 15) {
            $fail(__('Enter a valid phone number with 7 to 15 digits.'));
        }
    }
}
