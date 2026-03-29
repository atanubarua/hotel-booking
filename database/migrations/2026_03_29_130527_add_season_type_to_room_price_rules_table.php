<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('room_price_rules', function (Blueprint $table) {
            $table->enum('season_type', [
                'festival',
                'off_season',
                'peak',
                'weekend',
                'holiday',
                'custom',
            ])->nullable()->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('room_price_rules', function (Blueprint $table) {
            $table->dropColumn('season_type');
        });
    }
};
