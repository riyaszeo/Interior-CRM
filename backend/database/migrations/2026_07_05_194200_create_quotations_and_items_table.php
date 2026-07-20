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
        // Drop existing quotations table to rebuild it professionally
        Schema::dropIfExists('quotations');

        Schema::create('quotations', function (Blueprint $table) {
            $table->id();
            $table->string('qtn_number')->nullable()->unique();
            $table->foreignId('customer_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('project_id')->nullable()->constrained()->onDelete('set null');
            $table->string('title');
            $table->string('status')->default('draft'); // 'draft', 'sent', 'approved', 'rejected'
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('gst_rate', 5, 2)->default(18.0);
            $table->decimal('gst_amount', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('labor_charges', 15, 2)->default(0);
            $table->decimal('additional_charges', 15, 2)->default(0);
            $table->decimal('total', 15, 2)->default(0);
            $table->text('terms_conditions')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('quotation_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quotation_id')->constrained()->onDelete('cascade');
            $table->string('room_name'); // e.g. "Living Room", "Master Bedroom"
            $table->foreignId('material_id')->nullable()->constrained()->onDelete('set null');
            $table->string('description')->nullable();
            $table->decimal('quantity', 10, 2);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('total_price', 15, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotation_items');
        Schema::dropIfExists('quotations');
    }
};
