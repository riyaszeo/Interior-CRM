<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\Project;
use App\Repositories\QuotationRepository;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class QuotationController extends Controller
{
    use ApiResponse;

    protected QuotationRepository $quotationRepo;

    public function __construct(QuotationRepository $quotationRepo)
    {
        $this->quotationRepo = $quotationRepo;
    }

    /**
     * Display a paginated listing of quotations.
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $sortBy = $request->query('sort_by', 'created_at');
        $sortOrder = $request->query('sort_order', 'desc');
        $perPage = (int) $request->query('per_page', 10);

        $paginated = $this->quotationRepo->getPaginated($perPage, $search, $status, $sortBy, $sortOrder);

        return $this->successResponse([
            'items' => $paginated->items(),
            'pagination' => [
                'total' => $paginated->total(),
                'per_page' => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
            ],
        ], 'Quotations retrieved successfully.');
    }

    /**
     * Store a newly created quotation with items.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'customer_id' => 'nullable|integer|exists:customers,id',
            'project_id' => 'nullable|integer|exists:projects,id',
            'title' => 'required|string|max:255',
            'status' => 'sometimes|string|in:draft,sent,approved,rejected',
            'labor_charges' => 'nullable|numeric|min:0',
            'additional_charges' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'gst_rate' => 'nullable|numeric|min:0|max:100',
            'terms_conditions' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.room_name' => 'required|string|max:255',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.material_id' => 'nullable|integer|exists:materials,id',
            'items.*.description' => 'nullable|string|max:500',
            'items.*.width' => 'nullable|numeric|min:0',
            'items.*.height' => 'nullable|numeric|min:0',
            'items.*.units' => 'nullable|numeric|min:0.01',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        try {
            DB::beginTransaction();

            $data = $validator->validated();

            // Compute financials
            $subtotal = collect($data['items'])->sum(fn($i) => $i['quantity'] * $i['unit_price']);
            $laborCharges = $data['labor_charges'] ?? 0;
            $additionalCharges = $data['additional_charges'] ?? 0;
            $discountAmount = $data['discount_amount'] ?? 0;
            $gstRate = $data['gst_rate'] ?? 18.0;
            $gstBase = $subtotal + $laborCharges + $additionalCharges - $discountAmount;
            $gstAmount = $gstBase * ($gstRate / 100);
            $total = $gstBase + $gstAmount;

            $quotation = Quotation::create([
                'customer_id' => $data['customer_id'] ?? null,
                'project_id' => $data['project_id'] ?? null,
                'title' => $data['title'],
                'status' => $data['status'] ?? 'draft',
                'subtotal' => $subtotal,
                'gst_rate' => $gstRate,
                'gst_amount' => $gstAmount,
                'discount_amount' => $discountAmount,
                'labor_charges' => $laborCharges,
                'additional_charges' => $additionalCharges,
                'total' => $total,
                'terms_conditions' => $data['terms_conditions'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                $rowTotal = $item['quantity'] * $item['unit_price'];
                QuotationItem::create([
                    'quotation_id' => $quotation->id,
                    'room_name' => $item['room_name'],
                    'item_name' => $item['item_name'],
                    'material_id' => $item['material_id'] ?? null,
                    'description' => $item['description'] ?? null,
                    'width' => $item['width'] ?? null,
                    'height' => $item['height'] ?? null,
                    'units' => $item['units'] ?? 1,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $rowTotal,
                ]);
            }

            DB::commit();

            $quotation->load(['items.material:id,name,sku,unit', 'customer:id,name', 'project:id,name']);

            return $this->successResponse($quotation, 'Quotation created successfully.', 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Failed to create quotation: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Display a specific quotation with items and relations.
     */
    public function show(int $id): JsonResponse
    {
        $quotation = $this->quotationRepo->getDetails($id);

        if (!$quotation) {
            return $this->errorResponse('Quotation not found.', 404);
        }

        return $this->successResponse($quotation, 'Quotation retrieved successfully.');
    }

    /**
     * Update a quotation and sync its items.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $quotation = Quotation::find($id);

        if (!$quotation) {
            return $this->errorResponse('Quotation not found.', 404);
        }

        $validator = Validator::make($request->all(), [
            'customer_id' => 'nullable|integer|exists:customers,id',
            'project_id' => 'nullable|integer|exists:projects,id',
            'title' => 'required|string|max:255',
            'status' => 'sometimes|string|in:draft,sent,approved,rejected',
            'labor_charges' => 'nullable|numeric|min:0',
            'additional_charges' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'gst_rate' => 'nullable|numeric|min:0|max:100',
            'terms_conditions' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.room_name' => 'required|string|max:255',
            'items.*.item_name' => 'required|string|max:255',
            'items.*.material_id' => 'nullable|integer|exists:materials,id',
            'items.*.description' => 'nullable|string|max:500',
            'items.*.width' => 'nullable|numeric|min:0',
            'items.*.height' => 'nullable|numeric|min:0',
            'items.*.units' => 'nullable|numeric|min:0.01',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        try {
            DB::beginTransaction();

            $data = $validator->validated();

            $subtotal = collect($data['items'])->sum(fn($i) => $i['quantity'] * $i['unit_price']);
            $laborCharges = $data['labor_charges'] ?? 0;
            $additionalCharges = $data['additional_charges'] ?? 0;
            $discountAmount = $data['discount_amount'] ?? 0;
            $gstRate = $data['gst_rate'] ?? 18.0;
            $gstBase = $subtotal + $laborCharges + $additionalCharges - $discountAmount;
            $gstAmount = $gstBase * ($gstRate / 100);
            $total = $gstBase + $gstAmount;

            $quotation->update([
                'customer_id' => $data['customer_id'] ?? null,
                'project_id' => $data['project_id'] ?? null,
                'title' => $data['title'],
                'status' => $data['status'] ?? $quotation->status,
                'subtotal' => $subtotal,
                'gst_rate' => $gstRate,
                'gst_amount' => $gstAmount,
                'discount_amount' => $discountAmount,
                'labor_charges' => $laborCharges,
                'additional_charges' => $additionalCharges,
                'total' => $total,
                'terms_conditions' => $data['terms_conditions'] ?? null,
            ]);

            // Sync items: delete old, insert new
            $quotation->items()->delete();
            foreach ($data['items'] as $item) {
                QuotationItem::create([
                    'quotation_id' => $quotation->id,
                    'room_name' => $item['room_name'],
                    'item_name' => $item['item_name'],
                    'material_id' => $item['material_id'] ?? null,
                    'description' => $item['description'] ?? null,
                    'width' => $item['width'] ?? null,
                    'height' => $item['height'] ?? null,
                    'units' => $item['units'] ?? 1,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['quantity'] * $item['unit_price'],
                ]);
            }

            DB::commit();

            $quotation->load(['items.material:id,name,sku,unit', 'customer:id,name', 'project:id,name']);

            return $this->successResponse($quotation, 'Quotation updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Failed to update quotation: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Soft delete a quotation.
     */
    public function destroy(int $id): JsonResponse
    {
        $quotation = Quotation::find($id);

        if (!$quotation) {
            return $this->errorResponse('Quotation not found.', 404);
        }

        $quotation->delete();

        return $this->successResponse(null, 'Quotation archived successfully.');
    }

    /**
     * Update quotation status (approval workflow).
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $quotation = Quotation::find($id);

        if (!$quotation) {
            return $this->errorResponse('Quotation not found.', 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:draft,sent,approved,rejected',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $quotation->update(['status' => $request->status]);

        return $this->successResponse($quotation, 'Quotation status updated to ' . ucfirst($request->status) . '.');
    }

    /**
     * Convert an approved quotation to a project.
     */
    public function convertToProject(int $id): JsonResponse
    {
        $quotation = Quotation::with('customer')->find($id);

        if (!$quotation) {
            return $this->errorResponse('Quotation not found.', 404);
        }

        if ($quotation->status !== 'approved') {
            return $this->errorResponse('Only approved quotations can be converted to projects.', 422);
        }

        if ($quotation->project_id) {
            return $this->errorResponse('This quotation is already linked to a project.', 422);
        }

        try {
            DB::beginTransaction();

            $project = Project::create([
                'name' => $quotation->title,
                'status' => 'active',
                'budget' => $quotation->total,
                'material_budget' => $quotation->subtotal,
                'start_date' => now(),
                'end_date' => now()->addDays(90),
                'customer_id' => $quotation->customer_id,
            ]);

            // Link the quotation to the new project
            $quotation->update(['project_id' => $project->id]);

            DB::commit();

            return $this->successResponse([
                'project' => $project,
                'quotation' => $quotation,
            ], 'Quotation successfully converted to project.');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Conversion failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Return all customers and projects for dropdown selections.
     */
    public function formOptions(): JsonResponse
    {
        $customers = \App\Models\Customer::select('id', 'name', 'site_address')->get();
        $projects = \App\Models\Project::select('id', 'name', 'status')->whereNotIn('status', ['completed'])->get();
        $materials = \App\Models\Material::select('id', 'name', 'sku', 'unit', 'cost_price')->get();

        return $this->successResponse(compact('customers', 'projects', 'materials'), 'Form options loaded.');
    }
}
