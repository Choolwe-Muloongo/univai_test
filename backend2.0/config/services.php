<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'lenco' => [
        'secret_key' => env('LENCO_SECRET_KEY'),
        'account_id' => env('LENCO_ACCOUNT_ID'),
        'webhook_secret' => env('LENCO_WEBHOOK_SECRET'),
        'base_url' => env('LENCO_BASE_URL_V2', env('LENCO_BASE_URL', 'https://api.lenco.co/access/v2')),
        'checkout_stub_url' => env('LENCO_CHECKOUT_STUB_URL', 'https://pay.lenco.co/checkout'),
        'allow_stub_checkout' => env('LENCO_ALLOW_STUB_CHECKOUT', false),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
