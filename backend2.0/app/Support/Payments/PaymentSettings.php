<?php

namespace App\Support\Payments;

use App\Models\PaymentSetting;

class PaymentSettings
{
    public static function current(): PaymentSetting
    {
        return PaymentSetting::query()->firstOrCreate([], [
            'lenco_collections_enabled' => false,
            'test_mode_message' => 'Lenco collections are disabled. Payments activate in test mode.',
        ]);
    }

    public static function lencoCollectionsEnabled(): bool
    {
        return (bool) self::current()->lenco_collections_enabled;
    }
}
