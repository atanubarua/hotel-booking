<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('room_price_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained('rooms')->cascadeOnDelete();
            $table->string('name');
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('adjustment_type', ['fixed', 'percent', 'amount']);
            $table->decimal('adjustment_value', 10, 2);
            $table->unsignedInteger('priority')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['room_id', 'is_active', 'start_date', 'end_date'], 'room_price_rules_lookup_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_price_rules');
    }
};
