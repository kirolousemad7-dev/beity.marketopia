<?php

namespace Tests\Feature\Orders;

use App\Rules\Orders\PhoneNumber;
use Illuminate\Support\Facades\Validator;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class PhoneNumberTest extends TestCase
{
    public static function phoneNumbers(): array
    {
        return [
            'local number preserves zero' => ['01012345678', true],
            'international number' => ['+201012345678', true],
            'formatted number' => ['+20 (101) 234-5678', true],
            'minimum digits' => ['1234567', true],
            'maximum digits' => ['123456789012345', true],
            'too few digits' => ['123456', false],
            'too many digits' => ['1234567890123456', false],
            'letters' => ['010abcd5678', false],
            'embedded plus' => ['010+12345678', false],
            'punctuation only' => ['--- () ---', false],
            'decimal' => ['010.12345678', false],
            'new line' => ["01012345678\n", false],
            'not a string' => [1012345678, false],
        ];
    }

    #[DataProvider('phoneNumbers')]
    public function test_phone_number_validation(mixed $number, bool $valid): void
    {
        $validator = Validator::make(['phone' => $number], ['phone' => [new PhoneNumber]]);

        $this->assertSame($valid, $validator->passes());
        if (! $valid) {
            $this->assertSame('Enter a valid phone number with 7 to 15 digits.', $validator->errors()->first('phone'));
        }
    }
}
