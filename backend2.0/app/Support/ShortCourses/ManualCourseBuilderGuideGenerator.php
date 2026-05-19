<?php

namespace App\Support\ShortCourses;

use App\Support\Branding\UnivAiBranding;
use Illuminate\Support\Facades\Storage;

class ManualCourseBuilderGuideGenerator
{
    public function ensureGuide(): string
    {
        $path = 'guides/manual-course-builder/univai-manual-course-builder-guide.pdf';
        $contents = class_exists(\FPDF::class) ? $this->buildFpdf() : $this->buildFallbackPdf();
        Storage::disk('local')->put($path, $contents);

        return $path;
    }

    private function buildFpdf(): string
    {
        $pdf = new \FPDF('P', 'mm', 'A4');
        $pdf->SetMargins(18, 18, 18);
        $pdf->SetAutoPageBreak(true, 18);

        $this->coverPage($pdf);
        $this->tocPage($pdf);
        $this->sectionPage($pdf, '1. Start With The Course Outline', [
            'Open the builder and complete the course basics first: title, description, school, level, duration, entry fee, certificate fee, and currency.',
            'Write a name that a non-specialist learner can understand immediately. Prefer plain language over internal programme jargon.',
            'Keep the description focused on the promise of the course: what the learner will be able to do after finishing.',
            'Use the readiness panel as you work. The builder should tell you what is missing before you try to publish.',
        ], [
            'Course title',
            'School / faculty',
            'Level and duration',
            'Entry and certificate fees',
            'Public-facing description',
        ]);
        $this->sectionPage($pdf, '2. Build Lessons Like Chapters', [
            'Treat each lesson as one chapter in a book. A chapter should cover one main idea and one learner outcome.',
            'Use the lesson title for the learner-facing topic and the summary for the purpose of the chapter.',
            'Keep each lesson short enough that the learner can finish it without losing the thread of the topic.',
            'Use drag, duplicate, collapse, and reorder actions to shape the course outline before polishing the content.',
        ], [
            'One lesson = one chapter',
            'One chapter = one main idea',
            'Short, clear lesson titles',
            'Duplicate only when the structure repeats',
        ]);
        $this->sectionPage($pdf, '3. Pick The Right Card Template', [
            'Teach cards explain a core idea in a direct voice.',
            'Example cards show the idea in use.',
            'Checkpoint cards ask one focused question and confirm understanding.',
            'Visual cards anchor charts, graphs, tables, equations, and images.',
            'Flashcards help with recall and definitions.',
            'Practice tasks and scenarios move the learner from understanding to use.',
            'Summary cards close the lesson with the essential takeaways.',
        ], [
            'Teach',
            'Example',
            'Checkpoint',
            'Visual',
            'Flashcard',
            'Practice task',
            'Case / scenario',
            'Summary',
        ]);
        $this->sectionPage($pdf, '4. Use Guided Sections For Dense Content', [
            'Do not force every detail into the main card body. Keep the card readable by putting extra material into secondary sections.',
            'Primary content should be the single idea that the learner must see first.',
            'Examples, criteria, teacher reasoning, source questions, and long notes belong in the secondary or expandable areas.',
            'Use the readability meter. If a card is marked heavy, split it or move the extra material into a collapsed section.',
        ], [
            'Primary: title, core text, question, visual',
            'Secondary: examples, criteria, context, notes',
            'Expandable: long source problems and trails',
        ]);
        $this->sectionPage($pdf, '5. Handle Maths And Visuals Clearly', [
            'Use the math tool only when the card truly needs a graph, equation, table, formula sheet, number line, or matrix.',
            'Put the learner instruction next to the visual so the purpose of the chart or equation is obvious.',
            'If a card needs a lot of graph explanation, keep the prompt short and move the explanation into the supporting text.',
            'Always include alt text for images. Every visual should still make sense when read aloud.',
        ], [
            'Graphs and charts',
            'Equations and formulas',
            'Tables and number lines',
            'Image captions and alt text',
        ]);
        $this->sectionPage($pdf, '6. Keep Assessments Practical', [
            'Use checkpoints often, but keep each one short and unambiguous.',
            'A checkpoint should test one thing at a time, not the entire lesson at once.',
            'Mix question styles only when there is a clear learning reason. Otherwise, keep the experience simple.',
            'Make sure every question has an answer, and every answer has a short explanation.',
        ], [
            'Multiple choice',
            'True / false',
            'Fill in the blank',
            'Short answer',
            'Difficulty balance',
        ]);
        $this->sectionPage($pdf, '7. Review Before You Publish', [
            'Read the course once as a learner would. If the structure feels crowded, split the content.',
            'Use the readiness checklist to confirm that the course title exists, lessons have cards, the quiz bank has answers, and images are described.',
            'Preview desktop and mobile before saving the final draft.',
            'Do not publish until the course reads cleanly in the preview mode and the launch warnings are resolved.',
        ], [
            'Title present',
            'Lessons populated',
            'Quiz answers complete',
            'Heavy cards resolved',
            'Images described',
        ]);
        $this->sectionPage($pdf, '8. Publishing Standard', [
            'The builder should produce a course that a non-technical person can understand, maintain, and update later without needing developer help.',
            'Use plain language in field labels and card copy. Avoid jargon where a simpler term exists.',
            'Keep the structure predictable. Learners should always know what the main idea is and what comes next.',
            'For launch, prefer clarity over density. One well-shaped lesson is better than three crowded ones.',
        ], [
            'Plain language',
            'Predictable structure',
            'Readable cards',
            'Mobile-friendly layouts',
            'Launch-ready flow',
        ]);

        return $pdf->Output('S');
    }

