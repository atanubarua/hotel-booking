<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBookingRequest;
use App\Models\Booking;
use App\Models\Room;
use App\Models\StripeWebhookEvent;
use App\Services\StripeGateway;
use App\Support\RoomPricing;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Throwable;

class BookingController extends Controller
{
    public function __construct(
        private readonly StripeGateway $stripe,
    ) {
    }

    public function create(Request $request): Response|RedirectResponse
    {
        $request->validate([
            'room_id' => 'required|integer|exists:rooms,id',
            'check_in' => 'required|date|after_or_equal:today',
            'check_out' => 'required|date|after:check_in',
            'guests' => 'nullable|integer|min:1',
        ]);

        $room = Room::with(['hotel', 'hotel.images', 'images', 'priceRules'])->findOrFail($request->room_id);
        $hotel = $room->hotel;

        if (in_array($room->status, ['maintenance', 'out_of_order'], true)) {
            return redirect()->back()->withErrors(['room_id' => 'This room is not available for booking.']);
        }

        $checkin = $request->check_in;
        $checkout = $request->check_out;
        $guests = (int) $request->input('guests', 1);

        if (Booking::hasConflict($room->id, $checkin, $checkout)) {
            return redirect()->back()->withErrors(['room_id' => 'Sorry, this room is no longer available for your selected dates.']);
        }

        $stay = RoomPricing::resolveStay($room, $checkin, $checkout);

        return Inertia::render('bookings/create', [
            'hotel' => [
                'id' => $hotel->id,
                'name' => $hotel->name,
                'city' => $hotel->city,
                'country' => $hotel->country,
                'address' => $hotel->address,
                'star_rating' => $hotel->star_rating,
                'images' => $hotel->images->map(fn ($img) => ['id' => $img->id, 'path' => $img->path])->values()->all(),
            ],
            'room' => [
                'id' => $room->id,
                'name' => $room->name,
                'type' => $room->type,
                'capacity' => $room->capacity,
                'price_per_night' => (float) $room->price_per_night,
                'images' => $room->images->map(fn ($img) => ['id' => $img->id, 'path' => $img->path])->values()->all(),
            ],
            'stay' => [
                'check_in' => $checkin,
                'check_out' => $checkout,
                'guests' => $guests,
                'nights' => $stay['nights'],
                'price_per_night' => $stay['avg_price_per_night'],
                'total_price' => $stay['total_price'],
                'breakdown' => $stay['breakdown'],
                'applied_rule_name' => $stay['applied_rule']?->name,
            ],
            'auth_user' => auth()->check() ? [
                'name' => auth()->user()->name,
                'email' => auth()->user()->email,
            ] : null,
        ]);
    }

