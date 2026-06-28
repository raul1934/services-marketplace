<?php

namespace App\Services;

use App\Models\JobPart;
use App\Models\ServiceRequest;

/** Parts the provider replaced/adjusted during a job. */
class JobPartService
{
    /**
     * @param  array{name:string,action:string,quantity?:int,unit_price?:?float}  $data
     */
    public function add(ServiceRequest $request, array $data): JobPart
    {
        return $request->jobParts()->create([
            'name' => $data['name'],
            'action' => $data['action'],
            'quantity' => $data['quantity'] ?? 1,
            'unit_price' => $data['unit_price'] ?? null,
        ]);
    }

    public function remove(JobPart $part): void
    {
        $part->delete();
    }
}
