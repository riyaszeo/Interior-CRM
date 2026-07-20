<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TenantController extends Controller
{
    use ApiResponse;

    public function index()
    {
        $tenants = Tenant::orderBy('created_at', 'desc')->get();
        return $this->successResponse($tenants, 'Tenants retrieved successfully.');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'domain' => 'nullable|string|unique:tenants,domain|max:255',
            'subscription_plan' => 'required|string|in:trial,standard,premium',
            'admin_email' => 'required|email|unique:users,email',
            'admin_password' => 'required|string|min:8',
        ]);

        try {
            DB::beginTransaction();

            $expiry = now()->addYears(1);
            if ($request->subscription_plan === 'trial') {
                $expiry = now()->addDays(14);
            }

            $tenant = Tenant::create([
                'name' => $request->name,
                'domain' => $request->domain ?? Str::slug($request->name),
                'status' => 'active',
                'subscription_plan' => $request->subscription_plan,
                'subscription_ends_at' => $expiry,
            ]);

            // Temporarily skip tenant scope for user creation
            $user = new User();
            $user->name = $request->name . ' Admin';
            $user->email = $request->admin_email;
            $user->password = Hash::make($request->admin_password);
            $user->tenant_id = $tenant->id;
            $user->save();

            DB::commit();

            return $this->successResponse($tenant, 'Tenant and Admin User created successfully.', 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->errorResponse('Failed to create tenant: ' . $e->getMessage(), null, 500);
        }
    }

    public function update(Request $request, Tenant $tenant)
    {
        $request->validate([
            'status' => 'nullable|string|in:active,suspended,expired',
            'subscription_plan' => 'nullable|string|in:trial,standard,premium',
            'extend_days' => 'nullable|integer',
        ]);

        if ($request->has('status')) {
            $tenant->status = $request->status;
        }

        if ($request->has('subscription_plan')) {
            $tenant->subscription_plan = $request->subscription_plan;
        }

        if ($request->has('extend_days') && $request->extend_days > 0) {
            $currentExpiry = $tenant->subscription_ends_at ? $tenant->subscription_ends_at : now();
            $tenant->subscription_ends_at = $currentExpiry->addDays($request->extend_days);
            // If they are expired and we extended, reactivate them automatically
            if ($tenant->status === 'expired') {
                $tenant->status = 'active';
            }
        }

        $tenant->save();

        return $this->successResponse($tenant, 'Tenant updated successfully.');
    }
}
