<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Drop old table ────────────────────────────────────────────────
        Schema::dropIfExists('material_dispatches');

        // ── 2. Material Requests Table ───────────────────────────────────────
        Schema::create('material_requests', function (Blueprint $table) {
            $table->id();
            $table->string('request_number')->unique();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('warehouse_id')->constrained('warehouses')->onDelete('cascade');
            $table->foreignId('requested_by')->constrained('users')->onDelete('cascade');
            $table->string('status')->default('draft'); // draft, pending_approval, approved, rejected, dispatched, cancelled
            $table->date('requested_date');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->dateTime('approved_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // ── 3. Material Request Items Table ──────────────────────────────────
        Schema::create('material_request_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_request_id')->constrained('material_requests')->onDelete('cascade');
            $table->foreignId('material_id')->constrained('materials')->onDelete('cascade');
            $table->decimal('quantity_requested', 12, 2);
            $table->decimal('quantity_approved', 12, 2)->default(0.00);
            $table->string('notes')->nullable();
            $table->timestamps();
        });

        // ── 4. Material Dispatches Table ─────────────────────────────────────
        Schema::create('material_dispatches', function (Blueprint $table) {
            $table->id();
            $table->string('dispatch_number')->unique();
            $table->foreignId('material_request_id')->nullable()->constrained('material_requests')->onDelete('set null');
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('warehouse_id')->constrained('warehouses')->onDelete('cascade');
            $table->foreignId('dispatched_by')->constrained('users')->onDelete('cascade');
            $table->dateTime('dispatched_at');
            $table->string('vehicle_number')->nullable();
            $table->string('driver_name')->nullable();
            $table->string('driver_phone')->nullable();
            $table->string('receiver_name')->nullable();
            $table->string('receiver_phone')->nullable();
            $table->string('delivery_status')->default('pending'); // pending, in_transit, delivered, failed
            $table->text('delivery_notes')->nullable();
            $table->dateTime('delivery_date')->nullable();
            $table->decimal('total_cost', 12, 2)->default(0.00);
            $table->timestamps();
        });

        // ── 5. Material Dispatch Items Table ─────────────────────────────────
        Schema::create('material_dispatch_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_dispatch_id')->constrained('material_dispatches')->onDelete('cascade');
            $table->foreignId('material_id')->constrained('materials')->onDelete('cascade');
            $table->foreignId('batch_id')->nullable()->constrained('material_batches')->onDelete('set null');
            $table->decimal('quantity_dispatched', 12, 2);
            $table->decimal('cost_price', 12, 2);
            $table->decimal('total_cost', 12, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('material_dispatch_items');
        Schema::dropIfExists('material_dispatches');
        Schema::dropIfExists('material_request_items');
        Schema::dropIfExists('material_requests');
    }
};
