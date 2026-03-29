<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Booking extends Model
{
    protected $fillable = [
        'user_id',
        'room_id',
        'hotel_id',
        'confirmation_code',
        'guest_name',
        'guest_email',
        'guest_phone',
        'special_requests',
        'check_in',
        'check_out',
        'guests',
        'nights',
        'price_per_night',
        'total_price',
        'status',
        'payment_method',
        'payment_status',
        'stripe_payment_intent_id',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'check_in'      => 'date',
            'check_out'     => 'date',
            'price_per_night' => 'decimal:2',
            'total_price'   => 'decimal:2',
            'cancelled_at'  => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    /**
     * Generate a unique confirmation code like HBD-A1B2C3.
     */
    public static function generateConfirmationCode(): string
    {
        do {
            $code = 'HBD-' . strtoupper(Str::random(6));
        } while (self::where('confirmation_code', $code)->exists());

        return $code;
    }

    /**
     * Check if a room has any conflicting confirmed/pending bookings for the given dates.
     * Uses the standard date-overlap formula: check_in < requested_checkout AND check_out > requested_checkin
     */
    public static function hasConflict(int $roomId, string $checkIn, string $checkOut, ?int $excludeId = null): bool
    {
        return self::where('room_id', $roomId)
            ->whereIn('status', ['confirmed', 'pending'])
            ->where('check_in', '<', $checkOut)
            ->where('check_out', '>', $checkIn)
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->exists();
    }
}
