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

class HotelSeeder extends Seeder
{
    public function run(): void
    {
        // Create a partner user to own the hotels
        $partner = User::query()->updateOrCreate(
            ['email' => 'partner@booking.test'],
            [
                'name' => 'Demo Partner',
                'password' => Hash::make('password'),
                'role' => Role::Partner,
            ]
        );

        $hotels = [
            [
                'name' => 'The Westin Dhaka',
                'address' => 'Main Gulshan Avenue, Gulshan 2',
                'city' => 'Dhaka',
                'country' => 'Bangladesh',
                'star_rating' => 5,
                'phone' => '+880 2 9882832',
                'email' => 'westin.dhaka@booking.test',
                'description' => 'Luxury 5-star hotel in the heart of Dhaka\'s business district. Featuring world-class amenities, fine dining restaurants, an outdoor pool, and a state-of-the-art spa.',
                'status' => 'active',
                'images' => [
                    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
                    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
                ],
                'rooms' => [
                    ['name' => 'Deluxe King Room', 'type' => 'Deluxe', 'capacity' => 2, 'price_per_night' => 8500],
                    ['name' => 'Executive Suite', 'type' => 'Suite', 'capacity' => 3, 'price_per_night' => 18000],
                    ['name' => 'Standard Twin Room', 'type' => 'Standard', 'capacity' => 2, 'price_per_night' => 5500],
                ],
            ],
            [
                'name' => 'Hotel Six Seasons',
                'address' => 'Gulshan North Avenue',
                'city' => 'Dhaka',
                'country' => 'Bangladesh',
                'star_rating' => 4,
                'phone' => '+880 2 8835468',
                'email' => 'sixseasons.dhaka@booking.test',
                'description' => 'Contemporary 4-star hotel offering modern comforts with traditional Bangladeshi hospitality. Located in upmarket Gulshan area with easy access to dining and shopping.',
                'status' => 'active',
                'images' => [
                    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
                    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80',
                ],
                'rooms' => [
                    ['name' => 'Superior Room', 'type' => 'Standard', 'capacity' => 2, 'price_per_night' => 4200],
                    ['name' => 'Junior Suite', 'type' => 'Suite', 'capacity' => 2, 'price_per_night' => 9000],
                    ['name' => 'Deluxe Room', 'type' => 'Deluxe', 'capacity' => 2, 'price_per_night' => 6000],
                ],
            ],
            [
                'name' => 'Ocean Paradise Hotel',
                'address' => 'Kolatoli Beach Road',
                'city' => "Cox's Bazar",
                'country' => 'Bangladesh',
                'star_rating' => 4,
                'phone' => '+880 341 51234',
                'email' => 'oceanparadise@booking.test',
                'description' => 'Situated right on the world\'s longest natural sea beach. Enjoy breathtaking ocean views, fresh seafood, and stunning sunsets from your room balcony.',
                'status' => 'active',
                'images' => [
                    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80',
                    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80',
                ],
                'rooms' => [
                    ['name' => 'Sea View Room', 'type' => 'Standard', 'capacity' => 2, 'price_per_night' => 3500],
                    ['name' => 'Beachfront Suite', 'type' => 'Suite', 'capacity' => 4, 'price_per_night' => 12000],
                    ['name' => 'Deluxe Sea View', 'type' => 'Deluxe', 'capacity' => 2, 'price_per_night' => 5500],
                ],
            ],
            [
                'name' => 'Long Beach Hotel Cox\'s Bazar',
                'address' => 'Sugandha Beach, Kolatoli',
                'city' => "Cox's Bazar",
                'country' => 'Bangladesh',
                'star_rating' => 3,
                'phone' => '+880 341 52000',
                'email' => 'longbeach@booking.test',
                'description' => 'Affordable beachfront hotel offering comfortable rooms with great beach access. Perfect for family vacations and romantic getaways. Restaurant serving fresh local seafood.',
                'status' => 'active',
                'images' => [
                    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
                    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
                ],
                'rooms' => [
                    ['name' => 'Standard Room', 'type' => 'Standard', 'capacity' => 2, 'price_per_night' => 2200],
                    ['name' => 'Family Suite', 'type' => 'Suite', 'capacity' => 5, 'price_per_night' => 6500],
                    ['name' => 'Deluxe Double', 'type' => 'Deluxe', 'capacity' => 2, 'price_per_night' => 3200],
                ],
            ],
            [
                'name' => 'Sylhet Rose View Hotel',
                'address' => 'Airport Road, Kumarpara',
                'city' => 'Sylhet',
                'country' => 'Bangladesh',
                'star_rating' => 4,
                'phone' => '+880 821 714500',
                'email' => 'roseview.sylhet@booking.test',
                'description' => 'Premium hotel in Sylhet surrounded by lush tea gardens. Ideal base for exploring the natural beauty of Sylhet, including Ratargul swamp forest and Jaflong.',
                'status' => 'active',
                'images' => [
                    'https://images.unsplash.com/photo-1506059612708-99d6c258160e?w=800&q=80',
                    'https://images.unsplash.com/photo-1455587734955-081b22074882?w=800&q=80',
                ],
                'rooms' => [
                    ['name' => 'Garden View Room', 'type' => 'Standard', 'capacity' => 2, 'price_per_night' => 3000],
                    ['name' => 'Premium Suite', 'type' => 'Suite', 'capacity' => 3, 'price_per_night' => 10000],
                    ['name' => 'Deluxe Garden View', 'type' => 'Deluxe', 'capacity' => 2, 'price_per_night' => 4800],
                ],
            ],
            [
                'name' => 'Peninsula Chittagong',
                'address' => 'Agrabad Commercial Area',
                'city' => 'Chittagong',
                'country' => 'Bangladesh',
                'star_rating' => 5,
                'phone' => '+880 31 713100',
                'email' => 'peninsula.ctg@booking.test',
                'description' => 'Chittagong\'s premier 5-star hotel in the bustling Agrabad business hub. Features panoramic views of the Karnaphuli River, multiple dining options, and a rooftop lounge.',
                'status' => 'active',
                'images' => [
                    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
                    'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800&q=80',
                ],
                'rooms' => [
                    ['name' => 'River View Room', 'type' => 'Deluxe', 'capacity' => 2, 'price_per_night' => 7000],
                    ['name' => 'Presidential Suite', 'type' => 'Suite', 'capacity' => 4, 'price_per_night' => 25000],
                    ['name' => 'Standard City View', 'type' => 'Standard', 'capacity' => 2, 'price_per_night' => 4500],
                ],
            ],
            [
                'name' => 'Grand Sultan Tea Resort',
                'address' => 'Sreemangal, Moulvibazar',
                'city' => 'Sreemangal',
                'country' => 'Bangladesh',
                'star_rating' => 4,
                'phone' => '+880 861 71234',
                'email' => 'grandsultan@booking.test',
                'description' => 'Eco-resort nestled in the largest tea garden in Asia. Experience the serenity of Sreemangal, tea tasting tours, bird watching, and access to Lawachara National Park.',
                'status' => 'active',
                'images' => [
                    'https://images.unsplash.com/photo-1586611292717-f828b167408c?w=800&q=80',
                    'https://images.unsplash.com/photo-1531088009183-5ff5b7c95f91?w=800&q=80',
                ],
                'rooms' => [
                    ['name' => 'Garden Cottage', 'type' => 'Standard', 'capacity' => 2, 'price_per_night' => 3800],
                    ['name' => 'Tea Estate Suite', 'type' => 'Suite', 'capacity' => 3, 'price_per_night' => 11000],
                    ['name' => 'Deluxe Villa', 'type' => 'Deluxe', 'capacity' => 4, 'price_per_night' => 7500],
                ],
            ],
            [
                'name' => 'Hotel Agrabad Dhaka',
                'address' => 'Motijheel Commercial Area',
                'city' => 'Dhaka',
                'country' => 'Bangladesh',
                'star_rating' => 3,
                'phone' => '+880 2 9564888',
                'email' => 'agrabad.dhaka@booking.test',
                'description' => 'Budget-friendly hotel in Dhaka\'s financial district. Modern rooms with free Wi-Fi, complimentary breakfast, and easy access to banks, offices, and public transport.',
                'status' => 'active',
                'images' => [
                    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80',
                    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
                ],
                'rooms' => [
                    ['name' => 'Economy Room', 'type' => 'Standard', 'capacity' => 1, 'price_per_night' => 1800],
                    ['name' => 'Business Double', 'type' => 'Deluxe', 'capacity' => 2, 'price_per_night' => 2800],
                    ['name' => 'Business Suite', 'type' => 'Suite', 'capacity' => 2, 'price_per_night' => 5000],
                ],
            ],
        ];

        foreach ($hotels as $hotelData) {
            $imageUrls = $hotelData['images'];
            $roomsData = $hotelData['rooms'];
            unset($hotelData['images'], $hotelData['rooms']);

            $hotel = Hotel::query()->create([
                ...$hotelData,
                'user_id' => $partner->id,
            ]);

            foreach ($imageUrls as $index => $url) {
                HotelImage::query()->create([
                    'hotel_id' => $hotel->id,
                    'path' => $url,
                    'order' => $index,
                ]);
            }

            foreach ($roomsData as $roomData) {
                $room = Room::query()->create([
                    ...$roomData,
                    'hotel_id' => $hotel->id,
                    'status' => 'available',
                ]);

                RoomImage::query()->create([
                    'room_id' => $room->id,
                    'path' => 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
                    'order' => 0,
                ]);
            }
        }
    }
}
