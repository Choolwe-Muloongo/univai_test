<?php

namespace App\Http\Controllers\Api;

class Cache
{
    public static function forget(string $key): bool
    {
        return \Illuminate\Support\Facades\Cache::forget($key);
    }
}
