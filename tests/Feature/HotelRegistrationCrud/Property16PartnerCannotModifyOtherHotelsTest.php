<?php

// Feature: hotel-registration-crud, Property 16: Partner cannot modify hotels they do not own

use App\Enums\Role;
use App\Http\Controllers\Partner\PartnerHotelController;
use App\Http\Requests\UpdateHotelRequest;
use App\Models\Hotel;
use App\Models\User;
use Faker\Factory as FakerFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpKernel\Exception\HttpException;

uses(RefreshDatabase::class);

/**
 * Property 16: Partner cannot modify hotels they do not own
 * Validates: Requirements 10.3, 10.5
 *
 * For any hotel that does not belong to the authenticated partner, any edit,
 * update, or destroy request from that partner should return a 403 Forbidden response.
 */
test('Property 16: partner cannot modify hotels they do not own across 100 random iterations', function () {
    $faker = FakerFactory::create();
    $statuses = ['active', 'inactive', 'pending'];

    for ($i = 0; $i < 100; $i++) {
        // Create partner A (the attacker)
        $partnerA = User::create([
            'name' => $faker->name(),
            'email' => $faker->unique()->safeEmail(),
            'password' => bcrypt($faker->password()),
            'role' => Role::Partner,
        ]);

        // Create partner B (the owner)
        $partnerB = User::create([
            'name' => $faker->name(),
            'email' => $faker->unique()->safeEmail(),
            'password' => bcrypt($faker->password()),
            'role' => Role::Partner,
        ]);

        // Create a hotel owned by partner B
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

        // Authenticate as partner A
        Auth::login($partnerA);

        $controller = new PartnerHotelController();

        // --- Test edit() ---
        $editException = null;
        try {
            $controller->edit($hotel);
        } catch (HttpException $e) {
            $editException = $e;
        }

        expect($editException)->not->toBeNull(
            "Iteration {$i}: edit() should throw HttpException for partner A accessing partner B's hotel"
        );
        expect($editException->getStatusCode())->toBe(403,
            "Iteration {$i}: edit() should return 403, got {$editException->getStatusCode()}"
        );

        // --- Test update() ---
        $updateRequest = UpdateHotelRequest::create('/partner/hotels/'.$hotel->id, 'PUT', [
            'name' => $faker->company(),
            'address' => $faker->streetAddress(),
            'city' => $faker->city(),
            'country' => $faker->country(),
            'star_rating' => $faker->numberBetween(1, 5),
            'phone' => $faker->numerify('##########'),
            'email' => $faker->safeEmail(),
            'status' => $faker->randomElement($statuses),
        ]);
        $updateRequest->setUserResolver(fn () => $partnerA);

        $updateException = null;
        try {
            $controller->update($updateRequest, $hotel);
        } catch (HttpException $e) {
            $updateException = $e;
        }

        expect($updateException)->not->toBeNull(
            "Iteration {$i}: update() should throw HttpException for partner A accessing partner B's hotel"
        );
        expect($updateException->getStatusCode())->toBe(403,
            "Iteration {$i}: update() should return 403, got {$updateException->getStatusCode()}"
        );

        // --- Test destroy() ---
        $destroyException = null;
        try {
            $controller->destroy($hotel);
        } catch (HttpException $e) {
            $destroyException = $e;
        }

        expect($destroyException)->not->toBeNull(
            "Iteration {$i}: destroy() should throw HttpException for partner A accessing partner B's hotel"
        );
        expect($destroyException->getStatusCode())->toBe(403,
            "Iteration {$i}: destroy() should return 403, got {$destroyException->getStatusCode()}"
        );

        Auth::logout();
    }
});
