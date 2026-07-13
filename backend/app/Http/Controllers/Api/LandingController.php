<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\City;
use App\Models\ServiceCategory;
use App\Models\WaitlistEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Public endpoints consumed by the marketing landing page (no auth). Kept in one
 * controller + routes/landing_api.php, separate from the customer/provider APIs.
 */
class LandingController extends Controller
{
    /** Early-access sign-ups (customer / provider / regional partner). */
    public function waitlist(Request $request): JsonResponse
    {
        $data = $request->validate([
            'role' => ['nullable', 'in:customer,pro,partner'],
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

    /** Active service categories for the landing's dynamic services grid. */
    public function serviceCategories(Request $request): JsonResponse
    {
        $categories = ServiceCategory::query()
            ->where('is_active', true)
            ->when($request->filled('type'), fn ($q) => $q->where('type', $request->string('type')))
            ->orderBy('sort_order')
            ->get(['id', 'type', 'slug', 'name', 'icon']);

        return response()->json(['data' => $categories]);
    }

    /** City autocomplete for the landing forms (Brazil / IBGE). */
    public function cities(Request $request): JsonResponse
    {
        $q = trim((string) $request->query('q', ''));

        $query = City::query()->with('state:id,name,uf,country_id');

        if ($q !== '') {
            $query->where('name', 'ilike', '%'.$q.'%')
                ->orderByRaw('(name ilike ?) desc', [$q.'%']); // prefix matches first
        }

        $cities = $query->orderBy('name')->limit(20)->get(['id', 'state_id', 'name']);

        return response()->json([
            'data' => $cities->map(fn (City $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'uf' => $c->state?->uf,
                'state' => $c->state?->name,
                'label' => $c->state ? "{$c->name} - {$c->state->uf}" : $c->name,
            ]),
        ]);
    }
}
