<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaterialCategory extends Model
{
    use BelongsToTenant;

    protected $fillable = ['name', 'description', 'color', 'parent_id'];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(MaterialCategory::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(MaterialCategory::class, 'parent_id');
    }

    public function materials(): HasMany
    {
        return $this->hasMany(Material::class, 'category_id');
    }
}
