<?php

namespace App\Services\Notifications;

class NotificationChannelManager
{
    /** @var array<string, NotificationChannel> */
    private array $channels = [];

    public function __construct()
    {
        $this->extend(new DashboardNotificationChannel());
        $this->extend(new EmailNotificationChannel());
    }

    public function extend(NotificationChannel $channel): void
    {
        $this->channels[$channel->key()] = $channel;
    }

    public function channel(string $key): ?NotificationChannel
    {
        return $this->channels[$key] ?? null;
    }
}
