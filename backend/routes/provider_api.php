<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\JobPartController;
use App\Http\Controllers\Api\JobUpdateController;
use App\Http\Controllers\Api\UploadController;
use App\Http\Controllers\Api\Provider\DashboardController;
use App\Http\Controllers\Api\Provider\DisputeController;
use App\Http\Controllers\Api\Provider\JobController;
use App\Http\Controllers\Api\Provider\NearbyController;
use App\Http\Controllers\Api\Provider\OdometerController;
use App\Http\Controllers\Api\Provider\PreferredClientController;
use App\Http\Controllers\Api\Provider\PricingController;
use App\Http\Controllers\Api\Provider\ProposalController;
use App\Http\Controllers\Api\Provider\ProviderAvailabilityController;
use App\Http\Controllers\Api\Provider\ProviderController;
use App\Http\Controllers\Api\Provider\ProviderDocumentController;
use App\Http\Controllers\Api\Provider\QuestionController;
use App\Http\Controllers\Api\Provider\RescheduleController;
use App\Http\Controllers\Api\Provider\ReviewController;
use App\Http\Controllers\Api\Provider\SurchargeController;
use App\Http\Controllers\Api\Provider\WalletController;
use App\Http\Controllers\Api\PhoneAuthController;
use App\Http\Controllers\Api\PushTokenController;
use App\Http\Controllers\Api\SocialAuthController;
use Illuminate\Support\Facades\Route;

/*
 * Provider API — served under /api/provider/v1. Fully self-contained.
 */

Route::prefix('provider/v1')->group(function () {
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

    // ── Provider (token ability: provider) ───────────────────
    Route::middleware(['auth:sanctum', 'abilities:provider'])->group(function () {
        // Profile + status
        Route::put('provider/profile', [ProviderController::class, 'updateProfile']);
        Route::put('provider/online', [ProviderController::class, 'online']);
        Route::put('provider/location', [ProviderController::class, 'location']);
        Route::put('provider/categories', [ProviderController::class, 'categories']);
        Route::get('provider/availability', [ProviderAvailabilityController::class, 'show']);
        Route::put('provider/availability', [ProviderAvailabilityController::class, 'update']);

        // Home dashboard + pricing hints
        Route::get('provider/dashboard', [DashboardController::class, 'index']);
        Route::get('provider/wallet', [WalletController::class, 'index']);
        Route::get('provider/wallet/transactions', [WalletController::class, 'transactions']);
        Route::post('provider/wallet/payout', [WalletController::class, 'payout']);
        Route::get('provider/pricing/area-average', [PricingController::class, 'areaAverage']);

        // Preferred clients
        Route::get('provider/clients/preferred', [PreferredClientController::class, 'index']);
        Route::put('provider/clients/{client}/preferred', [PreferredClientController::class, 'update']);

        // Verification documents
        Route::get('provider/documents', [ProviderDocumentController::class, 'index']);
        Route::post('provider/documents', [ProviderDocumentController::class, 'store']);

        // Jobs
        Route::get('provider/requests/nearby', [NearbyController::class, 'index']);
        Route::get('provider/requests/scheduled', [NearbyController::class, 'scheduled']);
        Route::get('provider/requests/{serviceRequest}', [JobController::class, 'show']);
        Route::get('provider/jobs', [JobController::class, 'index']);
        Route::get('provider/bids', [ProposalController::class, 'bids']);
        Route::post('requests/{serviceRequest}/proposals', [ProposalController::class, 'store']);
        Route::put('requests/{serviceRequest}/status', [JobController::class, 'updateStatus']);
        Route::post('requests/{serviceRequest}/start', [JobController::class, 'start']);
        Route::post('requests/{serviceRequest}/request-approval', [JobController::class, 'requestApproval']);
        Route::post('requests/{serviceRequest}/client-review', [ReviewController::class, 'store']);

        // Surcharge (acréscimo) — provider proposes; client approves/refuses.
        Route::post('requests/{serviceRequest}/surcharges', [SurchargeController::class, 'store']);

        // Reschedule (R-AGENDA) — provider requests or responds to the client.
        Route::post('requests/{serviceRequest}/reschedule', [RescheduleController::class, 'store']);
        Route::post('reschedules/{rescheduleRequest}/accept', [RescheduleController::class, 'accept']);
        Route::post('reschedules/{rescheduleRequest}/decline', [RescheduleController::class, 'decline']);

        // Dispute defense (R5) — provider files their side of an open dispute.
        Route::get('requests/{serviceRequest}/dispute', [DisputeController::class, 'show']);
        Route::post('disputes/{dispute}/defense', [DisputeController::class, 'defense']);

        // Pre-bid Q&A — ask the client about an open request.
        Route::get('requests/{serviceRequest}/questions', [QuestionController::class, 'index']);
        Route::get('requests/{serviceRequest}/question-suggestions', [QuestionController::class, 'suggestions']);
        Route::post('requests/{serviceRequest}/questions', [QuestionController::class, 'store']);
        Route::delete('questions/{question}', [QuestionController::class, 'destroy']);

        // Before/after job photos (upload-first: attach uploaded media ids + phase).
        Route::post('requests/{serviceRequest}/job-media', [JobController::class, 'jobMedia']);

        // Job report during the service
        Route::get('requests/{serviceRequest}/updates', [JobUpdateController::class, 'index']);
        Route::get('requests/{serviceRequest}/parts', [JobPartController::class, 'index']);
        Route::post('requests/{serviceRequest}/updates', [JobUpdateController::class, 'store']);
        Route::post('requests/{serviceRequest}/parts', [JobPartController::class, 'store']);
        Route::delete('parts/{jobPart}', [JobPartController::class, 'destroy']);
        // Odometer reading recorded by the provider during the service (e.g. oil change).
        Route::post('requests/{serviceRequest}/odometer', [OdometerController::class, 'store']);
    });
});
