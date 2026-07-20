<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaterialConsumption extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'project_id',
        'warehouse_id',
        'material_id',
        'batch_id',
        'quantity_consumed',
        'consumption_date',
        'logged_by',
        'notes',
    ];

    protected $casts = [
        'quantity_consumed' => 'decimal:2',
        'consumption_date'  => 'date',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(MaterialBatch::class, 'batch_id');
    }

    public function logger(): BelongsTo
    {
        return $this->belongsTo(User::class, 'logged_by');
    }
}
