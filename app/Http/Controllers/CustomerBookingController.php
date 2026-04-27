<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Services\StripeGateway;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class CustomerBookingController extends Controller
{
    public function __construct(
        private readonly StripeGateway $stripe,
    ) {}

    public function index(Request $request): Response
    {
        $bookings = Booking::with(['hotel', 'hotel.images', 'room'])
            ->where('user_id', auth()->id())
            ->latest()
            ->paginate(10);

        $items = $bookings->getCollection()->map(function (Booking $booking) {
            $hotel = $booking->hotel;
            $refundAmount = $booking->isCancellable() && $hotel
                ? $booking->refundAmount($hotel)
                : 0.0;

            return [
                'id'               => $booking->id,
                'confirmation_code'=> $booking->confirmation_code,
                'hotel_name'       => $hotel->name ?? 'Unknown',
                'hotel_city'       => $hotel->city ?? '',
                'hotel_image'      => $hotel?->images->first()?->path,
                'room_name'        => $booking->room->name ?? 'Unknown',
                'check_in'         => $booking->check_in->format('Y-m-d'),
                'check_out'        => $booking->check_out->format('Y-m-d'),
                'nights'           => $booking->nights,
                'guests'           => $booking->guests,
                'total_price'      => (float) $booking->total_price,
                'status'           => $booking->status,
                'payment_status'   => $booking->payment_status,
                'refund_amount'    => (float) ($booking->refund_amount ?? 0),
                'is_cancellable'   => $booking->isCancellable(),
                'eligible_refund'  => $refundAmount,
                'cancellation_policy' => $hotel?->cancellationPolicyText() ?? 'No policy set',
                'cancelled_at'     => $booking->cancelled_at?->toIso8601String(),
                'created_at'       => $booking->created_at->toIso8601String(),
            ];
        });

        $bookings->setCollection($items);

        return Inertia::render('bookings/my-bookings', [
            'bookings' => $bookings,
        ]);
    }

    public function cancel(Request $request, Booking $booking): RedirectResponse
    {
        // Authorization: booking must belong to the logged-in user
        if ($booking->user_id !== auth()->id()) {
            abort(403, 'Unauthorized action.');
        }

        if (! $booking->isCancellable()) {
            return back()->with('error', 'This booking cannot be cancelled.');
        }

        // Guard: already has a refund recorded
        if ($booking->stripe_refund_id) {
            return back()->with('error', 'This booking has already been refunded.');
        }

        $booking->load('hotel');
        $hotel = $booking->hotel;

        $refundAmount = $booking->refundAmount($hotel);

        try {
            $refundData = [];

            if ($refundAmount > 0 && $booking->stripe_payment_intent_id) {
                $totalPrice = (float) $booking->total_price;

                // Full refund: omit the amount param for cleaner Stripe processing
                if ($refundAmount >= $totalPrice) {
                    $refundData = $this->stripe->createRefund(
                        $booking->stripe_payment_intent_id,
                        [
                            'booking_id' => $booking->id,
                            'reason'     => 'customer_cancellation',
                        ]
                    );
                } else {
                    // Partial refund
                    $refundData = $this->stripe->createPartialRefund(
                        $booking->stripe_payment_intent_id,
                        $refundAmount,
                        [
                            'booking_id' => $booking->id,
                            'reason'     => 'customer_cancellation_partial',
                        ]
                    );
                }
            }

            $booking->forceFill([
                'status'          => 'cancelled',
                'cancelled_at'    => now(),
                'payment_status'  => $refundAmount > 0 ? 'refunded' : $booking->payment_status,
                'stripe_refund_id'=> $refundData['id'] ?? null,
                'refund_amount'   => $refundAmount > 0 ? $refundAmount : null,
            ])->save();

        } catch (Throwable $e) {
            report($e);
            return back()->with('error', 'Failed to process the cancellation. Please try again or contact support.');
        }

        $message = $refundAmount > 0
            ? "Booking cancelled. A refund of Tk " . number_format($refundAmount, 2) . " will be credited to your card within 5–10 business days."
            : "Booking cancelled. No refund is applicable per the hotel's cancellation policy.";

        return redirect()->route('bookings.my-bookings')->with('success', $message);
    }
}
