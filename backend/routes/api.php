<?php

use App\Http\Controllers\Api\Admin\AdminController;
use App\Http\Controllers\Api\Admin\CategoryAdminController;
use Illuminate\Support\Facades\Route;

/*
 * Admin API — served under /api/v1/admin (token ability: admin).
 *
 * The public marketing-landing endpoints live in routes/landing_api.php
 * (LandingController). The customer and provider surfaces are separated into
 * routes/customer_api.php (/api/customer/v1) and routes/provider_api.php
 * (/api/provider/v1).
 */

Route::prefix('v1')->middleware(['auth:sanctum', 'abilities:admin'])->prefix('admin')->group(function () {
    Route::get('stats', [AdminController::class, 'stats']);
    Route::get('users', [AdminController::class, 'users']);
    Route::get('requests', [AdminController::class, 'requests']);
    Route::post('categories', [CategoryAdminController::class, 'store']);
    Route::put('categories/{category}', [CategoryAdminController::class, 'update']);
});
