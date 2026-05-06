<?php

namespace App\Services;

use App\Models\AlumniDiscountApplication;
use App\Models\AlumniDiscountCampaign;
use App\Models\CompletedProgramme;
use App\Models\Intake;
use App\Models\Invoice;
use App\Models\Notification;
use App\Models\Program;
use App\Models\User;
use Illuminate\Support\Carbon;

class AlumniDiscountService
{
    public function evaluate(User $user, AlumniDiscountCampaign $campaign, ?Intake $intake, ?Invoice $invoice = null): array
    {
        $program = $intake?->program ?? ($intake?->program_id ? Program::find($intake->program_id) : null);
        $newLevel = $program?->level ?? 'certificate';
        $completed = CompletedProgramme::query()
            ->where('user_id', $user->id)
            ->where('status', 'completed')
            ->orderByDesc('completed_at')
            ->get()
            ->first(function (CompletedProgramme $history) use ($campaign) {
                $allowed = $campaign->previous_programme_levels;
                return empty($allowed) || in_array($history->program_level, $allowed, true);
            });

        $reasons = [];
        $now = Carbon::today();

        if (!$campaign->is_active) {
            $reasons[] = 'Campaign is inactive.';
        }
        if ($campaign->starts_at && $now->lt($campaign->starts_at)) {
            $reasons[] = 'Campaign has not started.';
        }
        if ($campaign->ends_at && $now->gt($campaign->ends_at)) {
            $reasons[] = 'Campaign has ended.';
        }
        if ($campaign->max_uses !== null && $campaign->uses_count >= $campaign->max_uses) {
            $reasons[] = 'Campaign usage limit has been reached.';
        }
        if (($user->alumni_state ?? 'none') !== 'alumni') {
            $reasons[] = 'Student is not marked as alumni.';
        }
        if (!$completed) {
            $reasons[] = 'No completed programme history matches the campaign.';
        }
        if ($campaign->requires_good_standing && ($user->account_standing ?? 'good') !== 'good') {
            $reasons[] = 'Account standing is not good.';
        }
        if ($campaign->requires_good_standing && $completed && $completed->final_standing !== 'good') {
            $reasons[] = 'Completed programme standing is not good.';
        }
        if ($campaign->requires_payment_clearance && (!$completed || !$completed->payment_cleared)) {
            $reasons[] = 'Previous programme payment clearance is missing.';
        }
        if ($campaign->blocks_suspended_alumni && ($user->suspended_at || ($user->alumni_state ?? '') === 'suspended')) {
            $reasons[] = 'Alumni discount privileges are suspended.';
        }
        if (!empty($campaign->new_programme_levels) && !in_array($newLevel, $campaign->new_programme_levels, true)) {
            $reasons[] = 'New programme level is not eligible for this campaign.';
        }

        $basisAmount = (float) ($invoice?->original_amount ?? $invoice?->amount ?? 0);
        $discountAmount = $this->calculateDiscount($campaign, $basisAmount);

        return [
            'eligible' => count($reasons) === 0,
            'reasons' => $reasons,
            'completedProgramme' => $completed,
            'newProgramme' => $program,
            'newProgrammeLevel' => $newLevel,
            'discountAmount' => $discountAmount,
            'requiresAdminApproval' => $campaign->requires_admin_approval,
            'checks' => [
                'completion' => (bool) $completed,
                'accountStanding' => $user->account_standing ?? 'good',
                'paymentClearance' => (bool) ($completed?->payment_cleared),
                'previousProgrammeLevel' => $completed?->program_level,
                'newProgrammeLevel' => $newLevel,
                'campaignWindow' => [$campaign->starts_at?->toDateString(), $campaign->ends_at?->toDateString()],
                'suspended' => (bool) ($user->suspended_at || ($user->alumni_state ?? '') === 'suspended'),
            ],
        ];
    }

