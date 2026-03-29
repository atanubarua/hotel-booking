<?php

// Feature: hotel-registration-crud, Property 8: PartnerWelcomeMail contains required information

use App\Enums\Role;
use App\Mail\PartnerWelcomeMail;
use App\Models\Hotel;
use App\Models\User;
use Faker\Factory as FakerFactory;

/**
 * Property 8: PartnerWelcomeMail contains required information
 * Validates: Requirements 4.2
 *
 * For any valid partner User, Hotel, and reset token, the rendered
 * PartnerWelcomeMail HTML must contain the partner's name, the hotel's name,
 * and a password-reset URL containing the reset token.
 */
test('Property 8: PartnerWelcomeMail contains required information across 100 random iterations', function () {
    $faker = FakerFactory::create();
    $statuses = ['active', 'inactive', 'pending'];

    for ($i = 0; $i < 100; $i++) {
        // Create a random partner user
        $partner = User::create([
            'name' => $faker->name(),
            'email' => $faker->unique()->safeEmail(),
            'password' => bcrypt($faker->password()),
            'role' => Role::Partner,
        ]);

        // Create a random hotel belonging to the partner
        $hotel = Hotel::create([
            'user_id' => $partner->id,
            'name' => $faker->company(),
            'address' => $faker->streetAddress(),
            'city' => $faker->city(),
            'country' => $faker->country(),
            'star_rating' => $faker->numberBetween(1, 5),
            'phone' => $faker->numerify('##########'),
            'email' => $faker->safeEmail(),
            'description' => $faker->paragraph(),
            'status' => $faker->randomElement($statuses),
        ]);

        // Generate a fake reset token
        $token = $faker->sha256();

        // Instantiate and render the mail
        $mail = new PartnerWelcomeMail($partner, $hotel, $token);
        // Decode HTML entities so assertions work regardless of Blade escaping
        $rendered = html_entity_decode($mail->render(), ENT_QUOTES | ENT_HTML5, 'UTF-8');

        // Assert the rendered HTML contains the partner's name
        expect($rendered)->toContain($partner->name);

        // Assert the rendered HTML contains the hotel's name
        expect($rendered)->toContain($hotel->name);

        // Assert the rendered HTML contains the reset token in a URL
        expect($rendered)->toContain($token);
    }
});
