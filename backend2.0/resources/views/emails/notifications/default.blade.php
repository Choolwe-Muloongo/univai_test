<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $notification->title }}</title>
</head>
<body style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
    <div style="max-width: 640px; margin: 0 auto; padding: 24px;">
        <p style="font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; margin: 0 0 8px;">
            UnivAI {{ str_replace('_', ' ', $notification->category) }} alert
        </p>
        <h1 style="font-size: 24px; margin: 0 0 16px;">{{ $notification->title }}</h1>
        <p>{{ $notification->message }}</p>

        @if($notification->action_url)
            <p style="margin: 24px 0;">
                <a href="{{ url($notification->action_url) }}" style="background: #111827; color: #ffffff; padding: 12px 18px; border-radius: 8px; text-decoration: none;">
                    View in UnivAI
                </a>
            </p>
        @endif

        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="font-size: 12px; color: #6b7280;">
            You received this because this update affects your UnivAI account. SMS, WhatsApp, and push channels can be added by registering a new notification channel without changing this business event.
        </p>
    </div>
</body>
</html>
