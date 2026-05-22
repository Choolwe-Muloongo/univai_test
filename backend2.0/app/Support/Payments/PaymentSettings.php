<?php

namespace App\Support\Payments;

use App\Models\PaymentSetting;

class PaymentSettings
{
    public const MODE_LIVE = 'live';
    public const MODE_LENCO_TEST = 'lenco_test';
    public const MODE_LOCAL_TEST = 'local_test';

    public static function current(): PaymentSetting
    {
        return PaymentSetting::query()->firstOrCreate([], [
            'lenco_collections_enabled' => true,
            'payment_mode' => self::MODE_LIVE,
            'show_test_payments_in_admin' => true,
            'test_mode_message' => 'Payments are running in test mode. Records are labelled as test payments.',
        ]);
    }

    public static function mode(): string
    {
        $mode = (string) (self::current()->payment_mode ?: self::MODE_LIVE);
        return in_array($mode, [self::MODE_LIVE, self::MODE_LENCO_TEST, self::MODE_LOCAL_TEST], true)
            ? $mode
            : self::MODE_LIVE;
    }

    public static function lencoCollectionsEnabled(): bool
    {
        return self::mode() !== self::MODE_LOCAL_TEST && (bool) self::current()->lenco_collections_enabled;
    }

    public static function paymentsAreTest(): bool
    {
        return self::mode() !== self::MODE_LIVE;
    }

    public static function adminShowsTestPayments(): bool
    {
        return (bool) self::current()->show_test_payments_in_admin;
    }
}