    public function store(StoreBookingRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $booking = rescue(function () use ($validated) {
            return DB::transaction(function () use ($validated) {
                $room = Room::lockForUpdate()->findOrFail($validated['room_id']);

                if (in_array($room->status, ['maintenance', 'out_of_order'], true)) {
                    abort(HttpResponse::HTTP_CONFLICT, 'This room is currently unavailable.');
                }

                if (Booking::hasConflict($room->id, $validated['check_in'], $validated['check_out'])) {
                    abort(HttpResponse::HTTP_CONFLICT, 'Sorry, this room was just booked by someone else. Please select different dates.');
                }

                $stay = RoomPricing::resolveStay($room, $validated['check_in'], $validated['check_out']);

                return Booking::create([
                    'user_id' => auth()->id(),
                    'room_id' => $room->id,
                    'hotel_id' => $room->hotel_id,
                    'confirmation_code' => Booking::generateConfirmationCode(),
                    'guest_access_token' => Booking::generateGuestAccessToken(),
                    'guest_name' => $validated['guest_name'],
                    'guest_email' => $validated['guest_email'],
                    'guest_phone' => $validated['guest_phone'],
                    'special_requests' => $validated['special_requests'] ?? null,
                    'check_in' => $validated['check_in'],
                    'check_out' => $validated['check_out'],
                    'guests' => $validated['guests'],
                    'nights' => $stay['nights'],
                    'price_per_night' => $stay['avg_price_per_night'],
                    'total_price' => $stay['total_price'],
                    'status' => 'pending',
                    'payment_method' => 'stripe',
                    'payment_status' => 'pending',
                    'payment_expires_at' => now()->addMinutes(config('booking.payment_hold_minutes', 15)),
                ]);
            });
        }, function (QueryException $e) use ($validated) {
            if (! Str::contains($e->getMessage(), ['Duplicate entry', 'UNIQUE constraint failed'])) {
                throw $e;
            }

            // Rare token/code collision — retry once with freshly generated values
            return DB::transaction(function () use ($validated) {
                $room = Room::lockForUpdate()->findOrFail($validated['room_id']);
                $stay = RoomPricing::resolveStay($room, $validated['check_in'], $validated['check_out']);

                return Booking::create([
                    'user_id' => auth()->id(),
                    'room_id' => $room->id,
                    'hotel_id' => $room->hotel_id,
                    'confirmation_code' => Booking::generateConfirmationCode(),
                    'guest_access_token' => Booking::generateGuestAccessToken(),
                    'guest_name' => $validated['guest_name'],
                    'guest_email' => $validated['guest_email'],
                    'guest_phone' => $validated['guest_phone'],
                    'special_requests' => $validated['special_requests'] ?? null,
                    'check_in' => $validated['check_in'],
                    'check_out' => $validated['check_out'],
                    'guests' => $validated['guests'],
                    'nights' => $stay['nights'],
                    'price_per_night' => $stay['avg_price_per_night'],
                    'total_price' => $stay['total_price'],
                    'status' => 'pending',
                    'payment_method' => 'stripe',
                    'payment_status' => 'pending',
                    'payment_expires_at' => now()->addMinutes(config('booking.payment_hold_minutes', 15)),
                ]);
            });
        });

        $this->rememberGuestBooking($request, $booking);

        return redirect()->route('bookings.pay', [
            'booking' => $booking,
            'access' => $booking->guest_access_token,
        ]);
    }

    public function pay(Request $request, Booking $booking): Response|RedirectResponse
    {
        if (! $this->canAccessBooking($request, $booking)) {
            abort(HttpResponse::HTTP_FORBIDDEN);
        }

        if ($this->expireIfPastDue($booking)) {
            return redirect()->route('home')->with('error', 'This payment session expired. Please start a new booking.');
        }

        if ($booking->payment_status === 'paid' && $booking->status === 'confirmed') {
            return redirect()->route('bookings.confirmation', [
                'booking' => $booking,
                'access' => $booking->guest_access_token,
            ]);
        }

        if (! $booking->canBePaid()) {
            return redirect()->route('home')->with('error', 'This booking is no longer payable.');
        }

        $booking->load(['room', 'hotel', 'hotel.images', 'room.images']);

        return Inertia::render('bookings/pay', [
            'booking' => $this->bookingPayload($booking),
            'hotel' => [
                'id' => $booking->hotel->id,
                'name' => $booking->hotel->name,
                'city' => $booking->hotel->city,
                'star_rating' => $booking->hotel->star_rating,
                'images' => $booking->hotel->images->map(fn ($img) => ['id' => $img->id, 'path' => $img->path])->values()->all(),
            ],
            'room' => [
                'id' => $booking->room->id,
                'name' => $booking->room->name,
                'type' => $booking->room->type,
            ],
            'stripe_key' => config('services.stripe.key'),
            'payment_intent_url' => route('bookings.payment-intent', [
                'booking' => $booking,
                'access' => $booking->guest_access_token,
            ]),
            'status_url' => route('bookings.status', [
                'booking' => $booking,
                'access' => $booking->guest_access_token,
            ]),
            'confirmation_url' => route('bookings.confirmation', [
                'booking' => $booking,
                'access' => $booking->guest_access_token,
            ]),
            'setup_check_url' => auth()->user()?->isAdmin() ? route('admin.stripe.setup-check') : null,
        ]);
    }

