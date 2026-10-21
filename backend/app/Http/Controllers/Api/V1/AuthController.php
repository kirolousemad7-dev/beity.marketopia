<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\LoginException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\LoginRequest;
use App\Http\Requests\Api\V1\Auth\RegisterRequest;
use App\Http\Requests\Api\V1\Auth\UpdateProfileRequest;
use App\Interfaces\AuthInterface;
use Illuminate\Http\Request;
use App\Support\ApiResponse;
use Exception;

class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(
        protected AuthInterface $authService
    ){}

    public function login(LoginRequest $request)
    {
        try {
            $response = $this->authService->login($request->validated());
        } catch (LoginException $e) {
            return $this->catchErrorResponse($e->getMessage(), 401);
        }
        catch (Exception $e) {
            return $this->catchErrorResponse('An error occurred during login. ' . $e->getMessage(), 500);
        }

        return $this->successResponse($response, 'Login successful.');
    }

    public function register(RegisterRequest $request)
    {
        try {
            $response = $this->authService->register($request->validated());
        } catch (Exception $e) {
            return $this->catchErrorResponse("An error occurred during registration.", 500);
        }
        return $this->successResponse($response, 'Registration successful.');
    }

    public function profile()
    {
        try {
            $response = $this->authService->profile();
        } catch (Exception $e) {
            return $this->catchErrorResponse('An error occurred while fetching the profile.', 500);
        }

        return $this->successResponse($response, 'Profile fetched successfully.');
    }

    public function updateProfile(UpdateProfileRequest $request)
    {
        try {
            $response = $this->authService->updateProfile($request->validated());
        } catch (Exception $e) {
            return $this->catchErrorResponse('An error occurred while updating the profile.', 500);
        }

        return $this->successResponse($response, 'Profile updated successfully.');
    }

    public function logout()
    {
        try {
            $this->authService->logout();
        } catch (Exception $e) {
            return $this->catchErrorResponse('An error occurred while logging out.', 500);
        }
        return $this->successResponse(null, 'Logged out successfully.');
    }

    public function deleteAccount()
    {
        try {
            $this->authService->deleteAccount();
        } catch (Exception $e) {
            return $this->catchErrorResponse('An error occurred while deleting the account.', 500);
        }
        return $this->successResponse(null, 'Account deleted successfully.');
    }
}