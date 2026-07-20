<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GoodsReceiptNoteItem extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'goods_receipt_note_id',
        'purchase_order_item_id',
        'material_id',
        'quantity_ordered',
        'quantity_received',
        'quantity_accepted',
        'quantity_rejected',
        'rejection_reason',
    ];

    protected $casts = [
        'quantity_ordered'  => 'decimal:2',
        'quantity_received' => 'decimal:2',
        'quantity_accepted' => 'decimal:2',
        'quantity_rejected' => 'decimal:2',
    ];

    public function goodsReceiptNote(): BelongsTo
    {
        return $this->belongsTo(GoodsReceiptNote::class);
    }

    public function purchaseOrderItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrderItem::class);
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }
}
