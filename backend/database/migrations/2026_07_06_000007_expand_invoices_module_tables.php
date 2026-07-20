<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Drop existing placeholder invoices table ───────────────────────
        Schema::dropIfExists('invoices');

        // ── 2. Create Expanded invoices table ──────────────────────────────────
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('quotation_id')->nullable()->constrained('quotations')->onDelete('set null');
            $table->string('invoice_number')->unique();
            $table->string('invoice_type'); // advance, running, final
            $table->date('invoice_date');
            $table->date('due_date');
            $table->text('payment_terms')->nullable();
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(18.00); // Default GST percent
            $table->decimal('cgst', 15, 2)->default(0);
            $table->decimal('sgst', 15, 2)->default(0);
            $table->decimal('igst', 15, 2)->default(0);
            $table->decimal('total_gst', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->string('status')->default('unpaid'); // draft, unpaid, partially_paid, paid, cancelled
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->dateTime('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // ── 3. Create invoice_items table ──────────────────────────────────────
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->onDelete('cascade');
            $table->string('description');
            $table->string('hsn_code')->nullable();
            $table->decimal('quantity', 12, 2);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('total_price', 15, 2);
            $table->decimal('gst_rate', 5, 2)->default(18.00);
            $table->decimal('gst_amount', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
        Schema::dropIfExists('invoices');

        // Recreate original basic table on rollback
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->string('invoice_number')->unique();
            $table->decimal('amount', 12, 2);
            $table->string('status');
            $table->date('due_date');
            $table->dateTime('paid_at')->nullable();
            $table->timestamps();
        });
    }
};
