<?php

use App\Support\Pricing\LaunchFeeSchedule;

return [
    'is_open' => env('ADMISSIONS_OPEN', true),
    'required_subjects' => array_filter(array_map('trim', explode(',', env('ADMISSIONS_REQUIRED_SUBJECTS', 'English,Mathematics')))),
    'allowed_delivery_modes' => array_filter(array_map('trim', explode(',', env('ADMISSIONS_ALLOWED_DELIVERY_MODES', 'online,hybrid,physical')))),
    'default_application_fee' => (float) env('DEFAULT_APPLICATION_FEE', LaunchFeeSchedule::DEFAULT_PROGRAM_APPLICATION_FEE),
    'default_application_currency' => env('DEFAULT_APPLICATION_CURRENCY', LaunchFeeSchedule::DEFAULT_PROGRAM_CURRENCY),
    'offer_letter_disk' => env('OFFER_LETTER_DISK', 'local'),
];
