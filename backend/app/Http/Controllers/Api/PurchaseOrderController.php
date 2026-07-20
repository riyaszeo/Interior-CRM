<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\PurchaseRepository;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PurchaseOrderController extends Controller
{
    use ApiResponse;

    public function __construct(protected PurchaseRepository $repo) {}

    public function index(Request $request): JsonResponse
    {
        $paginated = $this->repo->paginatePOs(
            (int) $request->input('per_page', 15),
            $request->input('search'),
            $request->input('status'),
            $request->input('vendor_id') ? (int) $request->input('vendor_id') : null
        );

        return $this->successResponse([
            'items'      => $paginated->items(),
            'pagination' => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
        ], 'Purchase Orders retrieved.');
    }

    public function formOptions(): JsonResponse
    {
        return $this->successResponse($this->repo->getFormOptions(), 'Form options retrieved.');
    }

    public function store(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'vendor_id'        => 'required|integer|exists:vendors,id',
            'project_id'       => 'nullable|integer|exists:projects,id',
            'order_date'       => 'required|date',
            'delivery_date'    => 'nullable|date|after_or_equal:order_date',
            'discount'         => 'nullable|numeric|min:0',
            'notes'            => 'nullable|string',
            'terms_conditions' => 'nullable|string',
            'items'            => 'required|array|min:1',
            'items.*.material_id' => 'required|integer|exists:materials,id',
            'items.*.quantity'    => 'required|numeric|min:0.01',
            'items.*.unit_price'  => 'required|numeric|min:0',
            'items.*.tax_rate'    => 'nullable|numeric|in:0,5,12,18,28',
        ]);

        if ($v->fails()) return $this->validationErrorResponse($v->errors());

        $po = $this->repo->createPO($v->validated());
        return $this->successResponse($po, 'Purchase Order created.', 201);
    }

    public function show(int $id): JsonResponse
    {
        $po = $this->repo->findPO($id);
        if (!$po) return $this->errorResponse('Purchase Order not found.', 404);
        return $this->successResponse($po, 'Purchase Order details retrieved.');
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'vendor_id'        => 'sometimes|required|integer|exists:vendors,id',
            'project_id'       => 'nullable|integer|exists:projects,id',
            'order_date'       => 'sometimes|required|date',
            'delivery_date'    => 'nullable|date|after_or_equal:order_date',
            'discount'         => 'nullable|numeric|min:0',
            'notes'            => 'nullable|string',
            'terms_conditions' => 'nullable|string',
            'items'            => 'nullable|array|min:1',
            'items.*.material_id' => 'required|integer|exists:materials,id',
            'items.*.quantity'    => 'required|numeric|min:0.01',
            'items.*.unit_price'  => 'required|numeric|min:0',
            'items.*.tax_rate'    => 'nullable|numeric|in:0,5,12,18,28',
        ]);

        if ($v->fails()) return $this->validationErrorResponse($v->errors());

        try {
            $po = $this->repo->updatePO($id, $v->validated());
            if (!$po) return $this->errorResponse('Purchase Order not found.', 404);
            return $this->successResponse($po, 'Purchase Order updated.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'status' => 'required|string|in:draft,pending_approval,approved,rejected,ordered,received,cancelled',
        ]);
        if ($v->fails()) return $this->validationErrorResponse($v->errors());

        $status = $request->input('status');
        $userId = $request->user()?->id;

        // Perform Spatie checks if approving/rejecting
        if (in_array($status, ['approved', 'rejected'])) {
            if (!$request->user()->hasPermissionTo('purchase_orders:approve')) {
                return $this->errorResponse('Unauthorized to approve or reject Purchase Orders.', 403);
            }
        }

        $po = $this->repo->updatePOStatus($id, $status, $userId);
        return $this->successResponse($po, "Status changed to {$status}.");
    }

    public function destroy(int $id): JsonResponse
    {
        $po = PurchaseOrder::find($id);
        if (!$po) return $this->errorResponse('Purchase Order not found.', 404);
        
        if (in_array($po->status, ['approved', 'received', 'ordered'])) {
            return $this->errorResponse('Cannot delete approved or processed Purchase Orders.', 422);
        }

        $po->delete();
        return $this->successResponse(null, 'Purchase Order deleted.');
    }
}
