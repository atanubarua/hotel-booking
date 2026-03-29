<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Room extends Model
{
    protected $fillable = [
        'hotel_id',
        'name',
        'type',
        'capacity',
        'price_per_night',
        'status',
    ];

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(RoomImage::class)->orderBy('order');
    }

    public function priceRules(): HasMany
    {
        return $this->hasMany(RoomPriceRule::class)
            ->orderByDesc('priority')
            ->orderBy('start_date');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }
}
