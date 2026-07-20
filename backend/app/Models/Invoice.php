<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    use BelongsToTenant;

    use HasFactory;

    protected $fillable = [
        'project_id',
        'quotation_id',
        'invoice_number',
        'invoice_type',
        'invoice_date',
        'due_date',
        'payment_terms',
        'subtotal',
        'discount_amount',
        'tax_rate',
        'cgst',
        'sgst',
        'igst',
        'total_gst',
        'total_amount',
        'status',
        'paid_amount',
        'paid_at',
        'notes',
    ];

    protected $casts = [
        'invoice_date'    => 'date',
        'due_date'        => 'date',
        'subtotal'        => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_rate'        => 'decimal:2',
        'cgst'            => 'decimal:2',
        'sgst'            => 'decimal:2',
        'igst'            => 'decimal:2',
        'total_gst'       => 'decimal:2',
        'total_amount'    => 'decimal:2',
        'paid_amount'     => 'decimal:2',
        'paid_at'         => 'datetime',
    ];

    protected static function booted()
    {
        static::creating(function ($invoice) {
            if (empty($invoice->invoice_number)) {
                $date = date('Ymd');
                $latest = static::where('invoice_number', 'like', 'INV-' . $date . '-%')
                    ->latest('id')
                    ->first();
                $seq = $latest ? intval(substr($latest->invoice_number, -4)) + 1 : 1;
                $invoice->invoice_number = 'INV-' . $date . '-' . str_pad($seq, 4, '0', STR_PAD_LEFT);
            }
        });
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(Quotation::class);
    }

    public function items(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(InvoiceItem::class);
    }
}
