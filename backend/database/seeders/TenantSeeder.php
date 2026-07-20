<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TenantSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tenant = \App\Models\Tenant::firstOrCreate(
            ['domain' => 'vks'],
            [
                'name' => 'VKS Interior & Exterior',
                'status' => 'active',
                'subscription_ends_at' => now()->addYears(10),
                'subscription_plan' => 'premium',
            ]
        );

        $tables = \Illuminate\Support\Facades\Schema::getTables();
        $ignoredTables = [
            'migrations',
            'password_reset_tokens',
            'personal_access_tokens',
            'failed_jobs',
            'jobs',
            'job_batches',
            'sessions',
            'tenants',
            'cache',
            'cache_locks'
        ];

        foreach ($tables as $table) {
            $tableName = $table['name'];
            if (!in_array($tableName, $ignoredTables)) {
                if (\Illuminate\Support\Facades\Schema::hasColumn($tableName, 'tenant_id')) {
                    \Illuminate\Support\Facades\DB::table($tableName)->update(['tenant_id' => $tenant->id]);
                }
            }
        }
    }
}
