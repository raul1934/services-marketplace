<?php

use App\Http\Controllers\Api\LandingController;
use Illuminate\Support\Facades\Route;

/*
 * Public marketing-landing API — served under /api (no auth). Kept separate from
 * the customer/provider surfaces (customer_api.php / provider_api.php), all
 * handled by LandingController.
 */

Route::controller(LandingController::class)->group(function () {
    Route::post('v1/waitlist', 'waitlist');
    Route::get('v1/service-categories', 'serviceCategories');
});
