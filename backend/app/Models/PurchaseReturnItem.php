<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseReturnItem extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'purchase_return_id',
        'material_id',
        'quantity',
        'unit_price',
        'refund_amount',
    ];

    protected $casts = [
        'quantity'      => 'decimal:2',
        'unit_price'    => 'decimal:2',
        'refund_amount' => 'decimal:2',
    ];

    public function purchaseReturn(): BelongsTo
    {
        return $this->belongsTo(PurchaseReturn::class);
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }
}
