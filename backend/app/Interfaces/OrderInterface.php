<?php

namespace App\Interfaces;

interface OrderInterface
{
    public function index();
    public function checkout(array $data, $request);
}