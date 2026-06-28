<?php

use Illuminate\Support\Facades\Route;

// The admin panel is served by Filament at /admin.
Route::redirect('/', '/admin');
