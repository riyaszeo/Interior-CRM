<?php

namespace App\Repositories;

use App\Models\Warehouse;
use App\Models\WarehouseStock;
use App\Models\StockLedger;
use App\Models\MaterialBatch;
use App\Models\Material;
use App\Models\Project;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class InventoryRepository
{
    // ── WAREHOUSE CRUD ────────────────────────────────────────────────────────

    public function paginateWarehouses(int $perPage = 15, ?string $search = null): LengthAwarePaginator
    {
        $q = Warehouse::query();
        if ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('location', 'like', "%{$search}%");
        }
        return $q->orderBy('name')->paginate($perPage);
    }

    public function createWarehouse(array $data): Warehouse
    {
        return Warehouse::create($data);
    }

    public function updateWarehouse(int $id, array $data): ?Warehouse
    {
        $wh = Warehouse::find($id);
        if ($wh) { $wh->update($data); return $wh; }
        return null;
    }

    public function deleteWarehouse(int $id): bool
    {
        $wh = Warehouse::find($id);
        return $wh ? (bool) $wh->delete() : false;
    }

    // ── WAREHOUSE STOCKS ──────────────────────────────────────────────────────

    public function paginateStocks(
        int $perPage = 15,
        ?int $warehouseId = null,
        ?int $materialId = null,
        ?string $search = null,
        bool $lowStockOnly = false
    ): LengthAwarePaginator {
        $q = WarehouseStock::with(['warehouse', 'material.category', 'batch']);

        if ($warehouseId) {
            $q->where('warehouse_id', $warehouseId);
        }

        if ($materialId) {
            $q->where('material_id', $materialId);
        }

        if ($search) {
            $q->whereHas('material', function ($mq) use ($search) {
                $mq->where('name', 'like', "%{$search}%")
                   ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        if ($lowStockOnly) {
            $q->whereHas('material', function ($mq) {
                $mq->whereColumn('warehouse_stocks.current_stock', '<=', 'materials.reorder_level');
            });
        }

        return $q->orderBy('warehouse_id')->orderBy('material_id')->paginate($perPage);
    }

    // ── STOCK LEDGER TRANSACTIONS ─────────────────────────────────────────────

    public function paginateLedger(
        int $perPage = 15,
        ?int $warehouseId = null,
        ?int $materialId = null,
        ?string $type = null
    ): LengthAwarePaginator {
        $q = StockLedger::with(['warehouse', 'material', 'batch']);

        if ($warehouseId) {
            $q->where('warehouse_id', $warehouseId);
        }

        if ($materialId) {
            $q->where('material_id', $materialId);
        }

        if ($type) {
            $q->where('transaction_type', $type);
        }

        return $q->orderBy('created_at', 'desc')->paginate($perPage);
    }

    // ── ADJUST STOCK TRANSACTION ──────────────────────────────────────────────

    public function adjustStock(array $data): WarehouseStock
    {
        return DB::transaction(function () use ($data) {
            $whId   = $data['warehouse_id'];
            $matId  = $data['material_id'];
            $batchId = $data['batch_id'] ?? null;
            $qty     = (float) $data['quantity']; // positive for adding, negative for deducting
            $notes   = $data['notes'] ?? 'Manual Stock Adjustment';
            $type    = $data['transaction_type'] ?? 'adjustment'; // opening, receipt, dispatch, adjustment

            // 1. Find or create the stock record
            $stock = WarehouseStock::firstOrNew([
                'warehouse_id' => $whId,
                'material_id'  => $matId,
                'batch_id'     => $batchId,
            ]);

            if (!$stock->exists) {
                $stock->opening_stock = $type === 'opening' ? $qty : 0;
                $stock->current_stock = $qty;
            } else {
                if ($type === 'opening') {
                    $stock->opening_stock += $qty;
                }
                $stock->current_stock += $qty;
            }

            if ($stock->current_stock < 0) {
                throw new \Exception("Insufficient stock in warehouse to deduct {$qty} units.");
            }

            $stock->save();

            // 2. Log transaction in StockLedger
            StockLedger::create([
                'warehouse_id'     => $whId,
                'material_id'      => $matId,
                'batch_id'         => $batchId,
                'transaction_type' => $type,
                'quantity'         => $qty,
                'notes'            => $notes,
                'transaction_date' => now()->toDateString(),
            ]);

            // 3. Keep total material catalog stock quantity in sync
            $material = Material::findOrFail($matId);
            $material->stock_quantity += $qty;
            $material->save();

            return $stock->load(['warehouse', 'material', 'batch']);
        });
    }

    // ── RESERVE STOCK TRANSACTION ─────────────────────────────────────────────

    public function reserveStock(array $data): WarehouseStock
    {
        return DB::transaction(function () use ($data) {
            $whId   = $data['warehouse_id'];
            $matId  = $data['material_id'];
            $batchId = $data['batch_id'] ?? null;
            $qty     = (float) $data['quantity']; // positive to reserve, negative to release
            $projId  = $data['project_id'];
            $action  = $data['action'] ?? 'reserve'; // reserve | release

            $stock = WarehouseStock::where([
                'warehouse_id' => $whId,
                'material_id'  => $matId,
                'batch_id'     => $batchId,
            ])->firstOrFail();

            $project = Project::findOrFail($projId);

            if ($action === 'reserve') {
                $available = (float) $stock->current_stock - (float) $stock->reserved_stock;
                if ($available < $qty) {
                    throw new \Exception("Cannot reserve {$qty} units. Only {$available} available in stock.");
                }
                $stock->reserved_stock += $qty;

                // Log ledger
                StockLedger::create([
                    'warehouse_id'     => $whId,
                    'material_id'      => $matId,
                    'batch_id'         => $batchId,
                    'transaction_type' => 'reserve',
                    'quantity'         => -$qty, // negative as it's locked/taken from active available pool
                    'reference_type'   => 'Project',
                    'reference_id'     => $project->id,
                    'notes'            => "Reserved for Project: {$project->name}",
                    'transaction_date' => now()->toDateString(),
                ]);
            } else {
                if ($stock->reserved_stock < $qty) {
                    throw new \Exception("Cannot release {$qty} reserved units. Only {$stock->reserved_stock} reserved.");
                }
                $stock->reserved_stock -= $qty;

                // Log ledger
                StockLedger::create([
                    'warehouse_id'     => $whId,
                    'material_id'      => $matId,
                    'batch_id'         => $batchId,
                    'transaction_type' => 'release',
                    'quantity'         => $qty, // back to active pool
                    'reference_type'   => 'Project',
                    'reference_id'     => $project->id,
                    'notes'            => "Released from Project reservation: {$project->name}",
                    'transaction_date' => now()->toDateString(),
                ]);
            }

            $stock->save();
            return $stock->load(['warehouse', 'material', 'batch']);
        });
    }

    // ── TRANSFER STOCK TRANSACTION ────────────────────────────────────────────

    public function transferStock(array $data, ?string $sourceBranchId): void
    {
        $whId = $data['source_warehouse_id'];
        $matId = $data['material_id'];
        $batchId = $data['batch_id'] ?? null;
        $qty = (float) $data['quantity'];
        $destBranchId = (int) $data['destination_branch_id'];
        $destWhId = $data['destination_warehouse_id'];
        $notes = $data['notes'] ?? 'Stock Transfer';

        // Check if destination branch matches the source branch
        $isLocalTransfer = false;
        if ($sourceBranchId && (int)$sourceBranchId === $destBranchId) {
            $isLocalTransfer = true;
        }

        DB::transaction(function () use ($whId, $matId, $batchId, $qty, $destBranchId, $destWhId, $notes, $isLocalTransfer, $sourceBranchId) {
            // 1. Deduct stock from the source warehouse/material in current DB
            $sourceStock = WarehouseStock::where([
                'warehouse_id' => $whId,
                'material_id'  => $matId,
                'batch_id'     => $batchId,
            ])->first();

            if (!$sourceStock || (float)$sourceStock->current_stock < $qty) {
                $avail = $sourceStock ? (float)$sourceStock->current_stock : 0;
                throw new \Exception("Insufficient stock in source warehouse. Available: {$avail} units.");
            }

            // Deduct from stock levels
            $sourceStock->current_stock -= $qty;
            $sourceStock->save();

            $sourceMaterial = Material::findOrFail($matId);
            $sourceMaterial->stock_quantity -= $qty;
            $sourceMaterial->save();

            // Log ledger entry for outward transfer
            $destBranchName = DB::connection('central')->table('branches')->where('id', $destBranchId)->value('name') ?: 'Other Branch';
            $destWhName = $isLocalTransfer 
                ? Warehouse::where('id', $destWhId)->value('name') 
                : 'Warehouse #' . $destWhId;

            StockLedger::create([
                'warehouse_id'     => $whId,
                'material_id'      => $matId,
                'batch_id'         => $batchId,
                'transaction_type' => 'transfer_out',
                'quantity'         => -$qty,
                'reference_type'   => 'Branch',
                'reference_id'     => $destBranchId,
                'notes'            => "Transfer OUT to: {$destBranchName} ({$destWhName}). Notes: {$notes}",
                'transaction_date' => now()->toDateString(),
            ]);

            // Retrieve batch properties if present
            $sourceBatch = $batchId ? MaterialBatch::find($batchId) : null;

            // 2. Perform the inward transaction
            if ($isLocalTransfer) {
                // Local Warehouse Transfer
                $destStock = WarehouseStock::firstOrNew([
                    'warehouse_id' => $destWhId,
                    'material_id'  => $matId,
                    'batch_id'     => $batchId,
                ]);

                if (!$destStock->exists) {
                    $destStock->opening_stock = 0;
                    $destStock->current_stock = $qty;
                } else {
                    $destStock->current_stock += $qty;
                }
                $destStock->save();

                // Increment catalog stock back (since they are in the same branch DB)
                $sourceMaterial->stock_quantity += $qty;
                $sourceMaterial->save();

                // Log ledger entry for local inward transfer
                StockLedger::create([
                    'warehouse_id'     => $destWhId,
                    'material_id'      => $matId,
                    'batch_id'         => $batchId,
                    'transaction_type' => 'transfer_in',
                    'quantity'         => $qty,
                    'reference_type'   => 'Branch',
                    'reference_id'     => $destBranchId,
                    'notes'            => "Transfer IN from: {$sourceMaterial->name} ({$sourceStock->warehouse->name}). Notes: {$notes}",
                    'transaction_date' => now()->toDateString(),
                ]);
            } else {
                // Cross-Branch Transfer (requires temporary dynamic DB switching)
                $destBranch = DB::connection('central')->table('branches')->where('id', $destBranchId)->first();
                if (!$destBranch) {
                    throw new \Exception("Destination branch not found.");
                }

                $driver = env('DB_CONNECTION', 'sqlite');
                if ($driver === 'sqlite') {
                    $dbPath = database_path('database_branch_' . $destBranch->id . '.sqlite');
                    if (!file_exists($dbPath)) {
                        touch($dbPath);
                    }
                    Config::set('database.connections.temp_dest.driver', 'sqlite');
                    Config::set('database.connections.temp_dest.database', $dbPath);
                } else {
                    Config::set('database.connections.temp_dest.driver', $driver);
                    Config::set('database.connections.temp_dest.host', env('DB_HOST', '127.0.0.1'));
                    Config::set('database.connections.temp_dest.port', env('DB_PORT', '3306'));
                    Config::set('database.connections.temp_dest.database', env('DB_DATABASE', 'laravel') . '_branch_' . $destBranch->id);
                    Config::set('database.connections.temp_dest.username', env('DB_USERNAME', 'root'));
                    Config::set('database.connections.temp_dest.password', env('DB_PASSWORD', ''));
                }

                DB::purge('temp_dest');
                DB::reconnect('temp_dest');

                // Bootstrapping: Auto-migrate temp_dest if it is empty
                if (!Schema::connection('temp_dest')->hasTable('materials')) {
                    Artisan::call('migrate', [
                        '--database' => 'temp_dest',
                        '--path' => 'database/migrations',
                        '--force' => true,
                    ]);
                }

                // Verify destination warehouse exists
                $destWhExists = DB::connection('temp_dest')->table('warehouses')->where('id', $destWhId)->whereNull('deleted_at')->exists();
                if (!$destWhExists) {
                    throw new \Exception("Destination warehouse not found in destination branch.");
                }

                // Sync Category
                $srcCat = $sourceMaterial->category;
                $destCatId = null;
                if ($srcCat) {
                    $destCat = DB::connection('temp_dest')->table('material_categories')->where('name', $srcCat->name)->first();
                    if (!$destCat) {
                        $destCatId = DB::connection('temp_dest')->table('material_categories')->insertGetId([
                            'name' => $srcCat->name,
                            'description' => $srcCat->description,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } else {
                        $destCatId = $destCat->id;
                    }
                }

                // Sync Brand
                $srcBrand = $sourceMaterial->brand;
                $destBrandId = null;
                if ($srcBrand) {
                    $destBrand = DB::connection('temp_dest')->table('material_brands')->where('name', $srcBrand->name)->first();
                    if (!$destBrand) {
                        $destBrandId = DB::connection('temp_dest')->table('material_brands')->insertGetId([
                            'name' => $srcBrand->name,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } else {
                        $destBrandId = $destBrand->id;
                    }
                }

                // Sync Unit
                $srcUnit = $sourceMaterial->unitModel;
                $destUnitId = null;
                if ($srcUnit) {
                    $destUnit = DB::connection('temp_dest')->table('material_units')->where('name', $srcUnit->name)->first();
                    if (!$destUnit) {
                        $destUnitId = DB::connection('temp_dest')->table('material_units')->insertGetId([
                            'name' => $srcUnit->name,
                            'abbreviation' => $srcUnit->abbreviation,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } else {
                        $destUnitId = $destUnit->id;
                    }
                }

                // Match or Create Material in destination
                $destMaterial = DB::connection('temp_dest')->table('materials')->where('sku', $sourceMaterial->sku)->first();
                if (!$destMaterial) {
                    $destMatId = DB::connection('temp_dest')->table('materials')->insertGetId([
                        'category_id' => $destCatId,
                        'brand_id' => $destBrandId,
                        'unit_id' => $destUnitId,
                        'name' => $sourceMaterial->name,
                        'description' => $sourceMaterial->description,
                        'sku' => $sourceMaterial->sku,
                        'hsn_code' => $sourceMaterial->hsn_code,
                        'gst_rate' => $sourceMaterial->gst_rate,
                        'cost_price' => $sourceMaterial->cost_price,
                        'purchase_price' => $sourceMaterial->purchase_price,
                        'selling_price' => $sourceMaterial->selling_price,
                        'stock_quantity' => 0.00,
                        'reorder_level' => $sourceMaterial->reorder_level,
                        'unit' => $sourceMaterial->unit,
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    $destMatId = $destMaterial->id;
                }

                // Sync Batch if transferred
                $destBatchId = null;
                if ($sourceBatch) {
                    $destBatch = DB::connection('temp_dest')->table('material_batches')
                        ->where('material_id', $destMatId)
                        ->where('batch_number', $sourceBatch->batch_number)
                        ->first();
                    if (!$destBatch) {
                        $destBatchId = DB::connection('temp_dest')->table('material_batches')->insertGetId([
                            'material_id' => $destMatId,
                            'batch_number' => $sourceBatch->batch_number,
                            'expiry_date' => $sourceBatch->expiry_date,
                            'manufacturing_date' => $sourceBatch->manufacturing_date,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    } else {
                        $destBatchId = $destBatch->id;
                    }
                }

                // Find or create WarehouseStock in destination
                $destStock = DB::connection('temp_dest')->table('warehouse_stocks')
                    ->where([
                        'warehouse_id' => $destWhId,
                        'material_id'  => $destMatId,
                        'batch_id'     => $destBatchId,
                    ])->first();

                if (!$destStock) {
                    DB::connection('temp_dest')->table('warehouse_stocks')->insert([
                        'warehouse_id' => $destWhId,
                        'material_id'  => $destMatId,
                        'batch_id'     => $destBatchId,
                        'opening_stock' => 0.00,
                        'current_stock' => $qty,
                        'reserved_stock' => 0.00,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                } else {
                    DB::connection('temp_dest')->table('warehouse_stocks')
                        ->where('id', $destStock->id)
                        ->increment('current_stock', $qty);
                }

                // Increment catalog stock quantity in target DB
                DB::connection('temp_dest')->table('materials')
                    ->where('id', $destMatId)
                    ->increment('stock_quantity', $qty);

                // Log ledger entry for dynamic inward transfer
                $sourceBranchName = DB::connection('central')->table('branches')->where('id', $sourceBranchId)->value('name') ?: 'Main Branch';
                $sourceWhName = Warehouse::where('id', $whId)->value('name') ?: 'Warehouse #' . $whId;

                DB::connection('temp_dest')->table('stock_ledgers')->insert([
                    'warehouse_id'     => $destWhId,
                    'material_id'      => $destMatId,
                    'batch_id'         => $destBatchId,
                    'transaction_type' => 'transfer_in',
                    'quantity'         => $qty,
                    'reference_type'   => 'Branch',
                    'reference_id'     => (int)$sourceBranchId,
                    'notes'            => "Transfer IN from: {$sourceBranchName} ({$sourceWhName}). Notes: {$notes}",
                    'transaction_date' => now()->toDateString(),
                    'created_at'       => now(),
                    'updated_at'       => now(),
                ]);

                // Cleanup/purge connection
                DB::disconnect('temp_dest');
            }
        });
    }

    // ── LOOKUPS ───────────────────────────────────────────────────────────────

    public function getFormOptions(): array
    {
        return [
            'warehouses' => Warehouse::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'materials'  => Material::where('is_active', true)->orderBy('name')->get(['id', 'name', 'sku', 'reorder_level']),
            'projects'   => Project::whereNotIn('status', ['completed', 'on_hold'])->orderBy('name')->get(['id', 'name']),
            'batches'    => MaterialBatch::orderBy('batch_number')->get(['id', 'material_id', 'batch_number']),
        ];
    }
}
