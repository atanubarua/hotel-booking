<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE bookings MODIFY COLUMN status ENUM(
                'pending',
                'confirmed',
                'checked_in',
                'checked_out',
                'completed',
                'cancelled',
                'no_show',
                'expired'
            ) NOT NULL DEFAULT 'pending'");
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE bookings MODIFY COLUMN status ENUM(
                'pending',
                'confirmed',
                'cancelled',
                'completed',
                'expired'
            ) NOT NULL DEFAULT 'pending'");
        }
    }
};
