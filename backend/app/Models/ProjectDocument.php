<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class ProjectDocument extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'project_id',
        'uploaded_by',
        'file_name',
        'file_path',
        'mime_type',
        'file_type',
        'file_size',
    ];

    protected $appends = ['url'];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * Append full public URL for the file.
     */
    public function getUrlAttribute(): string
    {
        return Storage::url($this->file_path);
    }
}
