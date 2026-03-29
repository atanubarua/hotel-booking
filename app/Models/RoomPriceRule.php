<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoomPriceRule extends Model
{
    protected $fillable = [
        'room_id',
        'name',
        'season_type',
        'start_date',
        'end_date',
        'days_of_week',
        'adjustment_type',
        'adjustment_value',
        'priority',
        'is_active',
        'is_stackable',
    ];

    protected function casts(): array
    {
        return [
            'start_date'       => 'date',
            'end_date'         => 'date',
            'days_of_week'     => 'array',
            'adjustment_value' => 'decimal:2',
            'is_active'        => 'boolean',
            'is_stackable'     => 'boolean',
        ];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }
}
