<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MaterialCategory;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MaterialCategoryController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $cats = MaterialCategory::withCount('materials')
            ->with('parent:id,name')
            ->orderBy('name')
            ->get();
        return $this->successResponse($cats, 'Categories retrieved.');
    }

    public function store(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'name'        => 'required|string|max:100|unique:material_categories,name',
            'description' => 'nullable|string',
            'color'       => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'parent_id'   => 'nullable|integer|exists:material_categories,id',
        ]);
        if ($v->fails()) return $this->validationErrorResponse($v->errors());

        $cat = MaterialCategory::create($v->validated());
        return $this->successResponse($cat, 'Category created.', 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'name'        => "sometimes|required|string|max:100|unique:material_categories,name,{$id}",
            'description' => 'nullable|string',
            'color'       => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'parent_id'   => "nullable|integer|exists:material_categories,id|not_in:{$id}",
        ]);
        if ($v->fails()) return $this->validationErrorResponse($v->errors());

        $cat = MaterialCategory::find($id);
        if (!$cat) return $this->errorResponse('Category not found.', 404);

        $cat->update($v->validated());
        return $this->successResponse($cat, 'Category updated.');
    }

    public function destroy(int $id): JsonResponse
    {
        $cat = MaterialCategory::find($id);
        if (!$cat) return $this->errorResponse('Category not found.', 404);
        $cat->delete();
        return $this->successResponse(null, 'Category deleted.');
    }
}
