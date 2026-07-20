<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MaterialDispatch extends Model
{
    use BelongsToTenant;

    use HasFactory;

    protected $fillable = [
        'dispatch_number',
        'material_request_id',
        'project_id',
        'warehouse_id',
        'dispatched_by',
        'dispatched_at',
        'vehicle_number',
        'driver_name',
        'driver_phone',
        'receiver_name',
        'receiver_phone',
        'delivery_status',
        'delivery_notes',
        'delivery_date',
        'total_cost',
    ];

    protected $casts = [
        'dispatched_at' => 'datetime',
        'delivery_date' => 'datetime',
        'total_cost'    => 'decimal:2',
    ];

    protected static function booted(): void
    {
        static::creating(function (MaterialDispatch $md) {
            if (empty($md->dispatch_number)) {
                $latest = static::latest('id')->first();
                $seq = $latest ? $latest->id + 1 : 1;
                $md->dispatch_number = 'MD-' . now()->format('Ymd') . '-' . str_pad((string)$seq, 4, '0', STR_PAD_LEFT);
            }
        });
    }

    public function request(): BelongsTo
    {
        return $this->belongsTo(MaterialRequest::class, 'material_request_id');
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function dispatcher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dispatched_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(MaterialDispatchItem::class);
    }
}
