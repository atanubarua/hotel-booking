<?php

namespace App\Mail;

use App\Models\Hotel;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PartnerWelcomeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $partner,
        public Hotel $hotel,
        public string $resetToken,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Welcome to {$this->hotel->name} - Set Your Password",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.partner-welcome',
            with: [
                'partner' => $this->partner,
                'hotel' => $this->hotel,
                'resetToken' => $this->resetToken,
            ],
        );
    }
}
