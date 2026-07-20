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
        if (!Schema::connection('central')->hasColumn('companies', 'license_type')) {
            Schema::connection('central')->table('companies', function (Blueprint $table) {
                $table->string('license_type')->default('basic');
                $table->date('expiry_date')->nullable();
                $table->string('license_status')->default('active'); // active, suspended, expired
            });
        }

        if (!Schema::connection('central')->hasColumn('branches', 'company_id')) {
            Schema::connection('central')->table('branches', function (Blueprint $table) {
                $table->foreignId('company_id')->nullable()->constrained('companies')->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('central')->table('branches', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropColumn('company_id');
        });

        Schema::connection('central')->table('companies', function (Blueprint $table) {
            $table->dropColumn(['license_type', 'expiry_date', 'license_status']);
        });
    }
};
