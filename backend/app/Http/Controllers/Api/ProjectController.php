<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProjectDocument;
use App\Models\User;
use App\Repositories\ProjectRepository;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProjectController extends Controller
{
    use ApiResponse;

    protected ProjectRepository $projectRepository;

    public function __construct(ProjectRepository $projectRepository)
    {
        $this->projectRepository = $projectRepository;
    }

    // ════════════════════════════════════════════════════════════════════════
    //  PROJECTS CRUD
    // ════════════════════════════════════════════════════════════════════════

    public function index(Request $request): JsonResponse
    {
        $paginated = $this->projectRepository->paginate(
            (int) $request->input('per_page', 10),
            $request->input('search'),
            $request->input('status'),
            $request->input('sort_by', 'created_at'),
            $request->input('sort_order', 'desc')
        );

        return $this->successResponse([
            'items'      => $paginated->items(),
            'pagination' => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
            ],
        ], 'Projects retrieved successfully.');
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'                => 'required|string|max:255',
            'description'         => 'nullable|string',
            'status'              => 'required|string|in:active,completed,in_progress,pending,on_hold',
            'budget'              => 'required|numeric|min:0',
            'material_budget'     => 'required|numeric|min:0',
            'estimated_cost'      => 'nullable|numeric|min:0',
            'actual_cost'         => 'nullable|numeric|min:0',
            'completion_percent'  => 'nullable|integer|min:0|max:100',
            'start_date'          => 'nullable|date',
            'end_date'            => 'nullable|date|after_or_equal:start_date',
            'customer_id'         => 'nullable|integer|exists:customers,id',
            'project_manager_id'  => 'nullable|integer|exists:users,id',
            'site_address'        => 'nullable|string',
            'site_contact_name'   => 'nullable|string|max:255',
            'site_contact_phone'  => 'nullable|string|max:30',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $project = $this->projectRepository->create($validator->validated());
        return $this->successResponse($project, 'Project created successfully.', 201);
    }

    public function show(int $id): JsonResponse
    {
        $project = $this->projectRepository->getDetails($id);

        if (! $project) {
            return $this->errorResponse('Project not found.', 404);
        }

        return $this->successResponse($project, 'Project retrieved successfully.');
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'                => 'sometimes|required|string|max:255',
            'description'         => 'nullable|string',
            'status'              => 'sometimes|required|string|in:active,completed,in_progress,pending,on_hold',
            'budget'              => 'sometimes|required|numeric|min:0',
            'material_budget'     => 'sometimes|required|numeric|min:0',
            'estimated_cost'      => 'nullable|numeric|min:0',
            'actual_cost'         => 'nullable|numeric|min:0',
            'completion_percent'  => 'nullable|integer|min:0|max:100',
            'start_date'          => 'nullable|date',
            'end_date'            => 'nullable|date|after_or_equal:start_date',
            'customer_id'         => 'nullable|integer|exists:customers,id',
            'project_manager_id'  => 'nullable|integer|exists:users,id',
            'site_address'        => 'nullable|string',
            'site_contact_name'   => 'nullable|string|max:255',
            'site_contact_phone'  => 'nullable|string|max:30',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $project = $this->projectRepository->update($id, $validator->validated());

        if (! $project) {
            return $this->errorResponse('Project not found.', 404);
        }

        return $this->successResponse($project, 'Project updated successfully.');
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->projectRepository->delete($id);

        if (! $deleted) {
            return $this->errorResponse('Project not found.', 404);
        }

        return $this->successResponse(null, 'Project archived successfully.');
    }

    // ════════════════════════════════════════════════════════════════════════
    //  MILESTONES
    // ════════════════════════════════════════════════════════════════════════

    public function getMilestones(int $id): JsonResponse
    {
        return $this->successResponse(
            $this->projectRepository->getMilestones($id),
            'Milestones retrieved.'
        );
    }

    public function storeMilestone(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date'    => 'nullable|date',
            'status'      => 'nullable|string|in:pending,completed,delayed',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $milestone = $this->projectRepository->createMilestone($id, $validator->validated());
        return $this->successResponse($milestone, 'Milestone added.', 201);
    }

    public function updateMilestone(Request $request, int $id, int $mid): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title'        => 'sometimes|required|string|max:255',
            'description'  => 'nullable|string',
            'due_date'     => 'nullable|date',
            'status'       => 'nullable|string|in:pending,completed,delayed',
            'completed_at' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $milestone = $this->projectRepository->updateMilestone($mid, $validator->validated());

        if (! $milestone) {
            return $this->errorResponse('Milestone not found.', 404);
        }

        return $this->successResponse($milestone, 'Milestone updated.');
    }

    public function destroyMilestone(int $id, int $mid): JsonResponse
    {
        $deleted = $this->projectRepository->deleteMilestone($mid);
        return $deleted
            ? $this->successResponse(null, 'Milestone deleted.')
            : $this->errorResponse('Milestone not found.', 404);
    }

    // ════════════════════════════════════════════════════════════════════════
    //  PROGRESS LOGS
    // ════════════════════════════════════════════════════════════════════════

    public function getProgressLogs(int $id): JsonResponse
    {
        return $this->successResponse(
            $this->projectRepository->getProgressLogs($id),
            'Progress logs retrieved.'
        );
    }

    public function storeProgressLog(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'log_date'           => 'required|date',
            'description'        => 'required|string',
            'completion_percent' => 'required|integer|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $data               = $validator->validated();
        $data['logged_by']  = $request->user()?->id;

        $log = $this->projectRepository->createProgressLog($id, $data);
        return $this->successResponse($log, 'Progress log saved.', 201);
    }

    // ════════════════════════════════════════════════════════════════════════
    //  TEAM MEMBERS
    // ════════════════════════════════════════════════════════════════════════

    public function addTeamMember(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
            'role'    => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $member = $this->projectRepository->addTeamMember(
            $id,
            $request->user_id,
            $request->role
        );

        $member->load('user:id,name,email');
        return $this->successResponse($member, 'Team member added.');
    }

    public function removeTeamMember(int $id, int $userId): JsonResponse
    {
        $removed = $this->projectRepository->removeTeamMember($id, $userId);
        return $removed
            ? $this->successResponse(null, 'Team member removed.')
            : $this->errorResponse('Team member not found.', 404);
    }

    // ════════════════════════════════════════════════════════════════════════
    //  DOCUMENTS & IMAGES
    // ════════════════════════════════════════════════════════════════════════

    public function uploadDocument(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:20480', // 20 MB
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $project = $this->projectRepository->find($id);
        if (! $project) {
            return $this->errorResponse('Project not found.', 404);
        }

        $file     = $request->file('file');
        $mime     = $file->getMimeType() ?? '';
        $isImage  = str_starts_with($mime, 'image/');
        $isVideo  = str_starts_with($mime, 'video/');
        $folder   = $isImage ? "projects/{$id}/images" : ($isVideo ? "projects/{$id}/videos" : "projects/{$id}/documents");
        $path     = $file->store($folder, 'public');

        $doc = ProjectDocument::create([
            'project_id'  => $id,
            'uploaded_by' => $request->user()?->id,
            'file_name'   => $file->getClientOriginalName(),
            'file_path'   => $path,
            'mime_type'   => $mime,
            'file_type'   => $isImage ? 'image' : ($isVideo ? 'video' : 'document'),
            'file_size'   => $file->getSize(),
        ]);

        return $this->successResponse($doc, 'File uploaded successfully.', 201);
    }

    public function deleteDocument(int $id, int $docId): JsonResponse
    {
        $doc = ProjectDocument::where('project_id', $id)->find($docId);

        if (! $doc) {
            return $this->errorResponse('Document not found.', 404);
        }

        Storage::disk('public')->delete($doc->file_path);
        $doc->delete();

        return $this->successResponse(null, 'Document deleted.');
    }

    public function usersList(): JsonResponse
    {
        $users = User::select('id', 'name', 'email')
            ->orderBy('name')
            ->get()
            ->map(fn($u) => [
                'id'    => $u->id,
                'name'  => $u->name,
                'email' => $u->email,
                'roles' => $u->getRoleNames(),
            ]);

        return $this->successResponse($users, 'Users list retrieved.');
    }

    // ── daily progress customer approval ─────────────────────────────────────
    public function approveProgressLog(Request $request, int $id, int $logId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'customer_approved' => 'required|boolean',
            'customer_feedback' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) return $this->validationErrorResponse($validator->errors());

        $log = $this->projectRepository->approveProgressLog(
            $logId,
            $request->input('customer_feedback'),
            $request->boolean('customer_approved')
        );

        if (!$log) return $this->errorResponse('Progress log not found.', 404);

        return $this->successResponse($log, 'Customer approval updated.');
    }

    // ── material consumption ─────────────────────────────────────────────────
    public function storeMaterialConsumption(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'warehouse_id'      => 'required|integer|exists:warehouses,id',
            'material_id'       => 'required|integer|exists:materials,id',
            'batch_id'          => 'nullable|integer|exists:material_batches,id',
            'quantity_consumed' => 'required|numeric|min:0.01',
            'consumption_date'  => 'required|date',
            'notes'             => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) return $this->validationErrorResponse($validator->errors());

        $data = $validator->validated();
        $data['logged_by'] = $request->user()->id;

        try {
            $mc = $this->projectRepository->createMaterialConsumption($id, $data);
            return $this->successResponse($mc, 'Material consumption logged and warehouse stock synced.', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), 422);
        }
    }

    // ── worker attendance ────────────────────────────────────────────────────
    public function storeWorkerAttendance(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'attendance_date'   => 'required|date',
            'items'             => 'required|array|min:1',
            'items.*.worker_name' => 'required|string|max:100',
            'items.*.worker_type' => 'required|string|max:50',
            'items.*.status'      => 'required|string|in:present,absent,half_day',
        ]);

        if ($validator->fails()) return $this->validationErrorResponse($validator->errors());

        $items = $this->projectRepository->logWorkerAttendance(
            $id,
            $request->input('items'),
            $request->input('attendance_date'),
            $request->user()->id
        );

        return $this->successResponse($items, 'Worker attendance register logged.', 201);
    }

    // ── site expenses ────────────────────────────────────────────────────────
    public function storeExpense(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title'        => 'required|string|max:255',
            'amount'       => 'required|numeric|min:0.01',
            'expense_date' => 'required|date',
            'category'     => 'required|string|in:petty_purchase,food,transport,tools,other',
            'receipt'      => 'nullable|file|max:5120', // 5MB
        ]);

        if ($validator->fails()) return $this->validationErrorResponse($validator->errors());

        $data = $validator->validated();
        unset($data['receipt']);

        if ($request->hasFile('receipt')) {
            $path = $request->file('receipt')->store("projects/{$id}/expenses", 'public');
            $data['receipt_path'] = $path;
        }

        $data['logged_by'] = $request->user()->id;
        $data['status'] = 'pending';

        $expense = $this->projectRepository->createExpense($id, $data);
        return $this->successResponse($expense, 'Expense recorded pending review.', 201);
    }

    public function approveExpense(Request $request, int $id, int $expenseId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:approved,rejected',
        ]);

        if ($validator->fails()) return $this->validationErrorResponse($validator->errors());

        $expense = $this->projectRepository->approveExpense(
            $expenseId,
            $request->user()->id,
            $request->input('status')
        );

        if (!$expense) return $this->errorResponse('Expense record not found.', 404);

        return $this->successResponse($expense, "Expense status updated to '{$request->input('status')}' and project costs synchronized.");
    }
}
