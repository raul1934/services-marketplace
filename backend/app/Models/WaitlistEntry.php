<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WaitlistEntry extends Model
{
    protected $fillable = [
        'role', 'name', 'email', 'phone', 'city', 'service', 'locale',
    ];

    protected $casts = [
        'unsubscribed_at' => 'datetime',
        'confirmed_mail_sent_at' => 'datetime',
    ];

    /** Primeiro nome, para tratar a pessoa pelo nome sem soar formal demais. */
    public function firstName(): string
    {
        return trim(explode(' ', trim((string) $this->name))[0]) ?: (string) $this->name;
    }

    public function isPro(): bool
    {
        return $this->role === 'pro';
    }

    /**
     * Quem pediu para sair não recebe mais nada — nem a sequência até o
     * lançamento, nem o aviso de que a cidade abriu.
     */
    public function canBeEmailed(): bool
    {
        return $this->unsubscribed_at === null;
    }
}
