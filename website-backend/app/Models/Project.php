<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'category',
        'slug',
        'description',
        'area_sqft',
        'location',
        'budget',
        'completion_date',
        'materials_used',
        'testimonial',
        'images',
        'before_after',
    ];

    protected $casts = [
        'materials_used' => 'array',
        'testimonial' => 'array',
        'images' => 'array',
        'before_after' => 'array',
        'completion_date' => 'date',
    ];
}
