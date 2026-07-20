<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MaterialBatch extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'material_id',
        'batch_number',
        'expiry_date',
        'manufacturing_date',
        'supplier_id',
    ];

    protected $casts = [
        'expiry_date'        => 'date',
        'manufacturing_date' => 'date',
    ];

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'supplier_id');
    }

    public function stocks(): HasMany
    {
        return $this->hasMany(WarehouseStock::class, 'batch_id');
    }
}
