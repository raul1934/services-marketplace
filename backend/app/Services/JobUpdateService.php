<?php

namespace App\Services;

use App\Models\JobUpdate;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Http\UploadedFile;

/** Timeline entries (comment and/or photo) the provider adds during a job. */
class JobUpdateService
{
    public function add(ServiceRequest $request, User $provider, ?string $body, ?UploadedFile $photo): JobUpdate
    {
        $update = $request->jobUpdates()->create([
            'user_id' => $provider->id,
            'body' => $body,
        ]);

        if ($photo) {
            $update->media()->create([
                'uploaded_by_id' => $provider->id,
                'disk' => 'public',
                'path' => $photo->store("jobs/{$request->id}", 'public'),
                'tag' => 'update',
            ]);
        }

        return $update;
    }
}
