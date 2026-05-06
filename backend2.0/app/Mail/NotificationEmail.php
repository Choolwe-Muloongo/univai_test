<?php

namespace App\Mail;

use App\Models\Notification;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NotificationEmail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly Notification $notification)
    {
    }

    public function build(): self
    {
        return $this->subject($this->notification->title)
            ->view('emails.notifications.default')
            ->with([
                'notification' => $this->notification,
                'data' => $this->notification->data ?? [],
            ]);
    }
}
