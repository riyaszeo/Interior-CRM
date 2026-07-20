<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaterialDispatchItem extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'material_dispatch_id',
        'material_id',
        'batch_id',
        'quantity_dispatched',
        'cost_price',
        'total_cost',
    ];

    protected $casts = [
        'quantity_dispatched' => 'decimal:2',
        'cost_price'          => 'decimal:2',
        'total_cost'          => 'decimal:2',
    ];

    public function dispatch(): BelongsTo
    {
        return $this->belongsTo(MaterialDispatch::class, 'material_dispatch_id');
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(MaterialBatch::class, 'batch_id');
    }
}