    public function applyAutomaticDiscounts(User $user, Invoice $invoice): ?AlumniDiscountApplication
    {
        $intake = $invoice->intake_id ? Intake::with('program')->find($invoice->intake_id) : null;
        $campaigns = AlumniDiscountCampaign::query()
            ->where('automatic', true)
            ->where('is_active', true)
            ->orderByDesc('discount_value')
            ->get();

        foreach ($campaigns as $campaign) {
            $evaluation = $this->evaluate($user, $campaign, $intake, $invoice);
            if (!$evaluation['eligible']) {
                continue;
            }

            $application = AlumniDiscountApplication::query()->firstOrCreate(
                [
                    'campaign_id' => $campaign->id,
                    'user_id' => $user->id,
                    'invoice_id' => $invoice->id,
                ],
                $this->applicationPayload($campaign, $user, $invoice, $intake, $evaluation)
            );

            if ($campaign->requires_admin_approval) {
                $application->update(['status' => 'pending']);
                $this->notifyFinanceAdmins($application, 'Alumni discount approval required');
                return $application;
            }

            return $this->approve($application, null, 'Automatically approved by eligibility rules.');
        }

        return null;
    }

    public function approve(AlumniDiscountApplication $application, ?User $admin = null, ?string $notes = null): AlumniDiscountApplication
    {
        $invoice = $application->invoice;
        if ($invoice) {
            $original = (float) ($invoice->original_amount ?? $invoice->amount);
            $discount = min($original, (float) $application->requested_discount_amount);
            $invoice->update([
                'original_amount' => $original,
                'discount_amount' => $discount,
                'amount' => max($original - $discount, 0),
                'alumni_discount_application_id' => $application->id,
                'status' => $invoice->paid_amount >= max($original - $discount, 0) ? 'paid' : $invoice->status,
            ]);
        }

        $application->update([
            'status' => 'approved',
            'approved_discount_amount' => $application->requested_discount_amount,
            'decision_notes' => $notes,
            'reviewed_by' => $admin?->id,
            'reviewed_at' => now(),
        ]);
        $application->campaign()->increment('uses_count');

        Notification::create([
            'user_id' => $application->user_id,
            'audience' => 'student',
            'type' => 'discount-approved',
            'title' => 'Alumni discount approved',
            'message' => 'Your alumni discount has been applied to your tuition invoice.',
            'action_url' => '/student/payments/invoices',
        ]);

        return $application->refresh();
    }

    public function decline(AlumniDiscountApplication $application, ?User $admin = null, ?string $notes = null): AlumniDiscountApplication
    {
        $application->update([
            'status' => 'declined',
            'decision_notes' => $notes,
            'reviewed_by' => $admin?->id,
            'reviewed_at' => now(),
        ]);

        Notification::create([
            'user_id' => $application->user_id,
            'audience' => 'student',
            'type' => 'discount-declined',
            'title' => 'Alumni discount declined',
            'message' => $notes ?: 'Finance reviewed your alumni discount application and could not approve it.',
            'action_url' => '/student/payments/invoices',
        ]);

        return $application->refresh();
    }

    private function applicationPayload(AlumniDiscountCampaign $campaign, User $user, Invoice $invoice, ?Intake $intake, array $evaluation): array
    {
        $completed = $evaluation['completedProgramme'];
        $program = $evaluation['newProgramme'];

        return [
            'intake_id' => $intake?->id,
            'completed_programme_id' => $completed?->id,
            'previous_programme_level' => $completed?->program_level,
            'new_programme_id' => $program?->id,
            'new_programme_level' => $evaluation['newProgrammeLevel'],
            'requested_discount_amount' => $evaluation['discountAmount'],
            'approved_discount_amount' => 0,
            'status' => $campaign->requires_admin_approval ? 'pending' : 'approved',
            'eligibility_snapshot' => [
                'eligible' => $evaluation['eligible'],
                'reasons' => $evaluation['reasons'],
                'checks' => $evaluation['checks'],
            ],
        ];
    }

    private function calculateDiscount(AlumniDiscountCampaign $campaign, float $amount): float
    {
        if ($campaign->discount_type === 'fixed') {
            return round(min($amount, (float) $campaign->discount_value), 2);
        }

        return round($amount * ((float) $campaign->discount_value / 100), 2);
    }

    private function notifyFinanceAdmins(AlumniDiscountApplication $application, string $title): void
    {
        Notification::create([
            'audience' => 'finance-admin',
            'type' => 'discount-approval',
            'title' => $title,
            'message' => "{$application->user->name} qualifies for {$application->campaign->name}; approval is required before applying the invoice discount.",
            'action_url' => '/admin/reports/finance',
        ]);
    }
}
