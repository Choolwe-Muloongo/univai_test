<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('document_branding_settings')) {
            Schema::create('document_branding_settings', function (Blueprint $table) {
                $table->id();
                $table->string('registrar_name')->nullable();
                $table->string('registrar_title')->nullable();
                $table->longText('registrar_signature')->nullable();
                $table->string('director_name')->nullable();
                $table->string('director_title')->nullable();
                $table->longText('director_signature')->nullable();
                $table->string('footer_tagline')->nullable();
                $table->string('verification_url')->nullable();
                $table->string('contact_email')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('document_branding_settings');
    }
};
