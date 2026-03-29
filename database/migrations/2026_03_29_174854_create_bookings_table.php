<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();

            // Guest info — user_id nullable to allow guest checkout
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('room_id')->constrained('rooms')->restrictOnDelete();
            $table->foreignId('hotel_id')->constrained('hotels')->restrictOnDelete();

            // Unique confirmation code shown to the guest (e.g. HBD-A1B2C3)
            $table->string('confirmation_code', 20)->unique();

            // Guest details (always stored, even for logged-in users)
            $table->string('guest_name');
            $table->string('guest_email');
            $table->string('guest_phone', 30);
            $table->text('special_requests')->nullable();

            // Stay details
            $table->date('check_in');
            $table->date('check_out');
            $table->unsignedTinyInteger('guests')->default(1);
            $table->unsignedSmallInteger('nights');

            // Price snapshot at time of booking
            $table->decimal('price_per_night', 10, 2);
            $table->decimal('total_price', 10, 2);

            // Booking lifecycle
            $table->enum('status', ['pending', 'confirmed', 'cancelled', 'completed'])
                  ->default('pending');

            // Payment — Stripe only for now
            $table->enum('payment_method', ['stripe'])->default('stripe');
            $table->enum('payment_status', ['pending', 'paid', 'failed', 'refunded'])
                  ->default('pending');
            $table->string('stripe_payment_intent_id')->nullable()->unique();

            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            // Composite index for fast conflict-overlap queries
            $table->index(['room_id', 'check_in', 'check_out'], 'bookings_room_dates_idx');
            $table->index(['guest_email'], 'bookings_guest_email_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
