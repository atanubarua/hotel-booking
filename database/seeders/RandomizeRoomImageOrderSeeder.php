<?php

namespace Database\Seeders;

use App\Models\Room;
use App\Models\RoomImage;
use Illuminate\Database\Seeder;

class RandomizeRoomImageOrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get rooms from hotels 1-8
        $rooms = Room::whereHas('hotel', function ($query) {
            $query->whereIn('id', range(1, 8));
        })->with('images')->get();

        $updatedCount = 0;
        $totalImagesUpdated = 0;

        foreach ($rooms as $room) {
            $images = $room->images;

            if ($images->count() > 1) {
                // Shuffle the images to randomize order
                $shuffledImages = $images->shuffle();

                // Update the order for each image
                foreach ($shuffledImages as $index => $image) {
                    $image->update(['order' => $index]);
                    $totalImagesUpdated++;
                }

                $updatedCount++;
            }
        }

        $this->command->info("Randomized image order for {$updatedCount} rooms. Total images reordered: {$totalImagesUpdated}");
    }
}
