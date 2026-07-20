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
            'cache_locks'
        ];

        foreach ($tables as $table) {
            $tableName = $table['name'];
            
            if (in_array($tableName, $ignoredTables)) {
                continue;
            }

            if (!Schema::hasColumn($tableName, 'tenant_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->unsignedBigInteger('tenant_id')->nullable()->after('id');
                    $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
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
            'cache_locks'
        ];

        foreach ($tables as $table) {
            $tableName = $table['name'];
            
            if (in_array($tableName, $ignoredTables)) {
                continue;
            }

            if (Schema::hasColumn($tableName, 'tenant_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropForeign(['tenant_id']);
                    $table->dropColumn('tenant_id');
                });
            }
        }
    }
};
