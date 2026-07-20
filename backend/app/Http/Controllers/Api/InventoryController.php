<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\InventoryRepository;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class InventoryController extends Controller
{
    use ApiResponse;

    public function __construct(protected InventoryRepository $repo) {}

    public function stocksList(Request $request): JsonResponse
    {
        $paginated = $this->repo->paginateStocks(
            (int) $request->input('per_page', 15),
            $request->input('warehouse_id') ? (int) $request->input('warehouse_id') : null,
            $request->input('material_id')  ? (int) $request->input('material_id')  : null,
            $request->input('search'),
            $request->boolean('low_stock')
        );

        return $this->successResponse([
            'items'      => $paginated->items(),
            'pagination' => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
        ], 'Warehouse stock levels retrieved.');
    }

    public function ledgerList(Request $request): JsonResponse
    {
        $paginated = $this->repo->paginateLedger(
            (int) $request->input('per_page', 15),
            $request->input('warehouse_id') ? (int) $request->input('warehouse_id') : null,
            $request->input('material_id')  ? (int) $request->input('material_id')  : null,
            $request->input('transaction_type')
        );

        return $this->successResponse([
            'items'      => $paginated->items(),
            'pagination' => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
        ], 'Stock ledger transactions retrieved.');
    }

    public function adjustStock(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'warehouse_id'     => 'required|integer|exists:warehouses,id',
            'material_id'      => 'required|integer|exists:materials,id',
            'batch_id'         => 'nullable|integer|exists:material_batches,id',
            'transaction_type' => 'required|string|in:opening,receipt,dispatch,return,adjustment',
            'quantity'         => 'required|numeric',
            'notes'            => 'nullable|string|max:255',
        ]);

        if ($v->fails()) return $this->validationErrorResponse($v->errors());

        try {
            $stock = $this->repo->adjustStock($v->validated());
            return $this->successResponse($stock, 'Stock level adjusted successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function reserveStock(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'warehouse_id' => 'required|integer|exists:warehouses,id',
            'material_id'  => 'required|integer|exists:materials,id',
            'batch_id'     => 'nullable|integer|exists:material_batches,id',
            'project_id'   => 'required|integer|exists:projects,id',
            'quantity'     => 'required|numeric|min:0.01',
            'action'       => 'required|string|in:reserve,release',
        ]);

        if ($v->fails()) return $this->validationErrorResponse($v->errors());

        try {
            $stock = $this->repo->reserveStock($v->validated());
            return $this->successResponse($stock, 'Stock reservation updated successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function transferStock(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'source_warehouse_id'      => 'required|integer|exists:warehouses,id',
            'material_id'              => 'required|integer|exists:materials,id',
            'quantity'                 => 'required|numeric|min:0.01',
            'destination_branch_id'    => 'required|integer|exists:branches,id',
            'destination_warehouse_id' => 'required|integer',
            'batch_id'                 => 'nullable|integer|exists:material_batches,id',
            'notes'                    => 'nullable|string|max:255',
        ]);

        if ($v->fails()) return $this->validationErrorResponse($v->errors());

        try {
            $this->repo->transferStock($v->validated(), $request->header('X-Branch-ID'));
            return $this->successResponse(null, 'Stock transferred successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function formOptions(): JsonResponse
    {
        return $this->successResponse($this->repo->getFormOptions(), 'Inventory form options retrieved.');
    }
}