    private function coverPage(\FPDF $pdf): void
    {
        $pdf->AddPage();
        $pdf->SetFillColor(8, 33, 82);
        $pdf->Rect(0, 0, 210, 297, 'F');
        $pdf->SetFillColor(15, 184, 200);
        $pdf->Rect(0, 0, 210, 16, 'F');

        $logoPath = $this->logoPath();
        if ($logoPath) {
            $pdf->Image($logoPath, 18, 26, 42);
        } else {
            $pdf->SetTextColor(255, 255, 255);
            $pdf->SetFont('Arial', 'B', 24);
            $pdf->SetXY(18, 31);
            $pdf->Cell(42, 16, 'UAI', 0, 0, 'C');
        }

        $pdf->SetTextColor(255, 255, 255);
        $pdf->SetFont('Arial', 'B', 24);
        $pdf->SetXY(18, 92);
        $pdf->MultiCell(174, 12, 'UnivAI Manual Course Builder Guide', 0, 'L');

        $pdf->SetFont('Arial', '', 12);
        $pdf->SetXY(18, 128);
        $pdf->MultiCell(170, 7, 'A professional handbook for building short courses manually, template by template, with guided sections, clean assessment flow, and mobile-friendly learner cards.');

        $pdf->SetFillColor(255, 255, 255);
        $pdf->SetTextColor(8, 33, 82);
        $pdf->SetY(182);
        $pdf->Rect(18, 182, 174, 44, 'D');
        $pdf->SetXY(24, 190);
        $pdf->SetFont('Arial', 'B', 12);
        $pdf->Cell(0, 7, 'What this guide covers', 0, 1);
        $pdf->SetFont('Arial', '', 10.5);
        $pdf->MultiCell(162, 6, 'Course setup, lesson planning, card templates, maths and visuals, checkpoints, previews, publishing, and the standards that keep the builder simple enough for non-developers.');

        $pdf->SetTextColor(200, 223, 237);
        $pdf->SetFont('Arial', '', 9);
        $pdf->SetXY(18, 260);
        $pdf->Cell(0, 5, UnivAiBranding::name() . ' | ' . UnivAiBranding::officialOffice(), 0, 1, 'L');
        $pdf->SetX(18);
        $pdf->Cell(0, 5, UnivAiBranding::publicUrl(), 0, 1, 'L');
    }

