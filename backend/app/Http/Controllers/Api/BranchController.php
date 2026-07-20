<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class BranchController extends Controller
{
    use ApiResponse;

    /**
     * Display a listing of branches.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->company_id === 1) {
            if ($user->hasRole('Super Admin')) {
                $branches = Branch::with('company')->orderBy('name')->get();
            } else {
                $branches = $user->branches()->where('is_active', true)->orderBy('name')->get();
            }
        } else {
            // Separate Company (Tenant)
            $branches = Branch::where('company_id', $user->company_id)->orderBy('name')->get();
        }

        return $this->successResponse($branches, 'Branches retrieved successfully.');
    }

    /**
     * Store a newly created branch or separate company.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user->company_id !== 1 || !$user->hasRole('Super Admin')) {
            return $this->errorResponse('Unauthorized. Only platform Super Admins can manage branches and SaaS companies.', null, 403);
        }

        $v = Validator::make($request->all(), [
            'type' => 'required|string|in:branch,company',
            // Branch fields
            'name' => 'required_if:type,branch|nullable|string|max:255',
            'code' => 'required|string|unique:branches,code|max:20',
            'is_active' => 'boolean',
            // Company/SaaS fields
            'company_name' => 'required_if:type,company|nullable|string|max:255',
            'email' => 'required_if:type,company|nullable|email|unique:users,email|max:255',
            'license_type' => 'required_if:type,company|nullable|string|in:basic,premium,enterprise',
            'expiry_date' => 'required_if:type,company|nullable|date',
            'contact_no' => 'nullable|string|max:50',
            'address' => 'nullable|string',
        ]);

        if ($v->fails()) {
            return $this->validationErrorResponse($v->errors());
        }

        $data = $v->validated();

        if ($data['type'] === 'branch') {
            $branch = Branch::create([
                'name' => $data['name'],
                'code' => $data['code'],
                'is_active' => $data['is_active'] ?? true,
                'company_id' => $user->company_id,
            ]);

            $branch->database_name = 'database_branch_' . $branch->id;
            $branch->save();

            try {
                $this->initializeDatabase($branch);
            } catch (\Exception $e) {
                return $this->errorResponse('Branch created, but failed to initialize its database: ' . $e->getMessage(), $branch, 500);
            }

            return $this->successResponse($branch, 'Branch created and database initialized successfully.', 201);
        } else {
            // Create Separate Company
            $company = \App\Models\Company::create([
                'name' => $data['company_name'],
                'email' => $data['email'],
                'contact_no' => $data['contact_no'] ?? null,
                'address' => $data['address'] ?? null,
                'license_type' => $data['license_type'],
                'expiry_date' => $data['expiry_date'],
                'license_status' => 'active',
            ]);

            // Create a default branch for this company
            $branch = Branch::create([
                'name' => 'Main Branch (' . $company->name . ')',
                'code' => $data['code'],
                'is_active' => true,
                'company_id' => $company->id,
            ]);
            $branch->database_name = 'database_branch_' . $branch->id;
            $branch->save();

            try {
                $this->initializeDatabase($branch);
            } catch (\Exception $e) {
                return $this->errorResponse('Company created, but failed to initialize default branch database: ' . $e->getMessage(), $company, 500);
            }

            // Create Super Admin for separate company
            $newAdminUser = User::create([
                'name' => $company->name . ' Admin',
                'email' => $data['email'],
                'password' => bcrypt('password123'), // default password
                'company_id' => $company->id,
            ]);

            $newAdminUser->assignRole('Super Admin');
            $newAdminUser->branches()->sync([$branch->id]);

            return $this->successResponse($company, 'Separate SaaS Company created and default database initialized successfully.', 201);
        }
    }

    /**
     * Helper to initialize branch database and run migrations
     */
    private function initializeDatabase(Branch $branch): void
    {
        $driver = env('DB_CONNECTION', 'sqlite');
        if ($driver === 'sqlite') {
            $dbPath = database_path('database_branch_' . $branch->id . '.sqlite');
            if (!file_exists($dbPath)) {
                touch($dbPath);
            }
            Config::set('database.connections.tenant.driver', 'sqlite');
            Config::set('database.connections.tenant.database', $dbPath);
        } else {
            Config::set('database.connections.tenant.driver', $driver);
            Config::set('database.connections.tenant.host', env('DB_HOST', '127.0.0.1'));
            Config::set('database.connections.tenant.port', env('DB_PORT', '3306'));
            Config::set('database.connections.tenant.database', env('DB_DATABASE', 'laravel') . '_branch_' . $branch->id);
            Config::set('database.connections.tenant.username', env('DB_USERNAME', 'root'));
            Config::set('database.connections.tenant.password', env('DB_PASSWORD', ''));
        }

        Config::set('database.connections.tenant.foreign_key_constraints', false);
        DB::purge('tenant');
        DB::reconnect('tenant');

        try {
            DB::connection('tenant')->statement('PRAGMA foreign_keys = OFF;');
        } catch (\Exception $e) {}

        // Run migrations
        Artisan::call('migrate', [
            '--database' => 'tenant',
            '--path' => 'database/migrations',
            '--force' => true,
        ]);
    }

    /**
     * Update the specified branch.
     */
    public function update(Request $request, $id): JsonResponse
    {
        if (!$request->user()->hasRole('Super Admin')) {
            return $this->errorResponse('Unauthorized. Only Super Admins can manage branches.', null, 403);
        }

        $branch = Branch::findOrFail($id);

        $v = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:20|unique:branches,code,' . $branch->id,
            'is_active' => 'boolean',
        ]);

        if ($v->fails()) {
            return $this->validationErrorResponse($v->errors());
        }

        $branch->update($v->validated());

        return $this->successResponse($branch, 'Branch updated successfully.');
    }

    /**
     * Remove the specified branch.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        if (!$request->user()->hasRole('Super Admin')) {
            return $this->errorResponse('Unauthorized. Only Super Admins can manage branches.', null, 403);
        }

        $branch = Branch::findOrFail($id);
        $branch->delete();

        return $this->successResponse(null, 'Branch deleted successfully.');
    }

    /**
     * Get users and their branch mapping lists.
     */
    public function usersList(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->hasRole('Super Admin')) {
            return $this->errorResponse('Unauthorized.', null, 403);
        }

        if ($user->company_id === 1) {
            $users = User::with('branches')->orderBy('name')->get();
        } else {
            $users = User::where('company_id', $user->company_id)->with('branches')->orderBy('name')->get();
        }

        return $this->successResponse($users, 'Central users list retrieved successfully.');
    }

    /**
     * Assign branches to a user.
     */
    public function assignBranches(Request $request, $userId): JsonResponse
    {
        if (!$request->user()->hasRole('Super Admin')) {
            return $this->errorResponse('Unauthorized.', null, 403);
        }

        $user = User::findOrFail($userId);

        $v = Validator::make($request->all(), [
            'branch_ids' => 'present|array',
            'branch_ids.*' => 'integer|exists:branches,id',
        ]);

        if ($v->fails()) {
            return $this->validationErrorResponse($v->errors());
        }

        $user->branches()->sync($request->input('branch_ids'));

        return $this->successResponse($user->load('branches'), 'User branches updated successfully.');
    }

    /**
     * Fetch warehouses of a specific branch.
     */
    public function getBranchWarehouses(Request $request, $branchId): JsonResponse
    {
        $branch = Branch::findOrFail($branchId);

        // Store current connection config so we can switch back
        $originalDefault = Config::get('database.default');
        
        $driver = env('DB_CONNECTION', 'sqlite');
        
        // Dynamically point to target branch DB
        if ($driver === 'sqlite') {
            $dbPath = database_path('database_branch_' . $branch->id . '.sqlite');
            if (!file_exists($dbPath)) {
                touch($dbPath);
            }
            Config::set('database.connections.tenant.driver', 'sqlite');
            Config::set('database.connections.tenant.database', $dbPath);
        } else {
            Config::set('database.connections.tenant.driver', $driver);
            Config::set('database.connections.tenant.host', env('DB_HOST', '127.0.0.1'));
            Config::set('database.connections.tenant.port', env('DB_PORT', '3306'));
            Config::set('database.connections.tenant.database', env('DB_DATABASE', 'laravel') . '_branch_' . $branch->id);
            Config::set('database.connections.tenant.username', env('DB_USERNAME', 'root'));
            Config::set('database.connections.tenant.password', env('DB_PASSWORD', ''));
        }

        Config::set('database.connections.tenant.foreign_key_constraints', false);
        Config::set('database.default', 'tenant');
        DB::purge('tenant');
        DB::reconnect('tenant');

        try {
            DB::connection('tenant')->statement('PRAGMA foreign_keys = OFF;');
        } catch (\Exception $e) {}

        // Check if warehouses table exists, if not initialize it
        if (!Schema::connection('tenant')->hasTable('warehouses')) {
            Artisan::call('migrate', [
                '--database' => 'tenant',
                '--path' => 'database/migrations',
                '--force' => true,
            ]);
        }

        $warehouses = DB::connection('tenant')->table('warehouses')
            ->whereNull('deleted_at')
            ->where('is_active', 1)
            ->orderBy('name')
            ->get(['id', 'name', 'location']);

        // Switch back to original connection
        Config::set('database.default', $originalDefault);
        DB::purge($originalDefault);
        DB::reconnect($originalDefault);

        return $this->successResponse($warehouses, 'Warehouses retrieved for branch.');
    }
}
