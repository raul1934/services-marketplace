<?php

namespace App\Services;

use App\Models\Proposal;
use App\Models\ProviderProfile;
use App\Models\ServiceRequest;
use App\Models\User;

class AdminService
{
    /** Platform overview for the admin dashboard. */
    public function stats(): array
    {
        return [
            'users' => User::count(),
            'clients' => User::where('is_client', true)->count(),
            'providers' => User::where('is_provider', true)->count(),
            'providers_online' => ProviderProfile::where('is_online', true)->count(),
            'requests' => ServiceRequest::count(),
            'requests_by_status' => ServiceRequest::selectRaw('status, count(*) as total')
                ->groupBy('status')
                ->pluck('total', 'status'),
            'proposals' => Proposal::count(),
        ];
    }
}
