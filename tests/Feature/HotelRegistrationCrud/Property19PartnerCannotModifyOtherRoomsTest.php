<?php

// Feature: hotel-registration-crud, Property 19: Partner cannot modify rooms belonging to other partners

use App\Enums\Role;
use App\Http\Controllers\Partner\PartnerRoomController;
use App\Http\Requests\UpdateRoomRequest;
use App\Models\Hotel;
use App\Models\Room;
use App\Models\User;
use Faker\Factory as FakerFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpKernel\Exception\HttpException;

uses(RefreshDatabase::class);

/**
 * Property 19: Partner cannot modify rooms belonging to other partners
 * Validates: Requirements 11.3, 11.4
 *
 * For any room whose hotel does not belong to the authenticated partner, any edit,
 * update, or destroy request from that partner should return a 403 Forbidden response.
 */
test('Property 19: partner cannot modify rooms belonging to other partners across 100 random iterations', function () {
    $faker = FakerFactory::create();
    $roomTypes = ['Standard', 'Deluxe', 'Suite'];
    $roomStatuses = ['available', 'occupied', 'maintenance'];
    $hotelStatuses = ['active', 'inactive', 'pending'];

    for ($i = 0; $i < 100; $i++) {
        // Create partner A (the attacker)
        $partnerA = User::create([
            'name'     => $faker->name(),
            'email'    => $faker->unique()->safeEmail(),
            'password' => bcrypt($faker->password()),
            'role'     => Role::Partner,
        ]);

        // Create partner B (the owner)
        $partnerB = User::create([
            'name'     => $faker->name(),
            'email'    => $faker->unique()->safeEmail(),
            'password' => bcrypt($faker->password()),
            'role'     => Role::Partner,
        ]);

        // Create a hotel owned by partner B
        $hotel = Hotel::create([
            'user_id'     => $partnerB->id,
            'name'        => $faker->company(),
            'address'     => $faker->streetAddress(),
            'city'        => $faker->city(),
            'country'     => $faker->country(),
            'star_rating' => $faker->numberBetween(1, 5),
            'phone'       => $faker->numerify('##########'),
            'email'       => $faker->safeEmail(),
            'description' => $faker->boolean(70) ? $faker->paragraph() : null,
            'status'      => $faker->randomElement($hotelStatuses),
        ]);

        // Create a room belonging to partner B's hotel
        $room = Room::create([
            'hotel_id'       => $hotel->id,
            'name'           => $faker->words(3, true),
            'type'           => $faker->randomElement($roomTypes),
            'capacity'       => $faker->numberBetween(1, 6),
            'price_per_night' => $faker->randomFloat(2, 50, 500),
            'status'         => $faker->randomElement($roomStatuses),
        ]);

        // Authenticate as partner A
        Auth::login($partnerA);

        $controller = new PartnerRoomController();

        // --- Test edit() ---
        $editException = null;
        try {
            $controller->edit($room);
        } catch (HttpException $e) {
            $editException = $e;
        }

        expect($editException)->not->toBeNull(
            "Iteration {$i}: edit() should throw HttpException for partner A accessing partner B's room"
        );
        expect($editException->getStatusCode())->toBe(403,
            "Iteration {$i}: edit() should return 403, got {$editException->getStatusCode()}"
        );

        // --- Test update() ---
        $updateRequest = UpdateRoomRequest::create('/partner/rooms/'.$room->id, 'PUT', [
            'hotel_id'        => $hotel->id,
            'name'            => $faker->words(3, true),
            'type'            => $faker->randomElement($roomTypes),
            'capacity'        => $faker->numberBetween(1, 6),
            'price_per_night' => $faker->randomFloat(2, 50, 500),
            'status'          => $faker->randomElement($roomStatuses),
        ]);
        $updateRequest->setUserResolver(fn () => $partnerA);

        $updateException = null;
        try {
            $controller->update($updateRequest, $room);
        } catch (HttpException $e) {
            $updateException = $e;
        }

        expect($updateException)->not->toBeNull(
            "Iteration {$i}: update() should throw HttpException for partner A accessing partner B's room"
        );
        expect($updateException->getStatusCode())->toBe(403,
            "Iteration {$i}: update() should return 403, got {$updateException->getStatusCode()}"
        );

        // --- Test destroy() ---
        $destroyException = null;
        try {
            $controller->destroy($room);
        } catch (HttpException $e) {
            $destroyException = $e;
        }

        expect($destroyException)->not->toBeNull(
            "Iteration {$i}: destroy() should throw HttpException for partner A accessing partner B's room"
        );
        expect($destroyException->getStatusCode())->toBe(403,
            "Iteration {$i}: destroy() should return 403, got {$destroyException->getStatusCode()}"
        );

        Auth::logout();
    }
});
