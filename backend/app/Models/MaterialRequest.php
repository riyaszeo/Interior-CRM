<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MaterialRequest extends Model
{
    use BelongsToTenant;

    use HasFactory;

    protected $fillable = [
        'request_number',
        'project_id',
        'warehouse_id',
        'requested_by',
        'status',
        'requested_date',
        'approved_by',
        'approved_at',
        'notes',
    ];

    protected $casts = [
        'requested_date' => 'date',
        'approved_at'    => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (MaterialRequest $mr) {
            if (empty($mr->request_number)) {
                $latest = static::latest('id')->first();
                $seq = $latest ? $latest->id + 1 : 1;
                $mr->request_number = 'MR-' . now()->format('Ymd') . '-' . str_pad((string)$seq, 4, '0', STR_PAD_LEFT);
            }
        });
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(MaterialRequestItem::class);
    }

    public function dispatches(): HasMany
    {
        return $this->hasMany(MaterialDispatch::class);
    }
}
