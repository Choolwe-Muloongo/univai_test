<?php

namespace App\Support\Admissions;

use App\Models\Application;
use App\Models\Program;
use App\Support\Branding\UnivAiBranding;
use Illuminate\Support\Facades\Storage;

class AdmissionsDocumentGenerator
{
    public function ensureOfferLetter(Application $application): string
    {
        $path = $this->generate($application, 'offer');
        $application->forceFill([
            'offer_letter_url' => $path,
            'offer_issued_at' => $application->offer_issued_at ?? now(),
        ])->saveQuietly();

        return $path;
    }

    public function ensureAdmissionLetter(Application $application): ?string
    {
        if ($application->status !== 'admitted') {
            return null;
        }

        $path = $this->generate($application, 'admission');
        $application->forceFill([
            'admission_letter_url' => $path,
        ])->saveQuietly();

        return $path;
    }

    private function generate(Application $application, string $type): string
    {
        $contents = class_exists(\FPDF::class)
            ? $this->buildProfessionalFpdf($application, $type)
            : $this->buildSimplePdf($application, $type);

        $prefix = $type === 'admission' ? 'admission' : 'offer';
        $folder = $type === 'admission' ? 'admissions/letters' : 'offers';
        $path = $folder . '/' . $prefix . '-' . $application->reference . '.pdf';

        Storage::disk('local')->put($path, $contents);

        return $path;
    }

    private function buildProfessionalFpdf(Application $application, string $type): string
    {
        $details = $this->programmeDetails($application);
        $isAdmission = $type === 'admission';
        $title = $isAdmission ? 'OFFICIAL ADMISSION LETTER' : 'PROVISIONAL OFFER LETTER';
        $shortTitle = $isAdmission ? 'Admission Letter' : 'Offer Letter';
        $body = $isAdmission
            ? 'Following your acceptance of the offer issued by ' . UnivAiBranding::name() . ', we are pleased to confirm that you have been officially admitted into the programme listed below.'
            : ($application->offer_letter_message ?: 'Congratulations. After reviewing your application, ' . UnivAiBranding::name() . ' is pleased to offer you provisional admission into the programme listed below.');

        $pdf = new \FPDF('P', 'mm', 'A4');
        $pdf->SetMargins(18, 18, 18);
        $pdf->SetAutoPageBreak(true, 22);
        $pdf->AddPage();

        $this->drawHeader($pdf, $shortTitle);
        $this->drawTitleBlock($pdf, $title, $application);

        $pdf->Ln(6);
        $pdf->SetTextColor(20, 28, 50);
        $pdf->SetFont('Arial', '', 11);
        $pdf->Cell(0, 7, 'Dear ' . $this->cleanText($application->full_name) . ',', 0, 1);
        $pdf->Ln(2);
        $pdf->MultiCell(0, 6.2, $this->cleanText($body));

        $this->drawSectionHeading($pdf, 'Programme Details');
        $this->drawInfoTable($pdf, [
            ['Programme', $details['programTitle']],
            ['Qualification', $details['qualification'] ?: 'To be confirmed'],
            ['School / Faculty', $details['schoolName'] ?: $application->school_id],
            ['Department', $details['departmentName'] ?: 'To be confirmed'],
            ['Delivery Mode', $application->delivery_mode ?: 'To be confirmed'],
            ['Intake', $application->intake_id ?: 'To be confirmed'],
        ]);

        if ($isAdmission) {
            $this->drawSectionHeading($pdf, 'Enrollment Instructions');
            $this->drawNumberedList($pdf, [
                'Complete module selection through the UnivAI Enrollment Portal.',
                'Confirm your delivery mode and programme intake details.',
                'Pay any applicable tuition or enrollment fees.',
                'Comply with UnivAI academic, conduct, and student policies.',
                'Once enrollment is confirmed, your full Student Dashboard will be activated.',
            ]);
        } else {
            $this->drawSectionHeading($pdf, 'Conditions of Offer');
            $this->drawNumberedList($pdf, [
                'Verification of all submitted academic and identity documents.',
                'Acceptance of this offer through the UnivAI Admissions Portal.',
                'Payment of applicable admissions and enrollment fees.',
                'Completion of the official enrollment process.',
                'Compliance with UnivAI academic and student policies.',
            ]);

            if (!empty($details['requirements'])) {
                $pdf->Ln(2);
                $pdf->SetFont('Arial', 'B', 9.5);
                $pdf->Cell(0, 5, 'Published Admission Requirements', 0, 1);
                $pdf->SetFont('Arial', '', 9.5);
                $pdf->MultiCell(0, 5.5, $this->cleanText($details['requirements']));
            }
        }

        $this->drawActionBox($pdf, $isAdmission);
        $this->drawSignature($pdf);
        $this->drawFooter($pdf);

        return $pdf->Output('S');
    }

