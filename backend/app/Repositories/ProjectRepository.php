<?php

namespace App\Repositories;

use App\Models\Project;
use App\Models\ProjectMilestone;
use App\Models\ProjectProgressLog;
use App\Models\ProjectTeamMember;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ProjectRepository
{
    /**
     * Get paginated projects with filters, search, and sorting.
     */
    public function paginate(
        int $perPage = 10,
        ?string $search = null,
        ?string $status = null,
        string $sortBy = 'created_at',
        string $sortOrder = 'desc'
    ): LengthAwarePaginator {
        $query = Project::with(['customer:id,name', 'manager:id,name']);

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('project_code', 'like', "%{$search}%")
                  ->orWhereHas('customer', fn($cq) => $cq->where('name', 'like', "%{$search}%"));
            });
        }

        $allowedSortColumns = ['id', 'project_code', 'name', 'status', 'budget', 'completion_percent', 'start_date', 'end_date', 'created_at'];
        $sortBy    = in_array($sortBy, $allowedSortColumns) ? $sortBy : 'created_at';
        $sortOrder = strtolower($sortOrder) === 'asc' ? 'asc' : 'desc';

        return $query->orderBy($sortBy, $sortOrder)->paginate($perPage);
    }

    /**
     * Find a project by ID (minimal).
     */
    public function find(int $id): ?Project
    {
        return Project::find($id);
    }

    /**
     * Get full project details with all relations.
     */
    public function getDetails(int $id): ?Project
    {
        return Project::with([
            'customer:id,name,email,phone',
            'manager:id,name,email',
            'milestones',
            'progressLogs.logger:id,name',
            'teamMembers.user:id,name,email',
            'documents.uploader:id,name',
            'quotations:id,project_id,qtn_number,title,total,status',
            'invoices:id,project_id,invoice_number,amount,status',
            'materialConsumptions.material',
            'materialConsumptions.warehouse',
            'materialConsumptions.logger:id,name',
            'workerAttendances.logger:id,name',
            'siteExpenses.logger:id,name',
            'siteExpenses.approver:id,name',
        ])->find($id);
    }

    /**
     * Create a new project.
     */
    public function create(array $data): Project
    {
        return Project::create($data);
    }

    /**
     * Update an existing project.
     */
    public function update(int $id, array $data): ?Project
    {
        $project = $this->find($id);
        if ($project) {
            $project->update($data);
            return $project->fresh();
        }
        return null;
    }

    /**
     * Soft-delete a project.
     */
    public function delete(int $id): bool
    {
        $project = $this->find($id);
        return $project ? (bool) $project->delete() : false;
    }

    // ── Milestones ────────────────────────────────────────────────────────────

    public function getMilestones(int $projectId): \Illuminate\Database\Eloquent\Collection
    {
        return ProjectMilestone::where('project_id', $projectId)->orderBy('due_date')->get();
    }

    public function createMilestone(int $projectId, array $data): ProjectMilestone
    {
        return ProjectMilestone::create(array_merge($data, ['project_id' => $projectId]));
    }

    public function updateMilestone(int $milestoneId, array $data): ?ProjectMilestone
    {
        $milestone = ProjectMilestone::find($milestoneId);
        if ($milestone) {
            $milestone->update($data);
            return $milestone;
        }
        return null;
    }

    public function deleteMilestone(int $milestoneId): bool
    {
        $milestone = ProjectMilestone::find($milestoneId);
        return $milestone ? (bool) $milestone->delete() : false;
    }

    // ── Progress Logs ─────────────────────────────────────────────────────────

    public function getProgressLogs(int $projectId): \Illuminate\Database\Eloquent\Collection
    {
        return ProjectProgressLog::with('logger:id,name')
            ->where('project_id', $projectId)
            ->orderByDesc('log_date')
            ->get();
    }

    public function createProgressLog(int $projectId, array $data): ProjectProgressLog
    {
        $log = ProjectProgressLog::create(array_merge($data, ['project_id' => $projectId]));

        // Update project's completion_percent to latest log entry
        Project::where('id', $projectId)->update(['completion_percent' => $data['completion_percent'] ?? 0]);

        return $log->load('logger:id,name');
    }

    // ── Team Members ──────────────────────────────────────────────────────────

    public function addTeamMember(int $projectId, int $userId, ?string $role): ProjectTeamMember
    {
        return ProjectTeamMember::firstOrCreate(
            ['project_id' => $projectId, 'user_id' => $userId],
            ['role' => $role, 'assigned_at' => now()]
        );
    }

    public function removeTeamMember(int $projectId, int $userId): bool
    {
        return (bool) ProjectTeamMember::where('project_id', $projectId)
            ->where('user_id', $userId)
            ->delete();
    }

    // ── Daily Progress Customer Approval ─────────────────────────────────────

    public function approveProgressLog(int $logId, ?string $feedback, bool $approved = true): ?ProjectProgressLog
    {
        $log = ProjectProgressLog::find($logId);
        if (!$log) return null;

        $log->customer_approved = $approved;
        $log->customer_approved_at = $approved ? now() : null;
        $log->customer_feedback = $feedback;
        $log->save();

        return $log->load('logger:id,name');
    }

    // ── Material Consumptions ────────────────────────────────────────────────

    public function createMaterialConsumption(int $projectId, array $data): \App\Models\MaterialConsumption
    {
        return DB::transaction(function () use ($projectId, $data) {
            $mc = \App\Models\MaterialConsumption::create(array_merge($data, ['project_id' => $projectId]));

            // Optional: If warehouse stock is linked, deduct available site stock
            $stock = \App\Models\WarehouseStock::where('warehouse_id', $data['warehouse_id'])
                ->where('material_id', $data['material_id'])
                ->where('batch_id', $data['batch_id'] ?? null)
                ->first();

            if ($stock) {
                $stock->current_stock -= (float) $data['quantity_consumed'];
                $stock->save();

                // Log a ledger record
                \App\Models\StockLedger::create([
                    'warehouse_id'     => $data['warehouse_id'],
                    'material_id'      => $data['material_id'],
                    'batch_id'         => $data['batch_id'] ?? null,
                    'transaction_type' => 'dispatch', // custom site consumption
                    'quantity'         => -(float) $data['quantity_consumed'],
                    'reference_type'   => 'MaterialConsumption',
                    'reference_id'     => $mc->id,
                    'notes'            => 'Consumed on site for Project ID: ' . $projectId,
                    'transaction_date' => $data['consumption_date'],
                ]);

                // Sync catalog total stock
                $material = \App\Models\Material::findOrFail($data['material_id']);
                $material->stock_quantity -= (float) $data['quantity_consumed'];
                $material->save();
            }

            return $mc->load(['material', 'warehouse', 'logger:id,name']);
        });
    }

    // ── Worker Attendances ────────────────────────────────────────────────────

    public function logWorkerAttendance(int $projectId, array $items, string $date, int $loggedBy): array
    {
        return DB::transaction(function () use ($projectId, $items, $date, $loggedBy) {
            $logged = [];
            // Remove previous attendance for this project & date to overwrite cleanly
            \App\Models\WorkerAttendance::where('project_id', $projectId)
                ->whereDate('attendance_date', $date)
                ->delete();

            foreach ($items as $item) {
                $logged[] = \App\Models\WorkerAttendance::create([
                    'project_id'      => $projectId,
                    'worker_name'     => $item['worker_name'],
                    'worker_type'     => $item['worker_type'],
                    'attendance_date' => $date,
                    'status'          => $item['status'],
                    'logged_by'       => $loggedBy,
                ]);
            }

            return $logged;
        });
    }

    // ── Site Expenses ─────────────────────────────────────────────────────────

    public function createExpense(int $projectId, array $data): \App\Models\SiteExpense
    {
        return \App\Models\SiteExpense::create(array_merge($data, ['project_id' => $projectId]));
    }

    public function approveExpense(int $expenseId, int $approverId, string $status): ?\App\Models\SiteExpense
    {
        return DB::transaction(function () use ($expenseId, $approverId, $status) {
            $expense = \App\Models\SiteExpense::find($expenseId);
            if (!$expense) return null;

            if ($status === 'approved' && $expense->status !== 'approved') {
                $expense->status = 'approved';
                $expense->approved_by = $approverId;
                $expense->save();

                // Increment the project's financial actual cost value
                $project = Project::find($expense->project_id);
                if ($project) {
                    $project->actual_cost += $expense->amount;
                    $project->save();
                }
            } elseif ($status === 'rejected') {
                // If it was approved earlier, reverse the cost increment
                if ($expense->status === 'approved') {
                    $project = Project::find($expense->project_id);
                    if ($project) {
                        $project->actual_cost -= $expense->amount;
                        $project->save();
                    }
                }
                $expense->status = 'rejected';
                $expense->approved_by = $approverId;
                $expense->save();
            }

            return $expense->load(['logger:id,name', 'approver:id,name']);
        });
    }
}
