<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('academic_entitlements')) {
            return;
        }

        if (Schema::hasTable('student_entitlements')) {
            DB::table('student_entitlements')
                ->orderBy('id')
                ->chunk(100, function ($entitlements) {
                    foreach ($entitlements as $entitlement) {
                        DB::table('academic_entitlements')->updateOrInsert(
                            [
                                'user_id' => $entitlement->user_id,
                                'code' => $entitlement->type,
                                'scope_type' => null,
                                'scope_id' => null,
                            ],
                            [
                                'status' => $entitlement->status,
                                'starts_at' => $entitlement->starts_at,
                                'ends_at' => $entitlement->expires_at,
                                'metadata' => json_encode(array_filter([
                                    'source' => $entitlement->source,
                                    'legacy_metadata' => $entitlement->metadata ? json_decode($entitlement->metadata, true) : null,
                                ], fn ($value) => $value !== null)),
                                'created_at' => $entitlement->created_at,
                                'updated_at' => now(),
                            ]
                        );
                    }
                });

            Schema::dropIfExists('student_entitlements');
        }
    }

    public function down(): void
    {
        // The legacy student entitlement table is intentionally not restored.
    }
};