    private function drawHeader(\FPDF $pdf, string $shortTitle): void
    {
        $pdf->SetFillColor(0, 190, 190);
        $pdf->Rect(0, 0, 210, 10, 'F');

        $logoPath = $this->logoPath();
        if ($logoPath) {
            $pdf->Image($logoPath, 18, 16, 34);
        } else {
            $pdf->SetXY(18, 18);
            $pdf->SetDrawColor(0, 190, 190);
            $pdf->SetFillColor(238, 252, 252);
            $pdf->SetLineWidth(0.7);
            $pdf->Rect(18, 18, 30, 30, 'DF');
            $pdf->SetFont('Arial', 'B', 13);
            $pdf->SetTextColor(7, 18, 55);
            $pdf->SetXY(18, 28.5);
            $pdf->Cell(30, 7, 'UAI', 0, 0, 'C');
            $pdf->SetFont('Arial', '', 6.5);
            $pdf->SetXY(18, 36);
            $pdf->Cell(30, 4, 'OFFICIAL SEAL', 0, 0, 'C');
        }

        $pdf->SetXY(58, 17);
        $pdf->SetFont('Arial', 'B', 22);
        $pdf->SetTextColor(7, 18, 55);
        $pdf->Cell(0, 8, UnivAiBranding::name(), 0, 1);
        $pdf->SetX(58);
        $pdf->SetFont('Arial', '', 9.5);
        $pdf->SetTextColor(45, 57, 82);
        $pdf->Cell(0, 5, UnivAiBranding::officialOffice(), 0, 1);
        $pdf->SetX(58);
        $pdf->Cell(0, 5, 'Official Academic Correspondence', 0, 1);

        $pdf->SetXY(155, 18);
        $pdf->SetFont('Arial', 'B', 9);
        $pdf->SetTextColor(7, 18, 55);
        $pdf->Cell(37, 6, strtoupper($shortTitle), 1, 1, 'C');
        $pdf->SetX(155);
        $pdf->SetFont('Arial', '', 8);
        $pdf->Cell(37, 6, 'Admissions Record', 1, 1, 'C');

        $pdf->Ln(8);
        $pdf->SetDrawColor(220, 230, 236);
        $pdf->Line(18, 52, 192, 52);
        $pdf->SetY(58);
    }

    private function drawTitleBlock(\FPDF $pdf, string $title, Application $application): void
    {
        $pdf->SetFillColor(245, 250, 252);
        $pdf->SetDrawColor(205, 221, 229);
        $pdf->Rect(18, $pdf->GetY(), 174, 28, 'DF');

        $startY = $pdf->GetY();
        $pdf->SetXY(24, $startY + 5);
        $pdf->SetTextColor(7, 18, 55);
        $pdf->SetFont('Arial', 'B', 16);
        $pdf->Cell(108, 7, $title, 0, 1);
        $pdf->SetX(24);
        $pdf->SetFont('Arial', '', 9.5);
        $pdf->SetTextColor(45, 57, 82);
        $pdf->Cell(108, 6, 'Issued by ' . UnivAiBranding::officialOffice(), 0, 1);

        $pdf->SetXY(135, $startY + 5);
        $pdf->SetFont('Arial', 'B', 8.8);
        $pdf->Cell(22, 5, 'Reference:', 0, 0);
        $pdf->SetFont('Arial', '', 8.8);
        $pdf->Cell(0, 5, $this->cleanText($application->reference), 0, 1);
        $pdf->SetX(135);
        $pdf->SetFont('Arial', 'B', 8.8);
        $pdf->Cell(22, 5, 'Issued:', 0, 0);
        $pdf->SetFont('Arial', '', 8.8);
        $pdf->Cell(0, 5, now()->toFormattedDateString(), 0, 1);
        $pdf->SetX(135);
        $pdf->SetFont('Arial', 'B', 8.8);
        $pdf->Cell(22, 5, 'Status:', 0, 0);
        $pdf->SetFont('Arial', '', 8.8);
        $pdf->Cell(0, 5, ucfirst(str_replace('_', ' ', $application->status)), 0, 1);

        $pdf->SetY($startY + 34);
    }

    private function drawSectionHeading(\FPDF $pdf, string $heading): void
    {
        $pdf->Ln(5);
        $pdf->SetTextColor(7, 18, 55);
        $pdf->SetFont('Arial', 'B', 12);
        $pdf->Cell(0, 7, $heading, 0, 1);
        $pdf->SetDrawColor(0, 190, 190);
        $pdf->Line(18, $pdf->GetY(), 70, $pdf->GetY());
        $pdf->Ln(3);
    }

    private function drawInfoTable(\FPDF $pdf, array $rows): void
    {
        $pdf->SetFont('Arial', '', 9.5);
        $pdf->SetDrawColor(220, 230, 236);
        foreach ($rows as [$label, $value]) {
            $y = $pdf->GetY();
            $pdf->SetFillColor(247, 250, 252);
            $pdf->SetTextColor(45, 57, 82);
            $pdf->SetFont('Arial', 'B', 9.2);
            $pdf->Cell(50, 8, $this->cleanText($label), 1, 0, 'L', true);
            $pdf->SetFont('Arial', '', 9.2);
            $pdf->SetTextColor(20, 28, 50);
            $pdf->Cell(124, 8, $this->cleanText((string) $value), 1, 1);
            if ($pdf->GetY() <= $y) {
                $pdf->Ln(8);
            }
        }
    }

