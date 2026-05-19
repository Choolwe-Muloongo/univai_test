<?php

namespace App\Mail;

use App\Models\Invoice;
use App\Models\Payment;
use App\Support\Branding\UnivAiBranding;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentReceiptMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Invoice $invoice,
        public ?Payment $payment = null,
        public array $extra = []
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: UnivAiBranding::emailSubject('Payment receipt: ' . $this->invoice->title),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payment-receipt',
            with: [
                'brandName' => UnivAiBranding::name(),
                'invoice' => $this->invoice,
                'payment' => $this->payment,
                'extra' => $this->extra,
                'supportEmail' => UnivAiBranding::supportEmail(),
            ],
        );
    }
}
