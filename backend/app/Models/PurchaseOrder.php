<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseOrder extends Model
{
    use BelongsToTenant;

    use HasFactory, SoftDeletes;

    protected $fillable = [
        'po_number',
        'vendor_id',
        'project_id',
        'order_date',
        'delivery_date',
        'subtotal',
        'tax_amount',
        'discount',
        'total_amount',
        'status',
        'approved_by',
        'approved_at',
        'notes',
        'terms_conditions',
    ];

    protected $casts = [
        'order_date'    => 'date',
        'delivery_date' => 'date',
        'subtotal'      => 'decimal:2',
        'tax_amount'    => 'decimal:2',
        'discount'      => 'decimal:2',
        'total_amount'  => 'decimal:2',
        'approved_at'   => 'datetime',
    ];

    /**
     * Auto-generate PO number on creation.
     */
    protected static function booted(): void
    {
        static::creating(function (PurchaseOrder $po) {
            if (empty($po->po_number)) {
                $datePart = now()->format('Ymd');
                $latest = static::latest('id')->first();
                $seq = $latest ? $latest->id + 1 : 1;
                $po->po_number = 'PO-' . $datePart . '-' . str_pad((string)$seq, 4, '0', STR_PAD_LEFT);
            }
        });
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function goodsReceiptNotes(): HasMany
    {
        return $this->hasMany(GoodsReceiptNote::class);
    }

    public function purchaseInvoices(): HasMany
    {
        return $this->hasMany(PurchaseInvoice::class);
    }
}
