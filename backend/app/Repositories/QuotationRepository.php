<?php

namespace App\Repositories;

use App\Models\Quotation;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class QuotationRepository
{
    /**
     * Get paginated quotations with optional search, status filter, and sorting.
     */
    public function getPaginated(
        int $perPage = 10,
        ?string $search = null,
        ?string $status = null,
        string $sortBy = 'created_at',
        string $sortOrder = 'desc'
    ): LengthAwarePaginator {
        $query = Quotation::with(['customer:id,name', 'project:id,name', 'items.material:id,name,sku,unit']);

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('qtn_number', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhereHas('customer', fn($cq) => $cq->where('name', 'like', "%{$search}%"));
            });
        }

        $allowedSorts = ['qtn_number', 'title', 'status', 'total', 'created_at'];
        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'created_at';
        }
        $sortOrder = strtolower($sortOrder) === 'asc' ? 'asc' : 'desc';

        return $query->orderBy($sortBy, $sortOrder)->paginate($perPage);
    }

    /**
     * Get full quotation details with items (and their materials) and customer.
     */
    public function getDetails(int $id): ?Quotation
    {
        return Quotation::with([
            'customer',
            'project:id,name,status',
            'items.material:id,name,sku,unit',
        ])->find($id);
    }
}
