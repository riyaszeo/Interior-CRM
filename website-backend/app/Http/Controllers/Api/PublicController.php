<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\GalleryItem;
use App\Models\Blog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicController extends Controller
{
    /**
     * Fetch list of featured projects.
     */
    public function getProjects(Request $request): JsonResponse
    {
        $category = $request->query('category');
        $query = Project::query();

        if ($category && $category !== 'All') {
            $query->where('category', $category);
        }

        $projects = $query->orderBy('completion_date', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $projects,
        ]);
    }

    /**
     * Get a single project by slug.
     */
    public function getProjectBySlug(string $slug): JsonResponse
    {
        $project = Project::where('slug', $slug)->first();

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $project,
        ]);
    }

    /**
     * Fetch gallery items.
     */
    public function getGallery(Request $request): JsonResponse
    {
        $category = $request->query('category');
        $query = GalleryItem::query();

        if ($category && $category !== 'All') {
            $query->where('category', $category);
        }

        $items = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    /**
     * Fetch list of blogs.
     */
    public function getBlogs(): JsonResponse
    {
        $blogs = Blog::orderBy('published_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $blogs,
        ]);
    }

    /**
     * Get a single blog by slug.
     */
    public function getBlogBySlug(string $slug): JsonResponse
    {
        $blog = Blog::where('slug', $slug)->first();

        if (!$blog) {
            return response()->json([
                'success' => false,
                'message' => 'Blog post not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $blog,
        ]);
    }
}
