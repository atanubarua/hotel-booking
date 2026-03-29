<?php

namespace Database\Seeders;

use App\Models\Room;
use App\Models\RoomImage;
use Illuminate\Database\Seeder;

class AddMultipleRoomImagesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Room image URLs (realistic room photos from Unsplash)
        $roomImages = [
            'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
            'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
            'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
            'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80',
            'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&q=80',
            'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&q=80',
            'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80',
            'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80',
            'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
            'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80',
            'https://images.unsplash.com/photo-1584132915807-fd1f5fbc078f?w=800&q=80',
            'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80',
            'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80',
            'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800&q=80',
            'https://images.unsplash.com/photo-1602002418816-5c0aeef426aa?w=800&q=80',
            'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80',
        ];

        // Get rooms from hotels 1-8
        $rooms = Room::whereHas('hotel', function ($query) {
            $query->whereIn('id', range(1, 8));
        })->get();

        $updatedCount = 0;
        $totalImagesAdded = 0;

        foreach ($rooms as $room) {
            // Check if room already has images
            $existingImages = $room->images()->count();

            if ($existingImages < 3) {
                // Add 3-5 images per room (depends on how many it already has)
                $imagesToAdd = rand(3, 5) - $existingImages;

                if ($imagesToAdd > 0) {
                    $selectedImages = array_rand(array_flip($roomImages), min($imagesToAdd, count($roomImages)));
                    if (!is_array($selectedImages)) {
                        $selectedImages = [$selectedImages];
                    }

                    foreach ($selectedImages as $index => $imageUrl) {
                        RoomImage::create([
                            'room_id' => $room->id,
                            'path' => $imageUrl,
                            'order' => $existingImages + $index,
                        ]);
                        $totalImagesAdded++;
                    }
                    $updatedCount++;
                }
            }
        }

        $this->command->info("Updated {$updatedCount} rooms with multiple images. Total images added: {$totalImagesAdded}");
    }
}
