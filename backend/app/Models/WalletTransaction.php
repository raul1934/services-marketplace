<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletTransaction extends Model
{
    public const TYPE_CREDIT = 'credit';
    public const TYPE_PAYOUT = 'payout';

    public const STATUS_COMPLETED = 'completed';
    /** Split retained while a dispute is open (R-SPLIT) — excluded from balance. */
    public const STATUS_HELD = 'held';

    protected $fillable = ['provider_id', 'type', 'amount', 'description', 'service_request_id', 'status'];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function provider(): BelongsTo
    {
        return $this->belongsTo(User::class, 'provider_id');
    }

    /**
     * Net balance available to a provider: cleared credits minus payouts.
     * Credits held by an open dispute (R-SPLIT) are excluded until resolved.
     */
    public static function balanceFor(int $providerId): float
    {
        $credit = (float) static::where('provider_id', $providerId)
            ->where('type', self::TYPE_CREDIT)
            ->where('status', '!=', self::STATUS_HELD)
            ->sum('amount');
        $payout = (float) static::where('provider_id', $providerId)->where('type', self::TYPE_PAYOUT)->sum('amount');

        return round($credit - $payout, 2);
    }
}
