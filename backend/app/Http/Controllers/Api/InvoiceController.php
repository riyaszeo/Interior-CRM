<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Quotation;
use App\Repositories\InvoiceRepository;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class InvoiceController extends Controller
{
    use ApiResponse;

    protected InvoiceRepository $invoiceRepository;

    public function __construct(InvoiceRepository $invoiceRepository)
    {
        $this->invoiceRepository = $invoiceRepository;
    }

    public function index(Request $request): JsonResponse
    {
        $search    = $request->query('search');
        $status    = $request->query('status');
        $type      = $request->query('type');
        $sortBy    = $request->query('sort_by', 'created_at');
        $sortOrder = $request->query('sort_order', 'desc');
        $perPage   = (int) $request->query('per_page', 10);

        $invoices = $this->invoiceRepository->paginate($perPage, $search, $status, $type, $sortBy, $sortOrder);
        return $this->successResponse([
            'items'      => $invoices->items(),
            'pagination' => [
                'total'        => $invoices->total(),
                'per_page'     => $invoices->perPage(),
                'current_page' => $invoices->currentPage(),
                'last_page'    => $invoices->lastPage(),
            ]
        ], 'Invoices list retrieved.');
    }

    public function show(int $id): JsonResponse
    {
        $invoice = $this->invoiceRepository->find($id);
        if (!$invoice) {
            return $this->errorResponse('Invoice not found.', 404);
        }
        return $this->successResponse($invoice, 'Invoice details retrieved.');
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'project_id'      => 'required|integer|exists:projects,id',
            'quotation_id'    => 'nullable|integer|exists:quotations,id',
            'invoice_type'    => 'required|string|in:advance,running,final',
            'invoice_date'    => 'required|date',
            'due_date'        => 'required|date|after_or_equal:invoice_date',
            'payment_terms'   => 'nullable|string',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax_rate'        => 'nullable|numeric|min:0',
            'tax_type'        => 'nullable|string|in:local,igst',
            'notes'           => 'nullable|string',
            'items'           => 'required|array|min:1',
            'items.*.description' => 'required|string|max:255',
            'items.*.hsn_code'    => 'nullable|string|max:20',
            'items.*.quantity'    => 'required|numeric|min:0.01',
            'items.*.unit_price'  => 'required|numeric|min:0.01',
            'items.*.gst_rate'    => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        try {
            $invoice = $this->invoiceRepository->create($validator->validated());
            return $this->successResponse($invoice, 'Invoice generated successfully.', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function recordPayment(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'amount'  => 'required|numeric|min:0.01',
            'paid_at' => 'required|date',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $invoice = $this->invoiceRepository->recordPayment(
            $id,
            (float) $request->input('amount'),
            $request->input('paid_at')
        );

        if (!$invoice) {
            return $this->errorResponse('Invoice not found.', 404);
        }

        return $this->successResponse($invoice, 'Payment transaction recorded successfully.');
    }

    public function cancel(int $id): JsonResponse
    {
        $invoice = $this->invoiceRepository->cancel($id);
        if (!$invoice) {
            return $this->errorResponse('Invoice not found.', 404);
        }
        return $this->successResponse($invoice, 'Invoice marked as cancelled.');
    }

    public function formOptions(): JsonResponse
    {
        $projects = Project::select('id', 'name', 'project_code', 'customer_id')
            ->with('customer:id,name')
            ->orderBy('name')
            ->get();

        $quotations = Quotation::select('id', 'qtn_number', 'title', 'project_id', 'total')
            ->where('status', 'approved')
            ->orderBy('qtn_number')
            ->get();

        return $this->successResponse([
            'projects'   => $projects,
            'quotations' => $quotations,
        ], 'Invoice form options retrieved.');
    }
}
