<?php

namespace App\Exceptions\Shipping;

use RuntimeException;

class BostaException extends RuntimeException
{
    public function __construct(string $message, public readonly bool $needsReview = false)
    {
        parent::__construct($message);
    }
}
