<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CertificatePdfService;
use App\Support\Admissions\AdmissionsDocumentGenerator;
use App\Support\Documents\DocumentBranding;
use Illuminate\Http\Request;

class DocumentBrandingController extends Controller
{
    public function show(DocumentBranding $branding)
    {
        return response()->json($branding->map());
    }

    public function update(Request $request, DocumentBranding $branding)
    {
        $payload = $request->validate([
            'registrarName' => ['nullable', 'string', 'max:150'],
            'registrarTitle' => ['nullable', 'string', 'max:150'],
            'registrarSignature' => ['nullable', 'string'],
            'directorName' => ['nullable', 'string', 'max:150'],
            'directorTitle' => ['nullable', 'string', 'max:150'],
            'directorSignature' => ['nullable', 'string'],
            'footerTagline' => ['nullable', 'string', 'max:180'],
            'verificationUrl' => ['nullable', 'string', 'max:255'],
            'contactEmail' => ['nullable', 'email', 'max:255'],
        ]);

        return response()->json($branding->map($branding->update($payload)));
    }

    public function preview(string $type, AdmissionsDocumentGenerator $admissions, CertificatePdfService $certificates)
    {
        $contents = match ($type) {
            'offer' => $admissions->preview('offer'),
            'admission' => $admissions->preview('admission'),
            'certificate' => $certificates->previewShortCourseCertificate(),
            default => abort(404, 'Document preview not found.'),
        };

        $fileName = match ($type) {
            'offer' => 'univai-offer-letter-preview.pdf',
            'admission' => 'univai-admission-letter-preview.pdf',
            'certificate' => 'univai-certificate-preview.pdf',
            default => 'univai-document-preview.pdf',
        };

        return response($contents, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
        ]);
    }
}
