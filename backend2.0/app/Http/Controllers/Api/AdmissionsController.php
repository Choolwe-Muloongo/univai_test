<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\ApplicationDocument;
use App\Models\AdmissionsSetting;
use App\Models\Enrollment;
use App\Models\Invoice;
use App\Models\User;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Mail;

class AdmissionsController extends Controller
{
    public function submit(Request $request)
    {
        $settings = AdmissionsSetting::query()->first();
        if ($settings && !$settings->is_open) {
            return response()->json([
                'message' => $settings->message ?: 'Admissions are currently closed.',
            ], 403);
        }

        $payload = $request->validate([
            'fullName' => ['required', 'string'],
            'email' => ['required', 'email'],
            'programId' => ['required', 'string'],
            'schoolId' => ['required', 'string'],
            'deliveryMode' => ['nullable', 'string'],
            'learningStyle' => ['nullable', 'string'],
            'studyPace' => ['nullable', 'string'],
            'country' => ['nullable', 'string'],
            'subjectPoints' => ['nullable', 'array'],
        ]);

        $subjectPoints = $payload['subjectPoints'] ?? [];
        $subjectCount = collect($subjectPoints)->filter(fn ($value) => (int) $value > 0)->count();
        $totalPoints = collect($subjectPoints)->reduce(fn ($sum, $value) => $sum + (int) $value, 0);

        $reference = 'app-' . strtoupper(Str::random(6));

        $sessionUser = $request->session()->get('user');
        $userId = null;
        if (is_array($sessionUser) && isset($sessionUser['id']) && is_numeric($sessionUser['id'])) {
            $userId = (int) $sessionUser['id'];
        } else {
            $existingUser = User::where('email', $payload['email'])->first();
            $userId = $existingUser?->id;
        }

        $application = Application::create([
            'user_id' => $userId,
            'reference' => $reference,
            'full_name' => $payload['fullName'],
            'email' => $payload['email'],
            'program_id' => $payload['programId'],
            'school_id' => $payload['schoolId'],
            'status' => 'submitted',
            'submitted_at' => now(),
            'subject_points' => $subjectPoints,
            'subject_count' => $subjectCount,
            'total_points' => $totalPoints,
            'delivery_mode' => $payload['deliveryMode'] ?? 'hybrid',
            'learning_style' => $payload['learningStyle'] ?? 'traditional',
            'study_pace' => $payload['studyPace'] ?? 'standard',
            'country' => $payload['country'] ?? null,
        ]);

        $request->session()->put('admission_reference', $application->reference);

        return response()->json(['status' => $application->status]);
    }

    public function settings()
    {
        $settings = AdmissionsSetting::query()->first();
        if (!$settings) {
            $settings = AdmissionsSetting::create([
                'is_open' => true,
                'message' => null,
            ]);
        }

        return response()->json([
            'isOpen' => (bool) $settings->is_open,
            'message' => $settings->message,
        ]);
    }

    public function updateSettings(Request $request)
    {
        $payload = $request->validate([
            'isOpen' => ['required', 'boolean'],
            'message' => ['nullable', 'string'],
        ]);

        $settings = AdmissionsSetting::query()->first();
        if (!$settings) {
            $settings = AdmissionsSetting::create([
                'is_open' => true,
                'message' => null,
            ]);
        }

        $sessionUser = $request->session()->get('user');
        $updatedBy = null;
        if (is_array($sessionUser) && isset($sessionUser['id']) && is_numeric($sessionUser['id'])) {
            $updatedBy = (int) $sessionUser['id'];
        }

        $settings->update([
            'is_open' => $payload['isOpen'],
            'message' => $payload['message'] ?? $settings->message,
            'updated_by' => $updatedBy,
        ]);

        AuditLogger::log($request, 'admissions.settings.updated', 'admissions_settings', (string) $settings->id, [
            'isOpen' => $payload['isOpen'],
        ]);

        return response()->json([
            'isOpen' => (bool) $settings->is_open,
            'message' => $settings->message,
        ]);
    }

    public function status(Request $request)
    {
        $application = $this->resolveApplicationForSession($request);
        if (!$application) {
            return response()->json([
                'status' => 'draft',
                'admissionFeePaid' => false,
            ]);
        }

        return response()->json([
            'status' => $application->status,
            'admissionFeePaid' => (bool) $application->admission_fee_paid,
            'offerIssuedAt' => optional($application->offer_issued_at)->toISOString(),
            'offerAcceptedAt' => optional($application->offer_accepted_at)->toISOString(),
        ]);
    }

