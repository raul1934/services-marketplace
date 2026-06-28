<?php

namespace App\Http\Controllers\Api\Customer;

use App\Enums\AssetType;
use App\Http\Controllers\Controller;
use App\Http\Resources\AssetReadingResource;
use App\Http\Resources\AssetResource;
use App\Http\Resources\ServiceRequestResource;
use App\Models\Asset;
use App\Models\AssetPet;
use App\Models\AssetProperty;
use App\Models\AssetVehicle;
use App\Models\PetBreed;
use App\Models\VehicleModel;
use App\Services\AssetReadingService;
use App\Services\MediaService;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** The client's assets (vehicles/properties/pets) — the "fosso" / R6. */
class AssetController extends Controller
{
    public function __construct(
        private readonly AssetReadingService $readings,
        private readonly MediaService $media,
    ) {}

    /**
     * Eager loads for serializing an asset. The detail is polymorphic, so the
     * per-type catalog relations are loaded via morphWith (a plain
     * `detailable.make` would blow up on a property/pet detail).
     */
    private function withDetail(): array
    {
        return [
            'detailable' => fn (MorphTo $m) => $m->morphWith([
                AssetVehicle::class => ['make', 'model'],
                AssetProperty::class => ['propertyType'],
                AssetPet::class => ['species', 'breed'],
            ]),
        ];
    }

    /** List the client's active assets, optionally filtered by type. */
    public function index(Request $request): AnonymousResourceCollection
    {
        $assets = $request->user()->assets()
            ->active()
            ->when($request->query('type'), fn ($q, $type) => $q->where('type', $type))
            ->with($this->withDetail())
            ->latest()
            ->orderByDesc('id')
            ->paginate($this->perPage($request));

        return AssetResource::collection($assets);
    }

    /** Register a new asset with its typed detail. */
    public function store(Request $request): JsonResponse
    {
        $type = AssetType::from($request->validate([
            'type' => ['required', Rule::enum(AssetType::class)],
        ])['type']);

        $data = $request->validate([
            'nickname' => ['required', 'string', 'max:80'],
            'photo_media_id' => ['nullable', 'integer', 'exists:media,id'],
            'detail' => ['nullable', 'array'],
            ...$this->detailRules($type),
        ]);

        $detailInput = $data['detail'] ?? [];
        $this->assertModelBelongsToMake($type, $detailInput);
        $this->assertBreedBelongsToSpecies($type, $detailInput);

        $asset = DB::transaction(function () use ($request, $type, $data, $detailInput) {
            $detail = $this->detailModel($type)->create($this->detailColumns($type, $detailInput));

            $asset = $request->user()->assets()->create([
                'type' => $type->value,
                'nickname' => $data['nickname'],
                'detailable_type' => $type->value,
                'detailable_id' => $detail->id,
            ]);

            // An initial mileage on a vehicle is recorded as the first reading.
            if ($type === AssetType::Vehicle && ! empty($detailInput['mileage'])) {
                $asset->setRelation('detailable', $detail);
                $this->readings->record($asset, ['mileage' => (int) $detailInput['mileage']], 'customer', $request->user()->id);
            }

            $this->applyPhoto($asset, $data['photo_media_id'] ?? null, $request->user()->id);

            return $asset;
        });

        return (new AssetResource($asset->load($this->withDetail())))->response()->setStatusCode(201);
    }

    public function show(Request $request, Asset $asset): AssetResource
    {
        $this->authorizeOwner($request, $asset);

        return new AssetResource($asset->load($this->withDetail()));
    }

    /** Rename / correct catalog data (type is immutable). */
    public function update(Request $request, Asset $asset): AssetResource
    {
        $this->authorizeOwner($request, $asset);
        $type = $asset->type;

        $data = $request->validate([
            'nickname' => ['sometimes', 'string', 'max:80'],
            'photo_media_id' => ['nullable', 'integer', 'exists:media,id'],
            'detail' => ['nullable', 'array'],
            ...$this->detailRules($type),
        ]);

        $detailInput = $data['detail'] ?? [];
        $this->assertModelBelongsToMake($type, $detailInput);
        $this->assertBreedBelongsToSpecies($type, $detailInput);

        DB::transaction(function () use ($request, $asset, $data, $type, $detailInput) {
            if (array_key_exists('nickname', $data)) {
                $asset->update(['nickname' => $data['nickname']]);
            }
            if (array_key_exists('detail', $data) && $asset->detailable) {
                // Mileage is never overwritten here — it's changed only via readings.
                $asset->detailable->update($this->detailColumns($type, $detailInput));
            }
            $this->applyPhoto($asset, $data['photo_media_id'] ?? null, $request->user()->id);
        });

        return new AssetResource($asset->fresh()->load($this->withDetail()));
    }

    /** Archive (mark sold/given away) — keeps the history; never hard-deletes. */
    public function archive(Request $request, Asset $asset): JsonResponse
    {
        $this->authorizeOwner($request, $asset);
        $asset->update(['archived_at' => now()]);

        return response()->json(['ok' => true]);
    }

    /** Set the asset's photo from an uploaded media id (upload-first). */
    private function applyPhoto(Asset $asset, ?int $mediaId, int $userId): void
    {
        if (! $mediaId) {
            return;
        }
        $path = $this->media->consume($mediaId, $userId);
        if (! $path) {
            return;
        }
        $old = $asset->photo_path;
        $asset->update(['photo_path' => $path]);
        if ($old && $old !== $path) {
            Storage::disk('public')->delete($old);
        }
    }

