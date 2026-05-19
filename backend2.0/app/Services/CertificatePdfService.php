<?php

namespace App\Services;

use App\Models\ShortCourseEnrollment;
use App\Support\Branding\UnivAiBranding;
use App\Support\Documents\DocumentBranding;

class CertificatePdfService
{
    public function shortCourseCertificate(ShortCourseEnrollment $enrollment): string
    {
        $payload = [
            'studentName' => $this->clean($enrollment->student?->name ?? 'Student'),
            'courseTitle' => $this->clean($enrollment->course?->title ?? 'Short Course'),
            'score' => $this->clean((string) ($enrollment->exam_score ?? '0')),
            'date' => $this->clean(optional($enrollment->completed_at)->toFormattedDateString() ?? now()->toFormattedDateString()),
            'certificateId' => $this->certificateId($enrollment),
        ];

        return class_exists(\FPDF::class)
            ? $this->renderFpdf($payload)
            : $this->renderFallback($payload);
    }

    public function previewShortCourseCertificate(): string
    {
        $payload = [
            'studentName' => 'David Nymbiri',
            'courseTitle' => 'AI Productivity for Business Teams',
            'score' => '92',
            'date' => now()->toFormattedDateString(),
            'certificateId' => 'UNIVAI-SC-PREVIEW',
        ];

        return class_exists(\FPDF::class)
            ? $this->renderFpdf($payload)
            : $this->renderFallback($payload);
    }

    private function renderFpdf(array $payload): string
    {
        $studentName = $this->cleanText($payload['studentName']);
        $courseTitle = $this->cleanText($payload['courseTitle']);
        $score = $this->cleanText($payload['score']);
        $date = $this->cleanText($payload['date']);
        $certificateId = $this->cleanText($payload['certificateId']);
        $branding = app(DocumentBranding::class);
        $settings = $branding->settings();

        $pdf = new \FPDF('L', 'mm', 'A4');
        $pdf->SetMargins(18, 18, 18);
        $pdf->AddPage();

        $pdf->SetFillColor(255, 255, 255);
        $pdf->Rect(0, 0, 297, 210, 'F');

        $this->drawBorder($pdf);

        $logoPath = $this->fullLogoPath() ?: $this->logoPath();
        if ($logoPath) {
            $pdf->Image($logoPath, 103, 18, 92);
        } else {
            $pdf->SetFillColor(238, 252, 252);
            $pdf->Rect(124, 18, 48, 28, 'F');
            $pdf->SetTextColor(7, 18, 55);
            $pdf->SetFont('Arial', 'B', 18);
            $pdf->SetXY(124, 27);
            $pdf->Cell(48, 9, 'UNIVAI', 0, 0, 'C');
        }

        $pdf->SetY(53);
        $pdf->SetTextColor(7, 18, 55);
        $pdf->SetFont('Times', 'B', 25);
        $pdf->Cell(0, 10, 'CERTIFICATE OF COMPLETION', 0, 1, 'C');
        $pdf->SetTextColor(0, 116, 126);
        $pdf->SetFont('Arial', '', 12);
        $pdf->Cell(0, 7, 'SHORT COURSE CERTIFICATE', 0, 1, 'C');
        $pdf->SetDrawColor(0, 145, 150);
        $pdf->SetLineWidth(0.8);
        $pdf->Line(112, 73, 185, 73);

        $pdf->SetY(82);
        $pdf->SetTextColor(45, 57, 82);
        $pdf->SetFont('Arial', '', 12);
        $pdf->Cell(0, 7, 'This certifies that', 0, 1, 'C');

        $pdf->SetTextColor(7, 18, 55);
        $pdf->SetFont('Times', 'B', 28);
        $pdf->SetX(42);
        $pdf->MultiCell(213, 12, $studentName, 0, 'C');

        $pdf->SetTextColor(45, 57, 82);
        $pdf->SetFont('Arial', '', 12);
        $pdf->Cell(0, 7, 'has successfully completed the UnivAI short course', 0, 1, 'C');

        $pdf->SetTextColor(7, 18, 55);
        $pdf->SetFont('Arial', 'B', 17);
        $pdf->SetX(46);
        $pdf->MultiCell(205, 8, $courseTitle, 0, 'C');

        $pdf->SetY(135);
        $pdf->SetFillColor(238, 252, 252);
        $pdf->SetDrawColor(0, 190, 190);
        $pdf->Rect(48, 135, 201, 17, 'DF');
        $pdf->SetXY(55, 140);
        $this->metadataCell($pdf, 'Score', $score . '%', 45);
        $this->metadataCell($pdf, 'Issued', $date, 68);
        $this->metadataCell($pdf, 'Certificate No.', $certificateId, 75);

        $sigY = 166;
        $this->drawSignature($pdf, $branding, $settings->registrar_signature, 45, $sigY, $settings->registrar_name ?: 'Registrar', $settings->registrar_title ?: 'Registrar');
        $this->drawSignature($pdf, $branding, $settings->director_signature, 203, $sigY, $settings->director_name ?: 'Director', $settings->director_title ?: 'Director, Professional & Short Courses');

        $sealPath = $this->logoPath();
        if ($sealPath) {
            $pdf->Image($sealPath, 134, 157, 29);
        }
        $pdf->SetDrawColor(0, 145, 150);
        $pdf->SetLineWidth(0.8);
        $pdf->Rect(129, 153, 39, 36, 'D');
        $pdf->SetXY(125, 187);
        $pdf->SetFont('Arial', '', 7.5);
        $pdf->SetTextColor(0, 116, 126);
        $pdf->Cell(47, 4, 'Official UnivAI Seal', 0, 0, 'C');

        $this->drawVerificationBox($pdf, $settings->verification_url ?: UnivAiBranding::publicUrl(), $settings->contact_email ?: UnivAiBranding::supportEmail());

        return $pdf->Output('S');
    }

