<?php

use App\Models\Booking;
use App\Models\Hotel;
use App\Models\Room;
use App\Models\StripeWebhookEvent;
use App\Models\User;
use App\Services\StripeGateway;
use Illuminate\Support\Facades\Config;
use Mockery\MockInterface;

function createHotelWithRoom(): array
{
    $partner = User::factory()->create();

    $hotel = Hotel::create([
        'user_id' => $partner->id,
        'name' => 'Test Hotel',
        'address' => '123 Road',
        'city' => 'Dhaka',
        'country' => 'Bangladesh',
        'star_rating' => 4,
        'phone' => '0123456789',
        'email' => 'hotel@example.com',
        'description' => 'A nice place to stay',
        'status' => 'active',
    ]);

    $room = Room::create([
        'hotel_id' => $hotel->id,
        'name' => 'Deluxe Room',
        'type' => 'Deluxe',
        'capacity' => 2,
        'price_per_night' => 5000,
        'status' => 'available',
    ]);

    return [$hotel, $room];
}

test('expired pending bookings no longer block room availability', function () {
    [$hotel, $room] = createHotelWithRoom();

    Booking::create([
        'room_id' => $room->id,
        'hotel_id' => $hotel->id,
        'confirmation_code' => Booking::generateConfirmationCode(),
        'guest_access_token' => Booking::generateGuestAccessToken(),
        'guest_name' => 'Expired Hold',
        'guest_email' => 'expired@example.com',
        'guest_phone' => '01234',
        'check_in' => '2026-04-10',
        'check_out' => '2026-04-12',
        'guests' => 2,
        'nights' => 2,
        'price_per_night' => 5000,
        'total_price' => 10000,
        'status' => 'pending',
        'payment_method' => 'stripe',
        'payment_status' => 'pending',
        'payment_expires_at' => now()->subMinute(),
    ]);

    expect(Booking::hasConflict($room->id, '2026-04-10', '2026-04-12'))->toBeFalse();
});

test('booking store creates a temporary hold and redirects guest to payment page', function () {
    [$hotel, $room] = createHotelWithRoom();

    Config::set('booking.payment_hold_minutes', 15);

    $response = $this->post(route('bookings.store'), [
        'room_id' => $room->id,
        'check_in' => '2026-04-15',
        'check_out' => '2026-04-17',
        'guests' => 2,
        'guest_name' => 'Rahim',
        'guest_email' => 'rahim@example.com',
        'guest_phone' => '01700000000',
    ]);

    $booking = Booking::firstOrFail();

    $response->assertRedirect(route('bookings.pay', [
        'booking' => $booking,
        'access' => $booking->guest_access_token,
    ]));

    expect($booking->status)->toBe('pending')
        ->and($booking->payment_status)->toBe('pending')
        ->and($booking->guest_access_token)->not->toBeNull()
        ->and($booking->payment_expires_at?->isFuture())->toBeTrue();
});

test('stripe setup check returns working result when credentials are valid', function () {
    $this->mock(StripeGateway::class, function (MockInterface $mock): void {
        $mock->shouldReceive('retrieveAccount')->once()->andReturn(['id' => 'acct_test_123']);
    });

    Config::set('services.stripe.key', 'pk_test_123');
    Config::set('services.stripe.secret', 'sk_test_123');
    Config::set('services.stripe.webhook_secret', 'whsec_123');

    $this->getJson(route('stripe.setup-check'))
        ->assertOk()
        ->assertJson([
            'publishable_key_present' => true,
            'publishable_key_prefix_ok' => true,
            'secret_key_present' => true,
            'secret_key_prefix_ok' => true,
            'webhook_secret_present' => true,
            'stripe_api_reachable' => true,
            'stripe_account_id' => 'acct_test_123',
        ]);
});

test('successful webhook confirms booking when no conflict exists', function () {
    [$hotel, $room] = createHotelWithRoom();

    $booking = Booking::create([
        'room_id' => $room->id,
        'hotel_id' => $hotel->id,
        'confirmation_code' => Booking::generateConfirmationCode(),
        'guest_access_token' => Booking::generateGuestAccessToken(),
        'guest_name' => 'Confirmed Guest',
        'guest_email' => 'confirmed@example.com',
        'guest_phone' => '01234',
        'check_in' => '2026-04-20',
        'check_out' => '2026-04-22',
        'guests' => 2,
        'nights' => 2,
        'price_per_night' => 5000,
        'total_price' => 10000,
        'status' => 'pending',
        'payment_method' => 'stripe',
        'payment_status' => 'pending',
        'payment_expires_at' => now()->addMinutes(15),
        'stripe_payment_intent_id' => 'pi_success_123',
    ]);

    $this->mock(StripeGateway::class, function (MockInterface $mock): void {
        $mock->shouldReceive('verifyWebhookSignature')->once()->andReturnTrue();
    });

    $payload = [
        'id' => 'evt_success_123',
        'type' => 'payment_intent.succeeded',
        'data' => [
            'object' => [
                'id' => 'pi_success_123',
            ],
        ],
    ];

    $this->postJson(route('stripe.webhook'), $payload, [
        'Stripe-Signature' => 't=1,v1=fake',
    ])->assertOk();

    $booking->refresh();

    expect($booking->status)->toBe('confirmed')
        ->and($booking->payment_status)->toBe('paid')
        ->and($booking->payment_expires_at)->toBeNull();
});

