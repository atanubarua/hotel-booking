<?php

// Feature: hotel-registration-crud, Property 9: Edit page pre-fills hotel data

use App\Enums\Role;
use App\Http\Controllers\Admin\HotelController;
use App\Models\Hotel;
use App\Models\User;
use Faker\Factory as FakerFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;

uses(RefreshDatabase::class);

/**
 * Property 9: Edit page pre-fills hotel data
 * Validates: Requirements 5.1
 *
 * For any hotel in the database, the admin hotel edit endpoint should return
 * an Inertia response whose `hotel` prop contains all of the hotel's current
 * field values: id, name, address, city, country, star_rating, phone, email,
 * description, and status.
 */
test('Property 9: edit page pre-fills hotel data across 100 random iterations', function () {
    $faker = FakerFactory::create();
    $statuses = ['active', 'inactive', 'pending'];

    for ($i = 0; $i < 100; $i++) {
        // Create a partner user who owns the hotel
        $partner = User::create([
            'name'     => $faker->name(),
            'email'    => $faker->unique()->safeEmail(),
            'password' => bcrypt($faker->password()),
            'role'     => Role::Partner,
        ]);

        // Create a hotel with random data
        $hotel = Hotel::create([
            'user_id'     => $partner->id,
            'name'        => $faker->company(),
            'address'     => $faker->streetAddress(),
            'city'        => $faker->city(),
            'country'     => $faker->country(),
            'star_rating' => $faker->numberBetween(1, 5),
            'phone'       => $faker->numerify('##########'),
            'email'       => $faker->unique()->safeEmail(),
            'description' => $faker->boolean(70) ? $faker->paragraph() : null,
            'status'      => $faker->randomElement($statuses),
        ]);

        // Build a request with the X-Inertia header so the controller returns JSON
        $request = Request::create("/admin/hotels/{$hotel->id}/edit", 'GET');
        $request->headers->set('X-Inertia', 'true');
        $request->headers->set('X-Inertia-Version', '1');

        // Call the controller edit method directly (no route dependency)
        $controller = new HotelController();
        $inertiaResponse = $controller->edit($hotel);

        // Resolve to an HTTP response and decode the JSON
        $httpResponse = $inertiaResponse->toResponse($request);
        $page = $httpResponse->getData(true);

        $hotelProp = $page['props']['hotel'];

        // Assert all hotel fields are present and match the created hotel
        expect($hotelProp)->toHaveKey('id');
        expect($hotelProp['id'])->toBe($hotel->id);

        expect($hotelProp)->toHaveKey('name');
        expect($hotelProp['name'])->toBe($hotel->name);

        expect($hotelProp)->toHaveKey('address');
        expect($hotelProp['address'])->toBe($hotel->address);

        expect($hotelProp)->toHaveKey('city');
        expect($hotelProp['city'])->toBe($hotel->city);

        expect($hotelProp)->toHaveKey('country');
        expect($hotelProp['country'])->toBe($hotel->country);

        expect($hotelProp)->toHaveKey('star_rating');
        expect($hotelProp['star_rating'])->toBe($hotel->star_rating);

        expect($hotelProp)->toHaveKey('phone');
        expect($hotelProp['phone'])->toBe($hotel->phone);

        expect($hotelProp)->toHaveKey('email');
        expect($hotelProp['email'])->toBe($hotel->email);

        expect($hotelProp)->toHaveKey('description');
        expect($hotelProp['description'])->toBe($hotel->description);

        expect($hotelProp)->toHaveKey('status');
        expect($hotelProp['status'])->toBe($hotel->status);
    }
});
