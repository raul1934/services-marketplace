<?php

namespace App\Http\Controllers\Api\Provider;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** A provider's preferred clients — notified first for their future jobs. */
class PreferredClientController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $clients = $request->user()->preferredClients()
            ->get(['users.id', 'users.name', 'users.avatar_path'])
            ->map(fn (User $c) => ['id' => $c->id, 'name' => $c->name]);

        return response()->json(['clients' => $clients]);
    }

    /** Add or remove a client from the provider's preferred list. */
    public function update(Request $request, User $client): JsonResponse
    {
        abort_if($client->id === $request->user()->id, 422);

        $data = $request->validate([
            'preferred' => ['required', 'boolean'],
        ]);

        $relation = $request->user()->preferredClients();
        if ($data['preferred']) {
            $relation->syncWithoutDetaching([$client->id]);
        } else {
            $relation->detach($client->id);
        }

        return response()->json([
            'client_id' => $client->id,
            'preferred' => $data['preferred'],
        ]);
    }
}
