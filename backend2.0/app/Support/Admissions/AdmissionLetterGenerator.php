<?php

namespace App\Support\Admissions;

use App\Models\Application;
use App\Support\Branding\UnivAiBranding;
use Illuminate\Support\Facades\Storage;

class AdmissionLetterGenerator
{
    public function ensureAdmissionLetter(Application $application): ?string
    {
        if ($application->status !== 'admitted') {
            return null;
        }

        if (!empty($application->admission_letter_url) && Storage::disk('local')->exists($application->admission_letter_url)) {
            return $application->admission_letter_url;
        }

        $path = $this->generatePdf($application);
        $application->forceFill([
            'admission_letter_url' => $path,
        ])->saveQuietly();

        return $path;
    }

    private function generatePdf(Application $application): string
    {
        $text = UnivAiBranding::admissionLetterText($application);

        if (class_exists(\FPDF::class)) {
            $contents = $this->buildFpdf($text);
        } else {
            $contents = $this->buildSimplePdf($text);
        }

        $fileName = 'admission-' . $application->reference . '.pdf';
        $path = 'admissions/letters/' . $fileName;
        Storage::disk('local')->put($path, $contents);

        return $path;
    }

    private function buildFpdf(string $text): string
    {
        $pdf = new \FPDF();
        $pdf->AddPage();
        $pdf->SetDrawColor(0, 209, 209);
        $pdf->SetFillColor(0, 209, 209);
        $pdf->Rect(0, 0, 210, 8, 'F');

        $pdf->SetTextColor(7, 18, 55);
        $pdf->SetFont('Arial', 'B', 20);
        $pdf->Cell(0, 10, UnivAiBranding::name(), 0, 1);

        $pdf->SetFont('Arial', '', 10);
        $pdf->SetTextColor(35, 55, 90);
        $pdf->Cell(0, 6, UnivAiBranding::documentSubtitle(), 0, 1);

        $pdf->Ln(8);
        $pdf->SetTextColor(7, 18, 55);
        $pdf->SetFont('Arial', 'B', 16);
        $pdf->Cell(0, 10, 'Official Admission Letter', 0, 1);

        $pdf->SetFont('Arial', '', 11);
        $pdf->SetTextColor(30, 38, 58);
        $pdf->Ln(4);
        $pdf->MultiCell(0, 6, $text);

        return $pdf->Output('S');
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
        foreach ($objects as $object) {
            $offsets[] = strlen($pdf);
            $pdf .= $object;
        }

        $xrefOffset = strlen($pdf);
        $pdf .= "xref\n0 " . (count($objects) + 1) . "\n";
        $pdf .= "0000000000 65535 f \n";
        for ($i = 1; $i <= count($objects); $i++) {
            $pdf .= str_pad((string) $offsets[$i], 10, '0', STR_PAD_LEFT) . " 00000 n \n";
        }
        $pdf .= "trailer\n<< /Size " . (count($objects) + 1) . " /Root 1 0 R >>\n";
        $pdf .= "startxref\n{$xrefOffset}\n%%EOF";

        return $pdf;
    }
}
