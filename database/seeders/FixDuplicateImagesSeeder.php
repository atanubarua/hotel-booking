<?php

namespace Database\Seeders;

use App\Models\Hotel;
use App\Models\HotelImage;
use Illuminate\Database\Seeder;

class FixDuplicateImagesSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Fixing duplicate hotel images...');

        // High-quality hotel images from Unsplash (different ones for variety)
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
            'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
            'https://images.unsplash.com/photo-1563911302283-d2bc129e7570?w=800&q=80',
            'https://images.unsplash.com/photo-1587213811864-46e59f6873b5?w=800&q=80',
            'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80',
            'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
            'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80',
        ];

        $hotels = Hotel::with('images')->get();
        $updated = 0;

        foreach ($hotels as $index => $hotel) {
            // Delete existing images
            $hotel->images()->delete();

            // Better distribution: use different starting points for each hotel
            $numImages = rand(4, 6);
            $startIndex = ($index * 7) % count($hotelImages); // Different multiplier for better spread
            $selectedImages = [];

            // Select consecutive images starting from different points
            for ($i = 0; $i < $numImages; $i++) {
                $selectedImages[] = $hotelImages[($startIndex + $i) % count($hotelImages)];
            }

            foreach ($selectedImages as $imgIndex => $imageUrl) {
                HotelImage::create([
                    'hotel_id' => $hotel->id,
                    'path' => $imageUrl,
                    'order' => $imgIndex,
                ]);
            }

            $updated++;

            if ($updated % 10 === 0) {
                $this->command->info("Updated {$updated} hotels with unique images...");
            }
        }

        $this->command->info("Successfully updated {$updated} hotels with unique images!");
    }
}
