<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoomPriceRule extends Model
{
    protected $fillable = [
        'room_id',
        'name',
        'start_date',
        'end_date',
        'adjustment_type',
        'adjustment_value',
        'priority',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'adjustment_value' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }
}
