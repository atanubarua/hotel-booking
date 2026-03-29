<?php

// Feature: hotel-registration-crud, Property 1: Hotel model round-trip persistence

use App\Enums\Role;
use App\Models\Hotel;
use App\Models\User;
use Faker\Factory as FakerFactory;

/**
 * Property 1: Hotel model round-trip persistence
 * Validates: Requirements 1.2
 *
 * For any valid set of hotel field values, creating a Hotel record and then
 * retrieving it should return the same field values, and hotel->partner should
 * resolve to the correct User.
 */
test('Property 1: hotel model round-trip persistence across 100 random iterations', function () {
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

        // Generate random valid hotel data
        $description = $faker->boolean(70) ? $faker->paragraph() : null;
        $hotelData = [
            'user_id' => $partner->id,
            'name' => $faker->company(),
            'address' => $faker->streetAddress(),
            'city' => $faker->city(),
            'country' => $faker->country(),
            'star_rating' => $faker->numberBetween(1, 5),
            'phone' => $faker->numerify('##########'),
            'email' => $faker->safeEmail(),
            'description' => $description,
            'status' => $faker->randomElement($statuses),
        ];

        // Create the hotel
        $hotel = Hotel::create($hotelData);

        // Retrieve the hotel fresh from the database
        $retrieved = Hotel::find($hotel->id);

        // Assert the hotel was persisted
        expect($retrieved)->not->toBeNull();

        // Assert all fields match
        expect($retrieved->name)->toBe($hotelData['name']);
        expect($retrieved->address)->toBe($hotelData['address']);
        expect($retrieved->city)->toBe($hotelData['city']);
        expect($retrieved->country)->toBe($hotelData['country']);
        expect((int) $retrieved->star_rating)->toBe($hotelData['star_rating']);
        expect($retrieved->phone)->toBe($hotelData['phone']);
        expect($retrieved->email)->toBe($hotelData['email']);
        expect($retrieved->description)->toBe($hotelData['description']);
        expect($retrieved->status)->toBe($hotelData['status']);
        expect((int) $retrieved->user_id)->toBe($partner->id);

        // Assert hotel->partner resolves to the correct User
        $resolvedPartner = $retrieved->partner;
        expect($resolvedPartner)->not->toBeNull();
        expect($resolvedPartner->id)->toBe($partner->id);
        expect($resolvedPartner->email)->toBe($partner->email);
        expect($resolvedPartner->name)->toBe($partner->name);
    }
});
