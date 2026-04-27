<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Hotel extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'address',
        'city',
        'country',
        'star_rating',
        'phone',
        'email',
        'description',
        'status',
        'cancellation_deadline_hours',
        'cancellation_refund_percent',
    ];

    /**
     * Returns a human-readable cancellation policy string.
     * Example: "Free cancellation up to 48 hours before check-in (100% refund)"
     */
    public function cancellationPolicyText(): string
    {
        $hours = $this->cancellation_deadline_hours ?? 48;
        $percent = $this->cancellation_refund_percent ?? 100;

        if ($percent === 0) {
            return 'Non-refundable';
        }

        $refundLabel = $percent === 100 ? 'Full refund' : "{$percent}% refund";
        return "{$refundLabel} if cancelled at least {$hours} hours before check-in";
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function rooms(): HasMany
    {
        return $this->hasMany(Room::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(HotelImage::class)->orderBy('order');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function amenities(): BelongsToMany
    {
        return $this->belongsToMany(Amenity::class);
    }
}
