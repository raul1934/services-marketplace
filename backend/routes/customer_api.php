<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\Customer\AssetController;
use App\Http\Controllers\Api\Customer\DisputeController;
use App\Http\Controllers\Api\Customer\ProposalController;
use App\Http\Controllers\Api\Customer\QuestionController;
use App\Http\Controllers\Api\Customer\RequestController;
use App\Http\Controllers\Api\Customer\RequoteController;
use App\Http\Controllers\Api\Customer\RescheduleController;
use App\Http\Controllers\Api\Customer\ReviewController;
use App\Http\Controllers\Api\Customer\SurchargeController;
use App\Http\Controllers\Api\Customer\PetSpeciesController;
use App\Http\Controllers\Api\Customer\PropertyTypeController;
use App\Http\Controllers\Api\Customer\TrackingController;
use App\Http\Controllers\Api\Customer\VehicleMakeController;
use App\Http\Controllers\Api\Customer\WarrantyController;
use App\Http\Controllers\Api\JobPartController;
use App\Http\Controllers\Api\JobUpdateController;
use App\Http\Controllers\Api\PhoneAuthController;
use App\Http\Controllers\Api\PushTokenController;
use App\Http\Controllers\Api\SocialAuthController;
use App\Http\Controllers\Api\UploadController;
use Illuminate\Support\Facades\Route;

/*
 * Customer API — served under /api/customer/v1. Fully self-contained.
 */

Route::prefix('customer/v1')->group(function () {
    // ── Public ───────────────────────────────────────────────
    Route::post('auth/register', [AuthController::class, 'register']);
    Route::post('auth/login', [AuthController::class, 'login']);
    Route::post('auth/social', [SocialAuthController::class, 'social']);
    Route::post('auth/phone/request-code', [PhoneAuthController::class, 'requestCode']);
    Route::post('auth/phone/verify-code', [PhoneAuthController::class, 'verifyCode']);
    Route::get('categories', [CategoryController::class, 'index']);

    // ── Authenticated ────────────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('push/token', [PushTokenController::class, 'store']);
        Route::delete('push/token', [PushTokenController::class, 'destroy']);
        Route::post('uploads', [UploadController::class, 'store']);
    });

    // ── Client (token ability: client) ───────────────────────
    Route::middleware(['auth:sanctum', 'abilities:client'])->group(function () {
        // Catalogs for the asset pickers (make/model, property type, pet species/breed).
        Route::get('vehicle-makes', [VehicleMakeController::class, 'index']);
        Route::get('property-types', [PropertyTypeController::class, 'index']);
        Route::get('pet-species', [PetSpeciesController::class, 'index']);

        // Assets (vehicles/properties/pets) — selector on create + "Meus ativos".
        Route::get('assets', [AssetController::class, 'index']);
        Route::post('assets', [AssetController::class, 'store']);
        Route::get('assets/{asset}', [AssetController::class, 'show']);
        Route::put('assets/{asset}', [AssetController::class, 'update']);
        Route::delete('assets/{asset}', [AssetController::class, 'archive']);
        Route::get('assets/{asset}/history', [AssetController::class, 'history']);
        Route::get('assets/{asset}/readings', [AssetController::class, 'readings']);
        Route::post('assets/{asset}/readings', [AssetController::class, 'addReading']);
        Route::get('assets/{asset}/parts', [AssetController::class, 'parts']);
        Route::post('assets/{asset}/parts', [AssetController::class, 'addPart']);
        Route::put('assets/{asset}/parts/{part}', [AssetController::class, 'updatePart']);
        Route::delete('assets/{asset}/parts/{part}', [AssetController::class, 'removePart']);

        Route::get('requests', [RequestController::class, 'index']);
        Route::post('requests', [RequestController::class, 'store']);
        Route::get('requests/{serviceRequest}', [RequestController::class, 'show']);
        Route::get('requests/{serviceRequest}/events', [RequestController::class, 'events']);
        Route::post('requests/{serviceRequest}/cancel', [RequestController::class, 'cancel']);
        Route::post('requests/{serviceRequest}/no-show', [RequestController::class, 'reportNoShow']);
        Route::post('requests/{serviceRequest}/approve-parts', [RequestController::class, 'approveParts']);
        Route::get('requests/{serviceRequest}/proposals', [ProposalController::class, 'index']);
        Route::get('requests/{serviceRequest}/provider-location', [TrackingController::class, 'show']);
        Route::post('requests/{serviceRequest}/review', [ReviewController::class, 'store']);
        Route::post('proposals/{proposal}/accept', [ProposalController::class, 'accept']);
        Route::post('proposals/{proposal}/decline', [ProposalController::class, 'decline']);
        Route::post('proposals/{proposal}/counter', [ProposalController::class, 'counter']);

        // Surcharge (acréscimo) — client approves/refuses the provider's proposal.
        Route::post('surcharges/{surcharge}/approve', [SurchargeController::class, 'approve']);
        Route::post('surcharges/{surcharge}/refuse', [SurchargeController::class, 'refuse']);

        // Re-cotação — accept the present provider's new quote, or reopen to others.
        Route::post('requests/{serviceRequest}/requote/accept', [RequoteController::class, 'accept']);
        Route::post('requests/{serviceRequest}/requote/reopen', [RequoteController::class, 'reopen']);

        // Reschedule (R-AGENDA) — client requests or responds to the provider.
        Route::post('requests/{serviceRequest}/reschedule', [RescheduleController::class, 'store']);
        Route::post('reschedules/{rescheduleRequest}/accept', [RescheduleController::class, 'accept']);
        Route::post('reschedules/{rescheduleRequest}/decline', [RescheduleController::class, 'decline']);

        // Dispute — client opens; both sides read status.
        Route::post('requests/{serviceRequest}/disputes', [DisputeController::class, 'store']);
        Route::get('requests/{serviceRequest}/dispute', [DisputeController::class, 'show']);

        // Warranty / garantia — client claims after completion.
        Route::post('requests/{serviceRequest}/warranty', [WarrantyController::class, 'store']);
        Route::get('requests/{serviceRequest}/warranty', [WarrantyController::class, 'index']);

        // Pre-bid Q&A — read providers' questions and answer them.
        Route::get('requests/{serviceRequest}/questions', [QuestionController::class, 'index']);
        Route::post('questions/{question}/answer', [QuestionController::class, 'answer']);

        // Job report (timeline + parts) for the client's own requests.
        Route::get('requests/{serviceRequest}/updates', [JobUpdateController::class, 'index']);
        Route::get('requests/{serviceRequest}/parts', [JobPartController::class, 'index']);
        Route::post('parts/{jobPart}/approve', [JobPartController::class, 'approve']);
    });
});
