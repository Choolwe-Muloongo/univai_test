<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Payment;

class ReportsController extends Controller
{
    public function finance()
    {
        $totalInvoiced = (float) Invoice::query()->sum('amount');
        $totalPaid = (float) Payment::query()->sum('amount');
        $totalOutstanding = max($totalInvoiced - $totalPaid, 0);

        return response()->json([
            [
                'label' => 'Total Invoiced',
                'amount' => number_format($totalInvoiced, 2),
                'status' => 'Invoiced',
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
