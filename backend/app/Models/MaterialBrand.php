<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MaterialBrand extends Model
{
    use BelongsToTenant;

    protected $fillable = ['name', 'description'];

    public function materials(): HasMany
    {
        return $this->hasMany(Material::class, 'brand_id');
    }
}
