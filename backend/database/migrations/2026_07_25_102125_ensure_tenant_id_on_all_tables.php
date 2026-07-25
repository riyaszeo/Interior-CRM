<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
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
            'cache_locks',
            'roles',
            'permissions',
            'model_has_permissions',
            'model_has_roles',
            'role_has_permissions'
        ];

        foreach ($tables as $table) {
            $tableName = $table['name'];
            
            if (in_array($tableName, $ignoredTables)) {
                continue;
            }

            if (!Schema::hasColumn($tableName, 'tenant_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    // For SQLite, we just add the column without foreign key to avoid crashes
                    $table->unsignedBigInteger('tenant_id')->nullable();
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Handled manually or in previous migrations
    }
};
