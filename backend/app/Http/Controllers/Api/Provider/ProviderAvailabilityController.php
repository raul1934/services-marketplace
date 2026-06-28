<?php

namespace App\Http\Controllers\Api\Provider;

use App\Enums\AvailabilityType;
use App\Enums\Weekday;
use App\Http\Controllers\Controller;
use App\Services\ProviderAvailabilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProviderAvailabilityController extends Controller
{
    public function __construct(private readonly ProviderAvailabilityService $service) {}

    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load('availabilities', 'providerProfile');

        return response()->json([
            'availability_type' => $user->providerProfile?->availability_type,
            'windows' => $user->availabilities->map(fn ($a) => [
                'weekday' => $a->weekday,
                'start_time' => substr((string) $a->start_time, 0, 5),
                'end_time' => substr((string) $a->end_time, 0, 5),
            ])->values(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'availability_type' => ['required', Rule::enum(AvailabilityType::class)],
            'windows' => ['array'],
            'windows.*.weekday' => ['required', Rule::enum(Weekday::class)],
            'windows.*.start_time' => ['required', 'date_format:H:i'],
            'windows.*.end_time' => ['required', 'date_format:H:i'],
        ]);

        $this->service->set(
            $request->user(),
            AvailabilityType::from($data['availability_type']),
            $data['windows'] ?? [],
        );

        return $this->show($request);
    }
}
