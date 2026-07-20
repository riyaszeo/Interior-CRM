<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\PurchaseRepository;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class GoodsReceiptNoteController extends Controller
{
    use ApiResponse;

    public function __construct(protected PurchaseRepository $repo) {}

    public function index(Request $request): JsonResponse
    {
        $paginated = $this->repo->paginateGRNs((int) $request->input('per_page', 15));
        return $this->successResponse([
            'items'      => $paginated->items(),
            'pagination' => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
        ], 'Goods Receipt Notes retrieved.');
    }

    public function store(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'purchase_order_id' => 'required|integer|exists:purchase_orders,id',
            'received_date'     => 'required|date',
            'notes'             => 'nullable|string',
            'items'             => 'required|array|min:1',
            'items.*.purchase_order_item_id' => 'required|integer|exists:purchase_order_items,id',
            'items.*.quantity_received'      => 'required|numeric|min:0',
            'items.*.quantity_accepted'      => 'required|numeric|min:0|lte:items.*.quantity_received',
            'items.*.quantity_rejected'      => 'required|numeric|min:0',
            'items.*.rejection_reason'       => 'nullable|string|required_if:items.*.quantity_rejected,>,0',
        ]);

        if ($v->fails()) return $this->validationErrorResponse($v->errors());

        $userId = $request->user()?->id ?? 1;
        $grn = $this->repo->createGRN($v->validated(), $userId);
        return $this->successResponse($grn, 'Goods Receipt Note created as draft.', 201);
    }

    public function show(int $id): JsonResponse
    {
        $grn = $this->repo->findGRN($id);
        if (!$grn) return $this->errorResponse('GRN not found.', 404);
        return $this->successResponse($grn, 'GRN retrieved.');
    }

    public function complete(Request $request, int $id): JsonResponse
    {
        if (!$request->user()->hasPermissionTo('purchase_orders:receive')) {
            return $this->errorResponse('Unauthorized to receive store inventory.', 403);
        }

        try {
            $grn = $this->repo->completeGRN($id);
            return $this->successResponse($grn, 'GRN completed. Stock levels and PO updated successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }
}
