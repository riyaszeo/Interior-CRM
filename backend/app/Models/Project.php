<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Project extends Model
{
    use BelongsToTenant;

    use HasFactory, SoftDeletes;

    protected $fillable = [
        'project_code',
        'name',
        'description',
        'status',
        'site_address',
        'site_contact_name',
        'site_contact_phone',
        'budget',
        'material_budget',
        'estimated_cost',
        'actual_cost',
        'completion_percent',
        'start_date',
        'end_date',
        'customer_id',
        'project_manager_id',
    ];

    protected $casts = [
        'start_date'         => 'date',
        'end_date'           => 'date',
        'budget'             => 'decimal:2',
        'material_budget'    => 'decimal:2',
        'estimated_cost'     => 'decimal:2',
        'actual_cost'        => 'decimal:2',
        'completion_percent' => 'integer',
    ];

    /**
     * Auto-generate project code on creation (PRJ-YYYYMMDD-XXXX).
     */
    protected static function booted(): void
    {
        static::creating(function (Project $project) {
            if (empty($project->project_code)) {
                $prefix = 'PRJ-' . date('Ymd');
                $latest = static::withTrashed()
                    ->where('project_code', 'like', "{$prefix}-%")
                    ->latest('id')
                    ->first();

                $num = $latest
                    ? intval(substr($latest->project_code, -4)) + 1
                    : 1;

                $project->project_code = $prefix . '-' . str_pad($num, 4, '0', STR_PAD_LEFT);
            }
        });
    }

    // ── Relationships ──────────────────────────────────────────────────────────

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'project_manager_id');
    }

    public function siteProgresses(): HasMany
    {
        return $this->hasMany(SiteProgress::class);
    }

    public function materialDispatches(): HasMany
    {
        return $this->hasMany(MaterialDispatch::class);
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function quotations(): HasMany
    {
        return $this->hasMany(Quotation::class);
    }

    public function milestones(): HasMany
    {
        return $this->hasMany(ProjectMilestone::class)->orderBy('due_date');
    }

    public function progressLogs(): HasMany
    {
        return $this->hasMany(ProjectProgressLog::class)->orderByDesc('log_date');
    }

    public function teamMembers(): HasMany
    {
        return $this->hasMany(ProjectTeamMember::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ProjectDocument::class)->orderByDesc('created_at');
    }

    public function materialConsumptions(): HasMany
    {
        return $this->hasMany(MaterialConsumption::class)->orderByDesc('consumption_date');
    }

    public function workerAttendances(): HasMany
    {
        return $this->hasMany(WorkerAttendance::class)->orderByDesc('attendance_date');
    }

    public function siteExpenses(): HasMany
    {
        return $this->hasMany(SiteExpense::class)->orderByDesc('expense_date');
    }
}
