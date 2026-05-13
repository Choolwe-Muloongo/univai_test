param(
  [string]$Email = "applicant+test@univai.edu",
  [string]$Password = "password123"
)

$base = "http://localhost:8000/api"

function Invoke-Api {
  param(
    [string]$Method,
    [string]$Path,
    [object]$Body,
    [Microsoft.PowerShell.Commands.WebRequestSession]$Session
  )
  $params = @{
    Uri         = "$base$Path"
    Method      = $Method
    ContentType = "application/json"
    WebSession  = $Session
  }
  if ($null -ne $Body) {
    $params.Body = ($Body | ConvertTo-Json -Depth 6)
  }
  return Invoke-RestMethod @params
}

Write-Host "== UnivAI End-to-End Flow Test ==" -ForegroundColor Cyan

$studentSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$adminSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Write-Host "1) Register applicant account..."
Invoke-Api -Method "POST" -Path "/auth/register" -Body @{
  name     = "Test Applicant"
  email    = $Email
  password = $Password
} -Session $studentSession | Out-Null

Write-Host "2) Submit admissions application..."
Invoke-Api -Method "POST" -Path "/admissions/applications" -Body @{
  fullName      = "Test Applicant"
  email         = $Email
  programId     = "cs101"
  schoolId      = "ict"
  deliveryMode  = "hybrid"
  learningStyle = "traditional"
  studyPace     = "standard"
  country       = "Zambia"
  subjectPoints = @{
    "english-language" = "6"
    "mathematics"      = "6"
    "biology"          = "5"
    "chemistry"        = "5"
    "physics"          = "5"
    "computer-studies" = "5"
  }
} -Session $studentSession | Out-Null

Write-Host "3) Pay admissions fee..."
Invoke-Api -Method "POST" -Path "/admissions/fee" -Body @{} -Session $studentSession | Out-Null

Write-Host "4) Admin login..."
Invoke-Api -Method "POST" -Path "/auth/login" -Body @{
  email    = "admin@univai.edu"
  password = "password123"
  role     = "admin"
} -Session $adminSession | Out-Null

Write-Host "5) Admin review and issue offer..."
$apps = Invoke-Api -Method "GET" -Path "/admin/admissions" -Body $null -Session $adminSession
$app = $apps | Where-Object { $_.email -eq $Email } | Select-Object -First 1
if (-not $app) {
  Write-Host "Application not found for $Email" -ForegroundColor Yellow
  exit 1
}

Invoke-Api -Method "PATCH" -Path "/admin/admissions/$($app.id)" -Body @{
  status      = "offer_sent"
  intakeId    = "cs101-2026-jan"
  notes       = "Approved for admission."
  offerMessage = "Your offer is ready. Please accept to continue enrollment."
} -Session $adminSession | Out-Null

Write-Host "6) Applicant accepts offer..."
Invoke-Api -Method "POST" -Path "/admissions/offer/accept" -Body @{} -Session $studentSession | Out-Null

Write-Host "7) Check admissions status..."
$status = Invoke-Api -Method "GET" -Path "/admissions/status" -Body $null -Session $studentSession
Write-Host "Status: $($status.status) | FeePaid: $($status.admissionFeePaid)"

Write-Host "Flow complete. Next: tuition invoice payment + enrollment confirmation in the student portal." -ForegroundColor Green
