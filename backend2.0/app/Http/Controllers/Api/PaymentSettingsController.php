<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Support\AuditLogger;
use App\Support\Payments\PaymentSettings;
use Illuminate\Http\Request;

class PaymentSettingsController extends Controller
{
    public function show()
    {
        $settings = PaymentSettings::current();

        return response()->json([
            'lencoCollectionsEnabled' => (bool) $settings->lenco_collections_enabled,
            'paymentMode' => $settings->payment_mode ?: PaymentSettings::MODE_LIVE,
            'showTestPaymentsInAdmin' => (bool) $settings->show_test_payments_in_admin,
            'paymentsAreTest' => PaymentSettings::paymentsAreTest(),
            'testModeMessage' => $settings->test_mode_message,
        ]);
    }

    public function update(Request $request)
    {
        $payload = $request->validate([
            'lencoCollectionsEnabled' => ['required', 'boolean'],
            'paymentMode' => ['required', 'string', 'in:live,lenco_test,local_test'],
            'showTestPaymentsInAdmin' => ['required', 'boolean'],
            'testModeMessage' => ['nullable', 'string', 'max:500'],
        ]);

        $settings = PaymentSettings::current();
        $sessionUser = $request->session()->get('user');
        $updatedBy = is_array($sessionUser) && isset($sessionUser['id']) && is_numeric($sessionUser['id'])
            ? (int) $sessionUser['id']
            : null;

        $settings->update([
            'lenco_collections_enabled' => $payload['lencoCollectionsEnabled'],
            'payment_mode' => $payload['paymentMode'],
            'show_test_payments_in_admin' => $payload['showTestPaymentsInAdmin'],
            'test_mode_message' => $payload['testModeMessage'] ?? $settings->test_mode_message,
            'updated_by' => $updatedBy,
        ]);

        AuditLogger::log($request, 'payment.settings.updated', 'payment_settings', (string) $settings->id, [
            'lencoCollectionsEnabled' => (bool) $settings->lenco_collections_enabled,
            'paymentMode' => $settings->payment_mode,
            'showTestPaymentsInAdmin' => (bool) $settings->show_test_payments_in_admin,
        ]);

        return $this->show();
    }
}
