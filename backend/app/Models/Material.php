<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Material extends Model
{
    use BelongsToTenant;

    use HasFactory, SoftDeletes;

    protected $fillable = [
        'category_id',
        'brand_id',
        'unit_id',
        'name',
        'description',
        'sku',
        'hsn_code',
        'gst_rate',
        'cost_price',
        'purchase_price',
        'selling_price',
        'stock_quantity',
        'reorder_level',
        'unit',
        'barcode',
        'qr_data',
        'is_active',
    ];

    protected $casts = [
        'stock_quantity'  => 'decimal:2',
        'cost_price'      => 'decimal:2',
        'purchase_price'  => 'decimal:2',
        'selling_price'   => 'decimal:2',
        'reorder_level'   => 'decimal:2',
        'gst_rate'        => 'decimal:2',
        'is_active'       => 'boolean',
    ];

    /**
     * Auto-generate barcode and QR data on creation.
     */
    protected static function booted(): void
    {
        static::creating(function (Material $material) {
            // Auto-generate barcode from SKU if not provided
            if (empty($material->barcode) && !empty($material->sku)) {
                $material->barcode = strtoupper(preg_replace('/[^A-Z0-9\-]/', '', $material->sku));
            }

            // Auto-generate QR data JSON
            if (empty($material->qr_data)) {
                $material->qr_data = json_encode([
                    'sku'  => $material->sku,
                    'name' => $material->name,
                ]);
            }

            // Sync unit string column for backward compat
            if (empty($material->unit) && !empty($material->unit_id)) {
                $mu = MaterialUnit::find($material->unit_id);
                if ($mu) {
                    $material->unit = $mu->abbreviation;
                }
            }
        });

        static::updating(function (Material $material) {
            // Sync QR data if SKU/name changed
            if ($material->isDirty(['sku', 'name'])) {
                $material->qr_data = json_encode([
                    'sku'  => $material->sku,
                    'name' => $material->name,
                ]);
            }

            // Sync unit string column
            if ($material->isDirty('unit_id') && !empty($material->unit_id)) {
                $mu = MaterialUnit::find($material->unit_id);
                if ($mu) {
                    $material->unit = $mu->abbreviation;
                }
            }
        });
    }

    // ── Relationships ──────────────────────────────────────────────────────────

    public function category(): BelongsTo
    {
        return $this->belongsTo(MaterialCategory::class, 'category_id');
    }

    public function brand(): BelongsTo
    {
        return $this->belongsTo(MaterialBrand::class, 'brand_id');
    }

    public function unitModel(): BelongsTo
    {
        return $this->belongsTo(MaterialUnit::class, 'unit_id');
    }

    public function materialDispatches(): HasMany
    {
        return $this->hasMany(MaterialDispatch::class);
    }

    public function stocks(): HasMany
    {
        return $this->hasMany(WarehouseStock::class);
    }

    public function batches(): HasMany
    {
        return $this->hasMany(MaterialBatch::class);
    }

    public function ledgers(): HasMany
    {
        return $this->hasMany(StockLedger::class);
    }

    // ── Computed helpers ───────────────────────────────────────────────────────

    /**
     * True when stock is at or below the reorder level.
     */
    public function getNeedsRestockAttribute(): bool
    {
        return (float) $this->stock_quantity <= (float) $this->reorder_level;
    }

    /**
     * Selling price margin as a percentage.
     */
    public function getMarginPercentAttribute(): float
    {
        if ((float) $this->purchase_price <= 0) return 0;
        return round(((float) $this->selling_price - (float) $this->purchase_price) / (float) $this->purchase_price * 100, 2);
    }
}
