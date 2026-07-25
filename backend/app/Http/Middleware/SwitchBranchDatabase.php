<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Artisan;
use Symfony\Component\HttpFoundation\Response;

class SwitchBranchDatabase
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Resolve user via Sanctum if not already resolved (needed since global middleware runs before route middleware)
        if (!$request->user() && $request->bearerToken()) {
            $user = auth('sanctum')->user();
            if ($user) {
                $request->setUserResolver(fn() => $user);
            }
        }

        $user = $request->user();

        // 1. Verify SaaS Subscription/License status for separate companies
        if ($user && $user->company_id) {
            $company = $user->company;
            if ($company) {
                if ($company->license_status === 'suspended') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Your subscription has been suspended. Please contact support.',
                        'data' => null,
                    ], 403);
                }

                if ($company->license_status === 'expired' || ($company->expiry_date && $company->expiry_date->isPast())) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Your subscription has expired. Please renew your license.',
                        'data' => null,
                    ], 402);
                }
            }
        }

        $branchId = $request->header('X-Branch-ID') ?: $request->input('branch_id');

        // Fallback: If no branch is specified, check if user is authenticated and assign first branch
        if (!$branchId && $user) {
            if ($user->company_id === 1 && $user->hasRole('Super Admin')) {
                $firstBranch = Branch::where('is_active', true)->first();
                $branchId = $firstBranch ? $firstBranch->id : null;
            } else {
                // If it's a separate company, fallback to their first branch
                if ($user->company_id !== 1) {
                    $firstBranch = Branch::where('company_id', $user->company_id)->where('is_active', true)->first();
                } else {
                    $firstBranch = $user->branches()->where('is_active', true)->first();
                }
                $branchId = $firstBranch ? $firstBranch->id : null;
            }
        }

        if ($branchId) {
            $branch = Branch::find($branchId);

            if (!$branch || !$branch->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Selected branch is invalid or inactive.',
                    'data' => null,
                ], 403);
            }

            // 2. Verify Company Isolation (Users can only access branches in their own company)
            if ($user && $user->company_id !== 1) {
                if ($branch->company_id !== $user->company_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You do not have permission to access this branch.',
                        'data' => null,
                    ], 403);
                }
            }

            // Verify user branch access for branch-level mapping (skip for super admin or users in separate companies who own the tenant)
            if ($user && $user->company_id === 1 && !$user->hasRole('Super Admin')) {
                $hasAccess = $user->branches()->where('branches.id', $branch->id)->exists();
                if (!$hasAccess) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You do not have permission to access this branch.',
                        'data' => null,
                    ], 403);
                }
            }

            // Configure tenant connection details dynamically
            // In the new single-database architecture with tenant_id, we DO NOT switch databases per branch.
            // All data resides in the central database and is isolated via TenantScope.
            // We just ensure the 'tenant' connection points to the same database as 'mysql' / 'central'.
            
            $driver = env('DB_CONNECTION', 'mysql');
            
            Config::set('database.connections.tenant', Config::get('database.connections.' . $driver));
            Config::set('database.default', 'tenant');
            DB::purge('tenant');
            DB::reconnect('tenant');
        }

        return $next($request);
    }
}
