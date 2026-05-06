<?php

namespace App\Services\Notifications;

use App\Models\Notification;

class DashboardNotificationChannel implements NotificationChannel
{
    public function key(): string
    {
        return 'dashboard';
    }

    public function send(NotificationMessage $message, Notification $notification): void
    {
        if (!$notification->sent_at) {
            $notification->forceFill(['sent_at' => now()])->save();
        }
    }
}
