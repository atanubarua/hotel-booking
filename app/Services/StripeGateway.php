<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class StripeGateway
{
    private const BASE_URL = 'https://api.stripe.com/v1';

    public function createPaymentIntent(Booking $booking, string $returnUrl): array
    {
        $amount = $this->toMinorUnits((float) $booking->total_price);

        $response = $this->request('post', '/payment_intents', [
            'amount' => $amount,
            'currency' => 'bdt',
            'payment_method_types[]' => 'card',
            'description' => sprintf('Hotel booking %s', $booking->confirmation_code),
            'receipt_email' => $booking->guest_email,
            'metadata[booking_id]' => (string) $booking->id,
            'metadata[room_id]' => (string) $booking->room_id,
            'metadata[check_in]' => $booking->check_in->format('Y-m-d'),
            'metadata[check_out]' => $booking->check_out->format('Y-m-d'),
            'metadata[confirmation_code]' => $booking->confirmation_code,
            'metadata[guest_email]' => $booking->guest_email,
            'metadata[return_url]' => $returnUrl,
            'payment_method_options[card][request_three_d_secure]' => 'automatic',
        ], [
            'Idempotency-Key' => sprintf('booking:%d:payment-intent:v%d', $booking->id, $booking->payment_intent_attempt ?? 1),
        ]);

        $data = $this->decode($response);

        if (! isset($data['id'])) {
            throw new RuntimeException('Stripe did not return a valid PaymentIntent.');
        }

        return $data;
    }

    public function retrievePaymentIntent(string $paymentIntentId): array
    {
        return $this->decode($this->request('get', '/payment_intents/' . $paymentIntentId));
    }

    public function retrieveAccount(): array
    {
        return $this->decode($this->request('get', '/account'));
    }

    public function cancelPaymentIntent(string $paymentIntentId): array
    {
        return $this->decode($this->request('post', '/payment_intents/' . $paymentIntentId . '/cancel'));
    }

    public function createRefund(string $paymentIntentId, array $metadata = []): array
    {
        $payload = ['payment_intent' => $paymentIntentId];

        foreach ($metadata as $key => $value) {
            $payload["metadata[{$key}]"] = (string) $value;
        }

        return $this->decode($this->request('post', '/refunds', $payload, [
            'Idempotency-Key' => sprintf(
                'payment-intent:%s:refund:%s',
                $paymentIntentId,
                md5(json_encode($metadata) ?: ''),
            ),
        ]));
    }

    public function verifyWebhookSignature(string $payload, string $signatureHeader): bool
    {
        $secret = (string) config('services.stripe.webhook_secret');

        if ($secret === '' || $signatureHeader === '') {
            return false;
        }

        $parts = collect(explode(',', $signatureHeader))
            ->mapWithKeys(function (string $part): array {
                [$key, $value] = array_pad(explode('=', $part, 2), 2, null);

                return [$key => $value];
            });

        $timestamp = $parts->get('t');
        $signature = $parts->get('v1');

        if (! $timestamp || ! $signature) {
            return false;
        }

        if (abs(now()->timestamp - (int) $timestamp) > 300) {
            return false;
        }

        $expected = hash_hmac('sha256', $timestamp . '.' . $payload, $secret);

        return hash_equals($expected, $signature);
    }

    private function decode(Response $response): array
    {
        $data = $response->json();

        if (! is_array($data)) {
            throw new RuntimeException('Stripe returned an unexpected response.');
        }

        if (isset($data['error'])) {
            $message = $data['error']['message'] ?? 'Unknown Stripe error.';
            $code    = $data['error']['code'] ?? $data['error']['type'] ?? 'unknown';
            throw new RuntimeException("Stripe error ({$code}): {$message}");
        }

        return $data;
    }

    private function request(string $method, string $path, array $payload = [], array $headers = []): Response
    {
        $secret = (string) config('services.stripe.secret');

        if ($secret === '') {
            throw new RuntimeException('Stripe secret key is not configured.');
        }

        $response = Http::withBasicAuth($secret, '')
            ->acceptJson()
            ->asForm()
            ->withHeaders($headers)
            ->send($method, self::BASE_URL . $path, [
                'form_params' => $payload,
            ]);

        $response->throw();

        return $response;
    }

    private function toMinorUnits(float $amount): int
    {
        // Stripe expects amounts in the smallest currency unit.
        // BDT uses 2 decimal places (poisha), so multiply by 100.
        return (int) round($amount * 100);
    }
}
