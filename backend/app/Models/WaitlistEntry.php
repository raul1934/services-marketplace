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
        'referral_credit_granted_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        // Código gerado no boot e não no controller: qualquer caminho que crie
        // uma entrada — formulário, seed, admin, importação — precisa poder
        // indicar. Código que só existe em um caminho é código que falta nos
        // outros.
        static::creating(function (self $entry) {
            $entry->referral_code ??= self::gerarCodigo();
        });
    }

    /**
     * Código curto, sem caracteres que se confundem ao ditar.
     *
     * Sem 0/O, 1/I/L, 5/S: este código vai ser lido em voz alta em conversa de
     * WhatsApp e digitado à mão, não só clicado. Trocar "zero" por "ó" custa a
     * indicação inteira.
     */
    public static function gerarCodigo(int $tamanho = 7): string
    {
        $alfabeto = 'ABCDEFGHJKMNPQRTUVWXYZ234679';

        do {
            $codigo = '';
            for ($i = 0; $i < $tamanho; $i++) {
                $codigo .= $alfabeto[random_int(0, strlen($alfabeto) - 1)];
            }
        } while (self::where('referral_code', $codigo)->exists());

        return $codigo;
    }

    public function indicadoPor(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(self::class, 'referred_by_id');
    }

    public function indicados(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(self::class, 'referred_by_id');
    }

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
