<?php

namespace App\Interfaces;

interface ProductInterface
{
    public function index();
    public function show(string $slug);
    public function bestSelling();
}