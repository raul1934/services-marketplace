<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Profissional local pré-qualificado para acionamento manual (MKT-OPS-01).
 *
 * Gente que ainda NÃO está no app: a oficina visitada, o guincheiro que topou
 * receber ligação. É o CRM da prospecção de campo — o mesmo trabalho que produz
 * os primeiros prestadores cadastrados, aproveitado para não deixar chamado sem
 * resposta enquanto a oferta orgânica não existe.
 *
 * Só entra aqui quem deu consentimento na visita. Sem `consent_at`, o contato
 * não aparece em alerta nenhum: telefone de MEI é dado pessoal, e ligar para
 * quem não autorizou é o problema que a issue original existia para evitar.
 */
class RescueContact extends Model
{
    protected $fillable = [
        'name', 'company', 'phone', 'city', 'uf', 'categories',
        'consent_at', 'consent_source', 'is_active', 'priority', 'notes',
    ];

    protected $casts = [
        'categories' => 'array',
        'consent_at' => 'datetime',
        'last_called_at' => 'datetime',
        'is_active' => 'boolean',
        'priority' => 'integer',
    ];

    /** Só telefone: a Meta e o wa.me recusam máscara. */
    public function phoneDigits(): string
    {
        $digitos = preg_replace('/\D/', '', (string) $this->phone);

        // Número brasileiro sem DDI: o wa.me precisa dele para abrir a conversa.
        return strlen($digitos) <= 11 ? '55'.$digitos : $digitos;
    }

    public function label(): string
    {
        return $this->company ? "{$this->name} ({$this->company})" : $this->name;
    }

    /**
     * Quem pode ser acionado: ativo e com consentimento registrado.
     *
     * O filtro de consentimento vive aqui, e não em cada chamador, porque
     * esquecer dele numa consulta nova é fácil demais — e o custo do esquecimento
     * é ligar para quem não autorizou.
     */
    public function scopeAcionavel(Builder $q): Builder
    {
        return $q->where('is_active', true)->whereNotNull('consent_at');
    }

    /**
     * Fila para um chamado: mesma cidade, que atenda a categoria.
     *
     * Contato sem categoria declarada entra: numa praça pequena, quem faz
     * guincho costuma resolver bateria e pneu também, e é melhor um telefone a
     * mais do que nenhum às 2h da manhã.
     */
    public function scopeParaChamado(Builder $q, ?string $cidade, ?string $categoriaSlug): Builder
    {
        return $q->acionavel()
            ->when($cidade, fn ($s) => $s->where('city', $cidade))
            ->when($categoriaSlug, fn ($s) => $s->where(function ($w) use ($categoriaSlug) {
                $w->whereJsonContains('categories', $categoriaSlug)
                    ->orWhereNull('categories');
            }))
            // Quem foi chamado há mais tempo primeiro: distribui o trabalho e
            // evita queimar sempre o mesmo contato.
            ->orderByDesc('priority')
            ->orderByRaw('last_called_at IS NULL DESC')
            ->orderBy('last_called_at');
    }
}
