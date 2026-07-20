<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\ContactController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public queries
Route::get('/projects', [PublicController::class, 'getProjects']);
Route::get('/projects/{slug}', [PublicController::class, 'getProjectBySlug']);
Route::get('/gallery', [PublicController::class, 'getGallery']);
Route::get('/blogs', [PublicController::class, 'getBlogs']);
Route::get('/blogs/{slug}', [PublicController::class, 'getBlogBySlug']);

// Form Submissions
Route::post('/consultations', [ContactController::class, 'bookConsultation']);
Route::post('/inquiries', [ContactController::class, 'submitInquiry']);
