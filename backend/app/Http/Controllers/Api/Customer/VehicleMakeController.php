<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\VehicleMakeResource;
use App\Models\VehicleMake;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** The seeded vehicle make/model catalog for the asset picker. */
class VehicleMakeController extends Controller
{
    /** All makes with their models (small reference set; cached client-side). */
    public function index(): AnonymousResourceCollection
    {
        return VehicleMakeResource::collection(
            VehicleMake::with('models')->orderBy('name')->get()
        );
    }
}
