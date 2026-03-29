<?php

// Feature: hotel-registration-crud, Property 2: User deletion cascades to hotels

use App\Enums\Role;
use App\Models\Hotel;
use App\Models\User;
use Faker\Factory as FakerFactory;

/**
 * Property 2: User deletion cascades to hotels
 * Validates: Requirements 1.3
 *
 * For any user who owns one or more hotels, deleting that user should result
 * in all of their hotels also being deleted from the database.
 */
test('Property 2: user deletion cascades to hotels across 100 random iterations', function () {
    $faker = FakerFactory::create();
    $statuses = ['active', 'inactive', 'pending'];

    for ($i = 0; $i < 100; $i++) {
        // Create a partner user
        $partner = User::create([
            'name' => $faker->name(),
            'email' => $faker->unique()->safeEmail(),
            'password' => bcrypt($faker->password()),
            'role' => Role::Partner,
        ]);

        // Create 1–5 random hotels owned by this user
        $hotelCount = $faker->numberBetween(1, 5);
        $hotelIds = [];

        for ($j = 0; $j < $hotelCount; $j++) {
            $hotel = Hotel::create([
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
            $hotelIds[] = $hotel->id;
        }

        // Verify hotels exist before deletion
        expect(Hotel::whereIn('id', $hotelIds)->count())->toBe($hotelCount);

        // Delete the user
        $partner->delete();

        // Assert all hotels owned by this user are gone from the DB
        expect(Hotel::whereIn('id', $hotelIds)->count())->toBe(0);
        expect(Hotel::where('user_id', $partner->id)->count())->toBe(0);
    }
});