    public function payFee(Request $request)
    {
        $application = $this->resolveApplicationForSession($request);
        if (!$application) {
            return response()->json(['status' => 'submitted', 'admissionFeePaid' => false]);
        }

        $application->update([
            'status' => 'fee_paid',
            'admission_fee_paid' => true,
        ]);

        return response()->json([
            'status' => $application->status,
            'admissionFeePaid' => true,
        ]);
    }

    public function me(Request $request)
    {
        $application = $this->resolveApplicationForSession($request);
        if (!$application) {
            return response()->json(null, 404);
        }

        return response()->json($this->mapApplication($application));
    }

    public function documents(Request $request)
    {
        $application = $this->resolveApplicationForSession($request);
        if (!$application) {
            return response()->json([], 404);
        }

        return ApplicationDocument::query()
            ->where('application_id', $application->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (ApplicationDocument $doc) => $this->mapDocument($doc));
    }

    public function uploadDocument(Request $request)
    {
        $application = $this->resolveApplicationForSession($request);
        if (!$application) {
            return response()->json(['message' => 'Application not found'], 404);
        }

        $payload = $request->validate([
            'documentType' => ['required', 'string'],
            'file' => ['required', 'file', 'max:10240'],
        ]);

        $file = $payload['file'];
        $folder = 'admissions/' . $application->reference;
        $fileName = $payload['documentType'] . '-' . time() . '-' . $file->getClientOriginalName();
        $path = $file->storeAs($folder, $fileName, 'local');

        $sessionUser = $request->session()->get('user');
        $userId = is_array($sessionUser) && isset($sessionUser['id']) && is_numeric($sessionUser['id'])
            ? (int) $sessionUser['id']
            : null;

        $document = ApplicationDocument::create([
            'application_id' => $application->id,
            'user_id' => $userId,
            'document_type' => $payload['documentType'],
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize(),
            'status' => 'uploaded',
        ]);

        return response()->json($this->mapDocument($document), 201);
    }

