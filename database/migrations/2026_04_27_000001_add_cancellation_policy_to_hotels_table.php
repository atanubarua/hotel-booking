<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hotels', function (Blueprint $table) {
            // How many hours before check-in the guest can cancel for a refund.
            // Default: 48 hours (Booking.com standard free-cancellation window).
            $table->unsignedSmallInteger('cancellation_deadline_hours')->default(48)->after('status');

            // What % of total_price is refunded if cancelled before the deadline.
            // 100 = full refund, 50 = partial, 0 = non-refundable.
            $table->unsignedTinyInteger('cancellation_refund_percent')->default(100)->after('cancellation_deadline_hours');
        });
    }

    public function down(): void
    {
        Schema::table('hotels', function (Blueprint $table) {
            $table->dropColumn(['cancellation_deadline_hours', 'cancellation_refund_percent']);
        });
    }
};
