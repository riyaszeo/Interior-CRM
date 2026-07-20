<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use App\Repositories\InventoryRepository;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class WarehouseController extends Controller
{
    use ApiResponse;

    public function __construct(protected InventoryRepository $repo) {}

    public function index(Request $request): JsonResponse
    {
        $paginated = $this->repo->paginateWarehouses(
            (int) $request->input('per_page', 15),
            $request->input('search')
        );

        return $this->successResponse([
            'items'      => $paginated->items(),
            'pagination' => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
        ], 'Warehouses retrieved.');
    }

    public function store(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'name'           => 'required|string|max:100|unique:warehouses,name',
            'location'       => 'required|string|max:255',
            'contact_number' => 'nullable|string|max:50',
            'is_active'      => 'nullable|boolean',
        ]);

        if ($v->fails()) return $this->validationErrorResponse($v->errors());

        $wh = $this->repo->createWarehouse($v->validated());
        return $this->successResponse($wh, 'Warehouse registered.', 201);
    }

    public function show(int $id): JsonResponse
    {
        $wh = Warehouse::find($id);
        if (!$wh) return $this->errorResponse('Warehouse not found.', 404);
        return $this->successResponse($wh, 'Warehouse details retrieved.');
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'name'           => "sometimes|required|string|max:100|unique:warehouses,name,{$id}",
            'location'       => 'sometimes|required|string|max:255',
            'contact_number' => 'nullable|string|max:50',
            'is_active'      => 'nullable|boolean',
        ]);

        if ($v->fails()) return $this->validationErrorResponse($v->errors());

        $wh = $this->repo->updateWarehouse($id, $v->validated());
        if (!$wh) return $this->errorResponse('Warehouse not found.', 404);
        return $this->successResponse($wh, 'Warehouse updated.');
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->repo->deleteWarehouse($id);
        if (!$deleted) return $this->errorResponse('Warehouse not found.', 404);
        return $this->successResponse(null, 'Warehouse deleted.');
    }
}
