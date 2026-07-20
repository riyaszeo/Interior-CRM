<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockLedger extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'warehouse_id',
        'material_id',
        'batch_id',
        'transaction_type',
        'quantity',
        'reference_type',
        'reference_id',
        'notes',
        'transaction_date',
    ];

    protected $casts = [
        'quantity'         => 'decimal:2',
        'transaction_date' => 'date',
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
}
