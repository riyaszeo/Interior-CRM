<?php

namespace App\Repositories;

use App\Models\MaterialRequest;
use App\Models\MaterialRequestItem;
use App\Models\MaterialDispatch;
use App\Models\MaterialDispatchItem;
use App\Models\WarehouseStock;
use App\Models\StockLedger;
use App\Models\Material;
use App\Models\Project;
use App\Models\Warehouse;
use App\Models\MaterialBatch;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class DispatchRepository
{
    // ── MATERIAL REQUESTS ────────────────────────────────────────────────────

    public function paginateRequests(
        int $perPage = 15,
        ?int $projectId = null,
        ?int $warehouseId = null,
        ?string $status = null,
        ?string $search = null
    ): LengthAwarePaginator {
        $q = MaterialRequest::with(['project', 'warehouse', 'requester', 'approver', 'items.material']);

        if ($projectId)   $q->where('project_id', $projectId);
        if ($warehouseId) $q->where('warehouse_id', $warehouseId);
        if ($status)      $q->where('status', $status);

        if ($search) {
            $q->where('request_number', 'like', "%{$search}%")
              ->orWhereHas('project', function ($pq) use ($search) {
                  $pq->where('name', 'like', "%{$search}%");
              });
        }

        return $q->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function createRequest(array $data, array $items): MaterialRequest
    {
        return DB::transaction(function () use ($data, $items) {
            $mr = MaterialRequest::create($data);

            foreach ($items as $item) {
                $mr->items()->create([
                    'material_id'        => $item['material_id'],
                    'quantity_requested' => $item['quantity_requested'],
                    'notes'              => $item['notes'] ?? null,
                ]);
            }

            return $mr->load(['project', 'warehouse', 'requester', 'items.material']);
        });
    }

    public function updateRequestStatus(int $id, string $status, int $userId, ?array $itemsApproved = null): ?MaterialRequest
    {
        return DB::transaction(function () use ($id, $status, $userId, $itemsApproved) {
            $mr = MaterialRequest::find($id);
            if (!$mr) return null;

            if ($status === 'approved') {
                $mr->status = 'approved';
                $mr->approved_by = $userId;
                $mr->approved_at = now();

                // If approved quantities are specified, update items
                if ($itemsApproved) {
                    foreach ($itemsApproved as $appItem) {
                        $item = MaterialRequestItem::where('material_request_id', $mr->id)
                            ->where('material_id', $appItem['material_id'])
                            ->first();
                        if ($item) {
                            $item->quantity_approved = (float) $appItem['quantity_approved'];
                            $item->save();
                        }
                    }
                } else {
                    // Default approved qty to requested qty
                    foreach ($mr->items as $item) {
                        $item->quantity_approved = $item->quantity_requested;
                        $item->save();
                    }
                }
            } elseif ($status === 'rejected') {
                $mr->status = 'rejected';
                $mr->approved_by = $userId;
                $mr->approved_at = now();
            } else {
                $mr->status = $status;
            }

            $mr->save();
            return $mr->load(['project', 'warehouse', 'requester', 'approver', 'items.material']);
        });
    }

    // ── MATERIAL DISPATCHES ──────────────────────────────────────────────────

    public function paginateDispatches(
        int $perPage = 15,
        ?int $projectId = null,
        ?int $warehouseId = null,
        ?string $deliveryStatus = null,
        ?string $search = null
    ): LengthAwarePaginator {
        $q = MaterialDispatch::with(['request', 'project', 'warehouse', 'dispatcher', 'items.material', 'items.batch']);

        if ($projectId)        $q->where('project_id', $projectId);
        if ($warehouseId)      $q->where('warehouse_id', $warehouseId);
        if ($deliveryStatus)   $q->where('delivery_status', $deliveryStatus);

        if ($search) {
            $q->where('dispatch_number', 'like', "%{$search}%")
              ->orWhere('driver_name', 'like', "%{$search}%")
              ->orWhere('vehicle_number', 'like', "%{$search}%")
              ->orWhereHas('project', function ($pq) use ($search) {
                  $pq->where('name', 'like', "%{$search}%");
              });
        }

        return $q->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function createDispatch(array $data, array $items): MaterialDispatch
    {
        return DB::transaction(function () use ($data, $items) {
            $whId = $data['warehouse_id'];
            $projId = $data['project_id'];
            $reqId = $data['material_request_id'] ?? null;

            // 1. Calculate totals and verify stock levels first
            $totalCost = 0;
            $itemsToCreate = [];

            foreach ($items as $item) {
                $matId = $item['material_id'];
                $batchId = $item['batch_id'] ?? null;
                $qty = (float) $item['quantity_dispatched'];

                $material = Material::findOrFail($matId);
                $cost = (float) $material->purchase_price;

                // Query warehouse stock for this material/batch
                $stock = WarehouseStock::where('warehouse_id', $whId)
                    ->where('material_id', $matId)
                    ->where('batch_id', $batchId)
                    ->first();

                if (!$stock || (float) $stock->current_stock < $qty) {
                    $batchText = $batchId ? " (Batch ID: {$batchId})" : "";
                    throw new \Exception("Insufficient stock in selected warehouse for material '{$material->name}'{$batchText}. Requested: {$qty}, Available: " . ($stock ? $stock->current_stock : 0));
                }

                $totalCost += ($qty * $cost);
                $itemsToCreate[] = [
                    'material_id'         => $matId,
                    'batch_id'            => $batchId,
                    'quantity_dispatched' => $qty,
                    'cost_price'          => $cost,
                    'total_cost'          => $qty * $cost,
                    'stock_model'         => $stock,
                ];
            }

            // 2. Create the dispatch log
            $data['total_cost'] = $totalCost;
            $md = MaterialDispatch::create($data);

            // 3. Deduct inventory levels
            foreach ($itemsToCreate as $it) {
                $md->items()->create([
                    'material_id'         => $it['material_id'],
                    'batch_id'            => $it['batch_id'],
                    'quantity_dispatched' => $it['quantity_dispatched'],
                    'cost_price'          => $it['cost_price'],
                    'total_cost'          => $it['total_cost'],
                ]);

                // Deduct from current warehouse stock
                $stock = $it['stock_model'];
                $qty = $it['quantity_dispatched'];
                $stock->current_stock -= $qty;

                // If this project has reserved stock, reduce the reservation as well
                if ($stock->reserved_stock > 0) {
                    // Deduct up to the dispatched amount from the reserved stock pool
                    $toDeductRes = min((float) $stock->reserved_stock, $qty);
                    $stock->reserved_stock -= $toDeductRes;
                }

                $stock->save();

                // Append StockLedger audit trail record
                StockLedger::create([
                    'warehouse_id'     => $whId,
                    'material_id'      => $it['material_id'],
                    'batch_id'         => $it['batch_id'],
                    'transaction_type' => 'dispatch',
                    'quantity'         => -$qty, // negative as it leaves inventory
                    'reference_type'   => 'MaterialDispatch',
                    'reference_id'     => $md->id,
                    'notes'            => "Dispatched to Project: " . Project::find($projId)->name,
                    'transaction_date' => now()->toDateString(),
                ]);

                // Update catalog material quantity
                $material = Material::findOrFail($it['material_id']);
                $material->stock_quantity -= $qty;
                $material->save();
            }

            // 4. Update linked Material Request state
            if ($reqId) {
                $mr = MaterialRequest::find($reqId);
                if ($mr) {
                    $mr->status = 'dispatched';
                    $mr->save();
                }
            }

            return $md->load(['request', 'project', 'warehouse', 'dispatcher', 'items.material']);
        });
    }

    public function updateDeliveryStatus(int $id, string $status, ?string $notes = null): ?MaterialDispatch
    {
        $md = MaterialDispatch::find($id);
        if (!$md) return null;

        $md->delivery_status = $status;
        $md->delivery_notes = $notes;

        if ($status === 'delivered') {
            $md->delivery_date = now();
        }

        $md->save();
        return $md->load(['request', 'project', 'warehouse', 'dispatcher', 'items.material']);
    }

    // ── LOOKUPS ───────────────────────────────────────────────────────────────

    public function getFormOptions(): array
    {
        return [
            'projects'   => Project::whereNotIn('status', ['completed', 'on_hold'])->orderBy('name')->get(['id', 'name']),
            'warehouses' => Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'materials'  => Material::where('is_active', true)->orderBy('name')->get(['id', 'name', 'sku', 'purchase_price']),
            'batches'    => MaterialBatch::orderBy('batch_number')->get(['id', 'material_id', 'batch_number']),
            'approved_requests' => MaterialRequest::where('status', 'approved')->orderBy('request_number', 'desc')->get(['id', 'request_number', 'project_id', 'warehouse_id']),
        ];
    }
}
