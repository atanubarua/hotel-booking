<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\Hotel;
use App\Models\HotelImage;
use App\Models\Room;
use App\Models\RoomImage;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class BulkHotelRoomSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Starting bulk hotel and room seeding...');

        // Sample hotel names by city
        $hotelData = [
            'New York' => [
                ['name' => 'Grand Central Hotel', 'star' => 5],
                ['name' => 'Manhattan Luxury Suites', 'star' => 4],
                ['name' => 'Brooklyn Heights Inn', 'star' => 3],
                ['name' => 'Times Square Tower', 'star' => 4],
                ['name' => 'Central Park Residence', 'star' => 5],
                ['name' => 'Wall Street Business Hotel', 'star' => 4],
                ['name' => 'SoHo Boutique Hotel', 'star' => 4],
                ['name' => 'Chelsea Garden Inn', 'star' => 3],
                ['name' => 'Upper East Side Hotel', 'star' => 4],
                ['name' => 'Harlem Heritage Hotel', 'star' => 3],
            ],
            'Los Angeles' => [
                ['name' => 'Hollywood Sunset Hotel', 'star' => 5],
                ['name' => 'Beverly Hills Luxury', 'star' => 5],
                ['name' => 'Santa Monica Beach Resort', 'star' => 4],
                ['name' => 'Downtown LA Grand', 'star' => 4],
                ['name' => 'Venice Beach Hotel', 'star' => 3],
                ['name' => 'Malibu Oceanfront', 'star' => 5],
                ['name' => 'Pasadena Heritage Inn', 'star' => 3],
                ['name' => 'Hollywood Boulevard Hotel', 'star' => 4],
                ['name' => 'Westwood Village Suites', 'star' => 4],
                ['name' => 'Culver City Hotel', 'star' => 3],
            ],
            'Chicago' => [
                ['name' => 'Magnificent Mile Hotel', 'star' => 5],
                ['name' => 'Lakefront Tower', 'star' => 4],
                ['name' => 'River North Suites', 'star' => 4],
                ['name' => 'Windy City Grand', 'star' => 4],
                ['name' => 'Millennium Park Hotel', 'star' => 5],
                ['name' => 'Gold Coast Residence', 'star' => 5],
                ['name' => 'Lincoln Park Inn', 'star' => 3],
                ['name' => 'Bucktown Boutique', 'star' => 4],
                ['name' => 'Hyde Park Hotel', 'star' => 3],
                ['name' => 'Riverdale Suites', 'star' => 3],
            ],
            'Miami' => [
                ['name' => 'South Beach Luxury', 'star' => 5],
                ['name' => 'Ocean Drive Resort', 'star' => 4],
                ['name' => 'Wynwood Art Hotel', 'star' => 4],
                ['name' => 'Brickell Financial Suites', 'star' => 5],
                ['name' => 'Coconut Grove Hotel', 'star' => 4],
                ['name' => 'Key Biscayne Resort', 'star' => 5],
                ['name' => 'Little Havana Heritage', 'star' => 3],
                ['name' => 'Mid Beach Tower', 'star' => 4],
                ['name' => 'Design District Hotel', 'star' => 4],
                ['name' => 'Coral Gables Grand', 'star' => 5],
            ],
            'San Francisco' => [
                ['name' => 'Golden Gate Hotel', 'star' => 5],
                ['name' => 'Fisherman\'s Wharf Inn', 'star' => 4],
                ['name' => 'Union Square Luxury', 'star' => 5],
                ['name' => 'Nob Hill Residence', 'star' => 5],
                ['name' => 'Mission District Hotel', 'star' => 3],
                ['name' => 'SOMA Business Suites', 'star' => 4],
                ['name' => 'Marina Green Hotel', 'star' => 4],
                ['name' => 'Pacific Heights Tower', 'star' => 4],
                ['name' => 'Castro Boutique', 'star' => 3],
                ['name' => 'Embarcadero Waterfront', 'star' => 5],
            ],
            'Las Vegas' => [
                ['name' => 'Strip View Hotel', 'star' => 5],
                ['name' => 'Casino Royale Grand', 'star' => 4],
                ['name' => 'Bellagio Style Resort', 'star' => 5],
                ['name' => 'Fremont Street Hotel', 'star' => 3],
                ['name' => 'MGM Grand Type', 'star' => 5],
                ['name' => 'Luxor Pyramid Hotel', 'star' => 4],
                ['name' => 'Venetian Style', 'star' => 5],
                ['name' => 'Paris Las Vegas Type', 'star' => 4],
                ['name' => 'Caesars Palace Style', 'star' => 5],
                ['name' => 'Wynn Style Resort', 'star' => 5],
            ],
            'Boston' => [
                ['name' => 'Beacon Hill Hotel', 'star' => 4],
                ['name' => 'Back Bay Grand', 'star' => 5],
                ['name' => 'Harvard Square Inn', 'star' => 4],
                ['name' => 'Freedom Trail Hotel', 'star' => 4],
                ['name' => 'Copley Square Residence', 'star' => 4],
                ['name' => 'Faneuil Hall Hotel', 'star' => 4],
                ['name' => 'North End Italian', 'star' => 3],
                ['name' => 'Cambridge Academic', 'star' => 4],
                ['name' => 'Waterfront Boston', 'star' => 4],
                ['name' => 'Fenway Park Hotel', 'star' => 3],
            ],
            'Seattle' => [
                ['name' => 'Space Needle View', 'star' => 5],
                ['name' => 'Pike Place Market Hotel', 'star' => 4],
                ['name' => 'Downtown Seattle Grand', 'star' => 4],
                ['name' => 'Capitol Hill Hotel', 'star' => 3],
                ['name' => 'Bellevue Luxury', 'star' => 5],
                ['name' => 'Ballard Boutique', 'star' => 4],
                ['name' => 'Queen Anne Tower', 'star' => 4],
                ['name' => 'University District', 'star' => 3],
                ['name' => 'South Lake Union', 'star' => 4],
                ['name' => 'Pioneer Square Hotel', 'star' => 3],
            ],
            'Denver' => [
                ['name' => 'Mile High Hotel', 'star' => 4],
                ['name' => 'LoDo Historic Hotel', 'star' => 4],
                ['name' => 'RiNo Art District', 'star' => 4],
                ['name' => 'Cherry Creek Luxury', 'star' => 5],
                ['name' => 'Capitol Hill Residence', 'star' => 4],
                ['name' => 'Union Station Grand', 'star' => 5],
                ['name' => 'Highland Boutique', 'star' => 4],
                ['name' => 'Wash Park Hotel', 'star' => 3],
                ['name' => 'Five Points Hotel', 'star' => 4],
                ['name' => 'Stapleton Airport', 'star' => 3],
            ],
            'Austin' => [
                ['name' => 'South Congress Hotel', 'star' => 4],
                ['name' => 'Rainey Street Hotel', 'star' => 4],
                ['name' => 'Downtown Austin Grand', 'star' => 4],
                ['name' => 'East Austin Boutique', 'star' => 3],
                ['name' => 'Domain District', 'star' => 4],
                ['name' => 'University Area', 'star' => 3],
                ['name' => 'Zilker Park Hotel', 'star' => 4],
                ['name' => 'Arboretum District', 'star' => 4],
                ['name' => 'Barton Creek Resort', 'star' => 5],
                ['name' => 'Lake Travis Waterfront', 'star' => 5],
            ],
        ];

        // Realistic hotel images from Unsplash
        $hotelImages = [
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
            'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
            'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
            'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
            'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80',
            'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80',
            'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
            'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
            'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80',
            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
        ];

        // Realistic room images from Unsplash
        $roomImages = [
            'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
            'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
            'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80',
            'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&q=80',
            'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&q=80',
            'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80',
            'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80',
            'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80',
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
        ];

        $countries = ['United States', 'Canada', 'United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Australia', 'Japan', 'Singapore'];
        $roomTypes = ['Standard', 'Deluxe', 'Suite']; // Must match database enum values
        $roomStatuses = ['available', 'available', 'available', 'occupied', 'maintenance']; // Weighted towards available

        $hotelCount = 0;
        $roomCount = 0;

        // Create 100 hotels (10 cities x 10 hotels each)
        foreach ($hotelData as $city => $hotels) {
            foreach ($hotels as $hotelInfo) {
                $hotelCount++;

                // Create partner user
                $partner = User::create([
                    'name' => fake()->name(),
                    'email' => fake()->unique()->safeEmail(),
                    'email_verified_at' => now(),
                    'password' => Hash::make('password'),
                    'role' => Role::Partner,
                    'remember_token' => Str::random(10),
                ]);

                // Create hotel
                $hotel = Hotel::create([
                    'user_id' => $partner->id,
                    'name' => $hotelInfo['name'] . ' ' . $city,
                    'address' => fake()->streetAddress(),
                    'city' => $city,
                    'country' => $countries[array_rand($countries)],
                    'star_rating' => $hotelInfo['star'],
                    'phone' => fake()->phoneNumber(),
                    'email' => fake()->companyEmail(),
                    'description' => fake()->paragraph(3),
                    'status' => 'active',
                ]);

                // Add 3-6 hotel images
                $numHotelImages = rand(3, 6);
                $selectedHotelImages = array_rand(array_flip($hotelImages), $numHotelImages);
                foreach ($selectedHotelImages as $index => $imageUrl) {
                    HotelImage::create([
                        'hotel_id' => $hotel->id,
                        'path' => $imageUrl,
                        'order' => $index,
                    ]);
                }

                // Add 30-100 rooms per hotel
                $numRooms = rand(30, 100);
                for ($i = 0; $i < $numRooms; $i++) {
                    $roomCount++;
                    $roomType = $roomTypes[array_rand($roomTypes)];

                    $room = Room::create([
                        'hotel_id' => $hotel->id,
                        'name' => fake()->randomElement(['Ocean View', 'City View', 'Garden View', 'Pool View', 'Mountain View', 'Standard', 'Premium', 'Panoramic']) . ' Room ' . ($i + 1),
                        'type' => $roomType,
                        'capacity' => rand(1, 6),
                        'price_per_night' => fake()->randomFloat(2, 89, 999),
                        'status' => $roomStatuses[array_rand($roomStatuses)],
                    ]);

                    // Add 2-5 room images
                    $numRoomImages = rand(2, 5);
                    $selectedRoomImages = array_rand(array_flip($roomImages), $numRoomImages);
                    foreach ($selectedRoomImages as $index => $imageUrl) {
                        RoomImage::create([
                            'room_id' => $room->id,
                            'path' => $imageUrl,
                            'order' => $index,
                        ]);
                    }
                }

                if ($hotelCount % 10 === 0) {
                    $this->command->info("Created {$hotelCount} hotels with {$roomCount} total rooms...");
                }
            }
        }

        $this->command->info("Created {$hotelCount} hotels with {$roomCount} total rooms with images!");

        // Add images to existing rooms
        $this->addImagesToExistingRooms($roomImages);
    }

    private function addImagesToExistingRooms(array $roomImages): void
    {
        $this->command->info('Adding multiple images to existing rooms...');

        $existingRooms = Room::whereDoesntHave('images')->get();
        $updatedCount = 0;

        foreach ($existingRooms as $room) {
            $numRoomImages = rand(2, 5);
            $selectedRoomImages = array_rand(array_flip($roomImages), $numRoomImages);

            foreach ($selectedRoomImages as $index => $imageUrl) {
                RoomImage::create([
                    'room_id' => $room->id,
                    'path' => $imageUrl,
                    'order' => $index,
                ]);
            }

            $updatedCount++;

            if ($updatedCount % 50 === 0) {
                $this->command->info("Updated {$updatedCount} existing rooms with images...");
            }
        }

        $this->command->info("Updated {$updatedCount} existing rooms with multiple images!");
    }
}
