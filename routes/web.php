<?php

use App\Http\Controllers\HomeController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\Admin\HotelController;

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/hotels/search', [SearchController::class, 'index'])->name('hotels.search');
Route::get('/hotels/{hotel}', [SearchController::class, 'show'])->name('hotels.show');

// Booking flow — open to guests (no auth required)
Route::get('/bookings/create', [\App\Http\Controllers\BookingController::class, 'create'])->name('bookings.create');
Route::post('/bookings', [\App\Http\Controllers\BookingController::class, 'store'])->name('bookings.store');
Route::get('/bookings/{booking}/pay', [\App\Http\Controllers\BookingController::class, 'pay'])->name('bookings.pay');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::middleware(['non_admin_dashboard'])->group(function () {
        Route::inertia('dashboard', 'dashboard')->name('dashboard');
    });

    // Admin dashboard
    Route::prefix('admin')->name('admin.')->middleware(['admin'])->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\AdminController::class, 'dashboard'])->name('dashboard');
        Route::get('/users', [\App\Http\Controllers\Admin\AdminController::class, 'users'])->name('users.index');
        Route::get('/hotels/{hotel}/images', [HotelController::class, 'images'])->name('hotels.images');
        Route::post('/hotels/{hotel}/images', [HotelController::class, 'updateImages'])
            ->name('hotels.images.update')
            ->withoutMiddleware(['\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken']);
        Route::resource('hotels', HotelController::class);
        Route::get('/rooms/{room}/images', [\App\Http\Controllers\Admin\AdminRoomController::class, 'images'])->name('rooms.images');
        Route::post('/rooms/{room}/images', [\App\Http\Controllers\Admin\AdminRoomController::class, 'updateImages'])
            ->name('rooms.images.update')
            ->withoutMiddleware(['\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken']);
        Route::resource('rooms', \App\Http\Controllers\Admin\AdminRoomController::class)->except(['show']);
        Route::get('/bookings', [\App\Http\Controllers\Admin\AdminController::class, 'bookings'])->name('bookings.index');
    });

    // Partner portal
    Route::prefix('partner')->name('partner.')->middleware(['partner'])->group(function () {
        Route::get('/', [\App\Http\Controllers\Partner\PartnerController::class, 'dashboard'])->name('dashboard');
        Route::get('/hotels/{hotel}/images', [\App\Http\Controllers\Partner\PartnerHotelController::class, 'images'])->name('hotels.images');
        Route::post('/hotels/{hotel}/images', [\App\Http\Controllers\Partner\PartnerHotelController::class, 'updateImages'])
            ->name('hotels.images.update')
            ->withoutMiddleware(['\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken']);
        Route::resource('hotels', \App\Http\Controllers\Partner\PartnerHotelController::class);
        Route::get('/rooms/{room}/images', [\App\Http\Controllers\Partner\PartnerRoomController::class, 'images'])->name('rooms.images');
        Route::post('/rooms/{room}/images', [\App\Http\Controllers\Partner\PartnerRoomController::class, 'updateImages'])
            ->name('rooms.images.update')
            ->withoutMiddleware(['\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken']);
        Route::resource('rooms', \App\Http\Controllers\Partner\PartnerRoomController::class);
    });
});

require __DIR__.'/settings.php';