    public function paymentIntent(Request $request, Booking $booking): JsonResponse
    {
        if (! $this->canAccessBooking($request, $booking)) {
            abort(HttpResponse::HTTP_FORBIDDEN);
        }

        try {
            $payload = DB::transaction(function () use ($booking) {
                /** @var Booking $lockedBooking */
                $lockedBooking = Booking::query()->lockForUpdate()->findOrFail($booking->id);
                Room::query()->lockForUpdate()->findOrFail($lockedBooking->room_id);

                if ($this->expireIfPastDue($lockedBooking)) {
                    abort(HttpResponse::HTTP_CONFLICT, 'This payment session expired. Please start again.');
                }

                if (! $lockedBooking->canBePaid()) {
                    abort(HttpResponse::HTTP_CONFLICT, 'This booking is no longer payable.');
                }

                if ($lockedBooking->stripe_payment_intent_id) {
                    $intent = $this->stripe->retrievePaymentIntent($lockedBooking->stripe_payment_intent_id);

                    if (isset($intent['status']) && $intent['status'] !== 'canceled') {
                        return [
                            'client_secret' => $intent['client_secret'] ?? null,
                            'payment_intent_id' => $intent['id'] ?? $lockedBooking->stripe_payment_intent_id,
                            'status' => $intent['status'] ?? null,
                            'expires_at' => optional($lockedBooking->payment_expires_at)->toIso8601String(),
                        ];
                    }

                    $lockedBooking->forceFill([
                        'stripe_payment_intent_id' => null,
                        'payment_intent_attempt' => ($lockedBooking->payment_intent_attempt ?? 1) + 1,
                    ])->save();
                }

                $intent = $this->stripe->createPaymentIntent(
                    $lockedBooking,
                    route('bookings.confirmation', [
                        'booking' => $lockedBooking,
                        'access' => $lockedBooking->guest_access_token,
                    ]),
                );

                $lockedBooking->forceFill([
                    'stripe_payment_intent_id' => $intent['id'],
                    'payment_status' => 'pending',
                ])->save();

                return [
                    'client_secret' => $intent['client_secret'] ?? null,
                    'payment_intent_id' => $intent['id'],
                    'status' => $intent['status'] ?? null,
                    'expires_at' => optional($lockedBooking->payment_expires_at)->toIso8601String(),
                ];
            });
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'message' => $e->getMessage() ?: 'Unable to start payment.',
            ], HttpResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (! $payload['client_secret']) {
            return response()->json([
                'message' => 'Stripe did not return a client secret.',
            ], HttpResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        return response()->json($payload);
    }

    public function status(Request $request, Booking $booking): JsonResponse
    {
        if (! $this->canAccessBooking($request, $booking)) {
            abort(HttpResponse::HTTP_FORBIDDEN);
        }

        $booking->refresh();
        $this->expireIfPastDue($booking);

        return response()->json($this->bookingPayload($booking->fresh()));
    }

    public function confirmation(Request $request, Booking $booking): Response|RedirectResponse
    {
        if (! $this->canAccessBooking($request, $booking)) {
            abort(HttpResponse::HTTP_FORBIDDEN);
        }

        $booking->load(['room', 'hotel', 'hotel.images']);
        $this->rememberGuestBooking($request, $booking);

        return Inertia::render('bookings/confirmation', [
            'booking' => $this->bookingPayload($booking),
            'hotel' => [
                'id' => $booking->hotel->id,
                'name' => $booking->hotel->name,
                'city' => $booking->hotel->city,
                'country' => $booking->hotel->country,
                'star_rating' => $booking->hotel->star_rating,
                'images' => $booking->hotel->images->map(fn ($img) => ['id' => $img->id, 'path' => $img->path])->values()->all(),
            ],
            'room' => [
                'name' => $booking->room->name,
                'type' => $booking->room->type,
            ],
            'status_url' => route('bookings.status', [
                'booking' => $booking,
                'access' => $booking->guest_access_token,
            ]),
            'pay_url' => route('bookings.pay', [
                'booking' => $booking,
                'access' => $booking->guest_access_token,
            ]),
        ]);
    }

    public function stripeSetupCheck(): JsonResponse
    {
        $publishableKey = (string) config('services.stripe.key');
        $secretKey = (string) config('services.stripe.secret');
        $webhookSecret = (string) config('services.stripe.webhook_secret');

        $result = [
            'publishable_key_present' => $publishableKey !== '',
            'publishable_key_prefix_ok' => str_starts_with($publishableKey, 'pk_test_'),
            'secret_key_present' => $secretKey !== '',
            'secret_key_prefix_ok' => str_starts_with($secretKey, 'sk_test_'),
            'webhook_secret_present' => $webhookSecret !== '',
            'stripe_api_reachable' => false,
            'stripe_account_id' => null,
            'message' => null,
        ];

        try {
            $account = $this->stripe->retrieveAccount();
            $result['stripe_api_reachable'] = true;
            $result['stripe_account_id'] = $account['id'] ?? null;
            $result['message'] = 'Stripe test credentials are working.';
        } catch (Throwable $e) {
            $result['message'] = $e->getMessage();

            return response()->json($result, HttpResponse::HTTP_UNPROCESSABLE_ENTITY);
        }

        return response()->json($result);
    }

    public function webhook(Request $request): JsonResponse
    {
        $payload = $request->getContent();
        $signature = (string) $request->header('Stripe-Signature');

        if (! $this->stripe->verifyWebhookSignature($payload, $signature)) {
            return response()->json(['message' => 'Invalid Stripe signature.'], HttpResponse::HTTP_BAD_REQUEST);
        }

        $event = json_decode($payload, true);

        if (! is_array($event) || ! isset($event['id'], $event['type'])) {
            return response()->json(['message' => 'Invalid Stripe payload.'], HttpResponse::HTTP_BAD_REQUEST);
        }

        $object = data_get($event, 'data.object');

        if (! is_array($object)) {
            return response()->json(['received' => true]);
        }

        try {
            $handled = DB::transaction(function () use ($event, $object): bool {
                try {
                    StripeWebhookEvent::create([
                        'stripe_event_id' => $event['id'],
                        'type' => $event['type'],
                        'processed_at' => now(),
                    ]);
                } catch (QueryException $e) {
                    if (Str::contains($e->getMessage(), ['Duplicate entry', 'UNIQUE constraint failed'])) {
                        return false;
                    }

                    throw $e;
                }

                match ($event['type']) {
                    'payment_intent.succeeded' => $this->handlePaymentIntentSucceeded($object),
                    'payment_intent.payment_failed' => $this->handlePaymentIntentFailed($object),
                    'payment_intent.canceled' => $this->handlePaymentIntentCanceled($object),
                    default => null,
                };

                return true;
            });
        } catch (Throwable $e) {
            report($e);
            throw $e;
        }

        if (! $handled) {
            return response()->json(['received' => true]);
        }

        return response()->json(['received' => true]);
    }

    private function handlePaymentIntentSucceeded(array $intent): void
    {
        DB::transaction(function () use ($intent) {
            $booking = Booking::query()
                ->where('stripe_payment_intent_id', $intent['id'] ?? null)
                ->lockForUpdate()
                ->first();

            if (! $booking) {
                return;
            }

            Room::query()->lockForUpdate()->findOrFail($booking->room_id);

            if ($booking->payment_status === 'paid' && $booking->status === 'confirmed') {
                return;
            }

            $hasConflict = Booking::hasConflict(
                $booking->room_id,
                $booking->check_in->format('Y-m-d'),
                $booking->check_out->format('Y-m-d'),
                $booking->id,
            );

            if (($booking->status === 'expired' || $booking->status === 'cancelled' || $hasConflict) && $booking->payment_status !== 'refunded') {
                $this->stripe->createRefund($booking->stripe_payment_intent_id, [
                    'booking_id' => $booking->id,
                    'reason' => 'conflict_or_expired',
                ]);

                $booking->forceFill([
                    'status' => 'cancelled',
                    'payment_status' => 'refunded',
                    'cancelled_at' => now(),
                    'payment_expires_at' => null,
                ])->save();

                return;
            }

            $booking->forceFill([
                'status' => 'confirmed',
                'payment_status' => 'paid',
                'payment_expires_at' => null,
            ])->save();
        });
    }

    private function handlePaymentIntentFailed(array $intent): void
    {
        Booking::query()
            ->where('stripe_payment_intent_id', $intent['id'] ?? null)
            ->where('status', 'pending')
            ->where('payment_status', '!=', 'paid')
            ->update([
                'payment_status' => 'failed',
            ]);
    }

    private function handlePaymentIntentCanceled(array $intent): void
    {
        Booking::query()
            ->where('stripe_payment_intent_id', $intent['id'] ?? null)
            ->where('status', 'pending')
            ->where('payment_status', '!=', 'paid')
            ->update([
                'status' => 'expired',
                'payment_status' => 'failed',
                'payment_expires_at' => null,
            ]);
    }

    private function canAccessBooking(Request $request, Booking $booking): bool
    {
        if (auth()->check()) {
            if ($booking->user_id === null) {
                return $this->hasGuestAccess($request, $booking);
            }

            return $booking->user_id === auth()->id();
        }

        return $this->hasGuestAccess($request, $booking);
    }

    private function hasGuestAccess(Request $request, Booking $booking): bool
    {
        $access = (string) $request->query('access', '');
        $tokens = collect($request->session()->get('guest_booking_tokens', []));

        return ($access !== '' && hash_equals($booking->guest_access_token ?? '', $access))
            || $tokens->get((string) $booking->id) === $booking->guest_access_token;
    }

    private function rememberGuestBooking(Request $request, Booking $booking): void
    {
        $tokens = $request->session()->get('guest_booking_tokens', []);
        $tokens[(string) $booking->id] = $booking->guest_access_token;
        $request->session()->put('guest_booking_tokens', $tokens);
    }

    private function expireIfPastDue(Booking $booking): bool
    {
        if ($booking->status !== 'pending' || ! $booking->payment_expires_at?->isPast()) {
            return false;
        }

        if ($booking->stripe_payment_intent_id) {
            try {
                $this->stripe->cancelPaymentIntent($booking->stripe_payment_intent_id);
            } catch (Throwable $e) {
                report($e);
            }
        }

        $booking->forceFill([
            'status' => 'expired',
            'payment_status' => 'failed',
            'payment_expires_at' => null,
        ])->save();

        return true;
    }

    private function bookingPayload(Booking $booking): array
    {
        return [
            'id' => $booking->id,
            'confirmation_code' => $booking->confirmation_code,
            'guest_name' => $booking->guest_name,
            'guest_email' => $booking->guest_email,
            'check_in' => $booking->check_in->format('Y-m-d'),
            'check_out' => $booking->check_out->format('Y-m-d'),
            'nights' => $booking->nights,
            'guests' => $booking->guests,
            'price_per_night' => (float) $booking->price_per_night,
            'total_price' => (float) $booking->total_price,
            'status' => $booking->status,
            'payment_status' => $booking->payment_status,
            'payment_expires_at' => optional($booking->payment_expires_at)->toIso8601String(),
        ];
    }
}
