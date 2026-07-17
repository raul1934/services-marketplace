<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\PropertyTypeResource;
use App\Models\PropertyType;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Seeded property-type catalog for the asset picker. */
class PropertyTypeController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        // Eager-load the parts so the client gets the whole catalog in one go
        // (same shape as vehicle makes -> models).
        return PropertyTypeResource::collection(
            PropertyType::with('partTypes')->orderBy('name')->get(),
        );
    }
}
