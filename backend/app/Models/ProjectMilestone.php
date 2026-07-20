<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectMilestone extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'project_id',
        'title',
        'description',
        'due_date',
        'status',
        'completed_at',
    ];

    protected $casts = [
        'due_date'     => 'date',
        'completed_at' => 'datetime',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Mark milestone as completed.
     */
    public function markCompleted(): void
    {
        $this->update(['status' => 'completed', 'completed_at' => now()]);
    }

    /**
     * Reopen a milestone.
     */
    public function reopen(): void
    {
        $this->update(['status' => 'pending', 'completed_at' => null]);
    }
}
