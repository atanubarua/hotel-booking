<?php

// Feature: hotel-registration-crud, Property 14: Non-partner access to /partner/* is forbidden

use App\Enums\Role;
use App\Models\User;
use Faker\Factory as FakerFactory;
use Illuminate\Support\Facades\Route;

/**
 * Property 14: Non-partner access to /partner/* is forbidden
 * Validates: Requirements 8.4
 *
 * For any authenticated user whose role is not partner, any request to a
 * /partner/* route should return a 403 Forbidden response.
 */
test('Property 14: non-partner access to /partner/* is forbidden across 100 random iterations', function () {
    // Register a temporary test route protected by the partner middleware
    Route::get('/_test_partner_route', fn () => response('ok'))
        ->middleware(['web', 'auth', 'partner'])
        ->name('_test_partner_route');

    $faker = FakerFactory::create();
    $nonPartnerRoles = [Role::Admin, Role::Customer];

    for ($i = 0; $i < 100; $i++) {
        $role = $faker->randomElement($nonPartnerRoles);

        $user = User::create([
            'name' => $faker->name(),
            'email' => $faker->unique()->safeEmail(),
            'password' => bcrypt($faker->password()),
            'role' => $role,
        ]);

        $response = $this->actingAs($user)->get('/_test_partner_route');

        expect($response->status())->toBe(403,
            "Expected 403 for role [{$role->value}] but got {$response->status()}"
        );
    }
});

test('Property 14: partner user is NOT forbidden from /partner/* routes', function () {
    // Register a temporary test route protected by the partner middleware
    Route::get('/_test_partner_route_allowed', fn () => response('ok'))
        ->middleware(['web', 'auth', 'partner'])
        ->name('_test_partner_route_allowed');

    $faker = FakerFactory::create();

    $partner = User::create([
        'name' => $faker->name(),
        'email' => $faker->unique()->safeEmail(),
        'password' => bcrypt($faker->password()),
        'role' => Role::Partner,
    ]);

    $response = $this->actingAs($partner)->get('/_test_partner_route_allowed');

    // Partner should not get 403
    expect($response->status())->not->toBe(403);
});
