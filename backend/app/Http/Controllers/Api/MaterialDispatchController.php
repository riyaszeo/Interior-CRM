<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MaterialDispatch;
use App\Repositories\DispatchRepository;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MaterialDispatchController extends Controller
{
    use ApiResponse;

    public function __construct(protected DispatchRepository $repo) {}

    public function index(Request $request): JsonResponse
    {
        $paginated = $this->repo->paginateDispatches(
            (int) $request->input('per_page', 15),
            $request->input('project_id') ? (int) $request->input('project_id') : null,
            $request->input('warehouse_id') ? (int) $request->input('warehouse_id') : null,
            $request->input('delivery_status'),
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
        ], 'Material dispatches log retrieved.');
    }

    public function store(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'material_request_id' => 'nullable|integer|exists:material_requests,id',
            'project_id'          => 'required|integer|exists:projects,id',
            'warehouse_id'        => 'required|integer|exists:warehouses,id',
            'vehicle_number'      => 'nullable|string|max:50',
            'driver_name'         => 'nullable|string|max:100',
            'driver_phone'        => 'nullable|string|max:50',
            'receiver_name'       => 'nullable|string|max:100',
            'receiver_phone'      => 'nullable|string|max:50',
            'delivery_status'     => 'required|string|in:pending,in_transit,delivered',
            'delivery_notes'      => 'nullable|string|max:255',
            'items'               => 'required|array|min:1',
            'items.*.material_id'         => 'required|integer|exists:materials,id',
            'items.*.batch_id'            => 'nullable|integer|exists:material_batches,id',
            'items.*.quantity_dispatched' => 'required|numeric|min:0.01',
        ]);

        if ($v->fails()) return $this->validationErrorResponse($v->errors());

        $data = $v->validated();
        $data['dispatched_by'] = $request->user()->id;
        $data['dispatched_at'] = now();

        try {
            $md = $this->repo->createDispatch($data, $data['items']);
            return $this->successResponse($md, 'Materials dispatched and stock adjusted.', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function show(int $id): JsonResponse
    {
        $md = MaterialDispatch::with(['request', 'project', 'warehouse', 'dispatcher', 'items.material', 'items.batch'])->find($id);
        if (!$md) return $this->errorResponse('Material dispatch log not found.', 404);
        return $this->successResponse($md, 'Material dispatch details retrieved.');
    }

    public function updateDeliveryStatus(Request $request, int $id): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'delivery_status' => 'required|string|in:pending,in_transit,delivered,failed',
            'delivery_notes'  => 'nullable|string|max:255',
        ]);

        if ($v->fails()) return $this->validationErrorResponse($v->errors());

        try {
            $md = $this->repo->updateDeliveryStatus($id, $v->input('delivery_status'), $v->input('delivery_notes'));
            if (!$md) return $this->errorResponse('Material dispatch log not found.', 404);
            return $this->successResponse($md, "Delivery status updated to '{$v->input('delivery_status')}'.");
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }
}
