<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Extend the projects table ──────────────────────────────────────
        Schema::table('projects', function (Blueprint $table) {
            $table->string('project_code')->nullable()->unique()->after('id');
            $table->text('description')->nullable()->after('name');
            // Site information
            $table->text('site_address')->nullable()->after('description');
            $table->string('site_contact_name')->nullable()->after('site_address');
            $table->string('site_contact_phone')->nullable()->after('site_contact_name');
            // Financial tracking
            $table->decimal('estimated_cost', 15, 2)->default(0)->after('material_budget');
            $table->decimal('actual_cost', 15, 2)->default(0)->after('estimated_cost');
            // Completion tracking
            $table->unsignedTinyInteger('completion_percent')->default(0)->after('actual_cost');
            // Manager / lead
            $table->foreignId('project_manager_id')->nullable()->constrained('users')->onDelete('set null')->after('customer_id');
            // Soft deletes
            $table->softDeletes();
        });

        // ── 2. Project Milestones ─────────────────────────────────────────────
        Schema::create('project_milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('due_date')->nullable();
            $table->string('status')->default('pending'); // pending, completed, delayed
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        // ── 3. Project Progress Logs (Daily Diary) ────────────────────────────
        Schema::create('project_progress_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->foreignId('logged_by')->nullable()->constrained('users')->onDelete('set null');
            $table->date('log_date');
            $table->text('description');
            $table->unsignedTinyInteger('completion_percent')->default(0);
            $table->timestamps();
        });

        // ── 4. Project Team Members (pivot) ───────────────────────────────────
        Schema::create('project_team_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('role')->nullable(); // e.g. "Site Engineer", "Supervisor"
            $table->timestamp('assigned_at')->useCurrent();
            $table->unique(['project_id', 'user_id']); // one assignment per person per project
        });

        // ── 5. Project Documents & Images ─────────────────────────────────────
        Schema::create('project_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->onDelete('set null');
            $table->string('file_name');
            $table->string('file_path');
            $table->string('mime_type')->nullable();
            $table->string('file_type')->default('document'); // 'document' | 'image'
            $table->unsignedBigInteger('file_size')->nullable(); // bytes
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_documents');
        Schema::dropIfExists('project_team_members');
        Schema::dropIfExists('project_progress_logs');
        Schema::dropIfExists('project_milestones');

        Schema::table('projects', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropForeign(['project_manager_id']);
            $table->dropColumn([
                'project_code', 'description', 'site_address',
                'site_contact_name', 'site_contact_phone',
                'estimated_cost', 'actual_cost', 'completion_percent',
                'project_manager_id',
            ]);
        });
    }
};
