<?php

namespace App\Models;

use App\Models\Concerns\HasMedia;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One side's submission in a dispute: their version + photo/file evidence. */
class DisputeEvidence extends Model
{
    use HasMedia;

    protected $table = 'dispute_evidence';

    protected $fillable = ['dispute_id', 'party', 'text'];

    public function dispute(): BelongsTo
    {
        return $this->belongsTo(Dispute::class);
    }
}
