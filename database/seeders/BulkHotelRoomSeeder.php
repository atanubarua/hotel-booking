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

        // Sample hotel names by city (Bangladesh-based)
        $hotelData = [
            'Dhaka' => [
                ['name' => 'Gulshan Grand Hotel', 'star' => 5],
                ['name' => 'Banani Business Suites', 'star' => 4],
                ['name' => 'Uttara Luxury Residence', 'star' => 3],
                ['name' => 'Dhanmondi Tower Hotel', 'star' => 4],
                ['name' => 'Mirpur Garden Inn', 'star' => 5],
                ['name' => 'Motijheel Financial Hotel', 'star' => 4],
                ['name' => 'Bashundhara Boutique Hotel', 'star' => 4],
                ['name' => 'Tejgaon Commercial Inn', 'star' => 3],
                ['name' => 'Gulshan Lake View', 'star' => 4],
                ['name' => 'Baridhara Diplomatic Hotel', 'star' => 3],
            ],
            'Chittagong' => [
                ['name' => 'Agrabad Grand Hotel', 'star' => 5],
                ['name' => 'Nasirabad Luxury Suites', 'star' => 4],
                ['name' => 'Cox\'s Bazar Beach Resort', 'star' => 4],
                ['name' => 'Port City Business Hotel', 'star' => 5],
                ['name' => 'Pattijuri Heritage Inn', 'star' => 4],
                ['name' => 'Halishahar Tower Hotel', 'star' => 5],
                ['name' => 'GEC Circle Residence', 'star' => 3],
                ['name' => 'Chandgaon Garden Hotel', 'star' => 4],
                ['name' => 'Foy\'s Lake View', 'star' => 4],
                ['name' => 'Khatungonj Market Inn', 'star' => 3],
            ],
            'Sylhet' => [
                ['name' => 'Sylhet Tea Garden Resort', 'star' => 5],
                ['name' => 'Zindabazar Luxury Hotel', 'star' => 4],
                ['name' => 'Airport Road Business Inn', 'star' => 3],
                ['name' => 'Bisnakandhi Grand Hotel', 'star' => 4],
                ['name' => 'Jaflong Valley Resort', 'star' => 5],
                ['name' => 'Ratargul Forest Hotel', 'star' => 4],
                ['name' => 'Beanibazar Heritage Inn', 'star' => 3],
                ['name' => 'Shahjalal City Hotel', 'star' => 4],
                ['name' => 'Khadim Nagar View', 'star' => 4],
                ['name' => 'Nobiganj Tower Hotel', 'star' => 3],
            ],
            'Khulna' => [
                ['name' => 'KDA Avenue Hotel', 'star' => 4],
                ['name' => 'Sundarban Gateway Resort', 'star' => 5],
                ['name' => 'Khalishpur Luxury Inn', 'star' => 4],
                ['name' => 'Boyra Commercial Hotel', 'star' => 3],
                ['name' => 'Sonadanga Tower', 'star' => 4],
                ['name' => 'Daulatpur Garden Hotel', 'star' => 3],
                ['name' => 'Kushtia Bypass Inn', 'star' => 4],
                ['name' => 'Fultola River View', 'star' => 3],
                ['name' => 'Dumuria Thana Hotel', 'star' => 4],
                ['name' => 'Batiaghata Grand Hotel', 'star' => 3],
            ],
            'Rajshahi' => [
                ['name' => 'Rajshahi City Hotel', 'star' => 4],
                ['name' => 'Varendra Research Hotel', 'star' => 5],
                ['name' => 'Kazla River View', 'star' => 3],
                ['name' => 'Boalia Commercial Inn', 'star' => 4],
                ['name' => 'Rajpara Luxury Suites', 'star' => 4],
                ['name' => 'Shah Makhdum Airport Hotel', 'star' => 3],
                ['name' => 'Charghat Heritage Hotel', 'star' => 4],
                ['name' => 'Godagari Garden Resort', 'star' => 3],
                ['name' => 'Tanore Thana Hotel', 'star' => 4],
                ['name' => 'Poba Valley Inn', 'star' => 3],
            ],
            'Barisal' => [
                ['name' => 'Barisal Grand Hotel', 'star' => 4],
                ['name' => 'Sadar Road Business Inn', 'star' => 3],
                ['name' => 'Kuakata Beach Resort', 'star' => 5],
                ['name' => 'Barguna River View Hotel', 'star' => 4],
                ['name' => 'Patuakhali Coastal Hotel', 'star' => 3],
                ['name' => 'Jhalokati Heritage Inn', 'star' => 4],
                ['name' => 'Pirojpur Tower Hotel', 'star' => 3],
                ['name' => 'Bhola Island Resort', 'star' => 4],
                ['name' => 'Lakshmipur Grand Hotel', 'star' => 3],
                ['name' => 'Mehendiganj Hotel', 'star' => 4],
            ],
            'Rangpur' => [
                ['name' => 'Rangpur Central Hotel', 'star' => 4],
                ['name' => 'Tajhat Palace Heritage', 'star' => 5],
                ['name' => 'Dhap Lake View Hotel', 'star' => 3],
                ['name' => 'Central Road Business Inn', 'star' => 4],
                ['name' => 'Pirgachha Tower Hotel', 'star' => 3],
                ['name' => 'Gangachara Luxury Suites', 'star' => 4],
                ['name' => 'Mithapukur Grand Hotel', 'star' => 3],
                ['name' => 'Kishoreganj Inn', 'star' => 4],
                ['name' => 'Saidpur Airport Hotel', 'star' => 3],
                ['name' => 'Pirganj River View', 'star' => 4],
            ],
            'Mymensingh' => [
                ['name' => 'Mymensingh City Hotel', 'star' => 4],
                ['name' => 'Bangabandhu Hall Residence', 'star' => 3],
                ['name' => 'Trishal Commercial Inn', 'star' => 4],
                ['name' => 'Gaffargaon Tower Hotel', 'star' => 3],
                ['name' => 'Muktagachha Garden Hotel', 'star' => 4],
                ['name' => 'Fulpur Lake View', 'star' => 3],
                ['name' => 'Nandail Heritage Hotel', 'star' => 4],
                ['name' => 'Ishwarganj Grand Inn', 'star' => 3],
                ['name' => 'Phulpur River Resort', 'star' => 4],
                ['name' => 'Bhaluka Business Hotel', 'star' => 3],
            ],
            'Jessore' => [
                ['name' => 'Jessore Grand Hotel', 'star' => 4],
                ['name' => 'Benapole Border Hotel', 'star' => 5],
                ['name' => 'Manirampur Tower Inn', 'star' => 3],
                ['name' => 'Chaugachha Luxury Hotel', 'star' => 4],
                ['name' => 'Keshabpur Garden Resort', 'star' => 3],
                ['name' => 'Shailkupa River View', 'star' => 4],
                ['name' => 'Harinakunda Heritage Hotel', 'star' => 3],
                ['name' => 'Jhikargachha Business Inn', 'star' => 4],
                ['name' => 'Bagherpara Tower Hotel', 'star' => 3],
                ['name' => 'Narial Bazar Hotel', 'star' => 4],
            ],
            'Cox\'s Bazar' => [
                ['name' => 'Long Beach Cox\'s Bazar', 'star' => 5],
                ['name' => 'Kolatoli Ocean Resort', 'star' => 4],
                ['name' => 'Inani Beach Hotel', 'star' => 4],
                ['name' => 'Himchari Forest Resort', 'star' => 5],
                ['name' => 'Labony Beach Hotel', 'star' => 4],
                ['name' => 'Sugandha Sea View Hotel', 'star' => 5],
                ['name' => 'Patuartek Hill Resort', 'star' => 3],
                ['name' => 'Maheshkhali Island Hotel', 'star' => 4],
                ['name' => 'Ramu Buddhist Temple Hotel', 'star' => 3],
                ['name' => 'Chakaria Heritage Inn', 'star' => 4],
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
                    'name' => $hotelInfo['name'],
                    'address' => fake()->streetAddress(),
                    'city' => $city,
                    'country' => 'Bangladesh',
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
