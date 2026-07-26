<?php

namespace App\Http\Resources\Field;

use App\Models\Field\FieldService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin FieldService */
class FieldServiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'who' => $this->who,
            'whoName' => $this->who_name,
            'rate' => $this->rate,
            'done' => (bool) $this->done,
            'obrig' => (bool) $this->obrig,
            'nest' => $this->nest ?? [],
            // Execution overlay (set by the OS controller): who did it in the
            // field and which catalog resources were used. Null/[] elsewhere.
            'assignee' => $this->assignee,
            'assigneeName' => $this->assignee_name,
            'resources' => $this->exec_resources ?? [],
        ];
    }
}
