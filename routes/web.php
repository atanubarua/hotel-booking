<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    // Admin dashboard (Booking.com / Oyo-style admin)
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\AdminController::class, 'dashboard'])->name('dashboard');
        Route::get('/users', [\App\Http\Controllers\Admin\AdminController::class, 'users'])->name('users.index');
        Route::get('/hotels', [\App\Http\Controllers\Admin\AdminController::class, 'hotels'])->name('hotels.index');
        Route::get('/rooms', [\App\Http\Controllers\Admin\AdminController::class, 'rooms'])->name('rooms.index');
        Route::get('/bookings', [\App\Http\Controllers\Admin\AdminController::class, 'bookings'])->name('bookings.index');
    });
});

require __DIR__.'/settings.php';
