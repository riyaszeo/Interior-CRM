<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InvoiceItem extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'invoice_id',
        'description',
        'hsn_code',
        'quantity',
        'unit_price',
        'total_price',
        'gst_rate',
        'gst_amount',
    ];

    protected $casts = [
        'quantity'    => 'decimal:2',
        'unit_price'  => 'decimal:2',
        'total_price' => 'decimal:2',
        'gst_rate'    => 'decimal:2',
        'gst_amount'  => 'decimal:2',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}
