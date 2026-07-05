<?php

use App\Http\Controllers\Admin\MapMarkersController;
use Illuminate\Support\Facades\Route;

// The admin panel is served by Filament at /admin.
Route::redirect('/', '/admin');

// Polled by the ops dashboard's live map — see MapMarkersController's docblock
// for why this is a plain fetch() instead of a Livewire $wire call.
Route::middleware(['web', 'auth'])->get('/admin/map-markers', MapMarkersController::class);
