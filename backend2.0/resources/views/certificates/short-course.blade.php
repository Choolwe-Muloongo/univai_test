<!doctype html>
<html><head><meta charset="utf-8"><title>UnivAI Certificate</title></head>
<body style="font-family: sans-serif; text-align:center; padding: 64px; border: 12px solid #00694E;">
  <p style="letter-spacing: .3em; color:#00694E;">UNIVAI UNIVERSITY</p>
  <h1>Certificate of Completion</h1>
  <p>This certifies that</p>
  <h2>{{ $enrollment->student->name }}</h2>
  <p>has completed</p>
  <h2>{{ $enrollment->course->title }}</h2>
  <p>with an exam score of {{ $enrollment->exam_score }}% on {{ optional($enrollment->completed_at)->toFormattedDateString() }}.</p>
</body></html>
