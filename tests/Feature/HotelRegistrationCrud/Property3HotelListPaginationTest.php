<?php

// Feature: hotel-registration-crud, Property 3: Hotel list pagination is bounded

use App\Enums\Role;
use App\Http\Controllers\Admin\HotelController;
use App\Models\Hotel;
use App\Models\User;
use Faker\Factory as FakerFactory;
use Illuminate\Http\Request;
use Inertia\Testing\AssertableInertia;

/**
 * Property 3: Hotel list pagination is bounded
 * Validates: Requirements 2.1
 *
 * For any number of hotels in the database (between 1 and 30), the admin hotel
 * list endpoint should return at most 15 hotels per page, and each hotel item
 * should include a partner_name field.
 */
test('Property 3: hotel list pagination is bounded across 100 random iterations', function () {
    $faker = FakerFactory::create();
    $statuses = ['active', 'inactive', 'pending'];

    for ($i = 0; $i < 100; $i++) {
        // Create an admin user
        $admin = User::create([
            'name' => $faker->name(),
            'email' => $faker->unique()->safeEmail(),
            'password' => bcrypt($faker->password()),
            'role' => Role::Admin,
        ]);

        // Create a random number of hotels (1–30) each with their own partner user
        $hotelCount = $faker->numberBetween(1, 30);

        for ($j = 0; $j < $hotelCount; $j++) {
            $partner = User::create([
                'name' => $faker->name(),
                'email' => $faker->unique()->safeEmail(),
                'password' => bcrypt($faker->password()),
                'role' => Role::Partner,
            ]);

            Hotel::create([
                'user_id' => $partner->id,
                'name' => $faker->company(),
                'address' => $faker->streetAddress(),
                'city' => $faker->city(),
                'country' => $faker->country(),
                'star_rating' => $faker->numberBetween(1, 5),
                'phone' => $faker->numerify('##########'),
                'email' => $faker->safeEmail(),
                'description' => $faker->boolean(70) ? $faker->paragraph() : null,
                'status' => $faker->randomElement($statuses),
            ]);
        }

        // Build a request with the X-Inertia header so the controller returns JSON
        $request = Request::create('/admin/hotels', 'GET');
        $request->headers->set('X-Inertia', 'true');
        $request->headers->set('X-Inertia-Version', '1');

        // Call the controller index method directly (no route dependency)
        $controller = new HotelController();
        $inertiaResponse = $controller->index($request);

        // Resolve to an HTTP response and decode the JSON
        $httpResponse = $inertiaResponse->toResponse($request);
        $page = $httpResponse->getData(true);

        $hotelsData = $page['props']['hotels']['data'];

        // Assert at most 15 hotels are returned on the first page
        expect(count($hotelsData))->toBeLessThanOrEqual(15);

        // Assert each hotel item has a partner_name field
        foreach ($hotelsData as $hotel) {
            expect($hotel)->toHaveKey('partner_name');
            expect($hotel['partner_name'])->not->toBeNull();
        }
    }
});
