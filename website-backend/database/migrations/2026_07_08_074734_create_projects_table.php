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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('category'); // Residential, Commercial, Villa, Office, Landscape, Exterior
            $table->string('slug')->unique();
            $table->text('description');
            $table->integer('area_sqft');
            $table->string('location');
            $table->string('budget')->nullable();
            $table->date('completion_date');
            $table->text('materials_used')->nullable(); // JSON array
            $table->text('testimonial')->nullable(); // JSON object { name, rating, comment }
            $table->text('images'); // JSON array
            $table->text('before_after')->nullable(); // JSON object { before, after }
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
