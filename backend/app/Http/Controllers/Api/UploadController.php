<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\MediaResource;
use App\Services\MediaService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Generic image upload (upload-first). Stores file(s) as orphan media and
 * returns `[{ id, url }]`; the client passes those ids as `media_ids[]` when it
 * creates/updates the owning record, which re-parents them.
 */
class UploadController extends Controller
{
    public function __construct(private readonly MediaService $media) {}

    public function store(Request $request): AnonymousResourceCollection
    {
        // Canonical field is `photos[]`; `files[]` and a single `file`/`photo`
        // are accepted as aliases and normalized to `photos`.
        $files = $request->file('photos') ?? $request->file('files') ?? $request->file('photo') ?? $request->file('file');
        if ($files !== null) {
            $request->files->set('photos', is_array($files) ? $files : [$files]);
        }

        $request->validate([
            'photos' => ['required', 'array', 'min:1', 'max:10'],
            'photos.*' => ['image', 'max:5120'],
            'tag' => ['nullable', 'string', 'max:32'],
        ]);

        $created = collect($request->file('photos'))->map(
            fn ($file) => $this->media->store($file, $request->user(), $request->input('tag')),
        );

        return MediaResource::collection($created);
    }
}
