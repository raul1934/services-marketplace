<?php

namespace App\Http\Controllers\Api\Provider;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProviderDocumentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'documents' => $request->user()->documents()->get()->map(fn ($d) => [
                'id' => $d->id,
                'type' => $d->type,
                'status' => $d->status,
                'url' => $d->url,
            ])->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'type' => ['required', Rule::in(['id', 'proof_of_address', 'selfie', 'certificate'])],
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:10240'],
        ]);

        $path = $request->file('file')->store('provider-documents', 'public');

        $doc = $request->user()->documents()->updateOrCreate(
            ['type' => $data['type']],
            ['disk' => 'public', 'path' => $path, 'status' => 'uploaded'],
        );

        return response()->json([
            'id' => $doc->id,
            'type' => $doc->type,
            'status' => $doc->status,
            'url' => $doc->url,
        ], 201);
    }
}
