<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\PurchaseRepository;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PurchaseReturnController extends Controller
{
    use ApiResponse;

    public function __construct(protected PurchaseRepository $repo) {}

    public function index(Request $request): JsonResponse
    {
        $paginated = $this->repo->paginateReturns((int) $request->input('per_page', 15));
        return $this->successResponse([
            'items'      => $paginated->items(),
            'pagination' => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
        ], 'Purchase Returns retrieved.');
    }

    public function store(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'purchase_order_id' => 'nullable|integer|exists:purchase_orders,id',
            'vendor_id'         => 'required|integer|exists:vendors,id',
            'return_date'       => 'required|date',
            'return_reason'     => 'nullable|string',
            'items'             => 'required|array|min:1',
            'items.*.material_id' => 'required|integer|exists:materials,id',
            'items.*.quantity'    => 'required|numeric|min:0.01',
            'items.*.unit_price'  => 'required|numeric|min:0',
        ]);

        if ($v->fails()) return $this->validationErrorResponse($v->errors());

        $ret = $this->repo->createReturn($v->validated());
        return $this->successResponse($ret, 'Purchase Return transaction created.', 201);
    }

    public function show(int $id): JsonResponse
    {
        $ret = $this->repo->findReturn($id);
        if (!$ret) return $this->errorResponse('Purchase Return not found.', 404);
        return $this->successResponse($ret, 'Purchase Return details retrieved.');
    }

    public function complete(Request $request, int $id): JsonResponse
    {
        try {
            $ret = $this->repo->completeReturn($id);
            return $this->successResponse($ret, 'Purchase Return completed. Material stock levels updated successfully.');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }
}
