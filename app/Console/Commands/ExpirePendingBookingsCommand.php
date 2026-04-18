<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Services\StripeGateway;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

class ExpirePendingBookingsCommand extends Command
{
    protected $signature = 'bookings:expire-pending';

    protected $description = 'Expire unpaid booking holds and cancel their Stripe PaymentIntents.';

    public function handle(StripeGateway $stripe): int
    {
        $expiredCount = 0;

        Booking::query()
            ->where('status', 'pending')
            ->whereNotNull('payment_expires_at')
            ->where('payment_expires_at', '<=', now())
            ->orderBy('id')
            ->chunkById(50, function ($bookings) use (&$expiredCount, $stripe): void {
                foreach ($bookings as $booking) {
                    DB::transaction(function () use ($booking, &$expiredCount, $stripe): void {
                        $locked = Booking::query()->lockForUpdate()->find($booking->id);

                        if (! $locked || $locked->status !== 'pending' || ! $locked->payment_expires_at?->isPast()) {
                            return;
                        }

                        if ($locked->stripe_payment_intent_id) {
                            try {
                                $stripe->cancelPaymentIntent($locked->stripe_payment_intent_id);
                            } catch (Throwable $e) {
                                report($e);
                            }
                        }

                        $locked->forceFill([
                            'status' => 'expired',
                            'payment_status' => 'failed',
                            'payment_expires_at' => null,
                        ])->save();

                        $expiredCount++;
                    });
                }
            });

        $this->info(sprintf('Expired %d booking hold(s).', $expiredCount));

        return self::SUCCESS;
    }
}
