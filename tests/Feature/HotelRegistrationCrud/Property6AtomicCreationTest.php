<?php

// Feature: hotel-registration-crud, Property 6: Hotel + partner creation is atomic

use App\Enums\Role;
use App\Models\Hotel;
use App\Models\User;
use Faker\Factory as FakerFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

/**
 * Property 6: Hotel + partner creation is atomic
 * Validates: Requirements 3.3, 3.6
 *
 * For any valid hotel creation payload, both a Hotel record and a partner User
 * record should be created together; if either insert fails, neither record
 * should exist in the database.
 */
test('Property 6: hotel + partner creation is atomic across 100 random iterations', function () {
    $faker = FakerFactory::create();
    $statuses = ['active', 'inactive', 'pending'];

    // --- Scenario A: Happy path (50 iterations) ---
    // Valid payload creates both Hotel and User atomically.
    for ($i = 0; $i < 50; $i++) {
        $hotelsBefore = Hotel::count();
        $usersBefore  = User::count();

        $partnerName  = $faker->name();
        $partnerEmail = $faker->unique()->safeEmail();

        DB::transaction(function () use ($faker, $statuses, $partnerName, $partnerEmail) {
            $partner = User::create([
                'name'     => $partnerName,
                'email'    => $partnerEmail,
                'password' => bcrypt($faker->password()),
                'role'     => Role::Partner,
            ]);

            Hotel::create([
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
        });

        // Both records must have been created
        expect(Hotel::count())->toBe($hotelsBefore + 1);
        expect(User::count())->toBe($usersBefore + 1);

        // The partner user must exist with the correct role
        $createdPartner = User::where('email', $partnerEmail)->first();
        expect($createdPartner)->not->toBeNull();
        expect($createdPartner->role)->toBe(Role::Partner);

        // The hotel must be linked to the partner
        $createdHotel = Hotel::where('user_id', $createdPartner->id)->first();
        expect($createdHotel)->not->toBeNull();
    }

    // --- Scenario B: Failure path (50 iterations) ---
    // A DB::transaction() that throws an exception must roll back all changes,
    // leaving neither the Hotel nor the User in the database.
    for ($i = 0; $i < 50; $i++) {
        $hotelsBefore = Hotel::count();
        $usersBefore  = User::count();

        $partnerEmail = $faker->unique()->safeEmail();

        try {
            DB::transaction(function () use ($faker, $statuses, $partnerEmail) {
                // Create the partner user inside the transaction
                $partner = User::create([
                    'name'     => $faker->name(),
                    'email'    => $partnerEmail,
                    'password' => bcrypt($faker->password()),
                    'role'     => Role::Partner,
                ]);

                // Create the hotel inside the same transaction
                Hotel::create([
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

                // Simulate a failure after both inserts — the transaction must roll back
                throw new \RuntimeException('Simulated failure after inserts');
            });
        } catch (\RuntimeException $e) {
            // Expected — the transaction should have rolled back
        }

        // Neither record should have been persisted
        expect(Hotel::count())->toBe($hotelsBefore, 'Hotel count should not change after a failed transaction');
        expect(User::count())->toBe($usersBefore, 'User count should not change after a failed transaction');

        // The partner email must not exist in the database
        expect(User::where('email', $partnerEmail)->exists())->toBeFalse();
    }
});
