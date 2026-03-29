<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('room_price_rules', function (Blueprint $table) {
            // Stores day numbers: 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
            // Nullable — when null the rule matches by date range only
            $table->json('days_of_week')->nullable()->after('end_date');
            // Make start_date and end_date nullable to support day-of-week-only rules
            $table->date('start_date')->nullable()->change();
            $table->date('end_date')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('room_price_rules', function (Blueprint $table) {
            $table->dropColumn('days_of_week');
            $table->date('start_date')->nullable(false)->change();
            $table->date('end_date')->nullable(false)->change();
        });
    }
};