    private function tocPage(\FPDF $pdf): void
    {
        $pdf->AddPage();
        $this->topBar($pdf, 'Guide Contents');
        $pdf->SetTextColor(12, 24, 48);
        $pdf->SetFont('Arial', 'B', 20);
        $pdf->Cell(0, 12, 'Guide Structure', 0, 1);
        $pdf->SetFont('Arial', '', 11);
        $pdf->SetTextColor(51, 64, 84);
        $pdf->MultiCell(0, 6.5, 'Use this guide as the operating standard for the manual builder. Each section is written for course creators who need a clear workflow, not technical instructions.');

        $this->bulletPanel($pdf, 'Sections', [
            'Start with the course outline',
            'Build lessons like chapters',
            'Pick the right card template',
            'Use guided sections for dense content',
            'Handle maths and visuals clearly',
            'Keep assessments practical',
            'Review before you publish',
            'Maintain a launch-ready standard',
        ]);
    }

    private function sectionPage(\FPDF $pdf, string $heading, array $paragraphs, array $bullets): void
    {
        $pdf->AddPage();
        $this->topBar($pdf, $heading);
        $pdf->SetTextColor(12, 24, 48);
        $pdf->SetFont('Arial', 'B', 18);
        $pdf->MultiCell(0, 9, $heading);
        $pdf->Ln(1);

        $pdf->SetFont('Arial', '', 11);
        $pdf->SetTextColor(44, 57, 78);
        foreach ($paragraphs as $paragraph) {
            $pdf->MultiCell(0, 6.5, $this->cleanText($paragraph));
            $pdf->Ln(1.5);
        }

        $this->bulletPanel($pdf, 'Practical rules', $bullets);
    }

    private function topBar(\FPDF $pdf, string $label): void
    {
        $pdf->SetFillColor(15, 184, 200);
        $pdf->Rect(0, 0, 210, 10, 'F');
        $pdf->SetTextColor(255, 255, 255);
        $pdf->SetFont('Arial', 'B', 9);
        $pdf->SetXY(18, 12);
        $pdf->Cell(0, 6, $label, 0, 1, 'L');
        $pdf->Ln(3);
    }

    private function bulletPanel(\FPDF $pdf, string $title, array $items): void
    {
        $startY = $pdf->GetY();
        $pdf->SetFillColor(245, 249, 252);
        $pdf->SetDrawColor(207, 219, 232);
        $pdf->Rect(18, $startY, 174, max(38, 10 + count($items) * 9), 'DF');
        $pdf->SetXY(24, $startY + 5);
        $pdf->SetTextColor(8, 33, 82);
        $pdf->SetFont('Arial', 'B', 12);
        $pdf->Cell(0, 6, $title, 0, 1);
        $pdf->SetFont('Arial', '', 10);
        $pdf->SetTextColor(34, 49, 72);
        foreach ($items as $index => $item) {
            $pdf->Cell(8, 5.8, '•', 0, 0);
            $x = $pdf->GetX();
            $y = $pdf->GetY();
            $pdf->MultiCell(154, 5.8, $this->cleanText(($index + 1) . '. ' . $item));
            if ($pdf->GetY() === $y) {
                $pdf->SetXY($x, $y + 5.8);
            }
        }
        $pdf->SetY($startY + max(38, 10 + count($items) * 9) + 4);
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

    private function cleanText(string $value): string
    {
        $value = str_replace(['â€“', 'â€”', 'â€œ', 'â€', 'â€˜', 'â€™'], ['-', '-', '"', '"', "'", "'"], $value);
        return iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $value) ?: $value;
    }

    private function buildFallbackPdf(): string
    {
        $text = 'UnivAI Manual Course Builder Guide';
        $content = "BT\n/F1 18 Tf\n24 TL\n72 720 Td\n(" . $this->escapePdfText($text) . ") Tj\nET";

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

    private function escapePdfText(string $value): string
    {
        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $value);
    }
}
