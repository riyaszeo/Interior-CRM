<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Update project_progress_logs table for Customer Approvals ─────
        Schema::table('project_progress_logs', function (Blueprint $table) {
            $table->boolean('customer_approved')->default(false)->after('completion_percent');
            $table->dateTime('customer_approved_at')->nullable()->after('customer_approved');
            $table->text('customer_feedback')->nullable()->after('customer_approved_at');
        });

        // ── 2. Create Material Consumptions Table ─────────────────────────────
        Schema::create('material_consumptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('warehouse_id')->constrained('warehouses')->onDelete('cascade');
            $table->foreignId('material_id')->constrained('materials')->onDelete('cascade');
            $table->foreignId('batch_id')->nullable()->constrained('material_batches')->onDelete('set null');
            $table->decimal('quantity_consumed', 12, 2);
            $table->date('consumption_date');
            $table->foreignId('logged_by')->constrained('users')->onDelete('cascade');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // ── 3. Create Worker Attendances Table ───────────────────────────────
        Schema::create('worker_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->string('worker_name');
            $table->string('worker_type'); // e.g. carpenter, painter, electrician, helper
            $table->date('attendance_date');
            $table->string('status'); // present, absent, half_day
            $table->foreignId('logged_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });

        // ── 4. Create Site Expenses Table ────────────────────────────────────
        Schema::create('site_expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->string('title');
            $table->decimal('amount', 12, 2);
            $table->date('expense_date');
            $table->string('category'); // petty_purchase, food, transport, tools, other
            $table->string('status')->default('pending'); // pending, approved, rejected
            $table->string('receipt_path')->nullable();
            $table->foreignId('logged_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_expenses');
        Schema::dropIfExists('worker_attendances');
        Schema::dropIfExists('material_consumptions');

        Schema::table('project_progress_logs', function (Blueprint $table) {
            $table->dropColumn(['customer_approved', 'customer_approved_at', 'customer_feedback']);
        });
    }
};
