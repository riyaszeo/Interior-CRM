<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\PurchaseRepository;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PurchaseInvoiceController extends Controller
{
    use ApiResponse;

    public function __construct(protected PurchaseRepository $repo) {}

    public function index(Request $request): JsonResponse
    {
        $paginated = $this->repo->paginateInvoices((int) $request->input('per_page', 15));
        return $this->successResponse([
            'items'      => $paginated->items(),
            'pagination' => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
        ], 'Purchase Invoices retrieved.');
    }

    public function store(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'invoice_number'    => 'required|string|max:100',
            'invoice_date'      => 'required|date',
            'due_date'          => 'required|date|after_or_equal:invoice_date',
            'purchase_order_id' => 'nullable|integer|exists:purchase_orders,id',
            'vendor_id'         => 'required|integer|exists:vendors,id',
            'subtotal'          => 'required|numeric|min:0',
            'tax_amount'        => 'required|numeric|min:0',
            'total_amount'      => 'required|numeric|min:0',
            'status'            => 'nullable|string|in:unpaid,paid,partially_paid,cancelled',
        ]);

        if ($v->fails()) return $this->validationErrorResponse($v->errors());

        $inv = $this->repo->createInvoice($v->validated());
        return $this->successResponse($inv, 'Purchase Invoice recorded.', 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'invoice_number'    => 'sometimes|required|string|max:100',
            'invoice_date'      => 'sometimes|required|date',
            'due_date'          => 'sometimes|required|date',
            'purchase_order_id' => 'nullable|integer|exists:purchase_orders,id',
            'vendor_id'         => 'sometimes|required|integer|exists:vendors,id',
            'subtotal'          => 'sometimes|required|numeric|min:0',
            'tax_amount'        => 'sometimes|required|numeric|min:0',
            'total_amount'      => 'sometimes|required|numeric|min:0',
            'status'            => 'sometimes|required|string|in:unpaid,paid,partially_paid,cancelled',
            'payment_date'      => 'nullable|date',
            'payment_method'    => 'nullable|string|max:100',
        ]);

        if ($v->fails()) return $this->validationErrorResponse($v->errors());

        $inv = $this->repo->updateInvoice($id, $v->validated());
        if (!$inv) return $this->errorResponse('Invoice not found.', 404);
        return $this->successResponse($inv, 'Purchase Invoice updated.');
    }

    public function show(int $id): JsonResponse
    {
        $inv = PurchaseInvoice::with(['vendor', 'purchaseOrder'])->find($id);
        if (!$inv) return $this->errorResponse('Invoice not found.', 404);
        return $this->successResponse($inv, 'Invoice details retrieved.');
    }

    public function destroy(int $id): JsonResponse
    {
        $inv = PurchaseInvoice::find($id);
        if (!$inv) return $this->errorResponse('Invoice not found.', 404);
        $inv->delete();
        return $this->successResponse(null, 'Invoice deleted.');
    }
}
