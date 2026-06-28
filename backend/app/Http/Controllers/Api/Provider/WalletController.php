<?php

namespace App\Http\Controllers\Api\Provider;

use App\Http\Controllers\Controller;
use App\Models\WalletTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/** Provider wallet: balance, statement, and Pix withdrawals. */
class WalletController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $providerId = $request->user()->id;
        $balance = WalletTransaction::balanceFor($providerId);

        $monthStart = now()->startOfMonth();
        $monthCredit = (float) WalletTransaction::where('provider_id', $providerId)
            ->where('type', WalletTransaction::TYPE_CREDIT)
            ->where('created_at', '>=', $monthStart)
            ->sum('amount');
        $monthJobs = WalletTransaction::where('provider_id', $providerId)
            ->where('type', WalletTransaction::TYPE_CREDIT)
            ->where('created_at', '>=', $monthStart)
            ->count();
        // Credits are net of the provider's plan commission, so derive the fee
        // back out using that same rate (Free 5% · Pro 2.5% · Enterprise 1%).
        $rate = $request->user()->providerProfile?->commissionRate()
            ?? \App\Enums\ProviderPlan::Free->commissionRate();
        $monthFee = $rate < 1 ? round($monthCredit / (1 - $rate) * $rate, 2) : 0.0;

        // Transactions are served separately (paginated) by transactions().
        return response()->json([
            'balance' => $balance,
            'month_earnings' => round($monthCredit, 2),
            'month_jobs' => $monthJobs,
            'month_fee' => $monthFee,
        ]);
    }

    /** Paginated wallet statement (credits + payouts), newest first. */
    public function transactions(Request $request): JsonResponse
    {
        $page = WalletTransaction::where('provider_id', $request->user()->id)
            ->latest()
            ->orderByDesc('id')
            ->paginate($this->perPage($request));

        $data = $page->getCollection()->map(fn (WalletTransaction $t) => [
            'id' => $t->id,
            'type' => $t->type,
            'amount' => (float) $t->amount,
            'description' => $t->description,
            'created_at' => $t->created_at,
        ]);

        // Match the `{ data, meta }` envelope the resource collections emit, so
        // the client's Paginated<T> handling is uniform across every list.
        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $page->currentPage(),
                'last_page' => $page->lastPage(),
                'per_page' => $page->perPage(),
                'total' => $page->total(),
            ],
        ]);
    }

    /** Withdraw via Pix. Records a payout transaction against the balance. */
    public function payout(Request $request): JsonResponse
    {
        $data = $request->validate([
            'amount' => ['nullable', 'numeric', 'min:1'],
            'pix_key' => ['nullable', 'string', 'max:140'],
        ]);

        $providerId = $request->user()->id;
        $balance = WalletTransaction::balanceFor($providerId);
        $amount = isset($data['amount']) ? round((float) $data['amount'], 2) : $balance;

        if ($balance <= 0 || $amount > $balance) {
            throw ValidationException::withMessages(['amount' => [__('messages.insufficient_balance')]]);
        }

        WalletTransaction::create([
            'provider_id' => $providerId,
            'type' => WalletTransaction::TYPE_PAYOUT,
            'amount' => $amount,
            'description' => __('messages.payout_pix'),
        ]);

        return response()->json([
            'message' => __('messages.payout_done'),
            'balance' => WalletTransaction::balanceFor($providerId),
        ]);
    }
}
