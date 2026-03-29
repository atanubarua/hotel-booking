<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add 'out_of_order' to rooms.status enum.
     * Availability is now driven by the bookings table (date-overlap),
     * so 'available' is no longer the sole availability signal.
     * Rooms with status = maintenance | out_of_order are excluded from searches.
     */
    public function up(): void
    {
        // MySQL: alter the enum column directly
        DB::statement("ALTER TABLE rooms MODIFY COLUMN status ENUM('available','occupied','maintenance','out_of_order') NOT NULL DEFAULT 'available'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE rooms MODIFY COLUMN status ENUM('available','occupied','maintenance') NOT NULL DEFAULT 'available'");
    }
};
