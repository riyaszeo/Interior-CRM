<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class TenantScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        // For CLI or Jobs, check if a global tenant ID is set via a singleton/config
        if (app()->bound('current_tenant_id')) {
            $builder->where($model->getTable() . '.tenant_id', app('current_tenant_id'));
            return;
        }

        // Check if there is an authenticated user
        if (Auth::check()) {
            $user = Auth::user();
            
            // If the user has a tenant_id, apply the scope
            if ($user->tenant_id) {
                $builder->where($model->getTable() . '.tenant_id', $user->tenant_id);
            }
        }
    }
}
