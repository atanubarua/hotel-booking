<?php

namespace Database\Seeders;

use App\Models\Amenity;
use Illuminate\Database\Seeder;

class AmenitySeeder extends Seeder
{
    public function run(): void
    {
        $amenities = [
            ['name' => 'Free WiFi',       'icon' => 'Wifi'],
            ['name' => 'Swimming Pool',   'icon' => 'Waves'],
            ['name' => 'Pet-friendly',    'icon' => 'PawPrint'],
            ['name' => 'Gym',             'icon' => 'Dumbbell'],
            ['name' => 'Spa',             'icon' => 'Sparkles'],
            ['name' => 'Parking',         'icon' => 'ParkingCircle'],
            ['name' => 'Restaurant',      'icon' => 'UtensilsCrossed'],
            ['name' => 'Air Conditioning','icon' => 'Wind'],
        ];

        foreach ($amenities as $amenity) {
            Amenity::firstOrCreate(['name' => $amenity['name']], $amenity);
        }
    }
}
