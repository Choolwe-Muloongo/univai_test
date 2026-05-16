<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminShortCoursePlansController extends Controller
{
    public function index()
    {
        return response()->json($this->plans());
    }

    public function update(Request $request, string $code)
    {
        abort_unless(Schema::hasTable('short_course_access_plans'), 404, 'Plan table has not been migrated yet.');

        $payload = $request->validate([
            'name' => ['required', 'string', 'min:2'],
            'amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['required', 'string', 'size:3'],
            'accessHours' => ['required', 'integer', 'min:1'],
            'aiHours' => ['required', 'integer', 'min:0'],
            'hourlyAiQuota' => ['required', 'integer', 'min:0'],
            'dailyAiQuota' => ['required', 'integer', 'min:0'],
            'certificateIncluded' => ['required', 'boolean'],
            'isActive' => ['required', 'boolean'],
            'sortOrder' => ['nullable', 'integer', 'min:0'],
        ]);

        DB::table('short_course_access_plans')->updateOrInsert(
            ['code' => $code],
            [
                'name' => $payload['name'],
                'amount' => $payload['amount'],
                'currency' => strtoupper($payload['currency']),
                'access_hours' => $payload['accessHours'],
                'ai_hours' => $payload['aiHours'],
                'hourly_ai_quota' => $payload['hourlyAiQuota'],
                'daily_ai_quota' => $payload['dailyAiQuota'],
                'certificate_included' => $payload['certificateIncluded'],
                'is_active' => $payload['isActive'],
                'sort_order' => $payload['sortOrder'] ?? 0,
                'updated_at' => now(),
                'created_at' => now(),
            ]
        );

        return response()->json($this->plans());
    }

    private function plans(): array
    {
        if (!Schema::hasTable('short_course_access_plans')) {
            return [];
        }

        return DB::table('short_course_access_plans')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn ($plan) => [
                'code' => $plan->code,
                'name' => $plan->name,
                'amount' => (float) $plan->amount,
                'currency' => strtoupper($plan->currency ?? 'ZMW'),
                'accessHours' => (int) $plan->access_hours,
                'aiHours' => (int) $plan->ai_hours,
                'hourlyAiQuota' => (int) $plan->hourly_ai_quota,
                'dailyAiQuota' => (int) $plan->daily_ai_quota,
                'certificateIncluded' => (bool) $plan->certificate_included,
                'isActive' => (bool) $plan->is_active,
                'sortOrder' => (int) $plan->sort_order,
            ])
            ->values()
            ->all();
    }
}
