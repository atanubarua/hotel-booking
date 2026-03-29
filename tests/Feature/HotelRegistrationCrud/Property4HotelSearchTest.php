<?php

// Feature: hotel-registration-crud, Property 4: Hotel search returns only matching results

use App\Enums\Role;
use App\Http\Controllers\Admin\HotelController;
use App\Models\Hotel;
use App\Models\User;
use Faker\Factory as FakerFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;

uses(RefreshDatabase::class);

/**
 * Property 4: Hotel search returns only matching results
 * Validates: Requirements 2.2
 *
 * For any search term, the admin hotel list endpoint should return only hotels
 * where at least one of (name, city, country, partner_name) contains the search
 * term (case-insensitive).
 */
test('Property 4: hotel search returns only matching results across 100 random iterations', function () {
    $faker = FakerFactory::create();
    $statuses = ['active', 'inactive', 'pending'];

    for ($i = 0; $i < 100; $i++) {
        // Create several hotels with known names/cities/countries and partner names
        $hotels = [];

        for ($j = 0; $j < 5; $j++) {
            // Use a unique suffix per record to avoid collisions across iterations
            $suffix = "_{$i}_{$j}_" . $faker->randomNumber(5);

            $partner = User::create([
                'name'     => $faker->name() . $suffix,
                'email'    => $suffix . '_' . $faker->safeEmail(),
                'password' => bcrypt($faker->password()),
                'role'     => Role::Partner,
            ]);

            $hotels[] = [
                'model' => Hotel::create([
                    'user_id'     => $partner->id,
                    'name'        => $faker->company() . $suffix,
                    'address'     => $faker->streetAddress(),
                    'city'        => $faker->city() . $suffix,
                    'country'     => $faker->country() . $suffix,
                    'star_rating' => $faker->numberBetween(1, 5),
                    'phone'       => $faker->numerify('##########'),
                    'email'       => $faker->safeEmail(),
                    'description' => $faker->boolean(70) ? $faker->paragraph() : null,
                    'status'      => $faker->randomElement($statuses),
                ]),
                'partner_name' => $partner->name,
            ];
        }

        // Pick a random hotel and extract a substring from one of its searchable fields
        $target = $faker->randomElement($hotels);
        $targetModel = $target['model'];
        $targetPartnerName = $target['partner_name'];

        $searchableValues = [
            $targetModel->name,
            $targetModel->city,
            $targetModel->country,
            $targetPartnerName,
        ];

        $chosenField = $faker->randomElement($searchableValues);

        // Take a substring of at least 3 characters to use as the search term
        $start = 0;
        $length = max(3, (int) (strlen($chosenField) / 2));
        $searchTerm = substr($chosenField, $start, $length);

        // Build a request with the search query and X-Inertia header
        $request = Request::create('/admin/hotels', 'GET', ['search' => $searchTerm]);
        $request->headers->set('X-Inertia', 'true');
        $request->headers->set('X-Inertia-Version', '1');

        // Call the controller index method directly
        $controller = new HotelController();
        $inertiaResponse = $controller->index($request);

        $httpResponse = $inertiaResponse->toResponse($request);
        $page = $httpResponse->getData(true);

        $hotelsData = $page['props']['hotels']['data'];

        // Assert ALL returned hotels match the search term in at least one field
        $needle = strtolower($searchTerm);

        foreach ($hotelsData as $hotel) {
            $matchesName        = str_contains(strtolower($hotel['name']), $needle);
            $matchesCity        = str_contains(strtolower($hotel['city']), $needle);
            $matchesCountry     = str_contains(strtolower($hotel['country']), $needle);
            $matchesPartnerName = str_contains(strtolower($hotel['partner_name']), $needle);

            expect($matchesName || $matchesCity || $matchesCountry || $matchesPartnerName)
                ->toBeTrue(
                    "Hotel '{$hotel['name']}' (city: {$hotel['city']}, country: {$hotel['country']}, partner: {$hotel['partner_name']}) ".
                    "does not match search term '{$searchTerm}'"
                );
        }
    }
});
