<?php

namespace App\Models;

use App\Enums\SocialProvider;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A connected social account (a Facebook Page or an Instagram Business user).
 * `access_token` is a long-lived token pasted by the super admin and kept
 * encrypted at rest via the `encrypted` cast — it is never in env and never
 * shown in plaintext in the admin table.
 */
class SocialConnection extends Model
{
    protected $fillable = [
        'provider', 'external_id', 'name', 'access_token', 'token_expires_at', 'is_active',
    ];

    protected $casts = [
        'provider' => SocialProvider::class,
        'access_token' => 'encrypted',
        'token_expires_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    protected $hidden = ['access_token'];

    public function targets(): HasMany
    {
        return $this->hasMany(SocialPostTarget::class);
    }
}
