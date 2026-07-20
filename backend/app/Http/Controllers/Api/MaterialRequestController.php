<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MaterialRequest;
use App\Repositories\DispatchRepository;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MaterialRequestController extends Controller
{
    use ApiResponse;

    public function __construct(protected DispatchRepository $repo) {}

    public function index(Request $request): JsonResponse
    {
        $paginated = $this->repo->paginateRequests(
            (int) $request->input('per_page', 15),
            $request->input('project_id') ? (int) $request->input('project_id') : null,
            $request->input('warehouse_id') ? (int) $request->input('warehouse_id') : null,
            $request->input('status'),
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
        ], 'Material requests retrieved.');
    }

    public function store(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'project_id'     => 'required|integer|exists:projects,id',
            'warehouse_id'   => 'required|integer|exists:warehouses,id',
            'requested_date' => 'required|date',
            'notes'          => 'nullable|string|max:255',
            'items'          => 'required|array|min:1',
            'items.*.material_id'        => 'required|integer|exists:materials,id',
            'items.*.quantity_requested' => 'required|numeric|min:0.01',
            'items.*.notes'              => 'nullable|string|max:100',
        ]);

        if ($v->fails()) return $this->validationErrorResponse($v->errors());

        $data = $v->validated();
        $data['requested_by'] = $request->user()->id;
        $data['status'] = 'pending_approval';

        try {
            $mr = $this->repo->createRequest($data, $data['items']);
            return $this->successResponse($mr, 'Material request submitted for approval.', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function show(int $id): JsonResponse
    {
        $mr = MaterialRequest::with(['project', 'warehouse', 'requester', 'approver', 'items.material'])->find($id);
        if (!$mr) return $this->errorResponse('Material request not found.', 404);
        return $this->successResponse($mr, 'Material request details retrieved.');
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'status' => 'required|string|in:approved,rejected,cancelled',
            'items'  => 'nullable|array',
            'items.*.material_id'       => 'required|integer',
            'items.*.quantity_approved' => 'required|numeric|min:0',
        ]);

        if ($v->fails()) return $this->validationErrorResponse($v->errors());

        try {
            $mr = $this->repo->updateRequestStatus($id, $v->input('status'), $request->user()->id, $v->input('items'));
            if (!$mr) return $this->errorResponse('Material request not found.', 404);
            return $this->successResponse($mr, "Material request status updated to '{$v->input('status')}'.");
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    public function formOptions(): JsonResponse
    {
        return $this->successResponse($this->repo->getFormOptions(), 'Dispatch options retrieved.');
    }
}
