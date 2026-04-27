<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            // Stripe refund object ID — used to prevent duplicate refund attempts.
            $table->string('stripe_refund_id')->nullable()->after('stripe_payment_intent_id');

            // Actual amount refunded (in BDT). Null until a refund is processed.
            $table->decimal('refund_amount', 10, 2)->nullable()->after('stripe_refund_id');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropColumn(['stripe_refund_id', 'refund_amount']);
        });
    }
};
