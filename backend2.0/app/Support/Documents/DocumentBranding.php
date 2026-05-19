<?php

namespace App\Support\Documents;

use App\Models\DocumentBrandingSetting;
use App\Support\Branding\UnivAiBranding;
use Illuminate\Support\Facades\Storage;

class DocumentBranding
{
    public function settings(): DocumentBrandingSetting
    {
        $settings = DocumentBrandingSetting::query()->first();
        if ($settings) {
            return $settings;
        }

        return DocumentBrandingSetting::query()->create([
            'registrar_name' => 'Registrar',
            'registrar_title' => 'Registrar',
            'director_name' => 'Director, Professional & Short Courses',
            'director_title' => 'Director, Professional & Short Courses',
            'footer_tagline' => 'Unlocking Potential. Building Futures.',
            'verification_url' => rtrim(UnivAiBranding::publicUrl(), '/') . '/admissions/status',
            'contact_email' => UnivAiBranding::admissionsEmail(),
        ]);
    }

    public function update(array $payload): DocumentBrandingSetting
    {
        $settings = $this->settings();
        $settings->update([
            'registrar_name' => $payload['registrarName'] ?? $settings->registrar_name,
            'registrar_title' => $payload['registrarTitle'] ?? $settings->registrar_title,
            'registrar_signature' => array_key_exists('registrarSignature', $payload) ? $payload['registrarSignature'] : $settings->registrar_signature,
            'director_name' => $payload['directorName'] ?? $settings->director_name,
            'director_title' => $payload['directorTitle'] ?? $settings->director_title,
            'director_signature' => array_key_exists('directorSignature', $payload) ? $payload['directorSignature'] : $settings->director_signature,
            'footer_tagline' => $payload['footerTagline'] ?? $settings->footer_tagline,
            'verification_url' => $payload['verificationUrl'] ?? $settings->verification_url,
            'contact_email' => $payload['contactEmail'] ?? $settings->contact_email,
        ]);

        return $settings->fresh();
    }

    public function map(?DocumentBrandingSetting $settings = null): array
    {
        $settings = $settings ?: $this->settings();

        return [
            'registrarName' => $settings->registrar_name,
            'registrarTitle' => $settings->registrar_title,
            'registrarSignature' => $settings->registrar_signature,
            'directorName' => $settings->director_name,
            'directorTitle' => $settings->director_title,
            'directorSignature' => $settings->director_signature,
            'footerTagline' => $settings->footer_tagline,
            'verificationUrl' => $settings->verification_url,
            'contactEmail' => $settings->contact_email,
        ];
    }

    public function signaturePath(?string $dataUrl, string $name): ?string
    {
        if (!$dataUrl || !str_starts_with($dataUrl, 'data:image')) {
            return null;
        }

        if (!preg_match('/^data:image\/(png|jpeg|jpg);base64,(.+)$/', $dataUrl, $matches)) {
            return null;
        }

        $extension = $matches[1] === 'jpeg' ? 'jpg' : $matches[1];
        $bytes = base64_decode($matches[2], true);
        if (!$bytes) {
            return null;
        }

        $path = 'document-branding/' . $name . '-' . sha1($bytes) . '.' . $extension;
        if (!Storage::disk('local')->exists($path)) {
            Storage::disk('local')->put($path, $bytes);
        }

        return Storage::disk('local')->path($path);
    }
}