test('successful webhook refunds payment instead of double booking after another booking wins the room', function () {
    [$hotel, $room] = createHotelWithRoom();

    Booking::create([
        'room_id' => $room->id,
        'hotel_id' => $hotel->id,
        'confirmation_code' => Booking::generateConfirmationCode(),
        'guest_access_token' => Booking::generateGuestAccessToken(),
        'guest_name' => 'Other Guest',
        'guest_email' => 'other@example.com',
        'guest_phone' => '01234',
        'check_in' => '2026-04-25',
        'check_out' => '2026-04-27',
        'guests' => 2,
        'nights' => 2,
        'price_per_night' => 5000,
        'total_price' => 10000,
        'status' => 'confirmed',
        'payment_method' => 'stripe',
        'payment_status' => 'paid',
        'payment_expires_at' => null,
    ]);

    $booking = Booking::create([
        'room_id' => $room->id,
        'hotel_id' => $hotel->id,
        'confirmation_code' => Booking::generateConfirmationCode(),
        'guest_access_token' => Booking::generateGuestAccessToken(),
        'guest_name' => 'Late Guest',
        'guest_email' => 'late@example.com',
        'guest_phone' => '01234',
        'check_in' => '2026-04-25',
        'check_out' => '2026-04-27',
        'guests' => 2,
        'nights' => 2,
        'price_per_night' => 5000,
        'total_price' => 10000,
        'status' => 'pending',
        'payment_method' => 'stripe',
        'payment_status' => 'pending',
        'payment_expires_at' => now()->addMinutes(15),
        'stripe_payment_intent_id' => 'pi_refund_123',
    ]);

    $this->mock(StripeGateway::class, function (MockInterface $mock) use ($booking): void {
        $mock->shouldReceive('verifyWebhookSignature')->once()->andReturnTrue();
        $mock->shouldReceive('createRefund')
            ->once()
            ->with('pi_refund_123', [
                'booking_id' => $booking->id,
                'reason' => 'conflict_or_expired',
            ])
            ->andReturn(['id' => 're_123']);
    });

    $payload = [
        'id' => 'evt_refund_123',
        'type' => 'payment_intent.succeeded',
        'data' => [
            'object' => [
                'id' => 'pi_refund_123',
            ],
        ],
    ];

    $this->postJson(route('stripe.webhook'), $payload, [
        'Stripe-Signature' => 't=1,v1=fake',
    ])->assertOk();

    $booking->refresh();

    expect($booking->status)->toBe('cancelled')
        ->and($booking->payment_status)->toBe('refunded')
        ->and($booking->cancelled_at)->not->toBeNull();
});

test('failed webhook processing does not mark the event as processed so a retry can succeed', function () {
    [$hotel, $room] = createHotelWithRoom();

    Booking::create([
        'room_id' => $room->id,
        'hotel_id' => $hotel->id,
        'confirmation_code' => Booking::generateConfirmationCode(),
        'guest_access_token' => Booking::generateGuestAccessToken(),
        'guest_name' => 'Winning Guest',
        'guest_email' => 'winner@example.com',
        'guest_phone' => '01234',
        'check_in' => '2026-04-28',
        'check_out' => '2026-04-30',
        'guests' => 2,
        'nights' => 2,
        'price_per_night' => 5000,
        'total_price' => 10000,
        'status' => 'confirmed',
        'payment_method' => 'stripe',
        'payment_status' => 'paid',
    ]);

    $booking = Booking::create([
        'room_id' => $room->id,
        'hotel_id' => $hotel->id,
        'confirmation_code' => Booking::generateConfirmationCode(),
        'guest_access_token' => Booking::generateGuestAccessToken(),
        'guest_name' => 'Retry Guest',
        'guest_email' => 'retry@example.com',
        'guest_phone' => '01234',
        'check_in' => '2026-04-28',
        'check_out' => '2026-04-30',
        'guests' => 2,
        'nights' => 2,
        'price_per_night' => 5000,
        'total_price' => 10000,
        'status' => 'pending',
        'payment_method' => 'stripe',
        'payment_status' => 'pending',
        'payment_expires_at' => now()->addMinutes(15),
        'stripe_payment_intent_id' => 'pi_retry_123',
    ]);

    $payload = [
        'id' => 'evt_retry_123',
        'type' => 'payment_intent.succeeded',
        'data' => [
            'object' => [
                'id' => 'pi_retry_123',
            ],
        ],
    ];

    $this->withExceptionHandling();

    $this->mock(StripeGateway::class, function (MockInterface $mock) use ($booking): void {
        $mock->shouldReceive('verifyWebhookSignature')->twice()->andReturnTrue();
        $mock->shouldReceive('createRefund')
            ->once()
            ->with('pi_retry_123', [
                'booking_id' => $booking->id,
                'reason' => 'conflict_or_expired',
            ])
            ->andThrow(new \RuntimeException('Temporary refund failure'));
        $mock->shouldReceive('createRefund')
            ->once()
            ->with('pi_retry_123', [
                'booking_id' => $booking->id,
                'reason' => 'conflict_or_expired',
            ])
            ->andReturn(['id' => 're_retry_123']);
    });

    $this->postJson(route('stripe.webhook'), $payload, [
        'Stripe-Signature' => 't=1,v1=fake',
    ])->assertStatus(500);

    expect(StripeWebhookEvent::where('stripe_event_id', 'evt_retry_123')->exists())->toBeFalse();

    $this->postJson(route('stripe.webhook'), $payload, [
        'Stripe-Signature' => 't=1,v1=fake',
    ])->assertOk();

    $booking->refresh();

    expect(StripeWebhookEvent::where('stripe_event_id', 'evt_retry_123')->exists())->toBeTrue()
        ->and($booking->status)->toBe('cancelled')
        ->and($booking->payment_status)->toBe('refunded');
});
