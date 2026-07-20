<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ActivityLog;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use ApiResponse;

    /**
     * Authenticate user and return token.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return $this->errorResponse('Invalid email or password.', null, 401);
        }

        // 1. Verify SaaS Subscription status for separate companies
        if ($user->tenant_id) {
            $tenant = $user->tenant;
            if ($tenant) {
                if ($tenant->status === 'suspended') {
                    return $this->errorResponse('Your subscription has been suspended. Please contact support.', null, 403);
                }

                if ($tenant->status === 'expired' || ($tenant->subscription_ends_at && $tenant->subscription_ends_at->isPast())) {
                    return $this->errorResponse('Your subscription has expired. Please renew your license.', null, 402);
                }
            }
        }

        // Revoke existing tokens if any
        $user->tokens()->delete();

        // Create token
        $token = $user->createToken('auth_token')->plainTextToken;

        // Get roles and permissions
        $roles = $user->getRoleNames(); // Spatie collection
        $permissions = $user->getAllPermissions()->pluck('name');

        if ($user->tenant_id === 1) {
            if ($user->hasRole('Super Admin')) {
                $branches = \App\Models\Branch::where('is_active', true)->get(['id', 'name', 'code']);
            } else {
                $branches = $user->branches()->where('is_active', true)->get(['branches.id', 'branches.name', 'branches.code']);
            }
        } else {
            // Separate Company (Tenant)
            if ($user->hasRole('Super Admin')) {
                $branches = \App\Models\Branch::where('tenant_id', $user->tenant_id)->where('is_active', true)->get(['id', 'name', 'code']);
            } else {
                $branches = $user->branches()->where('is_active', true)->get(['branches.id', 'branches.name', 'branches.code']);
            }
        }

        // Log this login event
        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'LOGIN',
            'description' => "User {$user->email} logged in successfully.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return $this->successResponse([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'company_id' => $user->company_id, // Keeping for backward compatibility
                'tenant_id' => $user->tenant_id,
            ],
            'token' => $token,
            'roles' => $roles,
            'permissions' => $permissions,
            'branches' => $branches,
        ], 'Logged in successfully.');
    }

    /**
     * Log the user out (Revoke token).
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            // Log logout action before deleting token
            ActivityLog::create([
                'user_id' => $user->id,
                'action' => 'LOGOUT',
                'description' => "User {$user->email} logged out.",
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            $user->currentAccessToken()->delete();
        }

        return $this->successResponse(null, 'Logged out successfully.');
    }

    /**
     * Send password reset request (Mock).
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)->first();

        if (! $user) {
            return $this->errorResponse('User with this email does not exist.', null, 404);
        }

        // Generate a mock reset token
        $mockToken = bin2hex(random_bytes(20));

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'FORGOT_PASSWORD',
            'description' => "User {$user->email} requested password reset. Reset token generated: {$mockToken}.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return $this->successResponse([
            'email' => $user->email,
            'reset_token' => $mockToken, // For simulation/demo purposes
        ], 'Password reset link and token generated successfully.');
    }

    /**
     * Reset user password (Mock).
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::where('email', $request->email)->first();

        // Update password
        $user->password = Hash::make($request->password);
        $user->save();

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'RESET_PASSWORD',
            'description' => "User {$user->email} successfully reset their password.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return $this->successResponse(null, 'Password has been reset successfully.');
    }

    /**
     * Update user profile (name and email).
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $user->id,
        ]);

        $user->name = $request->name;
        $user->email = $request->email;
        $user->save();

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'UPDATE_PROFILE',
            'description' => "User {$user->email} updated their profile details.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return $this->successResponse([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'company_id' => $user->company_id,
        ], 'Profile updated successfully.');
    }

    /**
     * Change user password.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();

        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($request->current_password, $user->password)) {
            return $this->errorResponse('Current password does not match.', null, 422);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        ActivityLog::create([
            'user_id' => $user->id,
            'action' => 'CHANGE_PASSWORD',
            'description' => "User {$user->email} changed their password.",
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return $this->successResponse(null, 'Password changed successfully.');
    }
}
