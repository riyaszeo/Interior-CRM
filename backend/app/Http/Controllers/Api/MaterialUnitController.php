<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MaterialUnit;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MaterialUnitController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $units = MaterialUnit::withCount('materials')->orderBy('name')->get();
        return $this->successResponse($units, 'Units retrieved.');
    }

    public function store(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'name'         => 'required|string|max:50|unique:material_units,name',
            'abbreviation' => 'required|string|max:20|unique:material_units,abbreviation',
        ]);
        if ($v->fails()) return $this->validationErrorResponse($v->errors());

        $unit = MaterialUnit::create($v->validated());
        return $this->successResponse($unit, 'Unit created.', 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'name'         => "sometimes|required|string|max:50|unique:material_units,name,{$id}",
            'abbreviation' => "sometimes|required|string|max:20|unique:material_units,abbreviation,{$id}",
        ]);
        if ($v->fails()) return $this->validationErrorResponse($v->errors());

        $unit = MaterialUnit::find($id);
        if (!$unit) return $this->errorResponse('Unit not found.', 404);

        $unit->update($v->validated());
        return $this->successResponse($unit, 'Unit updated.');
    }

    public function destroy(int $id): JsonResponse
    {
        $unit = MaterialUnit::find($id);
        if (!$unit) return $this->errorResponse('Unit not found.', 404);
        $unit->delete();
        return $this->successResponse(null, 'Unit deleted.');
    }
}
