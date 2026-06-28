<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\WaitlistEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Public early-access sign-ups from the marketing landing page. */
class WaitlistController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'role' => ['nullable', 'in:customer,pro'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'city' => ['nullable', 'string', 'max:120'],
            'service' => ['nullable', 'string', 'max:120'],
        ]);

        $data['role'] ??= 'customer';
        WaitlistEntry::create($data);

        return response()->json(['message' => __('messages.waitlist_joined')], 201);
    }
}
