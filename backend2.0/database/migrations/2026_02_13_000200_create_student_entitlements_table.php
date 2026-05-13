<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // Deprecated: academic_entitlements is the canonical entitlement store.
    }

    public function down(): void
    {
        // Deprecated: this migration no longer creates a legacy entitlement table.
    }
};
