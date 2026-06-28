<?php

namespace App\Models;

use App\Enums\Weekday;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProviderAvailability extends Model
{
    protected $fillable = ['user_id', 'weekday', 'start_time', 'end_time'];

    protected $casts = ['weekday' => Weekday::class];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
