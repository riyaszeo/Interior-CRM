<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Define permissions
        $permissions = [
            'projects:view',
            'projects:create',
            'projects:edit',
            'projects:delete',
            'inventory:view',
            'inventory:create',
            'inventory:dispatch',
            'purchase_orders:view',
            'purchase_orders:create',
            'purchase_orders:approve',
            'purchase_orders:receive',
            'quotations:view',
            'quotations:create',
            'quotations:approve',
            'invoices:view',
            'invoices:create',
            'invoices:pay',
            'activity_logs:view',
            'site_progress:create',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission);
        }

        // 2. Create roles and assign permissions
        
        // Super Admin
        $superAdminRole = Role::findOrCreate('Super Admin');
        $superAdminRole->givePermissionTo(Permission::all());

        // Project Manager
        $projectManagerRole = Role::findOrCreate('Project Manager');
        $projectManagerRole->givePermissionTo([
            'projects:view',
            'projects:create',
            'projects:edit',
            'quotations:view',
            'quotations:create',
            'quotations:approve',
            'invoices:view',
            'purchase_orders:view',
            'site_progress:create',
        ]);

        // Purchase Manager
        $purchaseManagerRole = Role::findOrCreate('Purchase Manager');
        $purchaseManagerRole->givePermissionTo([
            'purchase_orders:view',
            'purchase_orders:create',
            'purchase_orders:approve',
            'inventory:view',
        ]);

        // Store Manager
        $storeManagerRole = Role::findOrCreate('Store Manager');
        $storeManagerRole->givePermissionTo([
            'inventory:view',
            'inventory:create',
            'inventory:dispatch',
            'purchase_orders:view',
            'purchase_orders:receive',
        ]);

        // Sales Executive
        $salesRole = Role::findOrCreate('Sales Executive');
        $salesRole->givePermissionTo([
            'quotations:view',
            'quotations:create',
            'projects:view',
        ]);

        // Accountant
        $accountantRole = Role::findOrCreate('Accountant');
        $accountantRole->givePermissionTo([
            'invoices:view',
            'invoices:create',
            'invoices:pay',
            'purchase_orders:view',
        ]);

        // Site Engineer
        $engineerRole = Role::findOrCreate('Site Engineer');
        $engineerRole->givePermissionTo([
            'projects:view',
            'site_progress:create',
            'inventory:dispatch',
        ]);

        // Supervisor
        $supervisorRole = Role::findOrCreate('Supervisor');
        $supervisorRole->givePermissionTo([
            'projects:view',
            'site_progress:create',
        ]);

        // 3. Create users and assign roles
        $usersData = [
            [
                'name' => 'Super Admin User',
                'email' => 'superadmin@interior.com',
                'role' => 'Super Admin',
            ],
            [
                'name' => 'Project Manager User',
                'email' => 'projectmanager@interior.com',
                'role' => 'Project Manager',
            ],
            [
                'name' => 'Purchase Manager User',
                'email' => 'purchasemanager@interior.com',
                'role' => 'Purchase Manager',
            ],
            [
                'name' => 'Store Manager User',
                'email' => 'storemanager@interior.com',
                'role' => 'Store Manager',
            ],
            [
                'name' => 'Sales Executive User',
                'email' => 'sales@interior.com',
                'role' => 'Sales Executive',
            ],
            [
                'name' => 'Accountant User',
                'email' => 'accountant@interior.com',
                'role' => 'Accountant',
            ],
            [
                'name' => 'Site Engineer User',
                'email' => 'engineer@interior.com',
                'role' => 'Site Engineer',
            ],
            [
                'name' => 'Supervisor User',
                'email' => 'supervisor@interior.com',
                'role' => 'Supervisor',
            ],
        ];

        $company = \App\Models\Company::first();

        if (!$company) {
            $company = \App\Models\Company::create([
                'name' => 'VKS Interior and Exterior',
                'email' => 'contact@vksinterior.com',
                'address' => 'SF NO 637/1 Door No 2/316 VKS Interior & Exterior Punitha Garden, Vadavalli Coimbatore-641041',
                'gstn' => '33AFBPY9446C1ZB',
                'contact_no' => '+91 80566 59199',
            ]);
        }

        $branch1 = \App\Models\Branch::updateOrCreate(
            ['code' => 'MAIN'],
            ['name' => 'Main Branch', 'database_name' => 'database_branch_1', 'is_active' => true]
        );

        $branch2 = \App\Models\Branch::updateOrCreate(
            ['code' => 'SEC'],
            ['name' => 'Secondary Branch', 'database_name' => 'database_branch_2', 'is_active' => true]
        );

        foreach ($usersData as $userData) {
            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'password' => bcrypt('password123'),
                    'company_id' => $company->id,
                ]
            );
            $user->syncRoles([$userData['role']]);
            $user->branches()->sync([$branch1->id, $branch2->id]);
        }
    }
}
