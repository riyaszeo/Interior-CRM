<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseOrderItem extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'purchase_order_id',
        'material_id',
        'quantity',
        'unit_price',
        'tax_rate',
        'tax_amount',
        'total_amount',
        'received_quantity',
    ];

    protected $casts = [
        'quantity'          => 'decimal:2',
        'unit_price'        => 'decimal:2',
        'tax_rate'          => 'decimal:2',
        'tax_amount'        => 'decimal:2',
        'total_amount'      => 'decimal:2',
        'received_quantity' => 'decimal:2',
    ];

    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }
}
