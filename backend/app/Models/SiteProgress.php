<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SiteProgress extends Model
{
    use BelongsToTenant;

    use HasFactory;

    protected $table = 'site_progress';

    protected $fillable = [
        'project_id',
        'progress_percentage',
        'update_notes',
    ];

    protected $casts = [
        'progress_percentage' => 'decimal:2',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }
}
