<?php

namespace App\Support\Affiliates;

use App\Models\Affiliate;
use App\Models\AffiliateEarning;
use App\Models\AffiliatePayout;
use App\Models\AffiliateReferral;
use App\Models\Application;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use App\Models\AdmissionsSetting;
use App\Services\LencoPaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AffiliateService
{
    public const SOURCE_FORMAL_PROGRAMME = 'formal_programme';
    public const SOURCE_SHORT_COURSE = 'short_course_first_purchase';

    public function captureReferralCode(?Request $request = null): ?string
    {
        if (!$request) {
            return null;
        }

        $code = $request->header('X-Univai-Referral-Code')
            ?: $request->header('X-Affiliate-Code')
            ?: $request->input('affiliateCode')
            ?: $request->input('referralCode')
            ?: $request->input('ref');

        if (!is_string($code)) {
            return null;
        }

        $clean = $this->cleanCode($code);
        return $clean !== '' ? $clean : null;
    }

    public function affiliateForCode(?string $code): ?Affiliate
    {
        $clean = $this->cleanCode((string) $code);
        if ($clean === '') {
            return null;
        }

        return Affiliate::query()
            ->where('code', $clean)
            ->where('status', 'active')
            ->first();
    }

    public function touchUserReferral(User $user, ?string $code, string $sourceType = 'registration'): void
    {
        $affiliate = $this->affiliateForCode($code);
        if (!$affiliate) {
            return;
        }

        if (empty($user->referred_by_affiliate_code)) {
            $user->forceFill(['referred_by_affiliate_code' => $affiliate->code])->saveQuietly();
        }

        AffiliateReferral::query()->updateOrCreate(
            [
                'affiliate_id' => $affiliate->id,
                'referred_user_id' => $user->id,
                'source_type' => $sourceType,
                'source_reference' => null,
            ],
            [
                'referral_code' => $affiliate->code,
                'metadata' => [
                    'source' => $sourceType,
                    'captured_at' => now()->toISOString(),
                ],
            ]
        );
    }

    public function recordForInvoice(Invoice $invoice, ?Payment $payment, array $context = []): ?AffiliateEarning
    {
        $invoice->loadMissing('student');
        $metadata = $invoice->metadata ?? [];
        $affiliate = $this->affiliateForCode($metadata['affiliate_code'] ?? $invoice->student?->referred_by_affiliate_code ?? null);
        if (!$affiliate || !$payment) {
            return null;
        }

        if ($invoice->type === 'application_fee') {
            if (!$this->affiliateCanEarn($affiliate, self::SOURCE_FORMAL_PROGRAMME)) {
                return null;
            }
            return $this->recordFormalProgrammeCommission($affiliate, $invoice, $payment, $context);
        }

        if (in_array($invoice->type, ['short_course_entry', 'short_course_access_plan', 'short_course_bundle'], true)) {
            if (!$this->affiliateCanEarn($affiliate, self::SOURCE_SHORT_COURSE)) {
                return null;
            }
            return $this->recordShortCourseCommission($affiliate, $invoice, $payment, $context);
        }

        return null;
    }

    public function recordFormalProgrammeCommission(Affiliate $affiliate, Invoice $invoice, Payment $payment, array $context = []): ?AffiliateEarning
    {
        $settings = AdmissionsSetting::query()->first();
        if ($settings && !$settings->is_open) {
            return null;
        }

        $applicationReference = (string) data_get($invoice->metadata, 'application_reference', '');
        if ($applicationReference === '') {
            return null;
        }

        $application = Application::query()->where('reference', $applicationReference)->first();
        if (!$application) {
            return null;
        }

        $gross = (float) $payment->amount;
        $rate = $this->rateForAffiliate($affiliate, self::SOURCE_FORMAL_PROGRAMME);
        $commission = round(($gross * $rate) / 100, 2);
        if ($commission <= 0) {
            return null;
        }

        $earning = AffiliateEarning::query()->updateOrCreate(
            [
                'affiliate_id' => $affiliate->id,
                'source_type' => self::SOURCE_FORMAL_PROGRAMME,
                'source_reference' => $application->reference,
                'payment_id' => $payment->id,
            ],
            [
                'referred_user_id' => $application->user_id,
                'invoice_id' => $invoice->id,
                'gross_amount' => $gross,
                'commission_rate' => $rate,
                'commission_amount' => $commission,
                'currency' => strtoupper($payment->currency ?? $invoice->currency ?? 'ZMW'),
                'status' => 'available',
                'metadata' => array_merge($context, [
                    'application_reference' => $application->reference,
                    'program_id' => $application->program_id,
                ]),
            ]
        );

        AffiliateReferral::query()->updateOrCreate(
            [
                'affiliate_id' => $affiliate->id,
                'referred_user_id' => $application->user_id,
                'source_type' => self::SOURCE_FORMAL_PROGRAMME,
                'source_reference' => $application->reference,
            ],
            [
                'referral_code' => $affiliate->code,
                'first_paid_at' => now(),
                'metadata' => ['application_reference' => $application->reference],
            ]
        );

        return $earning;
    }

    public function recordShortCourseCommission(Affiliate $affiliate, Invoice $invoice, Payment $payment, array $context = []): ?AffiliateEarning
    {
        $metadata = $invoice->metadata ?? [];
        $studentId = (int) $invoice->student_id;

        $alreadyEarned = AffiliateEarning::query()
            ->where('referred_user_id', $studentId)
            ->where('source_type', self::SOURCE_SHORT_COURSE)
            ->exists();
        if ($alreadyEarned) {
            return null;
        }

        $courseId = (string) ($metadata['short_course_id'] ?? '');
        if ($courseId === '' && isset($metadata['short_course_ids']) && is_array($metadata['short_course_ids']) && count($metadata['short_course_ids']) > 0) {
            $courseId = (string) $metadata['short_course_ids'][0];
        }
        $sourceReference = $courseId !== '' ? $courseId : ('bundle:' . (string) ($metadata['bundle_plan'] ?? 'short-course-bundle'));
        if ($sourceReference === 'bundle:') {
            return null;
        }

        $gross = (float) $payment->amount;
        $rate = $this->rateForAffiliate($affiliate, self::SOURCE_SHORT_COURSE);
        $commission = round(($gross * $rate) / 100, 2);
        if ($commission <= 0) {
            return null;
        }

        $earning = AffiliateEarning::query()->updateOrCreate(
            [
                'affiliate_id' => $affiliate->id,
                'source_type' => self::SOURCE_SHORT_COURSE,
                'source_reference' => $sourceReference,
                'payment_id' => $payment->id,
            ],
            [
                'referred_user_id' => $studentId,
                'invoice_id' => $invoice->id,
                'gross_amount' => $gross,
                'commission_rate' => $rate,
                'commission_amount' => $commission,
                'currency' => strtoupper($payment->currency ?? $invoice->currency ?? 'ZMW'),
                'status' => 'available',
                'metadata' => array_merge($context, [
                    'short_course_id' => $courseId ?: null,
                    'short_course_ids' => $metadata['short_course_ids'] ?? null,
                    'invoice_type' => $invoice->type,
                ]),
            ]
        );

        AffiliateReferral::query()->updateOrCreate(
            [
                'affiliate_id' => $affiliate->id,
                'referred_user_id' => $studentId,
                'source_type' => self::SOURCE_SHORT_COURSE,
                'source_reference' => $sourceReference,
            ],
            [
                'referral_code' => $affiliate->code,
                'first_paid_at' => now(),
                'metadata' => ['invoice_id' => $invoice->id],
            ]
        );

        return $earning;
    }

    public function summaryForAffiliate(Affiliate $affiliate): array
    {
        $available = AffiliateEarning::query()
            ->where('affiliate_id', $affiliate->id)
            ->where('status', 'available')
            ->sum('commission_amount');

        $reserved = AffiliatePayout::query()
            ->where('affiliate_id', $affiliate->id)
            ->whereIn('status', ['pending', 'processing', 'successful'])
            ->sum('amount');

        return [
            'grossEarned' => (string) AffiliateEarning::query()->where('affiliate_id', $affiliate->id)->sum('gross_amount'),
            'commissionEarned' => (string) AffiliateEarning::query()->where('affiliate_id', $affiliate->id)->sum('commission_amount'),
            'availableToWithdraw' => (string) max(0, $available - $reserved),
            'pendingPayouts' => (string) AffiliatePayout::query()->where('affiliate_id', $affiliate->id)->where('status', 'pending')->sum('amount'),
            'processingPayouts' => (string) AffiliatePayout::query()->where('affiliate_id', $affiliate->id)->where('status', 'processing')->sum('amount'),
            'successfulPayouts' => (string) AffiliatePayout::query()->where('affiliate_id', $affiliate->id)->where('status', 'successful')->sum('amount'),
        ];
    }

    public function createPayout(Affiliate $affiliate, array $payload, ?int $requestedBy = null): AffiliatePayout
    {
        $amount = (float) ($payload['amount'] ?? 0);
        $phone = $payload['phone'] ?? $affiliate->payout_phone;
        $operator = strtolower((string) ($payload['operator'] ?? $affiliate->payout_operator ?? ''));
        $country = strtolower((string) ($payload['country'] ?? $affiliate->payout_country ?? 'zm'));

        if (!is_string($phone) || trim($phone) === '') {
            throw new \RuntimeException('Affiliate payout phone is required.');
        }
        if ($country !== 'zm') {
            throw new \RuntimeException('Only Zambia mobile money payouts are supported for affiliates.');
        }
        if (!in_array($operator, ['airtel', 'mtn', 'zamtel'], true)) {
            throw new \RuntimeException('Affiliate payout operator must be airtel, mtn, or zamtel.');
        }

        $summary = $this->summaryForAffiliate($affiliate);
        if ($amount <= 0 || $amount > (float) $summary['availableToWithdraw']) {
            throw new \RuntimeException('Requested payout exceeds available affiliate balance.');
        }

        $payout = AffiliatePayout::query()->create([
            'affiliate_id' => $affiliate->id,
            'reference' => $payload['reference'] ?? ('AFF-' . strtoupper(Str::random(10))),
            'amount' => $amount,
            'fee' => (float) ($payload['fee'] ?? 0),
            'currency' => strtoupper((string) ($payload['currency'] ?? 'ZMW')),
            'method' => 'lenco_mobile_money',
            'phone' => trim($phone),
            'operator' => $operator,
            'country' => $country,
            'status' => 'pending',
            'requested_by' => $requestedBy,
            'requested_at' => now(),
            'lenco_payload' => null,
        ]);

        return $payout;
    }

    public function sendPayoutToLenco(AffiliatePayout $payout, LencoPaymentService $lenco, ?int $approvedBy = null): AffiliatePayout
    {
        $affiliate = $payout->affiliate;
        $accountId = $affiliate->lenco_account_id ?: config('services.lenco.account_id', env('LENCO_ACCOUNT_ID'));
        if (!$accountId) {
            $payout->update([
                'status' => 'failed',
                'failure_reason' => 'Lenco account id is missing.',
                'approved_by' => $approvedBy,
            ]);
            return $payout->fresh();
        }

        $transferPayload = [
            'accountId' => $accountId,
            'amount' => (float) $payout->amount,
            'narration' => 'UnivAI affiliate payout: ' . $affiliate->code,
            'reference' => $payout->reference,
            'phone' => $payout->phone ?: $affiliate->payout_phone,
            'operator' => $payout->operator ?: $affiliate->payout_operator,
            'country' => $payout->country ?: $affiliate->payout_country ?: 'zm',
        ];

        $response = $lenco->initiateMobileMoneyTransfer($transferPayload);

        $status = strtolower((string) ($response['status'] ?? 'unknown'));
        $successful = in_array($status, ['successful', 'success', 'paid', 'completed'], true);

        $payout->update([
            'status' => $successful ? 'successful' : ($status === 'pending' ? 'processing' : 'failed'),
            'approved_by' => $approvedBy,
            'lenco_reference' => (string) ($response['reference'] ?? data_get($response['payload'], 'data.reference') ?? $payout->reference),
            'lenco_payload' => $response['payload'] ?? null,
            'failure_reason' => $successful ? null : (string) ($response['message'] ?? 'Payout transfer failed.'),
            'completed_at' => $successful ? now() : $payout->completed_at,
        ]);

        return $payout->fresh();
    }

    public function verifyPayout(AffiliatePayout $payout, LencoPaymentService $lenco): AffiliatePayout
    {
        $reference = $payout->lenco_reference ?: $payout->reference;
        $verification = $lenco->verifyTransfer($reference);
        $payload = $verification['payload'] ?? [];
        $status = strtolower((string) (data_get($payload, 'data.status') ?? data_get($payload, 'status') ?? $verification['status'] ?? 'unknown'));

        if ($verification['verified'] || in_array($status, ['successful', 'success', 'paid', 'completed'], true)) {
            $payout->update([
                'status' => 'successful',
                'lenco_payload' => $payload ?: $payout->lenco_payload,
                'completed_at' => now(),
                'failure_reason' => null,
            ]);
        } elseif ($status === 'pending' || $status === 'processing') {
            $payout->update([
                'status' => 'processing',
                'lenco_payload' => $payload ?: $payout->lenco_payload,
                'failure_reason' => null,
            ]);
        } else {
            $payout->update([
                'status' => 'failed',
                'lenco_payload' => $payload ?: $payout->lenco_payload,
                'failure_reason' => $verification['message'] ?: 'Unable to verify payout.',
            ]);
        }

        return $payout->fresh();
    }

    private function rateForAffiliate(Affiliate $affiliate, string $sourceType): float
    {
        $rate = $sourceType === self::SOURCE_FORMAL_PROGRAMME
            ? (float) $affiliate->formal_programme_rate
            : (float) $affiliate->short_course_rate;

        return max(0, $rate);
    }

    private function affiliateCanEarn(Affiliate $affiliate, string $sourceType): bool
    {
        if ($affiliate->status !== 'active') {
            return false;
        }

        if ($affiliate->scope === 'all') {
            return true;
        }

        return $sourceType === self::SOURCE_FORMAL_PROGRAMME
            ? $affiliate->scope === 'formal_programmes'
            : $affiliate->scope === 'short_courses';
    }

    private function cleanCode(string $code): string
    {
        return strtoupper(trim(preg_replace('/[^A-Za-z0-9]+/', '', $code) ?? ''));
    }
}
