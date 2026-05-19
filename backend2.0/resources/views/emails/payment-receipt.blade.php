<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $brandName }} payment receipt</title>
</head>
<body style="margin:0;background:#f6f9fb;font-family:Arial,Helvetica,sans-serif;color:#122033;">
    <div style="max-width:720px;margin:0 auto;padding:24px;">
        <div style="background:#ffffff;border:1px solid #dbe5ee;border-radius:18px;overflow:hidden;">
            <div style="background:linear-gradient(90deg,#0fb8c8,#072257);padding:24px 28px;color:#fff;">
                <div style="font-size:13px;letter-spacing:.12em;text-transform:uppercase;opacity:.88;">{{ $brandName }}</div>
                <div style="font-size:28px;font-weight:700;line-height:1.15;margin-top:6px;">Payment Receipt</div>
                <div style="font-size:14px;opacity:.9;margin-top:8px;">Your payment was confirmed and the receipt is attached to your account.</div>
            </div>

            <div style="padding:28px;">
                <p style="margin:0 0 18px;font-size:15px;line-height:1.65;">Hello {{ $invoice->student?->name ?? 'student' }},</p>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.65;">
                    This email confirms payment for <strong>{{ $invoice->title }}</strong>. Your access or service status has been updated in UnivAI.
                </p>

                <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #dbe5ee;border-radius:14px;overflow:hidden;">
                    <tr>
                        <td style="padding:12px 14px;background:#f7fafc;border-bottom:1px solid #dbe5ee;width:34%;font-weight:700;">Invoice</td>
                        <td style="padding:12px 14px;border-bottom:1px solid #dbe5ee;">{{ $invoice->id }}</td>
                    </tr>
                    <tr>
                        <td style="padding:12px 14px;background:#f7fafc;border-bottom:1px solid #dbe5ee;font-weight:700;">Reference</td>
                        <td style="padding:12px 14px;border-bottom:1px solid #dbe5ee;">{{ $invoice->transaction_reference ?? 'Pending' }}</td>
                    </tr>
                    <tr>
                        <td style="padding:12px 14px;background:#f7fafc;border-bottom:1px solid #dbe5ee;font-weight:700;">Amount</td>
                        <td style="padding:12px 14px;border-bottom:1px solid #dbe5ee;">{{ $invoice->currency ?? 'ZMW' }} {{ number_format((float) $invoice->amount, 2) }}</td>
                    </tr>
                    <tr>
                        <td style="padding:12px 14px;background:#f7fafc;border-bottom:1px solid #dbe5ee;font-weight:700;">Status</td>
                        <td style="padding:12px 14px;border-bottom:1px solid #dbe5ee;">{{ ucfirst((string) $invoice->status) }}</td>
                    </tr>
                    <tr>
                        <td style="padding:12px 14px;background:#f7fafc;border-bottom:1px solid #dbe5ee;font-weight:700;">Paid at</td>
                        <td style="padding:12px 14px;border-bottom:1px solid #dbe5ee;">{{ optional($invoice->paid_at)->toDayDateTimeString() ?? now()->toDayDateTimeString() }}</td>
                    </tr>
                    <tr>
                        <td style="padding:12px 14px;background:#f7fafc;font-weight:700;">Method</td>
                        <td style="padding:12px 14px;">{{ $payment?->method ?? 'Lenco' }} / {{ $payment?->provider ?? 'verified' }}</td>
                    </tr>
                </table>

                @php
                    $metadata = is_array($invoice->metadata ?? null) ? $invoice->metadata : [];
                    $shortCourseTitle = $metadata['short_course_title'] ?? null;
                    $accessPlan = $metadata['access_plan'] ?? null;
                    $bundlePlan = $metadata['bundle_plan'] ?? null;
                @endphp

                @if($shortCourseTitle || $accessPlan || $bundlePlan)
                    <div style="margin-top:22px;padding:18px;border-radius:16px;background:#f5fbfc;border:1px solid #ccebee;">
                        <div style="font-weight:700;margin-bottom:8px;color:#072257;">Short-course details</div>
                        <div style="font-size:14px;line-height:1.7;">
                            @if($shortCourseTitle)
                                <div><strong>Course:</strong> {{ $shortCourseTitle }}</div>
                            @endif
                            @if($accessPlan)
                                <div><strong>Plan:</strong> {{ $accessPlan }}</div>
                            @endif
                            @if($bundlePlan)
                                <div><strong>Bundle:</strong> {{ $bundlePlan }}</div>
                            @endif
                        </div>
                    </div>
                @endif

                <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#3c4b5f;">
                    If you need help, reply to this email or write to <a href="mailto:{{ $supportEmail }}" style="color:#0b5fff;text-decoration:none;">{{ $supportEmail }}</a>.
                </p>
            </div>

            <div style="padding:18px 28px 28px;color:#66758a;font-size:12px;line-height:1.6;border-top:1px solid #e6edf4;">
                {{ $brandName }} receipt issued automatically after verified payment. Keep this email for your records.
            </div>
        </div>
    </div>
</body>
</html>
