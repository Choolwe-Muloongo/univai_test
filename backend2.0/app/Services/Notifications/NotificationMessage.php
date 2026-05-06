<?php

namespace App\Services\Notifications;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class NotificationMessage
{
    public function __construct(
        public readonly string $type,
        public readonly string $category,
        public readonly string $title,
        public readonly string $message,
        public readonly ?User $user = null,
        public readonly ?string $recipientEmail = null,
        public readonly ?string $recipientName = null,
        public readonly ?string $actionUrl = null,
        public readonly string $priority = 'normal',
        public readonly array $data = [],
        public readonly ?Model $notifiable = null,
    ) {
    }
}
