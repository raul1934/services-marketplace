<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\City;
use App\Models\ServiceCategory;
use App\Models\WaitlistEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

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

    /**
     * How many people are on the waitlist, for the landing's social proof.
     *
     * The hero used to claim "12k+ jobs done" and a 4.9 rating for a product
     * that has not served anyone yet. The honest replacement is the one number
     * we can actually prove — but only once it is large enough to help: a
     * counter saying "27 people" argues against joining. Below the floor the
     * endpoint reports null and the landing keeps the block hidden.
     *
     * Cached because it sits on the hero of every visit and the exact value
     * never matters — one minute of staleness is invisible to the reader and
     * turns a per-visit COUNT into one query a minute.
     */
    public function waitlistCount(): JsonResponse
    {
        $floor = (int) config('landing.waitlist_count_floor', 100);

        $count = Cache::remember(
            'landing:waitlist_count',
            now()->addMinute(),
            fn () => WaitlistEntry::query()->count()
        );

        return response()->json([
            'data' => ['count' => $count >= $floor ? $count : null],
        ]);
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
            // Accent-insensitive (unaccent extension): "goiania" matches "Goiânia".
            $query->whereRaw('unaccent(name) ILIKE unaccent(?)', ['%'.$q.'%'])
                ->orderByRaw('unaccent(name) ILIKE unaccent(?) DESC', [$q.'%']); // prefix matches first
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
