<?php

namespace App\Services\Notifications;

use App\Mail\NotificationEmail;
use App\Models\Notification;
use Illuminate\Support\Facades\Mail;

class EmailNotificationChannel implements NotificationChannel
{
    public function key(): string
    {
        return 'email';
    }

    public function send(NotificationMessage $message, Notification $notification): void
    {
        $email = $message->recipientEmail ?? $message->user?->email;
        if (!$email) {
            return;
        }

        try {
            Mail::to($email)->send(new NotificationEmail($notification));
            $notification->forceFill(['sent_at' => now()])->save();
        } catch (\Throwable $exception) {
            logger()->warning('Failed to send notification email', [
                'notification_id' => $notification->id,
                'type' => $message->type,
                'email' => $email,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
