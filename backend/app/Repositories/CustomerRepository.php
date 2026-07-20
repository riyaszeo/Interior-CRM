<?php

namespace App\Repositories;

use App\Models\Customer;
use App\Models\ActivityLog;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CustomerRepository
{
    /**
     * Get paginated customer records with optional search, filter, and sorting.
     */
    public function getPaginated(
        int $perPage = 10,
        ?string $search = null,
        ?string $status = null,
        string $sortBy = 'created_at',
        string $sortOrder = 'desc'
    ): LengthAwarePaginator {
        $query = Customer::query();

        // Lead Status Filter
        if ($status && $status !== 'all') {
            $query->where('lead_status', $status);
        }

        // Search Filter (checks Company Name, Contact Name, and Contact Email)
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('contact_name', 'like', "%{$search}%")
                  ->orWhere('contact_email', 'like', "%{$search}%");
            });
        }

        // Sorting Validation
        $allowedSorts = ['name', 'contact_name', 'lead_status', 'created_at'];
        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'created_at';
        }
        $sortOrder = strtolower($sortOrder) === 'asc' ? 'asc' : 'desc';

        return $query->orderBy($sortBy, $sortOrder)->paginate($perPage);
    }

    /**
     * Get detailed customer profile along with projects, quotations, documents, and timeline logs.
     */
    public function getProfileDetails(int $id): ?Customer
    {
        $customer = Customer::with(['projects', 'quotations', 'documents'])->find($id);

        if (!$customer) {
            return null;
        }

        // Fetch customer activity logs: scans for logs mentioning this customer's ID or name
        $logs = ActivityLog::with('user:id,name,email')
            ->where(function ($query) use ($id, $customer) {
                $query->where('description', 'like', "%customer%")
                      ->orWhere('payload', 'like', "%\"customer_id\":{$id}%")
                      ->orWhere('payload', 'like', "%\"customer_id\":\"{$id}\"%")
                      ->orWhere('description', 'like', "%{$customer->name}%")
                      ->orWhere('description', 'like', "%{$customer->contact_name}%");
            })
            ->latest()
            ->limit(15)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'user_name' => $log->user ? $log->user->name : 'System',
                    'action' => $log->action,
                    'description' => $log->description,
                    'time' => $log->created_at->diffForHumans(),
                    'created_at' => $log->created_at->toIso8601String(),
                ];
            });

        // Attach timeline attribute
        $customer->setAttribute('timeline', $logs);

        return $customer;
    }
}
