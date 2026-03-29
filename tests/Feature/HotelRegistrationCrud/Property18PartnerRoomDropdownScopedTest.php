<?php

// Feature: hotel-registration-crud, Property 18: Partner room hotel dropdown is scoped to partner's hotels

use App\Enums\Role;
use App\Http\Controllers\Partner\PartnerRoomController;
use App\Models\Hotel;
use App\Models\User;
use Faker\Factory as FakerFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

uses(RefreshDatabase::class);

/**
 * Property 18: Partner room hotel dropdown is scoped to partner's hotels
 * Validates: Requirements 11.2
 *
 * For any two partners with hotels in the database, the room create page
 * should only expose hotels belonging to the authenticated partner in the
 * hotels dropdown, never hotels belonging to another partner.
 */
test('Property 18: partner room hotel dropdown is scoped to authenticated partner across 100 random iterations', function () {
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
        $partnerAHotelIds = [];
        for ($j = 0; $j < $hotelCountA; $j++) {
            $hotel = Hotel::create([
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
            $partnerAHotelIds[] = $hotel->id;
        }

        // Create 1–5 hotels for partner B
        $hotelCountB = $faker->numberBetween(1, 5);
        $partnerBHotelIds = [];
        for ($j = 0; $j < $hotelCountB; $j++) {
            $hotel = Hotel::create([
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
            $partnerBHotelIds[] = $hotel->id;
        }

        // Authenticate as partner A and call the controller create directly
        Auth::login($partnerA);

        $request = Request::create('/partner/rooms/create', 'GET');
        $request->headers->set('X-Inertia', 'true');
        $request->headers->set('X-Inertia-Version', '1');
        $request->setUserResolver(fn () => $partnerA);

        $controller = new PartnerRoomController();
        $inertiaResponse = $controller->create();

        $httpResponse = $inertiaResponse->toResponse($request);
        $page = $httpResponse->getData(true);

        $hotelsInDropdown = $page['props']['hotels'];
        $dropdownIds = array_column($hotelsInDropdown, 'id');

        // Assert ALL hotels in the dropdown belong to partner A
        foreach ($dropdownIds as $id) {
            expect(in_array($id, $partnerAHotelIds))->toBeTrue();
        }

        // Assert no hotels belonging to partner B are in the dropdown
        foreach ($partnerBHotelIds as $bId) {
            expect(in_array($bId, $dropdownIds))->toBeFalse();
        }

        Auth::logout();
    }
});
