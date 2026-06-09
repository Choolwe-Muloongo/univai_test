<?php

namespace App\Support\Notifications;

use App\Models\InAppNotification;

class InAppNotifier
{
    public function notify(string $userKey, string $title, ?string $body = null, ?string $href = null, string $type = 'general'): InAppNotification
    {
        return InAppNotification::create([
            'user_key' => $userKey,
            'type' => $type,
            'title' => $title,
            'body' => $body,
            'href' => $href,
        ]);
    }
}
