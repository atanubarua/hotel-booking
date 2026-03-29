<?php

// Feature: hotel-registration-crud, Property 10: Hotel update persists new values

use App\Enums\Role;
use App\Models\Hotel;
use App\Models\User;
use Faker\Factory as FakerFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Property 10: Hotel update persists new values
 * Validates: Requirements 5.3
 *
 * For any hotel in the database, calling $hotel->update() with a valid payload
 * should persist all new field values to the database. After refreshing the
 * model from the database, every field must reflect the updated values.
 */
test('Property 10: hotel update persists new values across 100 random iterations', function () {
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

        // Create a hotel with initial random data
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

        // Generate a new valid update payload with different random values
        $newData = [
            'name'        => $faker->company(),
            'address'     => $faker->streetAddress(),
            'city'        => $faker->city(),
            'country'     => $faker->country(),
            'star_rating' => $faker->numberBetween(1, 5),
            'phone'       => $faker->numerify('##########'),
            'email'       => $faker->unique()->safeEmail(),
            'description' => $faker->boolean(70) ? $faker->paragraph() : null,
            'status'      => $faker->randomElement($statuses),
        ];

        // Call update directly on the model (mirrors what HotelController::update does)
        $hotel->update($newData);

        // Refresh from DB to confirm persistence
        $hotel->refresh();

        // Assert all fields reflect the new values
        expect($hotel->name)->toBe($newData['name']);
        expect($hotel->address)->toBe($newData['address']);
        expect($hotel->city)->toBe($newData['city']);
        expect($hotel->country)->toBe($newData['country']);
        expect($hotel->star_rating)->toBe($newData['star_rating']);
        expect($hotel->phone)->toBe($newData['phone']);
        expect($hotel->email)->toBe($newData['email']);
        expect($hotel->description)->toBe($newData['description']);
        expect($hotel->status)->toBe($newData['status']);
    }
});
