<?php

namespace App\Jobs;

use App\Mail\PartnerWelcomeMail;
use App\Models\Hotel;
use App\Models\User;
use Exception;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;

class HotelRegistrationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = 60;

    public function __construct(public User $partner, public Hotel $hotel) {}

    public function handle(): void
    {
        try {
            $resetToken = Password::createToken($this->partner);
            Mail::to($this->partner->email)->send(new PartnerWelcomeMail($this->partner, $this->hotel, $resetToken));
        } catch (Exception $e) {
            Log::error('HotelRegistrationJob failed: '.$e->getMessage(), [
                'partner_id' => $this->partner->id,
                'hotel_id' => $this->hotel->id,
                'exception' => $e,
            ]);
            throw $e;
        }
    }
}