    private function drawNumberedList(\FPDF $pdf, array $items): void
    {
        $pdf->SetFont('Arial', '', 9.8);
        $pdf->SetTextColor(20, 28, 50);
        foreach ($items as $index => $item) {
            $pdf->Cell(8, 6, ($index + 1) . '.', 0, 0);
            $x = $pdf->GetX();
            $y = $pdf->GetY();
            $pdf->MultiCell(0, 6, $this->cleanText($item));
            if ($pdf->GetY() === $y) {
                $pdf->SetXY($x, $y + 6);
            }
        }
    }

    private function drawActionBox(\FPDF $pdf, bool $isAdmission): void
    {
        $pdf->Ln(5);
        $pdf->SetFillColor(238, 252, 252);
        $pdf->SetDrawColor(0, 190, 190);
        $y = $pdf->GetY();
        $pdf->Rect(18, $y, 174, 22, 'DF');
        $pdf->SetXY(24, $y + 4);
        $pdf->SetFont('Arial', 'B', 10);
        $pdf->SetTextColor(7, 18, 55);
        $pdf->Cell(0, 5, $isAdmission ? 'Next Step: Complete Enrollment' : 'Next Step: Accept Your Offer', 0, 1);
        $pdf->SetX(24);
        $pdf->SetFont('Arial', '', 9.5);
        $pdf->MultiCell(160, 5.2, $isAdmission
            ? 'Proceed to the UnivAI Enrollment Portal. Your full Student Dashboard opens after enrollment confirmation.'
            : 'Log in to the UnivAI Admissions Portal, review this offer, and select Accept Offer to continue.');
        $pdf->SetY($y + 27);
    }

    private function drawSignature(\FPDF $pdf): void
    {
        $pdf->Ln(4);
        $pdf->SetFont('Arial', '', 10);
        $pdf->SetTextColor(20, 28, 50);
        $pdf->Cell(0, 6, 'Sincerely,', 0, 1);
        $pdf->Ln(9);
        $pdf->SetDrawColor(160, 175, 190);
        $pdf->Line(18, $pdf->GetY(), 78, $pdf->GetY());
        $pdf->Ln(2);
        $pdf->SetFont('Arial', 'B', 10);
        $pdf->Cell(0, 5, UnivAiBranding::name() . ' Admissions Office', 0, 1);
        $pdf->SetFont('Arial', '', 9);
        $pdf->Cell(0, 5, UnivAiBranding::officialOffice(), 0, 1);
        $pdf->Cell(0, 5, UnivAiBranding::admissionsEmail(), 0, 1);
    }

    private function drawFooter(\FPDF $pdf): void
    {
        $pdf->SetY(-35);
        $pdf->SetDrawColor(220, 230, 236);
        $pdf->Line(18, $pdf->GetY(), 192, $pdf->GetY());
        $pdf->Ln(3);
        $pdf->SetFont('Arial', '', 7.8);
        $pdf->SetTextColor(85, 95, 115);
        $pdf->MultiCell(0, 4.2, $this->cleanText(UnivAiBranding::documentVerificationNotice()));
        $pdf->Cell(0, 4.2, UnivAiBranding::name() . ' | ' . UnivAiBranding::officialOffice() . ' | ' . UnivAiBranding::publicUrl(), 0, 1, 'C');
    }

    private function logoPath(): ?string
    {
        $candidates = [
            base_path('../public/images/brand/univai-logo-mark-transparent.png'),
            base_path('../public/images/brand/univai-logo-full-transparent.png'),
            base_path('../src/public/images/brand/univai-logo-mark-transparent.png'),
            base_path('../src/public/images/brand/univai-logo-full-transparent.png'),
            base_path('../../public/images/brand/univai-logo-mark-transparent.png'),
            base_path('../../public/images/brand/univai-logo-full-transparent.png'),
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

    private function buildSimplePdf(Application $application, string $type): string
    {
        $text = $type === 'admission'
            ? UnivAiBranding::admissionLetterText($application)
            : UnivAiBranding::offerLetterText($application);

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

    private function programmeDetails(Application $application): array
    {
        $program = Program::with(['school', 'department', 'qualificationLevel'])->find($application->program_id);

        return [
            'programTitle' => $program?->title ?? $application->program_id,
            'schoolName' => $program?->school?->name,
            'departmentName' => $program?->department?->name,
            'qualification' => $program?->qualificationLevel?->name,
            'requirements' => $program?->admission_requirements,
        ];
    }

    private function cleanText(?string $value): string
    {
        $value = (string) $value;
        $value = str_replace(['–', '—', '“', '”', '‘', '’'], ['-', '-', '"', '"', "'", "'"], $value);
        return iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $value) ?: $value;
    }
}
