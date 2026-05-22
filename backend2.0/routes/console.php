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
