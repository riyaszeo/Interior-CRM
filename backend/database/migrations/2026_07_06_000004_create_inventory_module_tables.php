<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Warehouses Table ──────────────────────────────────────────────
        Schema::create('warehouses', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('location');
            $table->string('contact_number')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        // ── 2. Material Batches Table ────────────────────────────────────────
        Schema::create('material_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('material_id')->constrained('materials')->onDelete('cascade');
            $table->string('batch_number');
            $table->date('expiry_date')->nullable();
            $table->date('manufacturing_date')->nullable();
            $table->foreignId('supplier_id')->nullable()->constrained('vendors')->onDelete('set null');
            $table->timestamps();
        });

        // ── 3. Warehouse Stocks Table ────────────────────────────────────────
        Schema::create('warehouse_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->constrained('warehouses')->onDelete('cascade');
            $table->foreignId('material_id')->constrained('materials')->onDelete('cascade');
            $table->foreignId('batch_id')->nullable()->constrained('material_batches')->onDelete('cascade');
            $table->decimal('opening_stock', 12, 2)->default(0.00);
            $table->decimal('current_stock', 12, 2)->default(0.00);
            $table->decimal('reserved_stock', 12, 2)->default(0.00);
            $table->timestamps();

            // Ensure unique combinations of Warehouse + Material + Batch
            $table->unique(['warehouse_id', 'material_id', 'batch_id']);
        });

        // ── 4. Stock Ledgers Table ───────────────────────────────────────────
        Schema::create('stock_ledgers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->constrained('warehouses')->onDelete('cascade');
            $table->foreignId('material_id')->constrained('materials')->onDelete('cascade');
            $table->foreignId('batch_id')->nullable()->constrained('material_batches')->onDelete('cascade');
            $table->string('transaction_type'); // opening, receipt, dispatch, return, adjustment, reserve, release
            $table->decimal('quantity', 12, 2); // positive or negative
            $table->string('reference_type')->nullable(); // e.g. GoodsReceiptNote
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->text('notes')->nullable();
            $table->date('transaction_date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_ledgers');
        Schema::dropIfExists('warehouse_stocks');
        Schema::dropIfExists('material_batches');
        Schema::dropIfExists('warehouses');
    }
};
