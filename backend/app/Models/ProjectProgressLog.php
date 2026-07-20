<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectProgressLog extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'project_id',
        'logged_by',
        'log_date',
        'description',
        'completion_percent',
        'customer_approved',
        'customer_approved_at',
        'customer_feedback',
    ];

    protected $casts = [
        'log_date'             => 'date',
        'completion_percent'   => 'integer',
        'customer_approved'    => 'boolean',
        'customer_approved_at' => 'datetime',
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
