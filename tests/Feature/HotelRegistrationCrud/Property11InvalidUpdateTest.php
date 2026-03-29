<?php

// Feature: hotel-registration-crud, Property 11: Invalid update returns validation errors

use App\Enums\Role;
use App\Http\Requests\UpdateHotelRequest;
use App\Models\Hotel;
use App\Models\User;
use Faker\Factory as FakerFactory;
use Illuminate\Support\Facades\Validator;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

/**
 * Property 11: Invalid update returns validation errors
 * Validates: Requirements 5.4
 *
 * For any invalid update payload, validation must fail and the hotel record
 * in the database must remain unchanged.
 */
test('Property 11: invalid update returns validation errors across 100 random iterations', function () {
    $faker = FakerFactory::create();
    $validStatuses = ['active', 'inactive', 'pending'];
    $invalidStatuses = ['unknown', 'disabled', 'archived', 'open', 'closed', ''];
    $invalidTypes = [0, 6, -1, 10, 99];

    for ($i = 0; $i < 100; $i++) {
        // Create a partner user and a valid hotel
        $partner = User::create([
            'name'     => $faker->name(),
            'email'    => $faker->unique()->safeEmail(),
            'password' => bcrypt($faker->password()),
            'role'     => Role::Partner,
        ]);

        $original = Hotel::create([
            'user_id'     => $partner->id,
            'name'        => $faker->company(),
            'address'     => $faker->streetAddress(),
            'city'        => $faker->city(),
            'country'     => $faker->country(),
            'star_rating' => $faker->numberBetween(1, 5),
            'phone'       => $faker->numerify('##########'),
            'email'       => $faker->safeEmail(),
            'description' => $faker->optional(0.5)->paragraph(),
            'status'      => $faker->randomElement($validStatuses),
        ]);

        // Pick a random invalid payload type
        $invalidType = $i % 4;

        $payload = match ($invalidType) {
            // Missing name (empty string)
            0 => [
                'name'        => '',
                'address'     => $faker->streetAddress(),
                'city'        => $faker->city(),
                'country'     => $faker->country(),
                'star_rating' => $faker->numberBetween(1, 5),
                'phone'       => $faker->numerify('##########'),
                'email'       => $faker->safeEmail(),
                'description' => $faker->optional()->paragraph(),
                'status'      => $faker->randomElement($validStatuses),
            ],
            // star_rating out of range (0 or 6)
            1 => [
                'name'        => $faker->company(),
                'address'     => $faker->streetAddress(),
                'city'        => $faker->city(),
                'country'     => $faker->country(),
                'star_rating' => $faker->randomElement($invalidTypes),
                'phone'       => $faker->numerify('##########'),
                'email'       => $faker->safeEmail(),
                'description' => $faker->optional()->paragraph(),
                'status'      => $faker->randomElement($validStatuses),
            ],
            // Invalid status value
            2 => [
                'name'        => $faker->company(),
                'address'     => $faker->streetAddress(),
                'city'        => $faker->city(),
                'country'     => $faker->country(),
                'star_rating' => $faker->numberBetween(1, 5),
                'phone'       => $faker->numerify('##########'),
                'email'       => $faker->safeEmail(),
                'description' => $faker->optional()->paragraph(),
                'status'      => $faker->randomElement($invalidStatuses),
            ],
            // Missing required field (omit a random required field)
            default => (function () use ($faker, $validStatuses) {
                $full = [
                    'name'        => $faker->company(),
                    'address'     => $faker->streetAddress(),
                    'city'        => $faker->city(),
                    'country'     => $faker->country(),
                    'star_rating' => $faker->numberBetween(1, 5),
                    'phone'       => $faker->numerify('##########'),
                    'email'       => $faker->safeEmail(),
                    'description' => $faker->optional()->paragraph(),
                    'status'      => $faker->randomElement($validStatuses),
                ];
                $required = ['name', 'address', 'city', 'country', 'star_rating', 'phone', 'email', 'status'];
                $fieldToRemove = $faker->randomElement($required);
                unset($full[$fieldToRemove]);

                return $full;
            })(),
        };

        // Validate using UpdateHotelRequest rules
        $validator = Validator::make($payload, (new UpdateHotelRequest())->rules());

        // Assert validation fails
        expect($validator->fails())->toBeTrue(
            "Expected validation to fail for payload type {$invalidType} on iteration {$i}"
        );

        // Assert the hotel record in DB is unchanged
        $fresh = $original->fresh();
        expect($fresh->name)->toBe($original->name);
        expect($fresh->address)->toBe($original->address);
        expect($fresh->city)->toBe($original->city);
        expect($fresh->country)->toBe($original->country);
        expect($fresh->star_rating)->toBe($original->star_rating);
        expect($fresh->phone)->toBe($original->phone);
        expect($fresh->email)->toBe($original->email);
        expect($fresh->status)->toBe($original->status);
    }
});
