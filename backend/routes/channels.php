<?php

use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/*
 * Per-request live channel: the client who owns the request and the accepted
 * provider may listen for proposals, status changes and live location.
 */
Broadcast::channel('request.{serviceRequest}', function (User $user, ServiceRequest $serviceRequest) {
    return $user->id === $serviceRequest->client_id
        || $user->id === $serviceRequest->accepted_provider_id
        // A provider who bid may listen while the request is open, to hear the
        // accept/cancel outcome of their proposal in real time.
        || $serviceRequest->proposals()->where('provider_id', $user->id)->exists();
});
