<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── 0. Drop existing simple purchase_orders table ────────────────────
        Schema::dropIfExists('purchase_orders');

        // ── 1. Create Vendors Table ──────────────────────────────────────────
        Schema::create('vendors', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('company_name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->string('gst_number')->nullable();
            $table->string('payment_terms')->nullable(); // e.g. "Net 30", "Advance"
            $table->timestamps();
            $table->softDeletes();
        });

        // ── 2. Create Expanded Purchase Orders Table ─────────────────────────
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->string('po_number')->unique(); // e.g. PO-20260706-0001
            $table->foreignId('vendor_id')->constrained('vendors')->onDelete('cascade');
            $table->foreignId('project_id')->nullable()->constrained('projects')->onDelete('set null');
            $table->date('order_date');
            $table->date('delivery_date')->nullable();
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('discount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->string('status')->default('draft'); // draft, pending_approval, approved, rejected, ordered, received, cancelled
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->text('notes')->nullable();
            $table->text('terms_conditions')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // ── 3. Create Purchase Order Items Table ─────────────────────────────
        Schema::create('purchase_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained('purchase_orders')->onDelete('cascade');
            $table->foreignId('material_id')->constrained('materials')->onDelete('cascade');
            $table->decimal('quantity', 12, 2);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('tax_rate', 5, 2)->default(18.00);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->decimal('received_quantity', 12, 2)->default(0);
            $table->timestamps();
        });

        // ── 4. Create Goods Receipt Notes (GRN) Table ────────────────────────
        Schema::create('goods_receipt_notes', function (Blueprint $table) {
            $table->id();
            $table->string('grn_number')->unique(); // e.g. GRN-20260706-0001
            $table->foreignId('purchase_order_id')->constrained('purchase_orders')->onDelete('cascade');
            $table->date('received_date');
            $table->foreignId('received_by')->constrained('users')->onDelete('cascade');
            $table->string('status')->default('draft'); // draft, completed, cancelled
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // ── 5. Create Goods Receipt Note Items Table ─────────────────────────
        Schema::create('goods_receipt_note_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('goods_receipt_note_id')->constrained('goods_receipt_notes')->onDelete('cascade');
            $table->foreignId('purchase_order_item_id')->constrained('purchase_order_items')->onDelete('cascade');
            $table->foreignId('material_id')->constrained('materials')->onDelete('cascade');
            $table->decimal('quantity_ordered', 12, 2);
            $table->decimal('quantity_received', 12, 2);
            $table->decimal('quantity_accepted', 12, 2);
            $table->decimal('quantity_rejected', 12, 2)->default(0);
            $table->string('rejection_reason')->nullable();
            $table->timestamps();
        });

        // ── 6. Create Purchase Invoices Table ────────────────────────────────
        Schema::create('purchase_invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number'); // vendor invoice no.
            $table->date('invoice_date');
            $table->date('due_date');
            $table->foreignId('purchase_order_id')->nullable()->constrained('purchase_orders')->onDelete('set null');
            $table->foreignId('vendor_id')->constrained('vendors')->onDelete('cascade');
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->string('status')->default('unpaid'); // unpaid, paid, partially_paid, cancelled
            $table->date('payment_date')->nullable();
            $table->string('payment_method')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // ── 7. Create Purchase Returns Table ─────────────────────────────────
        Schema::create('purchase_returns', function (Blueprint $table) {
            $table->id();
            $table->string('return_number')->unique(); // PR-20260706-0001
            $table->foreignId('purchase_order_id')->nullable()->constrained('purchase_orders')->onDelete('set null');
            $table->foreignId('vendor_id')->constrained('vendors')->onDelete('cascade');
            $table->date('return_date');
            $table->text('return_reason')->nullable();
            $table->string('status')->default('pending'); // pending, completed, cancelled
            $table->decimal('total_refund_amount', 15, 2)->default(0);
            $table->timestamps();
        });

        // ── 8. Create Purchase Return Items Table ────────────────────────────
        Schema::create('purchase_return_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_return_id')->constrained('purchase_returns')->onDelete('cascade');
            $table->foreignId('material_id')->constrained('materials')->onDelete('cascade');
            $table->decimal('quantity', 12, 2);
            $table->decimal('unit_price', 15, 2);
            $table->decimal('refund_amount', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_return_items');
        Schema::dropIfExists('purchase_returns');
        Schema::dropIfExists('purchase_invoices');
        Schema::dropIfExists('goods_receipt_note_items');
        Schema::dropIfExists('goods_receipt_notes');
        Schema::dropIfExists('purchase_order_items');
        Schema::dropIfExists('purchase_orders');
        Schema::dropIfExists('vendors');

        // Re-create the simple PO table if rolled back
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->string('po_number')->unique();
            $table->string('vendor_name');
            $table->decimal('amount', 12, 2);
            $table->string('status');
            $table->timestamps();
        });
    }
};
