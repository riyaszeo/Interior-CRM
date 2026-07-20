<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MaterialBrand;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MaterialBrandController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $brands = MaterialBrand::withCount('materials')->orderBy('name')->get();
        return $this->successResponse($brands, 'Brands retrieved.');
    }

    public function store(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'name'        => 'required|string|max:100|unique:material_brands,name',
            'description' => 'nullable|string',
        ]);
        if ($v->fails()) return $this->validationErrorResponse($v->errors());

        $brand = MaterialBrand::create($v->validated());
        return $this->successResponse($brand, 'Brand created.', 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'name'        => "sometimes|required|string|max:100|unique:material_brands,name,{$id}",
            'description' => 'nullable|string',
        ]);
        if ($v->fails()) return $this->validationErrorResponse($v->errors());

        $brand = MaterialBrand::find($id);
        if (!$brand) return $this->errorResponse('Brand not found.', 404);

        $brand->update($v->validated());
        return $this->successResponse($brand, 'Brand updated.');
    }

    public function destroy(int $id): JsonResponse
    {
        $brand = MaterialBrand::find($id);
        if (!$brand) return $this->errorResponse('Brand not found.', 404);
        $brand->delete();
        return $this->successResponse(null, 'Brand deleted.');
    }
}
