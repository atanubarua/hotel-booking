<?php

// Feature: hotel-registration-crud, Property 15: Partner hotel list is scoped to the authenticated partner

use App\Enums\Role;
use App\Http\Controllers\Partner\PartnerHotelController;
use App\Models\Hotel;
use App\Models\User;
use Faker\Factory as FakerFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

uses(RefreshDatabase::class);

/**
 * Property 15: Partner hotel list is scoped to the authenticated partner
 * Validates: Requirements 10.1, 10.2
 *
 * For any two partners with hotels in the database, the partner hotel list
 * endpoint should return ONLY hotels belonging to the authenticated partner,
 * and never return hotels belonging to another partner.
 */
test('Property 15: partner hotel list is scoped to authenticated partner across 100 random iterations', function () {
    $faker = FakerFactory::create();
    $statuses = ['active', 'inactive', 'pending'];

    for ($i = 0; $i < 100; $i++) {
        // Create partner A
        $partnerA = User::create([
            'name' => $faker->name(),
            'email' => $faker->unique()->safeEmail(),
            'password' => bcrypt($faker->password()),
            'role' => Role::Partner,
        ]);

        // Create partner B
        $partnerB = User::create([
            'name' => $faker->name(),
            'email' => $faker->unique()->safeEmail(),
            'password' => bcrypt($faker->password()),
            'role' => Role::Partner,
        ]);

        // Create 1–5 hotels for partner A
        $hotelCountA = $faker->numberBetween(1, 5);
        for ($j = 0; $j < $hotelCountA; $j++) {
            Hotel::create([
                'user_id' => $partnerA->id,
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

        // Create 1–5 hotels for partner B
        $hotelCountB = $faker->numberBetween(1, 5);
        for ($j = 0; $j < $hotelCountB; $j++) {
            Hotel::create([
                'user_id' => $partnerB->id,
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

        // Authenticate as partner A and call the controller index directly
        Auth::login($partnerA);

        $request = Request::create('/partner/hotels', 'GET');
        $request->headers->set('X-Inertia', 'true');
        $request->headers->set('X-Inertia-Version', '1');
        $request->setUserResolver(fn () => $partnerA);

        $controller = new PartnerHotelController();
        $inertiaResponse = $controller->index($request);

        $httpResponse = $inertiaResponse->toResponse($request);
        $page = $httpResponse->getData(true);

        $hotelsData = $page['props']['hotels']['data'];

        // Assert ALL returned hotels belong to partner A
        foreach ($hotelsData as $hotel) {
            expect($hotel['user_id'])->toBe($partnerA->id);
        }

        // Assert no hotels belonging to partner B are returned
        $returnedUserIds = array_column($hotelsData, 'user_id');
        expect(in_array($partnerB->id, $returnedUserIds))->toBeFalse();

        Auth::logout();
    }
});
