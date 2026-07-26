<?php

namespace App\Http\Controllers\Api\Provider\Field;

use App\Http\Controllers\Controller;
use App\Models\Field\FieldShift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * The shift (turno) lifecycle. Opening a shift makes it the master
 * (shift_leader_id = its own id); adding crew opens a member shift pointing at
 * the master. Everything the field module executes hangs off the open shift.
 */
class FieldShiftController extends Controller
{
    /** The open master shift (with its crew), or null when none is running. */
    public function current(): JsonResponse
    {
        $shift = FieldShift::active();

        return response()->json(['data' => $shift ? $this->shape($shift) : null]);
    }

    /** Open a shift (slider/menu "Iniciar turno"). Returns the existing one if any. */
    public function start(Request $request): JsonResponse
    {
        if ($existing = FieldShift::active()) {
            return response()->json(['data' => $this->shape($existing)]);
        }

        $tech = $request->input('tech', $request->user()->name ?? 'Você');
        $id = (string) Str::uuid();

        // Master: shift_leader_id points at itself.
        $shift = FieldShift::create([
            'id' => $id,
            'shift_leader_id' => $id,
            'tech' => $tech,
            'date' => today(),
            'status' => 'active',
            'started_at' => now(),
        ]);

        return response()->json(['data' => $this->shape($shift)], 201);
    }

    /** Add a crew member — opens a member shift under the master. */
    public function addCrew(Request $request): JsonResponse
    {
        $data = $request->validate(['tech' => ['required', 'string', 'max:80']]);

        $master = FieldShift::active();

        if (! $master) {
            throw ValidationException::withMessages([
                'shift' => 'Nenhum turno aberto para adicionar equipe.',
            ]);
        }

        FieldShift::create([
            'id' => (string) Str::uuid(),
            'shift_leader_id' => $master->id, // crew: points at the master
            'tech' => $data['tech'],
            'date' => $master->date,
            'status' => 'active',
            'started_at' => now(),
        ]);

        return response()->json(['data' => $this->shape($master->fresh())], 201);
    }

    /** Close the shift and every crew member's shift under it. */
    public function finish(): JsonResponse
    {
        $master = FieldShift::active();

        if (! $master) {
            throw ValidationException::withMessages([
                'shift' => 'Nenhum turno aberto.',
            ]);
        }

        FieldShift::query()
            ->where('shift_leader_id', $master->id) // master + all its crew
            ->update(['status' => 'done', 'ended_at' => now()]);

        return response()->json(['data' => $this->shape($master->fresh())]);
    }

    /** @return array<string, mixed> */
    private function shape(FieldShift $shift): array
    {
        $shift->loadMissing('crew');

        return [
            'id' => $shift->id,
            'tech' => $shift->tech,
            'date' => $shift->date?->toDateString(),
            'status' => $shift->status,
            'isMaster' => $shift->isMaster(),
            'startedAt' => $shift->started_at?->toIso8601String(),
            'endedAt' => $shift->ended_at?->toIso8601String(),
            'crew' => $shift->crew->map(fn ($c) => [
                'id' => $c->id,
                'tech' => $c->tech,
                'status' => $c->status,
            ])->values(),
        ];
    }
}
