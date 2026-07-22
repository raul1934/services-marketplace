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
    Route::get('v1/waitlist/count', 'waitlistCount');
    // Assinada e sem auth: o link vive no rodapé de cada e-mail, e exigir login
    // de quem só quer sair da lista é atrito que a LGPD não admite.
    Route::get('v1/waitlist/{entry}/unsubscribe', 'unsubscribe')
        ->name('waitlist.unsubscribe')
        ->middleware('signed');
    Route::get('v1/service-categories', 'serviceCategories');
    Route::get('v1/cities', 'cities');
});
