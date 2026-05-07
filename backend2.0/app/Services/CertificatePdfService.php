<?php

namespace App\Services;

use App\Models\ShortCourseEnrollment;

class CertificatePdfService
{
    public function shortCourseCertificate(ShortCourseEnrollment $enrollment): string
    {
        $studentName = $this->clean($enrollment->student?->name ?? 'Student');
        $courseTitle = $this->clean($enrollment->course?->title ?? 'Short Course');
        $score = $this->clean((string) ($enrollment->exam_score ?? '0'));
        $date = $this->clean(optional($enrollment->completed_at)->toFormattedDateString() ?? now()->toFormattedDateString());
        $certificateId = $this->clean('UNIVAI-SC-' . str_pad((string) $enrollment->id, 8, '0', STR_PAD_LEFT));

        $lines = [
            ['text' => 'UNIVAI UNIVERSITY', 'x' => 150, 'y' => 110, 'size' => 22],
            ['text' => 'Certificate of Completion', 'x' => 145, 'y' => 165, 'size' => 26],
            ['text' => 'This certifies that', 'x' => 225, 'y' => 225, 'size' => 14],
            ['text' => $studentName, 'x' => $this->centerX($studentName, 22), 'y' => 270, 'size' => 22],
            ['text' => 'has successfully completed', 'x' => 198, 'y' => 320, 'size' => 14],
            ['text' => $courseTitle, 'x' => $this->centerX($courseTitle, 18), 'y' => 365, 'size' => 18],
            ['text' => "Exam score: {$score}%", 'x' => 235, 'y' => 420, 'size' => 12],
            ['text' => "Completion date: {$date}", 'x' => 210, 'y' => 450, 'size' => 12],
            ['text' => "Certificate ID: {$certificateId}", 'x' => 195, 'y' => 705, 'size' => 10],
        ];

        return $this->renderPdf($lines);
    }

    private function renderPdf(array $lines): string
    {
        $content = "q\n0.00 0.41 0.31 RG\n12 w\n36 36 540 720 re S\nQ\n";
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

    private function clean(string $value): string
    {
        return trim(preg_replace('/\s+/', ' ', strip_tags($value))) ?: 'N/A';
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
