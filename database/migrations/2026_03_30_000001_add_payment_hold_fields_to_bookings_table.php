<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('guest_access_token', 64)->nullable()->unique()->after('confirmation_code');
            $table->timestamp('payment_expires_at')->nullable()->after('payment_status');
        });

        if (Schema::getConnection()->getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE bookings MODIFY COLUMN status ENUM('pending','confirmed','cancelled','completed','expired') NOT NULL DEFAULT 'pending'");
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE bookings MODIFY COLUMN status ENUM('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending'");
        }

        Schema::table('bookings', function (Blueprint $table) {
            $table->dropUnique(['guest_access_token']);
            $table->dropColumn(['guest_access_token', 'payment_expires_at']);
        });
    }
};
