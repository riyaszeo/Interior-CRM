<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkerAttendance extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'project_id',
        'worker_name',
        'worker_type',
        'attendance_date',
        'status',
        'logged_by',
    ];

    protected $casts = [
        'attendance_date' => 'date',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function logger(): BelongsTo
    {
        return $this->belongsTo(User::class, 'logged_by');
    }
}
