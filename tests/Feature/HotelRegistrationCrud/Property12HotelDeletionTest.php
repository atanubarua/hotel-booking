<?php

// Feature: hotel-registration-crud, Property 12: Hotel deletion removes the record

use App\Enums\Role;
use App\Models\Hotel;
use App\Models\User;
use Faker\Factory as FakerFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Property 12: Hotel deletion removes the record
 * Validates: Requirements 6.1
 *
 * For any hotel record, calling delete() on it should result in the record
 * no longer being retrievable from the database.
 */
test('Property 12: hotel deletion removes the record across 100 random iterations', function () {
    $faker = FakerFactory::create();
    $statuses = ['active', 'inactive', 'pending'];

    for ($i = 0; $i < 100; $i++) {
        // Create a partner user
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
            'email'       => $faker->safeEmail(),
            'description' => $faker->boolean(70) ? $faker->paragraph() : null,
            'status'      => $faker->randomElement($statuses),
        ]);

        // Record the hotel's ID
        $hotelId = $hotel->id;

        // Assert the hotel exists before deletion
        expect(Hotel::find($hotelId))->not->toBeNull();

        // Delete the hotel
        $hotel->delete();

        // Assert the hotel no longer exists in the DB
        expect(Hotel::find($hotelId))->toBeNull();
    }
});
