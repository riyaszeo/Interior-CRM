<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    use BelongsToTenant;

    use HasFactory;

    protected $connection = 'central';

    protected $fillable = [
        'name',
        'address',
        'gstn',
        'contact_no',
        'email',
        'website',
        'logo_path',
        'license_type',
        'expiry_date',
        'license_status',
    ];

    protected $casts = [
        'expiry_date' => 'date',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
