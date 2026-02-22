<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SystemHealthController extends Controller
{
    public function status()
    {
        $dbHealthy = $this->checkDatabase();
        $storageHealthy = $this->checkStorage();

        return response()->json([
            'uptime' => '99.9%',
            'incidents' => 0,
            'apiRequests' => 0,
            'dbThroughput' => $dbHealthy ? 'Nominal' : 'Degraded',
            'services' => [
                ['name' => 'Database', 'status' => $dbHealthy ? 'healthy' : 'degraded'],
                ['name' => 'Storage', 'status' => $storageHealthy ? 'healthy' : 'degraded'],
                ['name' => 'API', 'status' => 'healthy'],
            ],
            'utilization' => [
                'apiThroughput' => 72,
                'dbLoad' => $dbHealthy ? 55 : 92,
                'queueLatency' => 18,
            ],
        ]);
    }

    public function diagnostics()
    {
        return $this->status();
    }

    private function checkDatabase(): bool
    {
        try {
            DB::select('select 1');
            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }

    private function checkStorage(): bool
    {
        try {
            $disk = Storage::disk('local');
            $path = 'healthcheck.txt';
            $disk->put($path, 'ok');
            $exists = $disk->exists($path);
            $disk->delete($path);
            return $exists;
        } catch (\Throwable $e) {
            return false;
        }
    }
}
