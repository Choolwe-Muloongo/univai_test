<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class CorsPatchServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $configured = array_filter(array_map('trim', explode(',', (string) env('FRONTEND_URLS', ''))));
        $origins = array_values(array_unique(array_filter(array_merge($configured, [
            env('FRONTEND_URL', 'http://localhost:3000'),
            'https://univai.aftacoin.biz',
            'http://localhost:3000',
        ]))));

        config(['cors.allowed_origins' => $origins]);
    }
}
