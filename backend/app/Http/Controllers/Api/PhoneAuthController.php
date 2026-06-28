<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * Phone + OTP authentication. The client requests a 6-digit code, which is
 * delivered by SMS (stubbed: logged) and held in the cache for 5 minutes, then
 * confirms it to sign in. Find-or-create happens on a successful verification.
 */
class PhoneAuthController extends Controller
{
    private const TTL_SECONDS = 300;

    public function __construct(private readonly AuthService $auth) {}

    public function requestCode(Request $request): JsonResponse
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'max:20'],
        ]);

        $phone = $this->normalize($data['phone']);
        $code = (string) random_int(100000, 999999);

        Cache::put($this->key($phone), $code, self::TTL_SECONDS);

        // TODO: hand off to an SMS provider. For now the code is logged so it can
        // be used in development; never returned in production.
        Log::info("OTP for {$phone}: {$code}");

        return response()->json([
            'message' => __('messages.otp_sent'),
            'expires_in' => self::TTL_SECONDS,
            // Surfaced only outside production to make the flow testable.
            'debug_code' => app()->environment('production') ? null : $code,
        ]);
    }

    public function verifyCode(Request $request): JsonResponse
    {
        $data = $request->validate([
            'phone' => ['required', 'string', 'max:20'],
            'code' => ['required', 'string', 'size:6'],
            'role' => ['nullable', 'in:client,provider,both'],
            'name' => ['nullable', 'string', 'max:255'],
        ]);

        $phone = $this->normalize($data['phone']);
        $cached = Cache::get($this->key($phone));

        if ($cached === null) {
            throw ValidationException::withMessages(['code' => [__('messages.otp_expired')]]);
        }
        if (! hash_equals($cached, $data['code'])) {
            throw ValidationException::withMessages(['code' => [__('messages.otp_invalid')]]);
        }

        Cache::forget($this->key($phone));

        $result = $this->auth->phoneLogin(
            $phone,
            $data['role'] ?? 'client',
            $request->only(['device_no', 'os_type', 'device_name', 'os_version', 'app_version', 'notification_token']),
            $data['name'] ?? null,
        );

        return response()->json([
            'user' => new UserResource($result['user']),
            'tokens' => $result['tokens'],
        ]);
    }

    private function key(string $phone): string
    {
        return "otp:{$phone}";
    }

    /** Keep only digits so the cache key is stable across formatting. */
    private function normalize(string $phone): string
    {
        return preg_replace('/\D+/', '', $phone) ?? $phone;
    }
}
