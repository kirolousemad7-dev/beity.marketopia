<?php

namespace App\Interfaces;

use Illuminate\Http\Request;

interface AuthInterface
{
    public function login(array $credentials);
    public function register(array $data);
    public function profile();
    public function updateProfile(array $data);
    public function logout();
    public function deleteAccount();
}