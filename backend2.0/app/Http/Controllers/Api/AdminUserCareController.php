<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AdminUserNote;
use App\Models\AcademicEntitlement;
use App\Models\Enrollment;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use App\Models\UserStateTransition;
use App\Support\Notifications\InAppNotifier;
use App\Support\Payments\PaidInvoiceUnlocker;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AdminUserCareController extends Controller
{
    public function show(User $user)
    {
        return response()->json($this->profile($user));
    }

    public function resetPassword(Request $request, User $user, InAppNotifier $notifier)
    {
        $payload = $request->validate([
            'temporaryPassword' => ['nullable', 'string', 'min:6'],
            'forceChange' => ['nullable', 'boolean'],
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        $temporaryPassword = $payload['temporaryPassword'] ?? Str::password(10, true, true, false, false);
        $actor = $request->session()->get('user');

        $user->forceFill([
            'password' => Hash::make($temporaryPassword),
            'must_change_password' => $payload['forceChange'] ?? true,
            'password_reset_by_admin_at' => now(),
            'password_reset_by_admin_id' => is_numeric($actor['id'] ?? null) ? (int) $actor['id'] : null,
        ])->save();

        $this->recordTransition($user, $user->account_state, $user->account_state, $request, $payload['reason'] ?? 'Password reset by admin.', ['action' => 'password_reset']);
        $notifier->notify((string) $user->id, 'Password reset by support', 'Your password was reset by UnivAI support. Please sign in with the temporary password and change it.', '/login', 'system');

        return response()->json([
            'temporaryPassword' => $temporaryPassword,
            'mustChangePassword' => (bool) $user->must_change_password,
            'user' => $this->profile($user->fresh()),
        ]);
    }

    public function suspend(Request $request, User $user, InAppNotifier $notifier)
    {
        $reason = $request->validate(['reason' => ['nullable', 'string', 'max:1000']])['reason'] ?? 'Account suspended by admin.';
        $from = $user->account_state;
        $user->forceFill(['account_state' => 'suspended'])->save();
        $this->recordTransition($user, $from, 'suspended', $request, $reason, ['action' => 'suspend']);
        $notifier->notify((string) $user->id, 'Account suspended', 'Your UnivAI account has been suspended. Contact support for assistance.', '/support', 'system');

        return response()->json($this->profile($user->fresh()));
    }

    public function reactivate(Request $request, User $user, InAppNotifier $notifier)
    {
        $reason = $request->validate(['reason' => ['nullable', 'string', 'max:1000']])['reason'] ?? 'Account reactivated by admin.';
        $from = $user->account_state;
        $user->forceFill(['account_state' => 'active', 'profile_completed_at' => $user->profile_completed_at ?? now()])->save();
        $this->recordTransition($user, $from, 'active', $request, $reason, ['action' => 'reactivate']);
        $notifier->notify((string) $user->id, 'Account reactivated', 'Your UnivAI account is active again.', '/student/dashboard', 'system');

        return response()->json($this->profile($user->fresh()));
    }

    public function notes(User $user)
    {
        return response()->json([
            'items' => AdminUserNote::with('admin')
                ->where('user_id', $user->id)
                ->latest()
                ->limit(50)
                ->get()
                ->map(fn (AdminUserNote $note) => $this->mapNote($note)),
        ]);
    }

    public function addNote(Request $request, User $user)
    {
        $payload = $request->validate(['note' => ['required', 'string', 'min:2', 'max:5000']]);
        $actor = $request->session()->get('user');
        $note = AdminUserNote::create([
            'user_id' => $user->id,
            'admin_id' => is_numeric($actor['id'] ?? null) ? (int) $actor['id'] : null,
            'note' => trim($payload['note']),
        ]);

        return response()->json($this->mapNote($note->fresh('admin')), 201);
    }

    public function payments(User $user)
    {
        $invoices = Invoice::with('payments')
            ->where('student_id', $user->id)
            ->latest()
            ->get();

        return response()->json([
            'invoices' => $invoices->map(fn (Invoice $invoice) => $this->mapInvoice($invoice)),
            'payments' => Payment::with('invoice')
                ->whereHas('invoice', fn ($query) => $query->where('student_id', $user->id))
                ->latest('paid_at')
                ->get()
                ->map(fn (Payment $payment) => $this->mapPayment($payment)),
        ]);
    }

    public function createInvoice(Request $request, User $user, InAppNotifier $notifier)
    {
        $payload = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:3'],
            'type' => ['nullable', 'string', 'max:100'],
            'dueDate' => ['nullable', 'date'],
        ]);

        $invoice = Invoice::create([
            'uuid' => (string) Str::uuid(),
            'student_id' => $user->id,
            'title' => $payload['title'],
            'description' => $payload['description'] ?? null,
            'amount' => $payload['amount'],
            'currency' => strtoupper($payload['currency'] ?? 'ZMW'),
            'paid_amount' => 0,
            'status' => 'unpaid',
            'type' => $payload['type'] ?? 'manual',
            'due_date' => $payload['dueDate'] ?? null,
        ]);

        $notifier->notifyInvoiceCreated($invoice);

        return response()->json($this->mapInvoice($invoice), 201);
    }

    public function markInvoicePaid(Request $request, User $user, Invoice $invoice, PaidInvoiceUnlocker $unlocker, InAppNotifier $notifier)
    {
        if ((string) $invoice->student_id !== (string) $user->id) {
            return response()->json(['message' => 'Invoice does not belong to this user.'], 422);
        }

        $payload = $request->validate([
            'method' => ['nullable', 'string', 'max:100'],
            'reference' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        DB::transaction(function () use ($invoice, $payload, $unlocker) {
            $reference = $payload['reference'] ?? ('manual-' . Str::uuid());
            $invoice->forceFill([
                'paid_amount' => $invoice->amount,
                'status' => 'paid',
                'paid_at' => now(),
                'transaction_reference' => $reference,
                'metadata' => array_merge($invoice->metadata ?? [], ['manual_admin_note' => $payload['note'] ?? null]),
            ])->save();

            Payment::updateOrCreate(
                ['transaction_reference' => $reference],
                [
                    'invoice_id' => $invoice->id,
                    'amount' => $invoice->amount,
                    'currency' => $invoice->currency ?? 'ZMW',
                    'method' => $payload['method'] ?? 'manual',
                    'provider' => 'admin-manual',
                    'status' => 'completed',
                    'is_test' => false,
                    'payment_mode' => 'manual',
                    'payload' => ['note' => $payload['note'] ?? null],
                    'paid_at' => now(),
                ]
            );

            $unlocker->unlock($invoice->fresh());
        });

        $notifier->notifyPaymentSuccessful($invoice->fresh());

        return response()->json($this->mapInvoice($invoice->fresh('payments')));
    }

    public function markInvoiceUnpaid(Request $request, User $user, Invoice $invoice)
    {
        if ((string) $invoice->student_id !== (string) $user->id) {
            return response()->json(['message' => 'Invoice does not belong to this user.'], 422);
        }

        $payload = $request->validate(['note' => ['nullable', 'string', 'max:1000']]);
        Payment::where('invoice_id', $invoice->id)->delete();
        $invoice->forceFill([
            'paid_amount' => 0,
            'status' => 'unpaid',
            'paid_at' => null,
            'transaction_reference' => null,
            'checkout_url' => null,
            'metadata' => array_merge($invoice->metadata ?? [], ['manual_unpaid_note' => $payload['note'] ?? null]),
        ])->save();

        return response()->json($this->mapInvoice($invoice->fresh('payments')));
    }

    public function entitlements(Request $request, User $user)
    {
        $payload = $request->validate([
            'entitlements' => ['required', 'array'],
            'entitlements.*' => ['string'],
        ]);

        $codes = array_values(array_unique($payload['entitlements']));
        foreach ($codes as $code) {
            AcademicEntitlement::updateOrCreate(
                ['user_id' => $user->id, 'code' => $code, 'scope_type' => null, 'scope_id' => null],
                ['status' => 'active', 'starts_at' => now(), 'ends_at' => null, 'metadata' => ['source' => 'admin-care']]
            );
        }

        AcademicEntitlement::where('user_id', $user->id)
            ->whereNull('scope_type')
            ->whereNull('scope_id')
            ->whereNotIn('code', $codes)
            ->update(['status' => 'revoked']);

        return response()->json($this->profile($user->fresh(['activeEntitlements'])));
    }

    private function profile(User $user): array
    {
        $user->loadMissing(['profile', 'activeSubscription', 'activeEntitlements']);
        return [
            'id' => (string) $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->account_state,
            'accountState' => $user->account_state,
            'verificationStatus' => $user->verification_status,
            'schoolId' => $user->school_id,
            'programId' => $user->program_id,
            'intakeId' => $user->intake_id,
            'unit' => collect([$user->school_id, $user->program_id, $user->intake_id])->filter()->join(' · ') ?: 'Unassigned',
            'notes' => $user->profile?->bio,
            'mustChangePassword' => (bool) $user->must_change_password,
            'passwordResetByAdminAt' => $user->password_reset_by_admin_at?->toISOString(),
            'entitlements' => $user->activeEntitlements->pluck('code')->values(),
        ];
    }

    private function mapNote(AdminUserNote $note): array
    {
        return [
            'id' => $note->id,
            'note' => $note->note,
            'adminName' => $note->admin?->name ?? 'Admin',
            'createdAt' => $note->created_at?->toISOString(),
        ];
    }

    private function mapInvoice(Invoice $invoice): array
    {
        return [
            'id' => $invoice->id,
            'title' => $invoice->title,
            'description' => $invoice->description,
            'amount' => (string) $invoice->amount,
            'currency' => $invoice->currency ?? 'ZMW',
            'paidAmount' => (string) $invoice->paid_amount,
            'status' => $invoice->status,
            'type' => $invoice->type,
            'dueDate' => $invoice->due_date?->toDateString(),
            'paidAt' => $invoice->paid_at?->toISOString(),
            'payments' => $invoice->relationLoaded('payments') ? $invoice->payments->map(fn (Payment $payment) => $this->mapPayment($payment))->values() : [],
        ];
    }

    private function mapPayment(Payment $payment): array
    {
        return [
            'id' => $payment->id,
            'invoiceId' => $payment->invoice_id,
            'amount' => (string) $payment->amount,
            'currency' => $payment->currency ?? 'ZMW',
            'method' => $payment->method,
            'provider' => $payment->provider,
            'reference' => $payment->transaction_reference,
            'status' => $payment->status,
            'isTest' => (bool) $payment->is_test,
            'paymentMode' => $payment->payment_mode,
            'paidAt' => $payment->paid_at?->toISOString(),
        ];
    }

    private function recordTransition(User $user, ?string $fromState, ?string $toState, Request $request, ?string $reason = null, array $metadata = []): void
    {
        $actor = $request->session()->get('user');
        UserStateTransition::create([
            'user_id' => $user->id,
            'from_state' => $fromState,
            'to_state' => $toState ?? $fromState ?? 'active',
            'reason' => $reason,
            'changed_by' => is_numeric($actor['id'] ?? null) ? (int) $actor['id'] : null,
            'metadata' => $metadata + ['actor_role' => $actor['role'] ?? null],
        ]);
    }
}
