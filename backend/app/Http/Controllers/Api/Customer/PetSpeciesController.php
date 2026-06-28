<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\PetSpeciesResource;
use App\Models\PetSpecies;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Seeded pet species + breeds catalog for the asset picker. */
class PetSpeciesController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return PetSpeciesResource::collection(PetSpecies::with('breeds')->orderBy('name')->get());
    }
}
