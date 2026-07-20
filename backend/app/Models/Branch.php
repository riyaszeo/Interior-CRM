<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    use BelongsToTenant;

    use HasFactory;

    protected $connection = 'central';

    protected $fillable = [
        'name',
        'code',
        'database_name',
        'is_active',
        'company_id'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_branches', 'branch_id', 'user_id');
    }
}
