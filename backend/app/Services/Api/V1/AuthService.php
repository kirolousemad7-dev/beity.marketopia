<?php

namespace App\Services\Api\V1;

use App\Exceptions\LoginException;
use App\Http\Resources\V1\UserResource;
use App\Models\User;
use App\Interfaces\AuthInterface;
use Illuminate\Support\Facades\Hash;

class AuthService implements AuthInterface
{
    public function login(array $credentials)
    {
        $user = User::where('email', $credentials['email'])->first();

        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            throw new LoginException('Invalid credentials provided.');
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token
        ];
    }

    public function register(array $data)
    {
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user' => $user,
            'token' => $token
        ];
    }

    public function profile()
    {
        $user = auth()->user();
        return UserResource::make($user);
    }

    public function updateProfile(array $data)
    {
        $user = auth()->user();
        $user->update($data);
        return UserResource::make($user);
    }

    public function logout()
    {
        $user = auth()->user();
        $user->tokens()->delete();
    }

    public function deleteAccount()
    {
        $user = auth()->user();
        $user->delete();
    }
}