<?php

namespace App\Models;

use App\Models\Concerns\HasMedia;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class RequestQuestion extends Model
{
    use HasMedia;

    protected $fillable = [
        'service_request_id', 'provider_id', 'suggestion_id', 'question', 'answer', 'image_required', 'answered_at',
    ];

    protected $casts = [
        'answered_at' => 'datetime',
        'image_required' => 'boolean',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class, 'service_request_id');
    }

    public function provider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'provider_id');
    }

    /** The suggestion this question was copied from, if any (tracking only). */
    public function suggestion(): BelongsTo
    {
        return $this->belongsTo(QuestionSuggestion::class, 'suggestion_id');
    }

    /** Photos the client attached when answering (uploaded in the background). */
    public function answerPhotos(): MorphMany
    {
        return $this->morphMany(Media::class, 'mediable')->where('tag', 'answer')->orderBy('position');
    }
}
