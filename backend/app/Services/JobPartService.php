<?php

namespace App\Services;

use App\Events\JobProgressUpdated;
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
        $part = $request->jobParts()->create([
            'name' => $data['name'],
            'action' => $data['action'],
            'quantity' => $data['quantity'] ?? 1,
            'unit_price' => $data['unit_price'] ?? null,
        ]);

        // Let the customer watch the job take shape instead of only finding out
        // when approval is finally requested.
        JobProgressUpdated::dispatch($request->id, 'part_added');

        return $part;
    }

    public function remove(JobPart $part): void
    {
        $requestId = $part->service_request_id;
        $part->delete();

        JobProgressUpdated::dispatch($requestId, 'part_removed');
    }
}
