<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Quotation extends Model
{
    use BelongsToTenant;

    use HasFactory, SoftDeletes;

    protected $fillable = [
        'qtn_number',
        'customer_id',
        'project_id',
        'title',
        'status',
        'subtotal',
        'gst_rate',
        'gst_amount',
        'discount_amount',
        'labor_charges',
        'additional_charges',
        'total',
        'terms_conditions',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'gst_rate' => 'decimal:2',
        'gst_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'labor_charges' => 'decimal:2',
        'additional_charges' => 'decimal:2',
        'total' => 'decimal:2',
    ];

    /**
     * Auto generate unique quotation number prefixing date index on creation.
     */
    protected static function booted()
    {
        static::creating(function ($quotation) {
            if (empty($quotation->qtn_number)) {
                $datePrefix = 'QTN-' . date('Ymd');
                
                // Get the latest number generated today
                $latest = static::where('qtn_number', 'like', "{$datePrefix}-%")
                    ->withTrashed()
                    ->latest('id')
                    ->first();

                if ($latest) {
                    // Extract serial suffix and increment
                    $serialStr = substr($latest->qtn_number, -4);
                    $num = intval($serialStr) + 1;
                } else {
                    $num = 1;
                }

                $quotation->qtn_number = $datePrefix . '-' . str_pad($num, 4, '0', STR_PAD_LEFT);
            }
        });
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(QuotationItem::class);
    }
}
