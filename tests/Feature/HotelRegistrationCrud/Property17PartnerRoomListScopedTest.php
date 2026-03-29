<?php

// Feature: hotel-registration-crud, Property 17: Partner room list is scoped to partner's hotels

use App\Enums\Role;
use App\Http\Controllers\Partner\PartnerRoomController;
use App\Models\Hotel;
use App\Models\Room;
use App\Models\User;
use Faker\Factory as FakerFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

uses(RefreshDatabase::class);

/**
 * Property 17: Partner room list is scoped to partner's hotels
 * Validates: Requirements 11.1
 *
 * For any two partners with hotels and rooms in the database, the partner room list
 * endpoint should return ONLY rooms belonging to hotels owned by the authenticated partner,
 * and never return rooms belonging to another partner's hotels.
 */
test('Property 17: partner room list is scoped to authenticated partner hotels across 100 random iterations', function () {
    $faker = FakerFactory::create();
    $statuses = ['available', 'occupied', 'maintenance'];
    $types = ['Standard', 'Deluxe', 'Suite'];
    $hotelStatuses = ['active', 'inactive', 'pending'];

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

        // Create 1–3 hotels for partner A, each with 1–3 rooms
        $hotelCountA = $faker->numberBetween(1, 3);
        $hotelAIds = [];
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
                'status' => $faker->randomElement($hotelStatuses),
            ]);
            $hotelAIds[] = $hotel->id;

            $roomCount = $faker->numberBetween(1, 3);
            for ($k = 0; $k < $roomCount; $k++) {
                Room::create([
                    'hotel_id' => $hotel->id,
                    'name' => $faker->words(2, true),
                    'type' => $faker->randomElement($types),
                    'capacity' => $faker->numberBetween(1, 4),
                    'price_per_night' => $faker->randomFloat(2, 50, 500),
                    'status' => $faker->randomElement($statuses),
                ]);
            }
        }

        // Create 1–3 hotels for partner B, each with 1–3 rooms
        $hotelCountB = $faker->numberBetween(1, 3);
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
                'status' => $faker->randomElement($hotelStatuses),
            ]);

            $roomCount = $faker->numberBetween(1, 3);
            for ($k = 0; $k < $roomCount; $k++) {
                Room::create([
                    'hotel_id' => $hotel->id,
                    'name' => $faker->words(2, true),
                    'type' => $faker->randomElement($types),
                    'capacity' => $faker->numberBetween(1, 4),
                    'price_per_night' => $faker->randomFloat(2, 50, 500),
                    'status' => $faker->randomElement($statuses),
                ]);
            }
        }

        // Authenticate as partner A and call the controller index directly
        Auth::login($partnerA);

        $request = Request::create('/partner/rooms', 'GET');
        $request->headers->set('X-Inertia', 'true');
        $request->headers->set('X-Inertia-Version', '1');
        $request->setUserResolver(fn () => $partnerA);

        $controller = new PartnerRoomController();
        $inertiaResponse = $controller->index($request);

        $httpResponse = $inertiaResponse->toResponse($request);
        $page = $httpResponse->getData(true);

        $roomsData = $page['props']['rooms']['data'];

        // Assert ALL returned rooms belong to hotels owned by partner A
        foreach ($roomsData as $room) {
            expect(in_array($room['hotel_id'], $hotelAIds))->toBeTrue();
        }

        // Assert no rooms belonging to partner B's hotels are returned
        $returnedHotelIds = array_column($roomsData, 'hotel_id');
        $partnerBHotelIds = Hotel::where('user_id', $partnerB->id)->pluck('id')->toArray();
        $overlap = array_intersect($returnedHotelIds, $partnerBHotelIds);
        expect($overlap)->toBeEmpty();

        Auth::logout();
    }
});
