<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Welcome to {{ $brandName }}</title>
</head>
<body style="margin:0;background:#f6fbfb;font-family:Arial,Helvetica,sans-serif;color:#13212a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6fbfb;padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border:1px solid #d9eeee;border-radius:24px;overflow:hidden;">
                    <tr>
                        <td style="background:#00694e;color:#ffffff;padding:28px 30px;">
                            <p style="margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.08em;">{{ $brandName }}</p>
                            <h1 style="margin:0;font-size:28px;line-height:1.25;">Welcome, {{ $user['name'] ?? 'there' }}</h1>
                            <p style="margin:12px 0 0;font-size:15px;line-height:1.6;">{{ $guide['intro'] }}</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:28px 30px;">
                            <h2 style="margin:0 0 12px;font-size:20px;">Start with these steps</h2>
                            <ol style="margin:0;padding-left:22px;line-height:1.7;color:#43515a;">
                                @foreach ($guide['steps'] as $step)
                                    <li style="margin-bottom:8px;">{{ $step }}</li>
                                @endforeach
                            </ol>

                            <h2 style="margin:28px 0 12px;font-size:20px;">Main features</h2>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                                @foreach ($guide['features'] as $feature)
                                    <tr>
                                        <td style="padding:12px 0;border-bottom:1px solid #edf5f5;">
                                            <strong style="display:block;color:#13212a;">{{ $feature['title'] }}</strong>
                                            <span style="display:block;margin-top:4px;color:#43515a;line-height:1.6;">{{ $feature['description'] }}</span>
                                        </td>
                                    </tr>
                                @endforeach
                            </table>

                            <div style="margin:28px 0;padding:18px;border:1px solid #d9eeee;border-radius:18px;background:#f1fbf8;">
                                <strong style="display:block;margin-bottom:6px;color:#00694e;">Need help?</strong>
                                <p style="margin:0;color:#43515a;line-height:1.6;">Use the Help Center and Support page inside your dashboard. You can also email {{ $supportEmail }}.</p>
                            </div>

                            <p style="margin:0 0 18px;color:#43515a;line-height:1.7;">Your in-app Notifications page also has this guide so you can read it again later.</p>

                            <a href="{{ rtrim($portalUrl, '/') . ($guide['href'] ?? '/student/help') }}" style="display:inline-block;background:#00694e;color:#ffffff;text-decoration:none;padding:13px 18px;border-radius:999px;font-weight:bold;">Open your UnivAI guide</a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:18px 30px;background:#f8fbfb;color:#6b7780;font-size:12px;line-height:1.6;">
                            You received this because your {{ $brandName }} account signed in. Keep this email for reference.
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
