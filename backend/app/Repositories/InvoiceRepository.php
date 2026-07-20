<?php

namespace App\Repositories;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Project;
use App\Models\Quotation;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class InvoiceRepository
{
    public function paginate(
        int $perPage = 10,
        ?string $search = null,
        ?string $status = null,
        ?string $type = null,
        string $sortBy = 'created_at',
        string $sortOrder = 'desc'
    ): LengthAwarePaginator {
        $query = Invoice::with(['project.customer', 'quotation:id,qtn_number']);

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($type && $type !== 'all') {
            $query->where('invoice_type', $type);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('project', function ($pq) use ($search) {
                      $pq->where('name', 'like', "%{$search}%")
                        ->orWhereHas('customer', fn($cq) => $cq->where('name', 'like', "%{$search}%"));
                  });
            });
        }

        $allowedSortColumns = ['id', 'invoice_number', 'invoice_type', 'invoice_date', 'due_date', 'total_amount', 'status', 'created_at'];
        $sortBy = in_array($sortBy, $allowedSortColumns) ? $sortBy : 'created_at';
        $sortOrder = strtolower($sortOrder) === 'asc' ? 'asc' : 'desc';

        return $query->orderBy($sortBy, $sortOrder)->paginate($perPage);
    }

    public function find(int $id): ?Invoice
    {
        return Invoice::with(['project.customer', 'quotation', 'items'])->find($id);
    }

    public function create(array $data): Invoice
    {
        return DB::transaction(function () use ($data) {
            // Compute financials
            $subtotal = 0;
            $totalGst = 0;
            $itemsData = $data['items'] ?? [];

            foreach ($itemsData as $key => $item) {
                $qty = (float) ($item['quantity'] ?? 1);
                $price = (float) ($item['unit_price'] ?? 0);
                $lineTotal = $qty * $price;
                $itemsData[$key]['total_price'] = $lineTotal;

                $gstRate = (float) ($item['gst_rate'] ?? 18.00);
                $gstAmount = ($lineTotal * $gstRate) / 100;
                $itemsData[$key]['gst_amount'] = $gstAmount;

                $subtotal += $lineTotal;
                $totalGst += $gstAmount;
            }

            $discount = (float) ($data['discount_amount'] ?? 0);
            $totalAmount = ($subtotal - $discount) + $totalGst;

            // Split CGST/SGST/IGST
            // If tax_type is IGST, put it in igst, else split into cgst/sgst
            $taxType = $data['tax_type'] ?? 'local';
            $cgst = 0;
            $sgst = 0;
            $igst = 0;

            if ($taxType === 'igst') {
                $igst = $totalGst;
            } else {
                $cgst = $totalGst / 2;
                $sgst = $totalGst / 2;
            }

            $invoice = Invoice::create([
                'project_id'      => $data['project_id'],
                'quotation_id'    => $data['quotation_id'] ?? null,
                'invoice_type'    => $data['invoice_type'], // advance, running, final
                'invoice_date'    => $data['invoice_date'],
                'due_date'        => $data['due_date'],
                'payment_terms'   => $data['payment_terms'] ?? null,
                'subtotal'        => $subtotal,
                'discount_amount' => $discount,
                'tax_rate'        => $data['tax_rate'] ?? 18.00,
                'cgst'            => $cgst,
                'sgst'            => $sgst,
                'igst'            => $igst,
                'total_gst'       => $totalGst,
                'total_amount'    => $totalAmount,
                'status'          => $data['status'] ?? 'unpaid',
                'notes'           => $data['notes'] ?? null,
            ]);

            foreach ($itemsData as $item) {
                $invoice->items()->create([
                    'description' => $item['description'],
                    'hsn_code'    => $item['hsn_code'] ?? null,
                    'quantity'    => $item['quantity'],
                    'unit_price'  => $item['unit_price'],
                    'total_price' => $item['total_price'],
                    'gst_rate'    => $item['gst_rate'] ?? 18.00,
                    'gst_amount'  => $item['gst_amount'],
                ]);
            }

            return $invoice->load(['project.customer', 'items']);
        });
    }

    public function recordPayment(int $id, float $amount, string $paidAt): ?Invoice
    {
        return DB::transaction(function () use ($id, $amount, $paidAt) {
            $invoice = Invoice::find($id);
            if (!$invoice) return null;

            $newPaid = $invoice->paid_amount + $amount;
            $invoice->paid_amount = $newPaid;
            $invoice->paid_at = $paidAt;

            if ($newPaid >= $invoice->total_amount) {
                $invoice->status = 'paid';
            } else {
                $invoice->status = 'partially_paid';
            }

            $invoice->save();
            return $invoice->load(['project.customer', 'items']);
        });
    }

    public function cancel(int $id): ?Invoice
    {
        $invoice = Invoice::find($id);
        if ($invoice) {
            $invoice->status = 'cancelled';
            $invoice->save();
            return $invoice;
        }
        return null;
    }
}
