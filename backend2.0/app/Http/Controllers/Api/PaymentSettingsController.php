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
            'testModeMessage' => $settings->test_mode_message,
        ]);
    }

    public function update(Request $request)
    {
        $payload = $request->validate([
            'lencoCollectionsEnabled' => ['required', 'boolean'],
            'testModeMessage' => ['nullable', 'string', 'max:500'],
        ]);

        $settings = PaymentSettings::current();
        $sessionUser = $request->session()->get('user');
        $updatedBy = is_array($sessionUser) && isset($sessionUser['id']) && is_numeric($sessionUser['id'])
            ? (int) $sessionUser['id']
            : null;

        $settings->update([
            'lenco_collections_enabled' => $payload['lencoCollectionsEnabled'],
            'test_mode_message' => $payload['testModeMessage'] ?? $settings->test_mode_message,
            'updated_by' => $updatedBy,
        ]);

        AuditLogger::log($request, 'payment.settings.updated', 'payment_settings', (string) $settings->id, [
            'lencoCollectionsEnabled' => (bool) $settings->lenco_collections_enabled,
        ]);

        return $this->show();
    }
}
