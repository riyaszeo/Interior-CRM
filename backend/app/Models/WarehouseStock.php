<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WarehouseStock extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'warehouse_id',
        'material_id',
        'batch_id',
        'opening_stock',
        'current_stock',
        'reserved_stock',
    ];

    protected $casts = [
        'opening_stock'  => 'decimal:2',
        'current_stock'  => 'decimal:2',
        'reserved_stock' => 'decimal:2',
    ];

    protected $appends = [
        'available_stock',
    ];

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

    /**
     * Compute available stock level: current - reserved.
     */
    public function getAvailableStockAttribute(): float
    {
        return (float) $this->current_stock - (float) $this->reserved_stock;
    }
}
