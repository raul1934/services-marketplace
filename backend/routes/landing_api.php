<?php

use App\Http\Controllers\Api\LandingController;
use Illuminate\Support\Facades\Route;

/*
 * Public marketing-landing API — served under /api (no auth). Kept separate from
 * the customer/provider surfaces (customer_api.php / provider_api.php), all
 * handled by LandingController.
 */

Route::controller(LandingController::class)->group(function () {
    // Rate limit no cadastro. O honeypot pega bot burro; isto pega o insistente.
    // A base de waitlist é o que decide qual praça abrir primeiro — envenená-la
    // com cadastro em massa é envenenar a decisão, e sai barato para quem quiser
    // fazer isso. Cinco por minuto por IP é folgado para gente e apertado para
    // script: ninguém preenche o formulário cinco vezes em um minuto.
    Route::post('v1/waitlist', 'waitlist')->middleware('throttle:5,1');
    Route::get('v1/waitlist/count', 'waitlistCount');
    // Assinada e sem auth: o link vive no rodapé de cada e-mail, e exigir login
    // de quem só quer sair da lista é atrito que a LGPD não admite.
    Route::get('v1/waitlist/{entry}/unsubscribe', 'unsubscribe')
        ->name('waitlist.unsubscribe')
        ->middleware('signed');
    Route::get('v1/service-categories', 'serviceCategories');
    Route::get('v1/cities', 'cities');
});
