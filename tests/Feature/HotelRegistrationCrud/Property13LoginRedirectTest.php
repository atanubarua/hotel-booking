<?php

// Feature: hotel-registration-crud, Property 13: Login redirects based on role

use App\Enums\Role;
use App\Models\User;
use Faker\Factory as FakerFactory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * Property 13: Login redirects based on role
 * Validates: Requirements 7.1, 7.2, 7.3
 *
 * For any user with a valid role, the LoginResponse should redirect to the
 * correct URL based on that role:
 *   - admin    → /admin
 *   - partner  → /partner
 *   - customer → /dashboard
 */
test('Property 13: login redirects based on role across 100 random iterations', function () {
    $faker = FakerFactory::create();

    $roleExpectations = [
        Role::Admin->value    => '/admin',
        Role::Partner->value  => '/partner',
        Role::Customer->value => '/dashboard',
    ];

    $roles = array_keys($roleExpectations);

    for ($i = 0; $i < 100; $i++) {
        $roleName = $faker->randomElement($roles);
        $role = Role::from($roleName);

        $user = User::create([
            'name'     => $faker->name(),
            'email'    => $faker->unique()->safeEmail(),
            'password' => Hash::make($faker->password()),
            'role'     => $role,
        ]);

        $loginResponse = new \App\Http\Responses\LoginResponse();
        $request = Request::create('/login', 'POST');
        $request->setUserResolver(fn () => $user);
        $response = $loginResponse->toResponse($request);

        $expectedUrl = $roleExpectations[$roleName];

        expect($response->getTargetUrl())->toContain($expectedUrl);
    }
});
