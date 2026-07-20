<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Material;
use App\Repositories\MaterialRepository;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Validator;
use Picqer\Barcode\BarcodeGeneratorPNG;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;

class MaterialController extends Controller
{
    use ApiResponse;

    public function __construct(protected MaterialRepository $repo) {}

    // ── List ──────────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $paginated = $this->repo->paginate(
            (int) $request->input('per_page', 15),
            $request->input('search'),
            $request->input('category_id') ? (int) $request->input('category_id') : null,
            $request->input('brand_id')    ? (int) $request->input('brand_id')    : null,
            $request->input('status', 'all'),
            $request->input('sort_by', 'name'),
            $request->input('sort_order', 'asc')
        );

        return $this->successResponse([
            'items'      => $paginated->items(),
            'pagination' => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
        ], 'Materials retrieved.');
    }

    // ── Form Options ──────────────────────────────────────────────────────────

    public function formOptions(): JsonResponse
    {
        return $this->successResponse($this->repo->formOptions(), 'Form options retrieved.');
    }

    // ── Create ────────────────────────────────────────────────────────────────

    public function store(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'name'           => 'required|string|max:255',
            'sku'            => 'required|string|max:100|unique:materials,sku',
            'description'    => 'nullable|string',
            'category_id'    => 'nullable|integer|exists:material_categories,id',
            'brand_id'       => 'nullable|integer|exists:material_brands,id',
            'unit_id'        => 'nullable|integer|exists:material_units,id',
            'unit'           => 'nullable|string|max:30',
            'hsn_code'       => 'nullable|string|max:20',
            'gst_rate'       => 'nullable|numeric|in:0,5,12,18,28',
            'cost_price'     => 'nullable|numeric|min:0',
            'purchase_price' => 'nullable|numeric|min:0',
            'selling_price'  => 'nullable|numeric|min:0',
            'stock_quantity' => 'nullable|numeric|min:0',
            'reorder_level'  => 'nullable|numeric|min:0',
            'barcode'        => 'nullable|string|max:255|unique:materials,barcode',
            'is_active'      => 'nullable|boolean',
        ]);

        if ($v->fails()) return $this->validationErrorResponse($v->errors());

        $data = $v->validated();
        // Mirror purchase_price → cost_price for backward compat
        if (!isset($data['cost_price']) && isset($data['purchase_price'])) {
            $data['cost_price'] = $data['purchase_price'];
        }

        $material = $this->repo->create($data);
        return $this->successResponse($material->load(['category', 'brand', 'unitModel']), 'Material created.', 201);
    }

    // ── Detail ────────────────────────────────────────────────────────────────

    public function show(int $id): JsonResponse
    {
        $material = $this->repo->find($id);
        if (!$material) return $this->errorResponse('Material not found.', 404);
        return $this->successResponse($material, 'Material retrieved.');
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function update(Request $request, int $id): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'name'           => 'sometimes|required|string|max:255',
            'sku'            => "sometimes|required|string|max:100|unique:materials,sku,{$id}",
            'description'    => 'nullable|string',
            'category_id'    => 'nullable|integer|exists:material_categories,id',
            'brand_id'       => 'nullable|integer|exists:material_brands,id',
            'unit_id'        => 'nullable|integer|exists:material_units,id',
            'unit'           => 'nullable|string|max:30',
            'hsn_code'       => 'nullable|string|max:20',
            'gst_rate'       => 'nullable|numeric|in:0,5,12,18,28',
            'cost_price'     => 'nullable|numeric|min:0',
            'purchase_price' => 'nullable|numeric|min:0',
            'selling_price'  => 'nullable|numeric|min:0',
            'stock_quantity' => 'nullable|numeric|min:0',
            'reorder_level'  => 'nullable|numeric|min:0',
            'barcode'        => "nullable|string|max:255|unique:materials,barcode,{$id}",
            'is_active'      => 'nullable|boolean',
        ]);

        if ($v->fails()) return $this->validationErrorResponse($v->errors());

        $data = $v->validated();
        if (!isset($data['cost_price']) && isset($data['purchase_price'])) {
            $data['cost_price'] = $data['purchase_price'];
        }

        $material = $this->repo->update($id, $data);
        if (!$material) return $this->errorResponse('Material not found.', 404);
        return $this->successResponse($material, 'Material updated.');
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->repo->delete($id);
        if (!$deleted) return $this->errorResponse('Material not found.', 404);
        return $this->successResponse(null, 'Material archived.');
    }

    // ── Barcode PNG ───────────────────────────────────────────────────────────

    public function barcode(int $id): Response
    {
        $material = Material::findOrFail($id);
        $code     = $material->barcode ?: $material->sku;

        $generator = new BarcodeGeneratorPNG();
        $png       = $generator->getBarcode($code, $generator::TYPE_CODE_128, 2, 60);

        return response($png, 200)->header('Content-Type', 'image/png');
    }

    public function qrcode(int $id): Response
    {
        $material = Material::findOrFail($id);
        $data     = $material->qr_data ?: json_encode(['sku' => $material->sku, 'name' => $material->name]);

        $qrCode = new QrCode(data: $data, size: 200, margin: 10);
        $writer = new PngWriter();
        $result = $writer->write($qrCode);

        return response($result->getString(), 200)->header('Content-Type', 'image/png');
    }
}
