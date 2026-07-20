<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Permission;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RolePermissionController extends Controller
{
    use ApiResponse;

    /**
     * Display a listing of roles with permissions.
     */
    public function index(Request $request): JsonResponse
    {
        if (!$request->user()->hasRole('Super Admin')) {
            return $this->errorResponse('Unauthorized. Only Super Admins can manage roles and permissions.', null, 403);
        }

        $roles = Role::with('permissions')->orderBy('name')->get();

        return $this->successResponse($roles, 'Roles and permissions retrieved successfully.');
    }

    /**
     * Display a listing of all system permissions.
     */
    public function permissions(Request $request): JsonResponse
    {
        if (!$request->user()->hasRole('Super Admin')) {
            return $this->errorResponse('Unauthorized.', null, 403);
        }

        $permissions = Permission::orderBy('name')->get();

        return $this->successResponse($permissions, 'All permissions retrieved successfully.');
    }

    /**
     * Sync permissions to a role.
     */
    public function syncPermissions(Request $request, $roleId): JsonResponse
    {
        if (!$request->user()->hasRole('Super Admin')) {
            return $this->errorResponse('Unauthorized. Only Super Admins can manage permissions.', null, 403);
        }

        $role = Role::findOrFail($roleId);

        $v = Validator::make($request->all(), [
            'permissions' => 'present|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        if ($v->fails()) {
            return $this->validationErrorResponse($v->errors());
        }

        $role->syncPermissions($request->input('permissions'));

        // Reset Spatie's permission cache so it reloads immediately
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return $this->successResponse($role->load('permissions'), 'Role permissions synced successfully.');
    }
}
