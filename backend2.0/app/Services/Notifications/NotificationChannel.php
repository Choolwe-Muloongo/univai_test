<?php

namespace App\Services\Notifications;

use App\Models\Notification;

interface NotificationChannel
{
    public function key(): string;

    public function send(NotificationMessage $message, Notification $notification): void;
}
