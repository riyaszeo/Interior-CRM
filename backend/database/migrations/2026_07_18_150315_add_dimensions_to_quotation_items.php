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
        Schema::table('quotation_items', function (Blueprint $table) {
            $table->string('item_name')->nullable()->after('room_name');
            $table->decimal('width', 10, 2)->nullable()->after('description');
            $table->decimal('height', 10, 2)->nullable()->after('width');
            $table->decimal('units', 10, 2)->default(1.00)->after('height');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quotation_items', function (Blueprint $table) {
            $table->dropColumn(['item_name', 'width', 'height', 'units']);
        });
    }
};
