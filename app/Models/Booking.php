<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
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
        'stripe_refund_id',
        'refund_amount',
        'payment_intent_attempt',
        'guest_access_token',
        'payment_expires_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'check_in'        => 'date',
            'check_out'       => 'date',
            'price_per_night' => 'decimal:2',
            'total_price'     => 'decimal:2',
            'refund_amount'   => 'decimal:2',
            'payment_expires_at' => 'datetime',
            'cancelled_at'    => 'datetime',
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

    public static function generateConfirmationCode(): string
    {
        return 'HBD-' . strtoupper(Str::random(6));
    }

    public static function generateGuestAccessToken(): string
    {
        return Str::random(40);
    }

    public function isHoldActive(): bool
    {
        if ($this->status !== 'pending') {
            return false;
        }

        if (! in_array($this->payment_status, ['pending', 'failed'], true)) {
            return false;
        }

        return $this->payment_expires_at?->isFuture() ?? false;
    }

    /**
     * A booking can be cancelled by the customer if it is confirmed and paid.
     */
    public function isCancellable(): bool
    {
        return $this->status === 'confirmed'
            && $this->payment_status === 'paid'
            && is_null($this->cancelled_at)
            && now()->startOfDay()->lte(\Carbon\Carbon::parse($this->check_in)->startOfDay());
    }

    /**
     * Calculate the eligible refund amount based on the hotel's cancellation policy.
     * - If cancelled before the deadline: refund_percent% of total_price
     * - If cancelled after the deadline: 0 (non-refundable)
     */
    public function refundAmount(\App\Models\Hotel $hotel): float
    {
        $deadlineHours = $hotel->cancellation_deadline_hours ?? 48;
        $refundPercent = $hotel->cancellation_refund_percent ?? 100;

        $hoursUntilCheckIn = now()->diffInHours($this->check_in, false);

        if ($hoursUntilCheckIn >= $deadlineHours) {
            return round((float) $this->total_price * ($refundPercent / 100), 2);
        }

        return 0.0;
    }

    public function markExpired(): void
    {
        $this->forceFill([
            'status' => 'expired',
            'payment_expires_at' => null,
        ])->save();
    }

    public function canBePaid(): bool
    {
        return $this->status === 'pending'
            && in_array($this->payment_status, ['pending', 'failed'], true)
            && $this->payment_expires_at?->isFuture();
    }

    public function scopeBlocking(Builder $query): Builder
    {
        return $query->where(function (Builder $query): void {
            $query->where('status', 'confirmed')
                ->orWhere(function (Builder $query): void {
                    $query->where('status', 'pending')
                        ->whereIn('payment_status', ['pending', 'failed'])
                        ->where('payment_expires_at', '>', Carbon::now());
                });
        });
    }

    /**
     * Check if a room has any conflicting confirmed/pending bookings for the given dates.
     * Uses the standard date-overlap formula: check_in < requested_checkout AND check_out > requested_checkin
     */
    public static function hasConflict(int $roomId, string $checkIn, string $checkOut, ?int $excludeId = null): bool
    {
        return self::where('room_id', $roomId)
            ->blocking()
            ->where('check_in', '<', $checkOut)
            ->where('check_out', '>', $checkIn)
            ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
            ->exists();
    }
}
