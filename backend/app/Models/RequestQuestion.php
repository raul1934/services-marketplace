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

    /**
     * The question as the *reader* should see it, not as the asker typed it.
     *
     * `question_suggestions` holds one row per language (a `lang` column, not a
     * translation map), and the provider's picker filters by the provider's
     * locale. Asking then snapshots `$suggestion->text` onto the request — so a
     * provider running the app in English sent an English question to a
     * customer running it in Portuguese, which is exactly what the audit saw.
     *
     * The snapshot stays (it is the record of what was asked, and free-typed
     * questions have nothing else), but when the question came from a
     * suggestion we can look up the sibling row in the reader's language.
     * Falls back to the snapshot whenever that sibling does not exist.
     */
    public function localizedQuestion(): ?string
    {
        $suggestion = $this->relationLoaded('suggestion') ? $this->suggestion : null;
        if (! $suggestion) {
            return $this->question;
        }
        if ($suggestion->lang === app()->getLocale()) {
            return $suggestion->text;
        }

        return QuestionSuggestion::where('key', $suggestion->key)
            ->where('category_type', $suggestion->category_type)
            ->where('lang', app()->getLocale())
            ->value('text') ?? $this->question;
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
