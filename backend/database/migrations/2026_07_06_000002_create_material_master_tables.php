<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Material Categories ────────────────────────────────────────────
        Schema::create('material_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->string('color', 7)->default('#7c4dff'); // hex colour for UI badge
            $table->foreignId('parent_id')->nullable()->constrained('material_categories')->onDelete('set null');
            $table->timestamps();
        });

        // ── 2. Material Brands ────────────────────────────────────────────────
        Schema::create('material_brands', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // ── 3. Material Units ─────────────────────────────────────────────────
        Schema::create('material_units', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();          // e.g. "Pieces"
            $table->string('abbreviation', 20)->unique(); // e.g. "pcs"
            $table->timestamps();
        });

        // ── 4. Expand materials table ─────────────────────────────────────────
        Schema::table('materials', function (Blueprint $table) {
            // Lookup FKs
            $table->foreignId('category_id')->nullable()->constrained('material_categories')->onDelete('set null')->after('id');
            $table->foreignId('brand_id')->nullable()->constrained('material_brands')->onDelete('set null')->after('category_id');
            $table->foreignId('unit_id')->nullable()->constrained('material_units')->onDelete('set null')->after('brand_id');

            // Descriptive
            $table->text('description')->nullable()->after('name');

            // Compliance
            $table->string('hsn_code', 20)->nullable()->after('sku');    // GST HSN classification
            $table->decimal('gst_rate', 5, 2)->default(18.00)->after('hsn_code');

            // Pricing (keep cost_price for backward-compat; add purchase/selling)
            $table->decimal('purchase_price', 15, 2)->default(0)->after('cost_price');
            $table->decimal('selling_price', 15, 2)->default(0)->after('purchase_price');

            // Inventory
            $table->decimal('reorder_level', 10, 2)->default(0)->after('stock_quantity');

            // Identification
            $table->string('barcode')->nullable()->unique()->after('sku');
            $table->text('qr_data')->nullable()->after('barcode');

            // Status
            $table->boolean('is_active')->default(true)->after('qr_data');

            // Soft deletes
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('materials', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropForeign(['category_id']);
            $table->dropForeign(['brand_id']);
            $table->dropForeign(['unit_id']);
            $table->dropColumn([
                'category_id', 'brand_id', 'unit_id', 'description',
                'hsn_code', 'gst_rate', 'purchase_price', 'selling_price',
                'reorder_level', 'barcode', 'qr_data', 'is_active',
            ]);
        });
        Schema::dropIfExists('material_units');
        Schema::dropIfExists('material_brands');
        Schema::dropIfExists('material_categories');
    }
};
