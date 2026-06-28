<?php

namespace App\Http\Controllers\Api\Provider;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\ProviderProfileResource;
use App\Http\Resources\UserResource;
use App\Services\MediaService;
use App\Services\ProviderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProviderController extends Controller
{
    public function __construct(
        private readonly ProviderService $service,
        private readonly MediaService $media,
    ) {}

    /** Update the provider's profile fields (name, phone, bio, vehicle, coverage). */
    public function updateProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:1000'],
            'vehicle_type' => ['nullable', 'string', 'max:100'],
            'coverage_radius_km' => ['nullable', 'integer', 'min:1', 'max:200'],
            'insured' => ['nullable', 'boolean'],
            'avatar_media_id' => ['nullable', 'integer', 'exists:media,id'],
        ]);

        $user = $request->user();

        // Avatar is upload-first: claim the uploaded media and store its path.
        if (! empty($data['avatar_media_id'])) {
            $path = $this->media->consume($data['avatar_media_id'], $user->id);
            if ($path) {
                $old = $user->avatar_path;
                $user->update(['avatar_path' => $path]);
                if ($old && $old !== $path) {
                    Storage::disk('public')->delete($old);
                }
            }
        }
        // Identity fields live on the user; the rest on the provider profile.
        $user->fill(array_filter([
            'name' => $data['name'] ?? null,
            'phone' => $data['phone'] ?? null,
        ], fn ($v) => $v !== null))->save();

        $user->providerProfile->update(collect($data)->only(['company_name', 'bio', 'vehicle_type', 'coverage_radius_km'])->all());

        // Liability insurance is opt-in (R: selo "com seguro"). Toggling on sets a
        // 1-year coverage window; off clears it. (Real packaging is the insurer's.)
        if (array_key_exists('insured', $data)) {
            $user->providerProfile->update(['insurance_valid_until' => $data['insured'] ? now()->addYear() : null]);
        }

        return response()->json(new UserResource($user->fresh()->load('providerProfile', 'categories')));
    }

    public function online(Request $request): JsonResponse
    {
        $data = $request->validate([
            'is_online' => ['required', 'boolean'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'accuracy' => ['nullable', 'numeric'],
        ]);

        $location = isset($data['latitude'], $data['longitude'])
            ? ['latitude' => $data['latitude'], 'longitude' => $data['longitude'], 'accuracy' => $data['accuracy'] ?? null]
            : null;

        $this->service->setOnline($request->user(), $data['is_online'], $location);

        return response()->json(new ProviderProfileResource($request->user()->providerProfile->fresh()));
    }

    public function location(Request $request): JsonResponse
    {
        $data = $request->validate([
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'accuracy' => ['nullable', 'numeric'],
        ]);

        $this->service->updateLocation($request->user(), $data);

        return response()->json(['ok' => true]);
    }

    public function categories(Request $request): JsonResponse
    {
        $data = $request->validate([
            'category_ids' => ['present', 'array'],
            'category_ids.*' => ['integer', 'exists:service_categories,id'],
        ]);

        $this->service->setCategories($request->user(), $data['category_ids']);

        return response()->json([
            'categories' => CategoryResource::collection(
                $request->user()->categories()->orderBy('sort_order')->get()
            ),
        ]);
    }
}
