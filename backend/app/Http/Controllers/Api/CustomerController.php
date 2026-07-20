<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CustomerDocument;
use App\Repositories\CustomerRepository;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class CustomerController extends Controller
{
    use ApiResponse;

    protected CustomerRepository $customerRepo;

    public function __construct(CustomerRepository $customerRepo)
    {
        $this->customerRepo = $customerRepo;
    }

    /**
     * Display a listing of the customers.
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $sortBy = $request->query('sort_by', 'created_at');
        $sortOrder = $request->query('sort_order', 'desc');
        $perPage = (int) $request->query('per_page', 10);

        $paginated = $this->customerRepo->getPaginated(
            $perPage,
            $search,
            $status,
            $sortBy,
            $sortOrder
        );

        return $this->successResponse([
            'items' => $paginated->items(),
            'pagination' => [
                'total' => $paginated->total(),
                'per_page' => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
            ]
        ], 'Customers retrieved successfully.');
    }

    /**
     * Store a newly created customer in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'contact_name' => 'required|string|max:255',
            'contact_phone' => 'required|string|max:30',
            'contact_email' => 'nullable|email|max:255',
            'gst_number' => 'nullable|string|max:20',
            'billing_address' => 'required|string',
            'site_address' => 'required|string',
            'lead_status' => 'required|string|in:lead,contacted,proposal,active,inactive',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $customer = Customer::create($validator->validated());

        return $this->successResponse($customer, 'Customer registered successfully.', 201);
    }

    /**
     * Display the specified customer profile.
     */
    public function show(int $id): JsonResponse
    {
        $customer = $this->customerRepo->getProfileDetails($id);

        if (!$customer) {
            return $this->errorResponse('Customer profile not found.', 404);
        }

        return $this->successResponse($customer, 'Customer profile retrieved successfully.');
    }

    /**
     * Update the specified customer in storage.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $customer = Customer::find($id);

        if (!$customer) {
            return $this->errorResponse('Customer not found.', 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'contact_name' => 'required|string|max:255',
            'contact_phone' => 'required|string|max:30',
            'contact_email' => 'nullable|email|max:255',
            'gst_number' => 'nullable|string|max:20',
            'billing_address' => 'required|string',
            'site_address' => 'required|string',
            'lead_status' => 'required|string|in:lead,contacted,proposal,active,inactive',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $customer->update($validator->validated());

        return $this->successResponse($customer, 'Customer details updated successfully.');
    }

    /**
     * Remove the specified customer from storage (Soft Delete).
     */
    public function destroy(int $id): JsonResponse
    {
        $customer = Customer::find($id);

        if (!$customer) {
            return $this->errorResponse('Customer not found.', 404);
        }

        $customer->delete();

        return $this->successResponse(null, 'Customer archived successfully.');
    }

    /**
     * Upload document associated with a customer.
     */
    public function uploadDocument(Request $request, int $id): JsonResponse
    {
        $customer = Customer::find($id);

        if (!$customer) {
            return $this->errorResponse('Customer not found.', 404);
        }

        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:10240', // 10MB limit
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator->errors());
        }

        $file = $request->file('file');
        
        // Save file to storage under public documents disk
        $path = $file->store('documents', 'public');
        
        $document = CustomerDocument::create([
            'customer_id' => $id,
            'file_name' => $file->getClientOriginalName(),
            'file_path' => Storage::url($path),
            'file_type' => $file->getClientOriginalExtension() ?: 'unknown',
        ]);

        return $this->successResponse($document, 'Document uploaded successfully.', 201);
    }

    /**
     * Delete customer document.
     */
    public function deleteDocument(int $documentId): JsonResponse
    {
        $doc = CustomerDocument::find($documentId);

        if (!$doc) {
            return $this->errorResponse('Document record not found.', 404);
        }

        // Extract relative storage path
        $relativeStoragePath = str_replace('/storage/', '', $doc->file_path);
        
        // Remove from storage disk
        Storage::disk('public')->delete($relativeStoragePath);
        
        $doc->delete();

        return $this->successResponse(null, 'Document deleted successfully.');
    }
}
