<?php

namespace App\Http\Controllers\Api\Customer;

use App\Enums\SurchargeStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\SurchargeResource;
use App\Models\Surcharge;
use App\Services\SurchargeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Client approves or refuses a provider's surcharge (acréscimo). */
class SurchargeController extends Controller
{
    public function __construct(private readonly SurchargeService $service) {}

    public function approve(Request $request, Surcharge $surcharge): JsonResponse
    {
        $this->authorizePending($request, $surcharge);

        return $this->respond($this->service->approve($surcharge));
    }

    public function refuse(Request $request, Surcharge $surcharge): JsonResponse
    {
        $this->authorizePending($request, $surcharge);

        return $this->respond($this->service->refuse($surcharge));
    }

    private function authorizePending(Request $request, Surcharge $surcharge): void
    {
        abort_unless($surcharge->request->client_id === $request->user()->id, 403);
        abort_unless($surcharge->status === SurchargeStatus::Pending, 422, __('messages.surcharge_not_pending'));
    }

    private function respond(Surcharge $surcharge): JsonResponse
    {
        return response()->json(new SurchargeResource($surcharge->load('provider')));
    }
}
