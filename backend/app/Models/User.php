<?php

namespace App\Models;

use App\Enums\AdminRole;
use Database\Factories\UserFactory;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Collection;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements FilamentUser
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'is_client',
        'is_provider',
        'is_admin',
        'is_bot', // TEMP — test bots. Remove with app/Bots.
        'avatar_path',
        'rating_avg',
        'rating_count',
        'no_show_count',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_client' => 'boolean',
            'is_provider' => 'boolean',
            'is_admin' => 'boolean',
            'is_bot' => 'boolean', // TEMP — test bots. Remove with app/Bots.
            'rating_avg' => 'decimal:2',
            'rating_count' => 'integer',
            'no_show_count' => 'integer',
            'role' => AdminRole::class,
        ];
    }

    /**
     * Admins need a role to enter the panel — is_admin with no role is a
     * misconfigured account, blocked rather than getting a blank dashboard.
     */
    public function canAccessPanel(Panel $panel): bool
    {
        return (bool) $this->is_admin && $this->role !== null;
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === AdminRole::SuperAdmin;
    }

    public function isMarketAdmin(): bool
    {
        return $this->role === AdminRole::MarketAdmin;
    }

    /** Markets this Market Admin is assigned to (empty for Super Admin — their scope is global by role). */
    public function marketIds(): Collection
    {
        return $this->markets()->pluck('markets.id');
    }

    // ── Relations ────────────────────────────────────────────

    /** Markets this Market Admin is assigned to, via the admin_market pivot. */
    public function markets(): BelongsToMany
    {
        return $this->belongsToMany(Market::class, 'admin_market');
    }

    public function providerProfile(): HasOne
    {
        return $this->hasOne(ProviderProfile::class);
    }

    public function location(): HasOne
    {
        return $this->hasOne(ProviderLocation::class);
    }

    /** Categories this user serves as a provider. */
    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(ServiceCategory::class, 'provider_categories');
    }

    /** Requests this user created as a client. */
    public function requests(): HasMany
    {
        return $this->hasMany(ServiceRequest::class, 'client_id');
    }

    /** Assets this user registered (vehicles/properties/pets). */
    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class);
    }

    /** Proposals this user submitted as a provider. */
    public function proposals(): HasMany
    {
        return $this->hasMany(Proposal::class, 'provider_id');
    }

    public function devices(): HasMany
    {
        return $this->hasMany(UserDevice::class);
    }

    /** Provider verification documents. */
    public function documents(): HasMany
    {
        return $this->hasMany(ProviderDocument::class);
    }

    public function reviewsReceived(): HasMany
    {
        return $this->hasMany(Review::class, 'provider_id');
    }

    /** Provider's weekly availability windows. */
    public function availabilities(): HasMany
    {
        return $this->hasMany(ProviderAvailability::class);
    }

    /** Clients this provider marked as preferred (notified first for their jobs). */
    public function preferredClients(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'provider_preferred_clients', 'provider_id', 'client_id')
            ->withTimestamps();
    }

    /** Providers who marked this client as preferred. */
    public function preferredByProviders(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'provider_preferred_clients', 'client_id', 'provider_id')
            ->withTimestamps();
    }

    // ── Notifications (FCM) ──────────────────────────────────

    /**
     * Route FCM notifications to all of this user's valid device tokens.
     * Mirrors lula's ProviderUser::routeNotificationForFcm().
     *
     * @return array<int, string>
     */
    public function routeNotificationForFcm(): array
    {
        return $this->devices()
            ->whereNotNull('notification_token')
            ->pluck('notification_token')
            ->all();
    }

    /**
     * Route Expo push notifications to all of this user's registered device
     * tokens (managed Expo app). Same column as FCM — the channel filters to
     * `ExponentPushToken[...]` values itself.
     *
     * @return array<int, string>
     */
    public function routeNotificationForExpo(): array
    {
        return $this->routeNotificationForFcm();
    }
}