    /** The asset's service history (consolidated requests), newest first. */
    public function history(Request $request, Asset $asset): AnonymousResourceCollection
    {
        $this->authorizeOwner($request, $asset);

        $requests = $asset->serviceRequests()
            ->with('category')
            ->latest()
            ->orderByDesc('id')
            ->paginate($this->perPage($request));

        return ServiceRequestResource::collection($requests);
    }

    /** The asset's odometer reading history (vehicles), newest first. */
    public function readings(Request $request, Asset $asset): AnonymousResourceCollection
    {
        $this->authorizeOwner($request, $asset);

        return AssetReadingResource::collection($asset->readings()->paginate($this->perPage($request)));
    }

    /** Record an odometer reading from the owner side. */
    public function addReading(Request $request, Asset $asset): JsonResponse
    {
        $this->authorizeOwner($request, $asset);
        abort_unless($asset->type === AssetType::Vehicle, 422, __('messages.invalid_status'));

        $data = $request->validate([
            'mileage' => ['required', 'integer', 'min:0'],
            'recorded_at' => ['nullable', 'date'],
            'service_request_id' => ['nullable', 'integer'],
            'note' => ['nullable', 'string', 'max:200'],
        ]);

        if (! empty($data['service_request_id'])
            && ! $asset->serviceRequests()->whereKey($data['service_request_id'])->exists()) {
            throw ValidationException::withMessages(['service_request_id' => __('validation.exists', ['attribute' => 'service request'])]);
        }

        $reading = $this->readings->record($asset, $data, 'customer', $request->user()->id);

        return (new AssetReadingResource($reading))
            ->additional(['current_mileage' => $asset->fresh()->load('detailable')->detailable?->current_mileage])
            ->response()->setStatusCode(201);
    }

    private function authorizeOwner(Request $request, Asset $asset): void
    {
        abort_unless($asset->user_id === $request->user()->id, 403);
    }

    /** @return class-string<\Illuminate\Database\Eloquent\Model> */
    private function detailModel(AssetType $type): AssetVehicle|AssetProperty|AssetPet
    {
        return match ($type) {
            AssetType::Vehicle => new AssetVehicle,
            AssetType::Property => new AssetProperty,
            AssetType::Pet => new AssetPet,
        };
    }

    /** Per-type validation rules, prefixed `detail.*`. */
    private function detailRules(AssetType $type): array
    {
        $str = ['nullable', 'string', 'max:120'];

        return match ($type) {
            AssetType::Vehicle => [
                'detail.vehicle_make_id' => ['nullable', 'integer', 'exists:vehicle_makes,id'],
                'detail.vehicle_model_id' => ['nullable', 'integer', 'exists:vehicle_models,id'],
                'detail.plate' => ['nullable', 'string', 'max:16'],
                'detail.color' => $str,
                'detail.year' => ['nullable', 'string', 'max:8'],
                'detail.fuel' => $str,
                'detail.chassis' => $str,
                'detail.mileage' => ['nullable', 'integer', 'min:0'],
            ],
            AssetType::Property => [
                'detail.property_type_id' => ['nullable', 'integer', 'exists:property_types,id'],
                'detail.unit' => $str, 'detail.size' => $str,
                'detail.address' => $str, 'detail.floor' => $str, 'detail.condo' => $str,
            ],
            AssetType::Pet => [
                'detail.pet_species_id' => ['nullable', 'integer', 'exists:pet_species,id'],
                'detail.pet_breed_id' => ['nullable', 'integer', 'exists:pet_breeds,id'],
                'detail.size' => $str,
                'detail.birthdate' => $str, 'detail.weight' => $str, 'detail.vaccines' => $str, 'detail.microchip' => $str,
            ],
        };
    }

    /** The detail columns to persist (mileage is excluded — readings own it). */
    private function detailColumns(AssetType $type, array $detail): array
    {
        $keys = match ($type) {
            AssetType::Vehicle => ['vehicle_make_id', 'vehicle_model_id', 'plate', 'color', 'year', 'fuel', 'chassis'],
            AssetType::Property => ['property_type_id', 'unit', 'size', 'address', 'floor', 'condo'],
            AssetType::Pet => ['pet_species_id', 'pet_breed_id', 'size', 'birthdate', 'weight', 'vaccines', 'microchip'],
        };

        $out = [];
        foreach ($keys as $k) {
            if (array_key_exists($k, $detail)) {
                $out[$k] = $detail[$k] === '' ? null : $detail[$k];
            }
        }

        return $out;
    }

    /** A chosen model must belong to the chosen make (and a model requires a make). */
    private function assertModelBelongsToMake(AssetType $type, array $detail): void
    {
        if ($type !== AssetType::Vehicle || empty($detail['vehicle_model_id'])) {
            return;
        }

        $belongs = ! empty($detail['vehicle_make_id'])
            && VehicleModel::whereKey($detail['vehicle_model_id'])
                ->where('vehicle_make_id', $detail['vehicle_make_id'])
                ->exists();

        if (! $belongs) {
            throw ValidationException::withMessages([
                'detail.vehicle_model_id' => __('validation.exists', ['attribute' => 'model']),
            ]);
        }
    }

    /** A chosen breed must belong to the chosen species (and a breed requires a species). */
    private function assertBreedBelongsToSpecies(AssetType $type, array $detail): void
    {
        if ($type !== AssetType::Pet || empty($detail['pet_breed_id'])) {
            return;
        }

        $belongs = ! empty($detail['pet_species_id'])
            && PetBreed::whereKey($detail['pet_breed_id'])
                ->where('pet_species_id', $detail['pet_species_id'])
                ->exists();

        if (! $belongs) {
            throw ValidationException::withMessages([
                'detail.pet_breed_id' => __('validation.exists', ['attribute' => 'breed']),
            ]);
        }
    }
}
