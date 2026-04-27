<?php

use App\Http\Controllers\HomeController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\Admin\HotelController;

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/hotels/search', [SearchController::class, 'index'])->name('hotels.search');
Route::get('/hotels/{hotel}', [SearchController::class, 'show'])->name('hotels.show');

// Booking flow � open to guests (no auth required)
Route::get('/find-booking', [\App\Http\Controllers\BookingController::class, 'find'])->name('bookings.find');
Route::post('/find-booking', [\App\Http\Controllers\BookingController::class, 'lookup'])->name('bookings.lookup');
Route::get('/bookings/create', [\App\Http\Controllers\BookingController::class, 'create'])->name('bookings.create');
Route::post('/bookings', [\App\Http\Controllers\BookingController::class, 'store'])->name('bookings.store');
Route::get('/bookings/{booking}/pay', [\App\Http\Controllers\BookingController::class, 'pay'])->name('bookings.pay');
Route::post('/bookings/{booking}/payment-intent', [\App\Http\Controllers\BookingController::class, 'paymentIntent'])->name('bookings.payment-intent');
Route::get('/bookings/{booking}/status', [\App\Http\Controllers\BookingController::class, 'status'])->name('bookings.status');
Route::get('/bookings/{booking}/confirmation', [\App\Http\Controllers\BookingController::class, 'confirmation'])->name('bookings.confirmation');
Route::post('/stripe/webhook', [\App\Http\Controllers\BookingController::class, 'webhook'])
    ->name('stripe.webhook')
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class]);

Route::post('/bookings/{booking}/cancel', [\App\Http\Controllers\BookingController::class, 'cancel'])->name('guest.bookings.cancel');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::middleware(['non_admin_dashboard'])->group(function () {
        Route::inertia('dashboard', 'dashboard')->name('dashboard');
    });

    // Customer: My Bookings portal
    Route::get('/my-bookings', [\App\Http\Controllers\CustomerBookingController::class, 'index'])->name('bookings.my-bookings');
    Route::post('/my-bookings/{booking}/cancel', [\App\Http\Controllers\CustomerBookingController::class, 'cancel'])->name('bookings.cancel');

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
        Route::resource('bookings', \App\Http\Controllers\Admin\AdminBookingController::class)->only(['index', 'update', 'destroy']);
        Route::resource('amenities', \App\Http\Controllers\Admin\AdminAmenityController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::get('/stripe/setup-check', [\App\Http\Controllers\BookingController::class, 'stripeSetupCheck'])->name('stripe.setup-check');
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
        Route::resource('bookings', \App\Http\Controllers\Partner\PartnerBookingController::class)->only(['index', 'update', 'destroy']);
    });
});

require __DIR__.'/settings.php';
