<?php

namespace App\Mail;

use App\Support\Branding\UnivAiBranding;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WelcomeGuideMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public array $sessionUser,
        public array $guide
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: UnivAiBranding::emailSubject('Welcome to UnivAI - your quick start guide'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.welcome-guide',
            with: [
                'brandName' => UnivAiBranding::name(),
                'supportEmail' => UnivAiBranding::supportEmail(),
                'portalUrl' => UnivAiBranding::publicUrl(),
                'user' => $this->sessionUser,
                'guide' => $this->guide,
            ],
        );
    }
}
