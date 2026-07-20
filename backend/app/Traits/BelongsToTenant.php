<?php

namespace App\Traits;

use App\Scopes\TenantScope;
use Illuminate\Support\Facades\Auth;

trait BelongsToTenant
{
    /**
     * Boot the BelongsToTenant trait for a model.
     */
    protected static function bootBelongsToTenant(): void
    {
        // Add the global scope to filter by tenant_id
        static::addGlobalScope(new TenantScope);

        // When creating a model, automatically assign the tenant_id
        static::creating(function ($model) {
            if (!$model->tenant_id) {
                if (app()->bound('current_tenant_id')) {
                    $model->tenant_id = app('current_tenant_id');
                } elseif (Auth::check() && Auth::user()->tenant_id) {
                    $model->tenant_id = Auth::user()->tenant_id;
                }
            }
        });
    }

    /**
     * Relationship to the Tenant model
     */
    public function tenant()
    {
        return $this->belongsTo(\App\Models\Tenant::class);
    }
}
