<?php

namespace App\Repositories;

use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\GoodsReceiptNote;
use App\Models\GoodsReceiptNoteItem;
use App\Models\PurchaseInvoice;
use App\Models\PurchaseReturn;
use App\Models\PurchaseReturnItem;
use App\Models\Vendor;
use App\Models\Material;
use App\Models\Project;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class PurchaseRepository
{
    // ── VENDORS CRUD ─────────────────────────────────────────────────────────

    public function paginateVendors(int $perPage = 15, ?string $search = null): LengthAwarePaginator
    {
        $q = Vendor::query();
        if ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('company_name', 'like', "%{$search}%")
              ->orWhere('email', 'like', "%{$search}%");
        }
        return $q->orderBy('name')->paginate($perPage);
    }

    public function createVendor(array $data): Vendor
    {
        return Vendor::create($data);
    }

    public function updateVendor(int $id, array $data): ?Vendor
    {
        $v = Vendor::find($id);
        if ($v) { $v->update($data); return $v; }
        return null;
    }

    public function deleteVendor(int $id): bool
    {
        $v = Vendor::find($id);
        return $v ? (bool) $v->delete() : false;
    }

    // ── PURCHASE ORDERS CRUD ──────────────────────────────────────────────────

    public function paginatePOs(
        int $perPage = 15,
        ?string $search = null,
        ?string $status = null,
        ?int $vendorId = null
    ): LengthAwarePaginator {
        $q = PurchaseOrder::with(['vendor:id,name,company_name', 'project:id,name']);

        if ($search) {
            $q->where(function ($query) use ($search) {
                $query->where('po_number', 'like', "%{$search}%")
                      ->orWhereHas('vendor', function ($vq) use ($search) {
                          $vq->where('name', 'like', "%{$search}%")
                             ->orWhere('company_name', 'like', "%{$search}%");
                      });
            });
        }

        if ($status) {
            $q->where('status', $status);
        }

        if ($vendorId) {
            $q->where('vendor_id', $vendorId);
        }

        return $q->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function findPO(int $id): ?PurchaseOrder
    {
        return PurchaseOrder::with(['vendor', 'project', 'items.material', 'goodsReceiptNotes', 'purchaseInvoices'])->find($id);
    }

    public function createPO(array $data): PurchaseOrder
    {
        return DB::transaction(function () use ($data) {
            $items = $data['items'] ?? [];
            unset($data['items']);

            // Compile totals
            $subtotal = 0;
            $taxAmount = 0;
            foreach ($items as $item) {
                $subtotal += $item['quantity'] * $item['unit_price'];
                $taxRate = $item['tax_rate'] ?? 18.00;
                $taxAmount += ($item['quantity'] * $item['unit_price']) * ($taxRate / 100);
            }
            $discount = $data['discount'] ?? 0;

            $data['subtotal'] = $subtotal;
            $data['tax_amount'] = $taxAmount;
            $data['total_amount'] = $subtotal + $taxAmount - $discount;

            $po = PurchaseOrder::create($data);

            foreach ($items as $item) {
                $itemTotal = ($item['quantity'] * $item['unit_price']) * (1 + ($item['tax_rate'] ?? 18.00) / 100);
                $po->items()->create([
                    'material_id' => $item['material_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_rate' => $item['tax_rate'] ?? 18.00,
                    'tax_amount' => ($item['quantity'] * $item['unit_price']) * (($item['tax_rate'] ?? 18.00) / 100),
                    'total_amount' => $itemTotal,
                ]);
            }

            $po->refresh();
            return $po->load(['vendor', 'items.material']);
        });
    }

    public function updatePO(int $id, array $data): ?PurchaseOrder
    {
        return DB::transaction(function () use ($id, $data) {
            $po = PurchaseOrder::find($id);
            if (!$po) return null;

            if (in_array($po->status, ['approved', 'received', 'ordered'])) {
                throw new \Exception('Approved or processed Purchase Orders cannot be modified.');
            }

            $items = $data['items'] ?? [];
            unset($data['items']);

            if (isset($data['items'])) {
                $po->items()->delete();
                $subtotal = 0;
                $taxAmount = 0;
                foreach ($items as $item) {
                    $subtotal += $item['quantity'] * $item['unit_price'];
                    $taxRate = $item['tax_rate'] ?? 18.00;
                    $taxAmount += ($item['quantity'] * $item['unit_price']) * ($taxRate / 100);
                }
                $discount = $data['discount'] ?? $po->discount;

                $data['subtotal'] = $subtotal;
                $data['tax_amount'] = $taxAmount;
                $data['total_amount'] = $subtotal + $taxAmount - $discount;
            }

            $po->update($data);

            if (!empty($items)) {
                $po->items()->delete();
                foreach ($items as $item) {
                    $itemTotal = ($item['quantity'] * $item['unit_price']) * (1 + ($item['tax_rate'] ?? 18.00) / 100);
                    $po->items()->create([
                        'material_id' => $item['material_id'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'tax_rate' => $item['tax_rate'] ?? 18.00,
                        'tax_amount' => ($item['quantity'] * $item['unit_price']) * (($item['tax_rate'] ?? 18.00) / 100),
                        'total_amount' => $itemTotal,
                    ]);
                }
            }

            return $po->load(['vendor', 'items.material']);
        });
    }

    public function updatePOStatus(int $id, string $status, ?int $userId = null): PurchaseOrder
    {
        $po = PurchaseOrder::findOrFail($id);
        $po->status = $status;

        if (in_array($status, ['approved', 'rejected'])) {
            $po->approved_by = $userId;
            $po->approved_at = now();
        }

        $po->save();
        return $po->load(['vendor', 'items.material']);
    }

    // ── GOODS RECEIPT NOTES (GRN) ─────────────────────────────────────────────

    public function paginateGRNs(int $perPage = 15): LengthAwarePaginator
    {
        return GoodsReceiptNote::with(['purchaseOrder.vendor', 'receiver:id,name'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    public function findGRN(int $id): ?GoodsReceiptNote
    {
        return GoodsReceiptNote::with(['purchaseOrder.vendor', 'items.material', 'receiver:id,name'])->find($id);
    }

    public function createGRN(array $data, int $userId): GoodsReceiptNote
    {
        return DB::transaction(function () use ($data, $userId) {
            $po = PurchaseOrder::findOrFail($data['purchase_order_id']);

            $latest = GoodsReceiptNote::whereDate('created_at', now()->toDateString())->latest('id')->first();
            $seq = $latest ? ((int) substr($latest->grn_number, -4)) + 1 : 1;
            $grnNumber = 'GRN-' . now()->format('Ymd') . '-' . str_pad((string)$seq, 4, '0', STR_PAD_LEFT);

            $grn = GoodsReceiptNote::create([
                'grn_number'        => $grnNumber,
                'purchase_order_id' => $po->id,
                'received_date'     => $data['received_date'] ?? now()->toDateString(),
                'received_by'       => $userId,
                'status'            => 'draft',
                'notes'             => $data['notes'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                $poItem = PurchaseOrderItem::findOrFail($item['purchase_order_item_id']);
                $grn->items()->create([
                    'purchase_order_item_id' => $poItem->id,
                    'material_id'            => $poItem->material_id,
                    'quantity_ordered'       => $poItem->quantity,
                    'quantity_received'      => $item['quantity_received'],
                    'quantity_accepted'      => $item['quantity_accepted'],
                    'quantity_rejected'      => $item['quantity_rejected'] ?? 0,
                    'rejection_reason'       => $item['rejection_reason'] ?? null,
                ]);
            }

            return $grn->load(['purchaseOrder.vendor', 'items.material']);
        });
    }

    public function completeGRN(int $id): GoodsReceiptNote
    {
        return DB::transaction(function () use ($id) {
            $grn = GoodsReceiptNote::with('items')->findOrFail($id);
            if ($grn->status === 'completed') {
                throw new \Exception('GRN is already completed.');
            }

            $grn->status = 'completed';
            $grn->save();

            // 1. Update PO status & received counts
            $po = $grn->purchaseOrder;
            $allFullyReceived = true;

            foreach ($grn->items as $grnItem) {
                $poItem = $grnItem->purchaseOrderItem;
                $poItem->received_quantity += $grnItem->quantity_accepted;
                $poItem->save();

                if ($poItem->received_quantity < $poItem->quantity) {
                    $allFullyReceived = false;
                }

                // 2. Adjust material stock levels
                $material = $grnItem->material;
                $material->stock_quantity += $grnItem->quantity_accepted;
                $material->save();
            }

            $po->status = $allFullyReceived ? 'received' : 'ordered';
            $po->save();

            return $grn->load(['purchaseOrder.vendor', 'items.material']);
        });
    }

    // ── PURCHASE INVOICES ─────────────────────────────────────────────────────

    public function paginateInvoices(int $perPage = 15): LengthAwarePaginator
    {
        return PurchaseInvoice::with(['vendor', 'purchaseOrder'])->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function createInvoice(array $data): PurchaseInvoice
    {
        return PurchaseInvoice::create($data);
    }

    public function updateInvoice(int $id, array $data): ?PurchaseInvoice
    {
        $inv = PurchaseInvoice::find($id);
        if ($inv) { $inv->update($data); return $inv; }
        return null;
    }

    public function payInvoice(int $id, array $paymentData): PurchaseInvoice
    {
        $inv = PurchaseInvoice::findOrFail($id);
        $inv->status = 'paid';
        $inv->payment_date = $paymentData['payment_date'] ?? now()->toDateString();
        $inv->payment_method = $paymentData['payment_method'] ?? 'Bank Transfer';
        $inv->save();
        return $inv;
    }

    // ── PURCHASE RETURNS ──────────────────────────────────────────────────────

    public function paginateReturns(int $perPage = 15): LengthAwarePaginator
    {
        return PurchaseReturn::with(['vendor', 'purchaseOrder'])->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function findReturn(int $id): ?PurchaseReturn
    {
        return PurchaseReturn::with(['vendor', 'purchaseOrder', 'items.material'])->find($id);
    }

    public function createReturn(array $data): PurchaseReturn
    {
        return DB::transaction(function () use ($data) {
            $latest = PurchaseReturn::whereDate('created_at', now()->toDateString())->latest('id')->first();
            $seq = $latest ? ((int) substr($latest->return_number, -4)) + 1 : 1;
            $returnNumber = 'PR-' . now()->format('Ymd') . '-' . str_pad((string)$seq, 4, '0', STR_PAD_LEFT);

            $items = $data['items'] ?? [];
            unset($data['items']);

            $totalRefund = 0;
            foreach ($items as $item) {
                $totalRefund += $item['quantity'] * $item['unit_price'];
            }
            $data['return_number'] = $returnNumber;
            $data['total_refund_amount'] = $totalRefund;
            $data['status'] = 'pending';

            $ret = PurchaseReturn::create($data);

            foreach ($items as $item) {
                $ret->items()->create([
                    'material_id'   => $item['material_id'],
                    'quantity'      => $item['quantity'],
                    'unit_price'    => $item['unit_price'],
                    'refund_amount' => $item['quantity'] * $item['unit_price'],
                ]);
            }

            return $ret->load(['vendor', 'items.material']);
        });
    }

    public function completeReturn(int $id): PurchaseReturn
    {
        return DB::transaction(function () use ($id) {
            $ret = PurchaseReturn::with('items')->findOrFail($id);
            if ($ret->status === 'completed') {
                throw new \Exception('Return is already completed.');
            }

            $ret->status = 'completed';
            $ret->save();

            // Deduct stock quantities from inventory
            foreach ($ret->items as $item) {
                $material = $item->material;
                $material->stock_quantity -= $item->quantity;
                $material->save();
            }

            return $ret->load(['vendor', 'items.material']);
        });
    }

    // ── GENERAL DROPDOWN OPTIONS ──────────────────────────────────────────────

    public function getFormOptions(): array
    {
        return [
            'vendors'    => Vendor::orderBy('name')->get(['id', 'name', 'company_name']),
            'projects'   => Project::whereNotIn('status', ['completed', 'on_hold'])->orderBy('name')->get(['id', 'name']),
            'materials'  => Material::where('is_active', true)->orderBy('name')->get(['id', 'name', 'sku', 'purchase_price', 'gst_rate']),
        ];
    }
}
