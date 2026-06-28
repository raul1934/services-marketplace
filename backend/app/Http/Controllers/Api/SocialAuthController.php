<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    public function __construct(private readonly AuthService $auth) {}

    /**
     * Mobile OAuth: the app signs in natively (Google/Apple/Facebook) and sends
     * the resulting token here. We verify it server-side and issue our tokens.
     */
    public function social(Request $request): JsonResponse
    {
        $data = $request->validate([
            'provider' => ['required', 'in:google,facebook,apple'],
            'token' => ['required', 'string'],
            'role' => ['nullable', 'in:client,provider,both'],
        ]);

        try {
            $social = Socialite::driver($data['provider'])->stateless()->userFromToken($data['token']);
        } catch (\Throwable $e) {
            throw ValidationException::withMessages(['token' => [__('messages.social_invalid')]]);
        }

        if (! $social->getEmail()) {
            throw ValidationException::withMessages(['token' => [__('messages.social_no_email')]]);
        }

        $result = $this->auth->socialLogin(
            $social->getEmail(),
            $social->getName() ?? $social->getNickname() ?? 'Usuário',
            $data['role'] ?? 'client',
            $request->only(['device_no', 'os_type', 'device_name', 'os_version', 'app_version', 'notification_token']),
        );

        return response()->json([
            'user' => new UserResource($result['user']),
            'tokens' => $result['tokens'],
        ]);
    }
}
