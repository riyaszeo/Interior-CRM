<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MaterialUnit extends Model
{
    use BelongsToTenant;

    protected $fillable = ['name', 'abbreviation'];

    public function materials(): HasMany
    {
        return $this->hasMany(Material::class, 'unit_id');
    }
}