    private function renderFallback(array $payload): string
    {
        $studentName = $payload['studentName'];
        $courseTitle = $payload['courseTitle'];
        $score = $payload['score'];
        $date = $payload['date'];
        $certificateId = $payload['certificateId'];

        $lines = [
            ['text' => strtoupper(UnivAiBranding::name()), 'x' => 152, 'y' => 110, 'size' => 22],
            ['text' => UnivAiBranding::tagline(), 'x' => 240, 'y' => 136, 'size' => 10],
            ['text' => 'Certificate of Completion', 'x' => 145, 'y' => 190, 'size' => 26],
            ['text' => 'This certifies that', 'x' => 225, 'y' => 245, 'size' => 14],
            ['text' => $studentName, 'x' => $this->centerX($studentName, 22), 'y' => 292, 'size' => 22],
            ['text' => 'has successfully completed', 'x' => 198, 'y' => 340, 'size' => 14],
            ['text' => $courseTitle, 'x' => $this->centerX($courseTitle, 18), 'y' => 385, 'size' => 18],
            ['text' => "Exam score: {$score}%", 'x' => 235, 'y' => 450, 'size' => 12],
            ['text' => "Completion date: {$date}", 'x' => 210, 'y' => 480, 'size' => 12],
            ['text' => "Certificate ID: {$certificateId}", 'x' => 195, 'y' => 705, 'size' => 10],
        ];

        return $this->renderSimplePdf($lines);
    }

