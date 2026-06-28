<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushTokenController extends Controller
{
    public function __construct(private readonly AuthService $auth) {}

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'device_no' => ['required', 'string', 'max:255'],
            'notification_token' => ['required', 'string', 'max:512'],
            'os_type' => ['nullable', 'string', 'max:30'],
            'device_name' => ['nullable', 'string', 'max:255'],
            'os_version' => ['nullable', 'string', 'max:50'],
            'app_version' => ['nullable', 'string', 'max:50'],
        ]);

        $this->auth->syncDevice($request->user(), $data);

        return response()->json(['ok' => true]);
    }

    public function destroy(Request $request): JsonResponse
    {
        if ($deviceNo = $request->input('device_no')) {
            $request->user()->devices()
                ->where('device_no', $deviceNo)
                ->update(['notification_token' => null]);
        }

        return response()->json(['ok' => true]);
    }
}
