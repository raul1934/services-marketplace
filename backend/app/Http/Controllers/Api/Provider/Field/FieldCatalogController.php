<?php

namespace App\Http\Controllers\Api\Provider\Field;

use App\Http\Controllers\Controller;
use App\Http\Resources\Field\FieldCatalogResource;
use App\Models\Field\FieldCatalogItem;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Company-wide add-on services offered on any visit. */
class FieldCatalogController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return FieldCatalogResource::collection(
            FieldCatalogItem::query()->orderBy('position')->get(),
        );
    }
}
