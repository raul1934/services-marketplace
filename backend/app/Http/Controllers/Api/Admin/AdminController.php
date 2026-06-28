<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceRequestResource;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Services\AdminService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminController extends Controller
{
    public function __construct(private readonly AdminService $service) {}

    public function stats(): JsonResponse
    {
        return response()->json($this->service->stats());
    }

    public function users(Request $request): JsonResponse
    {
        $users = User::query()
            ->withCount(['requests', 'proposals'])
            ->latest()
            ->orderByDesc('id')
            ->paginate(30);

        return response()->json($users);
    }

    public function requests(Request $request): AnonymousResourceCollection
    {
        $requests = ServiceRequest::query()
            ->with(['category', 'client'])
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->latest()
            ->orderByDesc('id')
            ->paginate(30);

        return ServiceRequestResource::collection($requests);
    }
}
