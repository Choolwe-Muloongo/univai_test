<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use App\Services\Notifications\NotificationChannelManager;
use App\Services\Notifications\NotificationMessage;
use Illuminate\Database\Eloquent\Model;

class NotificationService
{
    public function __construct(private readonly NotificationChannelManager $channels)
    {
    }

    public function send(NotificationMessage $message, array $channels = ['dashboard', 'email']): Notification
    {
        $notifiable = $message->notifiable;
        $notification = Notification::create([
            'user_id' => $message->user?->id,
            'recipient_email' => $message->recipientEmail ?? $message->user?->email,
            'recipient_name' => $message->recipientName ?? $message->user?->name,
            'type' => $message->type,
            'category' => $message->category,
            'title' => $message->title,
            'message' => $message->message,
            'action_url' => $message->actionUrl,
            'priority' => $message->priority,
            'channels' => array_values($channels),
            'data' => $message->data,
            'notifiable_type' => $notifiable?->getMorphClass(),
            'notifiable_id' => $notifiable ? (string) $notifiable->getKey() : null,
        ]);

        foreach ($channels as $channelKey) {
            $channel = $this->channels->channel($channelKey);
            if ($channel) {
                $channel->send($message, $notification);
            }
        }

        return $notification->refresh();
    }

    public function stateChange(
        string $type,
        string $category,
        string $title,
        string $message,
        User|string|null $recipient = null,
        ?Model $notifiable = null,
        ?string $actionUrl = null,
        array $data = [],
        string $priority = 'normal',
        array $channels = ['dashboard', 'email']
    ): Notification {
        $user = $recipient instanceof User ? $recipient : null;
        $email = is_string($recipient) ? $recipient : null;

        return $this->send(new NotificationMessage(
            type: $type,
            category: $category,
            title: $title,
            message: $message,
            user: $user,
            recipientEmail: $email,
            recipientName: $user?->name,
            actionUrl: $actionUrl,
            priority: $priority,
            data: $data,
            notifiable: $notifiable,
        ), $channels);
    }
}