    private function renderSimplePdf(array $lines): string
    {
        $content = "q\n0.00 0.41 0.31 RG\n12 w\n36 36 540 720 re S\nQ\n";
        $content .= "q\n0.03 0.07 0.22 rg\n48 690 516 30 re f\nQ\n";
        $content .= "BT\n/F1 12 Tf\n0.08 0.10 0.12 rg\n";

        foreach ($lines as $line) {
            $content .= sprintf('/F1 %d Tf 1 0 0 1 %d %d Tm (%s) Tj', $line['size'], $line['x'], $line['y'], $this->escape($line['text'])) . "\n";
        }

        $content .= "ET";

        $objects = [
            "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
            "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
            "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
            "4 0 obj\n<< /Length " . strlen($content) . " >>\nstream\n" . $content . "\nendstream\nendobj\n",
            "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [0];
        foreach ($objects as $object) {
            $offsets[] = strlen($pdf);
            $pdf .= $object;
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

    private function certificateId(ShortCourseEnrollment $enrollment): string
    {
        return $this->clean('UNIVAI-SC-' . str_pad((string) $enrollment->id, 8, '0', STR_PAD_LEFT));
    }

    private function logoPath(): ?string
    {
        $candidates = [
            base_path('../public/images/brand/univai-logo-mark-transparent.png'),
            base_path('../public/images/brand/univai-logo-full-transparent.png'),
            base_path('../src/public/images/brand/univai-logo-mark-transparent.png'),
            base_path('../src/public/images/brand/univai-logo-full-transparent.png'),
            public_path('images/brand/univai-logo-mark-transparent.png'),
            public_path('images/brand/univai-logo-full-transparent.png'),
        ];

        foreach ($candidates as $path) {
            if (is_string($path) && file_exists($path)) {
                return $path;
            }
        }

        return null;
    }

    private function fullLogoPath(): ?string
    {
        $candidates = [
            base_path('../public/images/brand/univai-logo-full-transparent.png'),
            base_path('../src/public/images/brand/univai-logo-full-transparent.png'),
            public_path('images/brand/univai-logo-full-transparent.png'),
        ];

        foreach ($candidates as $path) {
            if (is_string($path) && file_exists($path)) {
                return $path;
            }
        }

        return null;
    }

    private function drawBorder(\FPDF $pdf): void
    {
        $pdf->SetDrawColor(7, 18, 55);
        $pdf->SetLineWidth(1.2);
        $pdf->Rect(13, 13, 271, 184, 'D');
        $pdf->SetDrawColor(0, 145, 150);
        $pdf->SetLineWidth(0.45);
        $pdf->Rect(18, 18, 261, 174, 'D');

        foreach ([[24, 24], [253, 24], [24, 168], [253, 168]] as [$x, $y]) {
            $pdf->SetDrawColor(0, 145, 150);
            $pdf->Line($x, $y, $x + 20, $y);
            $pdf->Line($x, $y, $x, $y + 20);
        }
    }

    private function metadataCell(\FPDF $pdf, string $label, string $value, int $width): void
    {
        $pdf->SetTextColor(0, 116, 126);
        $pdf->SetFont('Arial', 'B', 8);
        $pdf->Cell($width, 4, strtoupper($label), 0, 2, 'C');
        $pdf->SetTextColor(7, 18, 55);
        $pdf->SetFont('Arial', '', 9.5);
        $pdf->Cell($width, 5, $value, 0, 0, 'C');
        $pdf->SetXY($pdf->GetX(), 140);
    }

    private function drawSignature(\FPDF $pdf, DocumentBranding $branding, ?string $signature, int $x, int $y, string $name, string $title): void
    {
        $signaturePath = $branding->signaturePath($signature, sha1($name));
        if ($signaturePath) {
            $pdf->Image($signaturePath, $x, $y - 12, 43, 16);
        }

        $pdf->SetDrawColor(130, 150, 168);
        $pdf->Line($x, $y + 7, $x + 50, $y + 7);
        $pdf->SetXY($x - 5, $y + 10);
        $pdf->SetTextColor(7, 18, 55);
        $pdf->SetFont('Arial', 'B', 9);
        $pdf->Cell(60, 4.5, $this->cleanText($name), 0, 2, 'C');
        $pdf->SetFont('Arial', '', 7.5);
        $pdf->SetTextColor(45, 57, 82);
        $pdf->Cell(60, 4, $this->cleanText($title), 0, 0, 'C');
    }

    private function drawVerificationBox(\FPDF $pdf, string $url, string $email): void
    {
        $pdf->SetFillColor(247, 250, 252);
        $pdf->SetDrawColor(215, 226, 235);
        $pdf->Rect(229, 25, 35, 35, 'DF');
        $pdf->SetDrawColor(0, 116, 126);
        for ($i = 0; $i < 6; $i++) {
            $offset = 4 + ($i * 5);
            $pdf->Line(232 + $offset, 28, 232 + $offset, 57);
            $pdf->Line(232, 28 + $offset, 261, 28 + $offset);
        }
        $pdf->SetXY(219, 63);
        $pdf->SetFont('Arial', 'B', 7.5);
        $pdf->SetTextColor(7, 18, 55);
        $pdf->Cell(55, 4, 'VERIFY CERTIFICATE', 0, 2, 'C');
        $pdf->SetFont('Arial', '', 6.7);
        $pdf->SetTextColor(45, 57, 82);
        $pdf->MultiCell(55, 3.5, $this->cleanText($url . "\n" . $email), 0, 'C');
    }

    private function clean(string $value): string
    {
        return trim(preg_replace('/\s+/', ' ', strip_tags($value))) ?: 'N/A';
    }

    private function cleanText(string $value): string
    {
        return iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $value) ?: $value;
    }

    private function escape(string $value): string
    {
        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $value);
    }

    private function centerX(string $text, int $fontSize): int
    {
        $estimatedWidth = strlen($text) * ($fontSize * 0.45);
        return max(54, (int) round((612 - $estimatedWidth) / 2));
    }
}