    public function downloadDocument(Request $request, ApplicationDocument $document)
    {
        $application = $this->resolveApplicationForSession($request);
        if (!$application || $document->application_id !== $application->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if (!Storage::disk('local')->exists($document->file_path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return Storage::disk('local')->download($document->file_path, $document->file_name);
    }

    public function acceptOffer(Request $request)
    {
        $application = $this->resolveApplicationForSession($request);
        if (!$application) {
            return response()->json(['message' => 'Application not found'], 404);
        }

        if (!in_array($application->status, ['offer_sent', 'approved'], true)) {
            return response()->json(['message' => 'Offer is not available for acceptance'], 422);
        }

        if (empty($application->intake_id)) {
            return response()->json(['message' => 'Offer missing intake assignment'], 422);
        }

        $application->update([
            'status' => 'admitted',
            'offer_accepted_at' => now(),
        ]);

        $user = User::where('email', $application->email)->first();
        if ($user) {
            $user->update([
                'role' => 'enrolled',
                'school_id' => $application->school_id,
                'program_id' => $application->program_id,
                'intake_id' => $application->intake_id,
            ]);

            Enrollment::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'intake_id' => $application->intake_id,
                ],
                [
                    'status' => 'pending',
                    'enrolled_at' => now(),
                ]
            );

            $this->ensureEnrollmentInvoice($application, $user);
        }

        $sessionUser = $request->session()->get('user');
        if (is_array($sessionUser)) {
            $sessionUser['role'] = 'enrolled';
            $sessionUser['schoolId'] = $application->school_id;
            $sessionUser['programId'] = $application->program_id;
            $sessionUser['intakeId'] = $application->intake_id;
            $request->session()->put('user', $sessionUser);
        }

        AuditLogger::log($request, 'admission.offer.accepted', 'application', $application->reference, []);

        $this->notifyApplicant(
            $application,
            'UnivAI Offer Accepted',
            'Your offer has been accepted successfully. Please continue to enrollment in your student portal.'
        );

        return response()->json($this->mapApplication($application));
    }

    public function adminIndex()
    {
        return Application::query()
            ->orderBy('submitted_at', 'desc')
            ->get()
            ->map(fn (Application $application) => [
                'id' => $application->reference,
                'fullName' => $application->full_name,
                'email' => $application->email,
                'programId' => $application->program_id,
                'intakeId' => $application->intake_id,
                'schoolId' => $application->school_id,
                'status' => $application->status,
                'submittedAt' => optional($application->submitted_at)->toISOString(),
                'subjectCount' => $application->subject_count,
                'totalPoints' => $application->total_points,
            ]);
    }

    public function adminShow(string $id)
    {
        $application = Application::where('reference', $id)->first();
        if (!$application) {
            return response()->json(null, 404);
        }

        return $this->mapApplication($application);
    }

    public function adminUpdate(Request $request, string $id)
    {
        $application = Application::where('reference', $id)->first();
        if (!$application) {
            return response()->json(null, 404);
        }

        $payload = $request->validate([
            'status' => ['required', 'string'],
            'notes' => ['nullable', 'string'],
            'intakeId' => ['nullable', 'string'],
            'offerMessage' => ['nullable', 'string'],
            'offerLetterUrl' => ['nullable', 'string'],
            'needsInfoMessage' => ['nullable', 'string'],
        ]);

        if (in_array($payload['status'], ['approved', 'admitted', 'offer_sent'], true) && empty($payload['intakeId'])) {
            return response()->json([
                'message' => 'Intake is required to approve or admit a student.',
            ], 422);
        }

        $application->update([
            'status' => $payload['status'],
            'notes' => $payload['notes'] ?? $application->notes,
            'intake_id' => $payload['intakeId'] ?? $application->intake_id,
            'offer_letter_message' => $payload['offerMessage'] ?? $application->offer_letter_message,
            'offer_letter_url' => $payload['offerLetterUrl'] ?? $application->offer_letter_url,
            'needs_info_message' => $payload['needsInfoMessage'] ?? $application->needs_info_message,
            'needs_info_at' => $payload['status'] === 'needs_info' ? now() : $application->needs_info_at,
        ]);

        AuditLogger::log($request, 'admission.updated', 'application', $application->reference, [
            'status' => $payload['status'],
            'intakeId' => $payload['intakeId'] ?? $application->intake_id,
        ]);

        if (in_array($payload['status'], ['offer_sent', 'approved'], true) && !$application->offer_issued_at) {
            $application->update([
                'offer_issued_at' => now(),
            ]);
        }

        if (in_array($payload['status'], ['offer_sent', 'approved'], true)) {
            $this->ensureOfferLetter($application);
            $this->notifyApplicant(
                $application,
                'Your UnivAI Offer Letter',
                $payload['offerMessage'] ?? $application->offer_letter_message ?? 'Your offer letter is ready. Please review and accept to continue.'
            );
        }

        if ($payload['status'] === 'needs_info') {
            $this->notifyApplicant(
                $application,
                'UnivAI Admissions - Additional Information Needed',
                $payload['needsInfoMessage'] ?? 'Please log in to your applicant portal to provide the required documents.'
            );
        }

        if (in_array($payload['status'], ['admitted'], true)) {
            $user = User::where('email', $application->email)->first();
            if ($user) {
                $user->update([
                    'role' => 'enrolled',
                    'school_id' => $application->school_id,
                    'program_id' => $application->program_id,
                    'intake_id' => $payload['intakeId'] ?? $application->intake_id,
                ]);

                if (!empty($payload['intakeId'])) {
                    Enrollment::updateOrCreate(
                        [
                            'user_id' => $user->id,
                            'intake_id' => $payload['intakeId'],
                        ],
                        [
                            'status' => 'active',
                            'enrolled_at' => now(),
                        ]
                    );

                    $this->ensureEnrollmentInvoice($application, $user);
                }
            }
        }

        return $this->adminShow($id);
    }

    public function adminDocuments(string $id)
    {
        $application = Application::where('reference', $id)->first();
        if (!$application) {
            return response()->json([], 404);
        }

        return ApplicationDocument::query()
            ->where('application_id', $application->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (ApplicationDocument $doc) => $this->mapDocument($doc));
    }

    public function adminReviewDocument(Request $request, string $id, ApplicationDocument $document)
    {
        $application = Application::where('reference', $id)->first();
        if (!$application || $document->application_id !== $application->id) {
            return response()->json(['message' => 'Document not found'], 404);
        }

        $payload = $request->validate([
            'status' => ['required', 'in:verified,rejected'],
            'reviewNotes' => ['nullable', 'string'],
        ]);

        $document->update([
            'status' => $payload['status'],
            'review_notes' => $payload['reviewNotes'] ?? $document->review_notes,
        ]);

        AuditLogger::log($request, 'admission.document.reviewed', 'application_document', (string) $document->id, [
            'status' => $payload['status'],
        ]);

        return response()->json($this->mapDocument($document));
    }

    public function adminDownloadDocument(string $id, ApplicationDocument $document)
    {
        $application = Application::where('reference', $id)->first();
        if (!$application || $document->application_id !== $application->id) {
            return response()->json(['message' => 'Not found'], 404);
        }

        if (!Storage::disk('local')->exists($document->file_path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        return Storage::disk('local')->download($document->file_path, $document->file_name);
    }

    public function downloadOfferLetter(Request $request)
    {
        $application = $this->resolveApplicationForSession($request);
        if (!$application || empty($application->offer_letter_url)) {
            return response()->json(['message' => 'Offer letter not found'], 404);
        }

        if (!Storage::disk('local')->exists($application->offer_letter_url)) {
            return response()->json(['message' => 'Offer letter file missing'], 404);
        }

        return Storage::disk('local')->download($application->offer_letter_url, 'UnivAI-Offer-Letter.pdf');
    }

    private function resolveApplicationForSession(Request $request): ?Application
    {
        $sessionUser = $request->session()->get('user');
        if (is_array($sessionUser)) {
            if (!empty($sessionUser['id'])) {
                $app = Application::where('user_id', $sessionUser['id'])->latest('created_at')->first();
                if ($app) {
                    return $app;
                }
            }
            if (!empty($sessionUser['email'])) {
                $app = Application::where('email', $sessionUser['email'])->latest('created_at')->first();
                if ($app) {
                    return $app;
                }
            }
        }

        $reference = $request->session()->get('admission_reference');
        if ($reference) {
            return Application::where('reference', $reference)->first();
        }

        return null;
    }

    private function mapApplication(Application $application): array
    {
        return [
            'id' => $application->reference,
            'fullName' => $application->full_name,
            'email' => $application->email,
            'programId' => $application->program_id,
            'intakeId' => $application->intake_id,
            'schoolId' => $application->school_id,
            'status' => $application->status,
            'submittedAt' => optional($application->submitted_at)->toISOString(),
            'subjectCount' => $application->subject_count,
            'totalPoints' => $application->total_points,
            'deliveryMode' => $application->delivery_mode,
            'learningStyle' => $application->learning_style,
            'studyPace' => $application->study_pace,
            'country' => $application->country,
            'subjectPoints' => $application->subject_points ?? [],
            'notes' => $application->notes,
            'admissionFeePaid' => (bool) $application->admission_fee_paid,
            'offerLetterMessage' => $application->offer_letter_message,
            'offerLetterUrl' => $application->offer_letter_url
                ? (str_starts_with($application->offer_letter_url, 'http') ? $application->offer_letter_url : '/admissions/offer-letter')
                : null,
            'offerIssuedAt' => optional($application->offer_issued_at)->toISOString(),
            'offerAcceptedAt' => optional($application->offer_accepted_at)->toISOString(),
            'needsInfoMessage' => $application->needs_info_message,
            'needsInfoAt' => optional($application->needs_info_at)->toISOString(),
        ];
    }

    private function mapDocument(ApplicationDocument $doc): array
    {
        return [
            'id' => $doc->id,
            'documentType' => $doc->document_type,
            'fileName' => $doc->file_name,
            'mimeType' => $doc->mime_type,
            'fileSize' => $doc->file_size,
            'status' => $doc->status,
            'reviewNotes' => $doc->review_notes,
            'createdAt' => optional($doc->created_at)->toISOString(),
        ];
    }

    private function ensureOfferLetter(Application $application): void
    {
        if (!empty($application->offer_letter_url)) {
            return;
        }

        $pdfPath = $this->generateOfferLetterPdf($application);
        if ($pdfPath) {
            $application->update([
                'offer_letter_url' => $pdfPath,
            ]);
        }
    }

    private function generateOfferLetterPdf(Application $application): ?string
    {
        $body = $application->offer_letter_message
            ?? "Congratulations! We are pleased to offer you admission into {$application->program_id}.";

        $text = implode("\n", [
            'UnivAI Offer Letter',
            '',
            "Dear {$application->full_name},",
            '',
            $body,
            '',
            "Program: {$application->program_id}",
            "Delivery mode: {$application->delivery_mode}",
            "Intake: {$application->intake_id}",
            '',
            'Please log in to your admissions portal to accept this offer and continue enrollment.',
            '',
            'Sincerely,',
            'UnivAI Admissions',
        ]);

        if (class_exists(\FPDF::class)) {
            $pdf = new \FPDF();
            $pdf->AddPage();
            $pdf->SetFont('Arial', 'B', 16);
            $pdf->Cell(0, 10, 'UnivAI Offer Letter', 0, 1);
            $pdf->SetFont('Arial', '', 12);
            $pdf->Ln(4);
            $pdf->MultiCell(0, 6, $text);
            $contents = $pdf->Output('S');
        } else {
            $contents = $this->buildSimplePdf($text);
        }

        $fileName = 'offer-' . $application->reference . '.pdf';
        $path = 'offers/' . $fileName;
        Storage::disk('local')->put($path, $contents);

        return $path;
    }

    private function buildSimplePdf(string $text): string
    {
        $lines = explode("\n", wordwrap($text, 90));
        $escapedLines = array_map(function ($line) {
            $line = str_replace('\\', '\\\\', $line);
            $line = str_replace('(', '\\(', $line);
            $line = str_replace(')', '\\)', $line);
            return $line;
        }, $lines);

        $contentLines = [];
        $contentLines[] = 'BT';
        $contentLines[] = '/F1 12 Tf';
        $contentLines[] = '14 TL';
        $contentLines[] = '72 720 Td';
        foreach ($escapedLines as $index => $line) {
            if ($index > 0) {
                $contentLines[] = 'T*';
            }
            $contentLines[] = '(' . $line . ') Tj';
        }
        $contentLines[] = 'ET';
        $content = implode("\n", $contentLines);

        $objects = [];
        $objects[] = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
        $objects[] = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
        $objects[] = "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n";
        $objects[] = "4 0 obj\n<< /Length " . strlen($content) . " >>\nstream\n" . $content . "\nendstream\nendobj\n";
        $objects[] = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";

        $pdf = "%PDF-1.4\n";
        $offsets = [0];
        foreach ($objects as $obj) {
            $offsets[] = strlen($pdf);
            $pdf .= $obj;
        }

        $xrefOffset = strlen($pdf);
        $pdf .= "xref\n0 " . count($offsets) . "\n";
        $pdf .= "0000000000 65535 f \n";
        for ($i = 1; $i < count($offsets); $i++) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$i]);
        }
        $pdf .= "trailer\n<< /Size " . count($offsets) . " /Root 1 0 R >>\n";
        $pdf .= "startxref\n{$xrefOffset}\n%%EOF";

        return $pdf;
    }

    private function notifyApplicant(Application $application, string $subject, string $message): void
    {
        try {
            Mail::raw($message, function ($mail) use ($application, $subject) {
                $mail->to($application->email)
                    ->subject($subject);
            });
        } catch (\Throwable $exception) {
            logger()->warning('Failed to send applicant email', [
                'application' => $application->reference,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    private function ensureEnrollmentInvoice(Application $application, ?User $user = null): void
    {
        $user = $user ?? User::where('email', $application->email)->first();
        if (!$user || empty($application->intake_id)) {
            return;
        }

        $existing = Invoice::query()
            ->where('student_id', $user->id)
            ->where('intake_id', $application->intake_id)
            ->first();

        if ($existing) {
            return;
        }

        $amount = (float) env('DEFAULT_TUITION_FEE', 650);
        Invoice::create([
            'student_id' => $user->id,
            'intake_id' => $application->intake_id,
            'title' => 'Semester 1 Tuition',
            'amount' => $amount,
            'paid_amount' => 0,
            'status' => 'unpaid',
            'due_date' => now()->addDays(14)->toDateString(),
        ]);
    }
}
