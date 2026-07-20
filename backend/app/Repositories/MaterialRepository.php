<?php

namespace App\Repositories;

use App\Models\Material;
use App\Models\MaterialCategory;
use App\Models\MaterialBrand;
use App\Models\MaterialUnit;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class MaterialRepository
{
    /**
     * Get paginated materials with filters, search, and sorting.
     */
    public function paginate(
        int $perPage = 15,
        ?string $search = null,
        ?int $categoryId = null,
        ?int $brandId = null,
        ?string $status = null,         // 'active' | 'inactive' | 'low_stock' | 'all'
        string $sortBy = 'name',
        string $sortOrder = 'asc'
    ): LengthAwarePaginator {
        $query = Material::with(['category:id,name,color', 'brand:id,name', 'unitModel:id,name,abbreviation']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%")
                  ->orWhere('hsn_code', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        if ($brandId) {
            $query->where('brand_id', $brandId);
        }

        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        } elseif ($status === 'low_stock') {
            $query->whereColumn('stock_quantity', '<=', 'reorder_level');
        }

        $allowed = ['id', 'name', 'sku', 'stock_quantity', 'purchase_price', 'selling_price', 'gst_rate', 'created_at'];
        $sortBy    = in_array($sortBy, $allowed) ? $sortBy : 'name';
        $sortOrder = strtolower($sortOrder) === 'desc' ? 'desc' : 'asc';

        return $query->orderBy($sortBy, $sortOrder)->paginate($perPage);
    }

    /**
     * Find a material by ID with all relations.
     */
    public function find(int $id): ?Material
    {
        return Material::with(['category', 'brand', 'unitModel'])->find($id);
    }

    /**
     * Create a new material.
     */
    public function create(array $data): Material
    {
        return Material::create($data);
    }

    /**
     * Update a material.
     */
    public function update(int $id, array $data): ?Material
    {
        $material = Material::find($id);
        if ($material) {
            $material->update($data);
            return $material->load(['category', 'brand', 'unitModel']);
        }
        return null;
    }

    /**
     * Soft-delete a material.
     */
    public function delete(int $id): bool
    {
        $material = Material::find($id);
        return $material ? (bool) $material->delete() : false;
    }

    /**
     * Return all data needed for the create/edit form dropdowns.
     */
    public function formOptions(): array
    {
        return [
            'categories' => MaterialCategory::orderBy('name')->get(['id', 'name', 'color']),
            'brands'     => MaterialBrand::orderBy('name')->get(['id', 'name']),
            'units'      => MaterialUnit::orderBy('name')->get(['id', 'name', 'abbreviation']),
            'gst_rates'  => [0, 5, 12, 18, 28],
        ];
    }

    // ── Lookup Table Helpers ───────────────────────────────────────────────────

    public function allCategories(): Collection
    {
        return MaterialCategory::with('children:id,name,parent_id')->whereNull('parent_id')->orderBy('name')->get();
    }

    public function allBrands(): Collection
    {
        return MaterialBrand::withCount('materials')->orderBy('name')->get();
    }

    public function allUnits(): Collection
    {
        return MaterialUnit::withCount('materials')->orderBy('name')->get();
    }
}
