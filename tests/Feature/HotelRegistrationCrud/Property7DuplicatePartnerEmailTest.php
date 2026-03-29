<?php

// Feature: hotel-registration-crud, Property 7: Duplicate partner email is rejected

use App\Enums\Role;
use App\Http\Requests\StoreHotelRequest;
use App\Models\Hotel;
use App\Models\User;
use Faker\Factory as FakerFactory;
use Illuminate\Support\Facades\Validator;

uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

/**
 * Property 7: Duplicate partner email is rejected
 * Validates: Requirements 3.4
 *
 * For any email that already exists in the users table, submitting a hotel
 * creation payload with that email as partner_email must fail validation with
 * an error on partner_email, and no new User or Hotel record should be created.
 */
test('Property 7: duplicate partner email is rejected across 100 random iterations', function () {
    $faker = FakerFactory::create();
    $statuses = ['active', 'inactive', 'pending'];

    for ($i = 0; $i < 100; $i++) {
        // Create an existing user with a random email
        $existingUser = User::create([
            'name'     => $faker->name(),
            'email'    => $faker->unique()->safeEmail(),
            'password' => bcrypt($faker->password()),
            'role'     => Role::Partner,
        ]);

        $userCountBefore  = User::count();
        $hotelCountBefore = Hotel::count();

        // Build a valid hotel payload using the existing email as partner_email
        $payload = [
            'name'          => $faker->company(),
            'address'       => $faker->streetAddress(),
            'city'          => $faker->city(),
            'country'       => $faker->country(),
            'star_rating'   => $faker->numberBetween(1, 5),
            'phone'         => $faker->numerify('##########'),
            'email'         => $faker->safeEmail(),
            'description'   => $faker->optional(0.7)->paragraph(),
            'status'        => $faker->randomElement($statuses),
            'partner_name'  => $faker->name(),
            'partner_email' => $existingUser->email, // duplicate
        ];

        // Validate using StoreHotelRequest rules
        $validator = Validator::make($payload, (new StoreHotelRequest())->rules());

        // Assert validation fails
        expect($validator->fails())->toBeTrue();

        // Assert the error is specifically on partner_email
        expect($validator->errors()->has('partner_email'))->toBeTrue();

        // Assert no new User was created
        expect(User::count())->toBe($userCountBefore);

        // Assert no Hotel was created
        expect(Hotel::count())->toBe($hotelCountBefore);
    }
});
