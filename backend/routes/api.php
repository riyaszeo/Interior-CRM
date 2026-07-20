<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\QuotationController;
use App\Http\Controllers\Api\MaterialController;
use App\Http\Controllers\Api\MaterialCategoryController;
use App\Http\Controllers\Api\MaterialBrandController;
use App\Http\Controllers\Api\MaterialUnitController;
use App\Http\Controllers\Api\VendorController;
use App\Http\Controllers\Api\PurchaseOrderController;
use App\Http\Controllers\Api\GoodsReceiptNoteController;
use App\Http\Controllers\Api\PurchaseInvoiceController;
use App\Http\Controllers\Api\PurchaseReturnController;
use App\Http\Controllers\Api\WarehouseController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\MaterialRequestController;
use App\Http\Controllers\Api\MaterialDispatchController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\CompanyController;

// Authentication routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');
});

// Super Admin SaaS Management Routes
Route::middleware(['auth:sanctum'])->prefix('super-admin')->group(function () {
    Route::get('tenants', [\App\Http\Controllers\Api\TenantController::class, 'index']);
    Route::post('tenants', [\App\Http\Controllers\Api\TenantController::class, 'store']);
    Route::put('tenants/{tenant}', [\App\Http\Controllers\Api\TenantController::class, 'update']);
});

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/dashboard', [DashboardController::class, 'index']);

// Projects CRUD + sub-resources (requires Sanctum auth)
Route::middleware('auth:sanctum')->group(function () {
    // Company Profile Config
    Route::get('company', [CompanyController::class, 'show']);
    Route::post('company', [CompanyController::class, 'update']);

    // Static named routes MUST come before apiResource to avoid being caught by {id} wildcard
    Route::get('projects/users-list', [ProjectController::class, 'usersList']);
    Route::apiResource('projects', ProjectController::class);

    // Milestones
    Route::get('projects/{id}/milestones', [ProjectController::class, 'getMilestones']);
    Route::post('projects/{id}/milestones', [ProjectController::class, 'storeMilestone']);
    Route::patch('projects/{id}/milestones/{mid}', [ProjectController::class, 'updateMilestone']);
    Route::delete('projects/{id}/milestones/{mid}', [ProjectController::class, 'destroyMilestone']);

    // Progress Logs
    Route::get('projects/{id}/progress-logs', [ProjectController::class, 'getProgressLogs']);
    Route::post('projects/{id}/progress-logs', [ProjectController::class, 'storeProgressLog']);

    // Team Members
    Route::post('projects/{id}/team-members', [ProjectController::class, 'addTeamMember']);
    Route::delete('projects/{id}/team-members/{userId}', [ProjectController::class, 'removeTeamMember']);

    // Documents & Images
    Route::post('projects/{id}/documents', [ProjectController::class, 'uploadDocument']);
    Route::delete('projects/{id}/documents/{docId}', [ProjectController::class, 'deleteDocument']);

    // Phase 10 Site Progress additions
    Route::patch('projects/{id}/progress-logs/{logId}/approve', [ProjectController::class, 'approveProgressLog']);
    Route::post('projects/{id}/material-consumptions', [ProjectController::class, 'storeMaterialConsumption']);
    Route::post('projects/{id}/worker-attendances', [ProjectController::class, 'storeWorkerAttendance']);
    Route::post('projects/{id}/expenses', [ProjectController::class, 'storeExpense']);
    Route::patch('projects/{id}/expenses/{expenseId}/approve', [ProjectController::class, 'approveExpense']);
});

// Customers CRUD and documents routes (requires Sanctum auth)
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('customers', CustomerController::class);
    Route::post('customers/{id}/documents', [CustomerController::class, 'uploadDocument']);
    Route::delete('documents/{documentId}', [CustomerController::class, 'deleteDocument']);
});

// Quotations routes (requires Sanctum auth)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('quotations/form-options', [QuotationController::class, 'formOptions']);
    Route::apiResource('quotations', QuotationController::class);
    Route::patch('quotations/{id}/status', [QuotationController::class, 'updateStatus']);
    Route::post('quotations/{id}/convert-to-project', [QuotationController::class, 'convertToProject']);
});

// Material Master (requires Sanctum auth)
Route::middleware('auth:sanctum')->group(function () {
    // Form options MUST come before apiResource to avoid {material} wildcard
    Route::get('materials/form-options', [MaterialController::class, 'formOptions']);
    Route::get('materials/{id}/barcode', [MaterialController::class, 'barcode']);
    Route::get('materials/{id}/qrcode',  [MaterialController::class, 'qrcode']);
    Route::apiResource('materials', MaterialController::class);

    // Lookup tables
    Route::apiResource('material-categories', MaterialCategoryController::class)->except(['show']);
    Route::apiResource('material-brands',     MaterialBrandController::class)->except(['show']);
    Route::apiResource('material-units',      MaterialUnitController::class)->except(['show']);
});

