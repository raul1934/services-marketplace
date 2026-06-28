<?php

namespace App\Services;

use App\Models\Media;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;

/** Stores and attaches polymorphic media. */
class MediaService
{
    /**
     * Claim an orphan media (uploaded by $userId) for a single-column target
     * (asset photo, avatar): return its stored path and delete the media row —
     * the file stays, now referenced directly by the target's own column.
     * Returns null if the id isn't a claimable upload of that user.
     */
    public function consume(int $id, int $userId): ?string
    {
        $media = Media::whereKey($id)->whereNull('mediable_id')->where('uploaded_by_id', $userId)->first();
        if (! $media) {
            return null;
        }
        $path = $media->path;
        $media->delete();

        return $path;
    }

    /** Store an uploaded file and create an orphan media row (no owner yet). */
    public function store(UploadedFile $file, User $uploader, ?string $tag = null): Media
    {
        $path = $file->store("uploads/{$uploader->id}", 'public');

        return Media::create([
            'uploaded_by_id' => $uploader->id,
            'disk' => 'public',
            'path' => $path,
            'tag' => $tag,
        ]);
    }

    /** Create a media row from an already-stored disk path, attached to $owner. */
    public function fromPath(string $path, Model $owner, string $tag, ?int $uploaderId = null, string $disk = 'public'): Media
    {
        return $owner->media()->create([
            'uploaded_by_id' => $uploaderId,
            'disk' => $disk,
            'path' => $path,
            'tag' => $tag,
        ]);
    }

    /**
     * Re-parent orphan media (by id) onto $owner. Only media that are still
     * unattached AND uploaded by $uploaderId are moved — you can't attach
     * someone else's upload id.
     *
     * @param  iterable<int|string>  $ids
     */
    public function attach(iterable $ids, Model $owner, string $tag, int $uploaderId): void
    {
        $ids = array_values(array_filter(array_map('intval', (array) $ids)));
        if (! $ids) {
            return;
        }

        Media::whereIn('id', $ids)
            ->whereNull('mediable_id')
            ->where('uploaded_by_id', $uploaderId)
            ->update([
                'mediable_type' => $owner->getMorphClass(),
                'mediable_id' => $owner->getKey(),
                'tag' => $tag,
            ]);
    }
}
