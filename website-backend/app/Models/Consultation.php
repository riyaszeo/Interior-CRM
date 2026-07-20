<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Consultation extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'mobile',
        'email',
        'city',
        'property_type',
        'budget',
        'area_sqft',
        'service_type',
        'preferred_date',
        'message',
        'status',
    ];
}
