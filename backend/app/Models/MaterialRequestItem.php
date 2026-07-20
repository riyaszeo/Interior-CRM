<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaterialRequestItem extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'material_request_id',
        'material_id',
        'quantity_requested',
        'quantity_approved',
        'notes',
    ];

    protected $casts = [
        'quantity_requested' => 'decimal:2',
        'quantity_approved'  => 'decimal:2',
    ];

    public function request(): BelongsTo
    {
        return $this->belongsTo(MaterialRequest::class, 'material_request_id');
    }

    public function material(): BelongsTo
    {
        return $this->belongsTo(Material::class);
    }
}
