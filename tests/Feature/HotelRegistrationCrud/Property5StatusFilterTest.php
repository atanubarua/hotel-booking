<?php

// Feature: hotel-registration-crud, Property 5: Status filter returns only matching hotels

use App\Enums\Role;
use App\Http\Controllers\Admin\HotelController;
use App\Models\Hotel;
use App\Models\User;
use Faker\Factory as FakerFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;

uses(RefreshDatabase::class);

/**
 * Property 5: Status filter returns only matching hotels
 * Validates: Requirements 2.3
 *
 * For any set of hotels with mixed statuses, filtering by a specific status
 * should return only hotels that have exactly that status value.
 */
test('Property 5: status filter returns only matching hotels across 100 random iterations', function () {
    $faker = FakerFactory::create();
    $statuses = ['active', 'inactive', 'pending'];

    for ($i = 0; $i < 100; $i++) {
        // Create hotels with mixed statuses, each with their own partner user
        $hotelCount = $faker->numberBetween(3, 20);

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

        // Pick a random status to filter by
        $filterStatus = $faker->randomElement($statuses);

        // Build a request with the status filter and X-Inertia header
        $request = Request::create('/admin/hotels', 'GET', ['status' => $filterStatus]);
        $request->headers->set('X-Inertia', 'true');
        $request->headers->set('X-Inertia-Version', '1');

        // Call the controller index method directly (no route dependency)
        $controller = new HotelController();
        $inertiaResponse = $controller->index($request);

        // Resolve to an HTTP response and decode the JSON
        $httpResponse = $inertiaResponse->toResponse($request);
        $page = $httpResponse->getData(true);

        $hotelsData = $page['props']['hotels']['data'];

        // Assert ALL returned hotels have exactly the filtered status value
        foreach ($hotelsData as $hotel) {
            expect($hotel['status'])->toBe($filterStatus);
        }
    }
});
