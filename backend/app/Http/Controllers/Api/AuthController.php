<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $auth) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        ['user' => $user, 'tokens' => $tokens] = $this->auth->register(
            $request->validated(),
            $request->deviceData(),
        );

        return response()->json([
            'user' => new UserResource($user),
            'tokens' => $tokens,
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        ['user' => $user, 'tokens' => $tokens] = $this->auth->login(
            $request->validated('email'),
            $request->validated('password'),
            $request->deviceData(),
        );

        return response()->json([
            'user' => new UserResource($user),
            'tokens' => $tokens,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->auth->logout($request->user(), $request->input('device_no'));

        return response()->json(['message' => __('messages.logged_out')]);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('providerProfile', 'categories');

        return response()->json(['user' => new UserResource($user)]);
    }
}