// Purchase Module (requires Sanctum auth)
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('vendors', VendorController::class);
    
    // Purchase Order routes (form-options must come first)
    Route::get('purchase-orders/form-options', [PurchaseOrderController::class, 'formOptions']);
    Route::apiResource('purchase-orders', PurchaseOrderController::class);
    Route::patch('purchase-orders/{id}/status', [PurchaseOrderController::class, 'updateStatus']);

    // Goods Receipt Notes (GRN)
    Route::apiResource('grns', GoodsReceiptNoteController::class)->except(['destroy', 'update']);
    Route::patch('grns/{id}/complete', [GoodsReceiptNoteController::class, 'complete']);

    // Purchase Invoices & Returns
    Route::apiResource('purchase-invoices', PurchaseInvoiceController::class);
    Route::apiResource('purchase-returns', PurchaseReturnController::class);
    Route::patch('purchase-returns/{id}/complete', [PurchaseReturnController::class, 'complete']);
});

// Inventory Module (requires Sanctum auth)
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('warehouses', WarehouseController::class);
    Route::get('inventory/stocks', [InventoryController::class, 'stocksList']);
    Route::get('inventory/ledger', [InventoryController::class, 'ledgerList']);
    Route::post('inventory/adjust', [InventoryController::class, 'adjustStock']);
    Route::post('inventory/reserve', [InventoryController::class, 'reserveStock']);
    Route::post('inventory/transfer', [InventoryController::class, 'transferStock']);
    Route::get('inventory/form-options', [InventoryController::class, 'formOptions']);

    // Branch management routes
    Route::get('branches', [\App\Http\Controllers\Api\BranchController::class, 'index']);
    Route::post('branches', [\App\Http\Controllers\Api\BranchController::class, 'store']);
    Route::put('branches/{id}', [\App\Http\Controllers\Api\BranchController::class, 'update']);
    Route::delete('branches/{id}', [\App\Http\Controllers\Api\BranchController::class, 'destroy']);
    Route::get('branches/users-list', [\App\Http\Controllers\Api\BranchController::class, 'usersList']);
    Route::post('branches/assign-users/{userId}', [\App\Http\Controllers\Api\BranchController::class, 'assignBranches']);
    Route::get('branches/{id}/warehouses', [\App\Http\Controllers\Api\BranchController::class, 'getBranchWarehouses']);

    // Role & Permission management routes
    Route::get('roles', [\App\Http\Controllers\Api\RolePermissionController::class, 'index']);
    Route::get('permissions', [\App\Http\Controllers\Api\RolePermissionController::class, 'permissions']);
    Route::post('roles/{id}/permissions', [\App\Http\Controllers\Api\RolePermissionController::class, 'syncPermissions']);

    // User Profile & Settings routes
    Route::put('profile', [\App\Http\Controllers\Api\AuthController::class, 'updateProfile']);
    Route::put('change-password', [\App\Http\Controllers\Api\AuthController::class, 'changePassword']);
});

// Dispatch & Logistics Module (requires Sanctum auth)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('material-requests/form-options', [MaterialRequestController::class, 'formOptions']);
    Route::apiResource('material-requests', MaterialRequestController::class);
    Route::patch('material-requests/{id}/status', [MaterialRequestController::class, 'updateStatus']);

    Route::apiResource('material-dispatches', MaterialDispatchController::class)->except(['destroy', 'update']);
    Route::patch('material-dispatches/{id}/delivery-status', [MaterialDispatchController::class, 'updateDeliveryStatus']);
});

// Customer Invoices & Billing Module (requires Sanctum auth)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('invoices/form-options', [InvoiceController::class, 'formOptions']);
    Route::apiResource('invoices', InvoiceController::class);
    Route::post('invoices/{id}/payment', [InvoiceController::class, 'recordPayment']);
    Route::patch('invoices/{id}/cancel', [InvoiceController::class, 'cancel']);
});

// Reports Engine Module (requires Sanctum auth)
Route::middleware('auth:sanctum')->prefix('reports')->group(function () {
    Route::get('/dashboard', [ReportController::class, 'dashboard']);
    Route::get('/projects', [ReportController::class, 'projects']);
    Route::get('/purchases', [ReportController::class, 'purchases']);
    Route::get('/stock', [ReportController::class, 'stock']);
    Route::get('/site', [ReportController::class, 'site']);
    Route::get('/material-consumption', [ReportController::class, 'materialConsumption']);
    Route::get('/vendors', [ReportController::class, 'vendors']);
    Route::get('/customers', [ReportController::class, 'customers']);
    Route::get('/profitability', [ReportController::class, 'profitability']);
});
