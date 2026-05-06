<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AlumniDiscountApplication;
use App\Models\Invoice;
use App\Models\Payment;

class ReportsController extends Controller
{
    public function finance()
    {
        $totalInvoiced = (float) Invoice::query()->sum('original_amount');
        if ($totalInvoiced <= 0) {
            $totalInvoiced = (float) Invoice::query()->sum('amount');
        }
        $totalDiscounts = (float) Invoice::query()->sum('discount_amount');
        $totalPaid = (float) Payment::query()->sum('amount');
        $netTuition = max($totalInvoiced - $totalDiscounts, 0);
        $totalOutstanding = max($netTuition - $totalPaid, 0);
        $pendingApprovals = AlumniDiscountApplication::query()->where('status', 'pending')->count();

        return response()->json([
            [
                'label' => 'Gross Tuition Invoiced',
                'amount' => number_format($totalInvoiced, 2),
                'status' => 'Invoiced',
            ],
            [
                'label' => 'Alumni Discounts Applied',
                'amount' => number_format($totalDiscounts, 2),
                'status' => $pendingApprovals > 0 ? "{$pendingApprovals} approval pending" : 'Applied',
            ],
            [
                'label' => 'Total Paid',
                'amount' => number_format($totalPaid, 2),
                'status' => 'Collected',
            ],
            [
                'label' => 'Outstanding Balance',
                'amount' => number_format($totalOutstanding, 2),
                'status' => $totalOutstanding > 0 ? 'Pending' : 'Cleared',
            ],
        ]);
    }
}
