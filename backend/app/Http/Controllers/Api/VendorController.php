<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\PurchaseRepository;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class VendorController extends Controller
{
    use ApiResponse;

    public function __construct(protected PurchaseRepository $repo) {}

    public function index(Request $request): JsonResponse
    {
        $paginated = $this->repo->paginateVendors(
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
        ], 'Vendors retrieved.');
    }

    public function store(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'name'          => 'required|string|max:255',
            'company_name'  => 'required|string|max:255',
            'email'         => 'nullable|email|max:255|unique:vendors,email',
            'phone'         => 'nullable|string|max:50',
            'address'       => 'nullable|string',
            'gst_number'    => 'nullable|string|max:50',
            'payment_terms' => 'nullable|string|max:100',
        ]);
        if ($v->fails()) return $this->validationErrorResponse($v->errors());

        $vendor = $this->repo->createVendor($v->validated());
        return $this->successResponse($vendor, 'Vendor registered.', 201);
    }

    public function show(int $id): JsonResponse
    {
        $v = Vendor::find($id);
        if (!$v) return $this->errorResponse('Vendor not found.', 404);
        return $this->successResponse($v, 'Vendor retrieved.');
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'name'          => 'sometimes|required|string|max:255',
            'company_name'  => 'sometimes|required|string|max:255',
            'email'         => "nullable|email|max:255|unique:vendors,email,{$id}",
            'phone'         => 'nullable|string|max:50',
            'address'       => 'nullable|string',
            'gst_number'    => 'nullable|string|max:50',
            'payment_terms' => 'nullable|string|max:100',
        ]);
        if ($v->fails()) return $this->validationErrorResponse($v->errors());

        $vendor = $this->repo->updateVendor($id, $v->validated());
        if (!$vendor) return $this->errorResponse('Vendor not found.', 404);
        return $this->successResponse($vendor, 'Vendor updated.');
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->repo->deleteVendor($id);
        if (!$deleted) return $this->errorResponse('Vendor not found.', 404);
        return $this->successResponse(null, 'Vendor archived.');
    }
}
