<?php

use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('univai:clear-test-payments {--force : Required to actually clear test payment records}', function () {
    if (!$this->option('force')) {
        $this->warn('Dry run only. Add --force to clear test payment records.');
    }

    $paymentCount = Payment::query()->where('is_test', true)->count();
    $invoiceCount = Invoice::query()->where('is_test', true)->count();

    $this->info("Test payments found: {$paymentCount}");
    $this->info("Test invoices found: {$invoiceCount}");

    if (!$this->option('force')) {
        return self::SUCCESS;
    }

    DB::transaction(function () {
        Payment::query()->where('is_test', true)->delete();
        Invoice::query()->where('is_test', true)->delete();
    });

    $this->info('Test payment records cleared. Live payment records were not touched.');

    return self::SUCCESS;
})->purpose('Clear only records marked as test payments/invoices');

Artisan::command('univai:clear-payments {--all : Clear all payment records, including old records created before test flags existed} {--reset-invoices : Reset invoice paid fields after deleting payments} {--force : Required to actually change records}', function () {
    if (!$this->option('all')) {
        $this->error('This command is intentionally locked. Add --all to confirm you want to target all payment records.');
        return self::FAILURE;
    }

    $paymentCount = Payment::query()->count();
    $paidInvoiceCount = Invoice::query()->where('status', 'paid')->count();
    $invoiceWithPaidAmountCount = Invoice::query()->where('paid_amount', '>', 0)->count();

    $this->warn('Payment cleanup preview');
    $this->info("Payments that will be deleted: {$paymentCount}");
    $this->info("Paid invoices found: {$paidInvoiceCount}");
    $this->info("Invoices with paid amounts: {$invoiceWithPaidAmountCount}");

    if ($this->option('reset-invoices')) {
        $this->warn('Invoice reset is enabled: paid_amount/status/paid_at/transaction_reference/checkout_url will be reset.');
    } else {
        $this->comment('Invoice reset is OFF: invoices and access remain as-is.');
    }

    if (!$this->option('force')) {
        $this->warn('Dry run only. Add --force to apply these changes.');
        return self::SUCCESS;
    }

    DB::transaction(function () {
        Payment::query()->delete();

        if ($this->option('reset-invoices')) {
            Invoice::query()->update([
                'paid_amount' => 0,
                'status' => 'unpaid',
                'paid_at' => null,
                'transaction_reference' => null,
                'checkout_url' => null,
            ]);
        }
    });

    $this->info('Payment cleanup complete. Users, courses, enrolments, and learning progress were not deleted.');

    return self::SUCCESS;
})->purpose('Clear old/all payment records with dry-run safety');
