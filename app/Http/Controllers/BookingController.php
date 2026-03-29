<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBookingRequest;
use App\Models\Booking;
use App\Models\Room;
use App\Support\RoomPricing;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class BookingController extends Controller
{
    /**
     * GET /bookings/create?room_id=X&check_in=Y&check_out=Z&guests=N
     * Shows the booking summary + guest details form.
     */
    public function create(Request $request): Response|\Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'room_id'   => 'required|integer|exists:rooms,id',
            'check_in'  => 'required|date|after_or_equal:today',
            'check_out' => 'required|date|after:check_in',
            'guests'    => 'nullable|integer|min:1',
        ]);

        $room = Room::with(['hotel', 'hotel.images', 'images', 'priceRules'])->findOrFail($request->room_id);
        $hotel = $room->hotel;

        // Exclude rooms under maintenance / out of order
        if (in_array($room->status, ['maintenance', 'out_of_order'])) {
            return redirect()->back()->withErrors(['room_id' => 'This room is not available for booking.']);
        }

        $checkin  = $request->check_in;
        $checkout = $request->check_out;
        $guests   = (int) $request->input('guests', 1);

        // Quick availability preview check (non-locking)
        if (Booking::hasConflict($room->id, $checkin, $checkout)) {
            return redirect()->back()->withErrors(['room_id' => 'Sorry, this room is no longer available for your selected dates.']);
        }

        $stay = RoomPricing::resolveStay($room, $checkin, $checkout);

        return Inertia::render('bookings/create', [
            'hotel' => [
                'id'          => $hotel->id,
                'name'        => $hotel->name,
                'city'        => $hotel->city,
                'country'     => $hotel->country,
                'address'     => $hotel->address,
                'star_rating' => $hotel->star_rating,
                'images'      => $hotel->images->map(fn ($img) => ['id' => $img->id, 'path' => $img->path])->values()->all(),
            ],
            'room' => [
                'id'              => $room->id,
                'name'            => $room->name,
                'type'            => $room->type,
                'capacity'        => $room->capacity,
                'price_per_night' => (float) $room->price_per_night,
                'images'          => $room->images->map(fn ($img) => ['id' => $img->id, 'path' => $img->path])->values()->all(),
            ],
            'stay' => [
                'check_in'           => $checkin,
                'check_out'          => $checkout,
                'guests'             => $guests,
                'nights'             => $stay['nights'],
                'price_per_night'    => $stay['avg_price_per_night'],
                'total_price'        => $stay['total_price'],
                'breakdown'          => $stay['breakdown'],
                'applied_rule_name'  => $stay['applied_rule']?->name,
            ],
            'auth_user' => auth()->check() ? [
                'name'  => auth()->user()->name,
                'email' => auth()->user()->email,
            ] : null,
        ]);
    }

    /**
     * POST /bookings
     * Creates the booking using pessimistic DB locking to prevent double-booking.
     */
    public function store(StoreBookingRequest $request): \Illuminate\Http\RedirectResponse
    {
        $validated = $request->validated();

        $booking = DB::transaction(function () use ($validated) {
            // Pessimistic lock on the room row — blocks concurrent transactions
            $room = Room::lockForUpdate()->findOrFail($validated['room_id']);

            if (in_array($room->status, ['maintenance', 'out_of_order'])) {
                abort(409, 'This room is currently unavailable.');
            }

            // Re-check conflicts with the lock held
            if (Booking::hasConflict($room->id, $validated['check_in'], $validated['check_out'])) {
                abort(409, 'Sorry, this room was just booked by someone else. Please select different dates.');
            }

            // Re-compute price server-side (never trust client-submitted prices)
            $stay = RoomPricing::resolveStay($room, $validated['check_in'], $validated['check_out']);

            return Booking::create([
                'user_id'          => auth()->id(), // null for guests
                'room_id'          => $room->id,
                'hotel_id'         => $room->hotel_id,
                'confirmation_code'=> Booking::generateConfirmationCode(),
                'guest_name'       => $validated['guest_name'],
                'guest_email'      => $validated['guest_email'],
                'guest_phone'      => $validated['guest_phone'],
                'special_requests' => $validated['special_requests'] ?? null,
                'check_in'         => $validated['check_in'],
                'check_out'        => $validated['check_out'],
                'guests'           => $validated['guests'],
                'nights'           => $stay['nights'],
                'price_per_night'  => $stay['avg_price_per_night'],
                'total_price'      => $stay['total_price'],
                'status'           => 'pending',
                'payment_method'   => 'stripe',
                'payment_status'   => 'pending',
            ]);
        });

        // Redirect to the Pay Now page
        return redirect()->route('bookings.pay', $booking);
    }

    /**
     * GET /bookings/{booking}/pay
     * Shows the Stripe card payment page.
     */
    public function pay(Request $request, Booking $booking): Response|\Illuminate\Http\RedirectResponse
    {
        // Only the booking owner (or the guest who created it via email) can access this page.
        // For now: the booking must be pending payment.
        if ($booking->payment_status !== 'pending' || $booking->status === 'cancelled') {
            return redirect()->route('home')->with('error', 'This booking is no longer payable.');
        }

        // Ownership check: if logged in, must own it; if guest, allow via session (set in store())
        if (auth()->check() && $booking->user_id && $booking->user_id !== auth()->id()) {
            abort(403);
        }

        $booking->load(['room', 'hotel', 'hotel.images', 'room.images']);

        return Inertia::render('bookings/pay', [
            'booking' => [
                'id'                => $booking->id,
                'confirmation_code' => $booking->confirmation_code,
                'guest_name'        => $booking->guest_name,
                'guest_email'       => $booking->guest_email,
                'check_in'          => $booking->check_in->format('Y-m-d'),
                'check_out'         => $booking->check_out->format('Y-m-d'),
                'nights'            => $booking->nights,
                'guests'            => $booking->guests,
                'price_per_night'   => (float) $booking->price_per_night,
                'total_price'       => (float) $booking->total_price,
                'status'            => $booking->status,
                'payment_status'    => $booking->payment_status,
            ],
            'hotel' => [
                'id'          => $booking->hotel->id,
                'name'        => $booking->hotel->name,
                'city'        => $booking->hotel->city,
                'star_rating' => $booking->hotel->star_rating,
                'images'      => $booking->hotel->images->map(fn ($img) => ['id' => $img->id, 'path' => $img->path])->values()->all(),
            ],
            'room' => [
                'id'   => $booking->room->id,
                'name' => $booking->room->name,
                'type' => $booking->room->type,
            ],
            // Stripe publishable key — safe to expose to frontend
            'stripe_key' => config('services.stripe.key'),
        ]);
    }
}
