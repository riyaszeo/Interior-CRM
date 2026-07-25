<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Material;
use App\Models\MaterialDispatch;
use App\Models\Quotation;
use App\Models\Invoice;
use App\Models\PurchaseOrder;
use App\Models\ActivityLog;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Get aggregated dashboard metrics, charts, lists, and notifications.
     */
    public function index(): JsonResponse
    {
        // If no branch database is active, return empty dashboard
        if (config('database.default') !== 'tenant') {
            return response()->json([
                'success' => true,
                'data' => [
                    'kpi' => [
                        'total_active_projects' => 0,
                        'projects_completed' => 0,
                        'projects_in_progress' => 0,
                        'materials_in_stock' => 0,
                        'materials_dispatched_today' => ['count' => 0, 'cost' => 0],
                        'pending_quotations' => 0,
                        'pending_invoices' => 0,
                        'purchase_orders_pending' => 0,
                        'monthly_revenue' => 0,
                    ],
                    'charts' => [
                        'revenue' => [], 'project_status' => [], 'purchases' => [], 'material_consumption' => [],
                        'site_wise_progress' => [], 'material_cost_vs_budget' => []
                    ],
                    'lists' => [
                        'recent_activities' => [], 'recent_quotations' => [], 'recent_purchases' => [], 'recent_dispatches' => []
                    ],
                    'notifications' => [
                        ['id' => 'no_branch', 'type' => 'warning', 'message' => 'No active branch selected. Please select or create a branch.']
                    ]
                ]
            ]);
        }

        // 1. KPI counters
        $totalActiveProjects = Project::whereIn('status', ['active', 'in_progress'])->count();
        $projectsCompleted = Project::where('status', 'completed')->count();
        $projectsInProgress = Project::where('status', 'in_progress')->count();
        $materialsInStock = Material::sum('stock_quantity');
        
        $todayDispatches = MaterialDispatch::whereDate('dispatched_at', Carbon::today());
        $dispatchedTodayCount = $todayDispatches->count();
        $dispatchedTodayCost = $todayDispatches->sum('total_cost');

        $pendingQuotations = Quotation::where('status', 'pending')->count();
        $pendingInvoices = Invoice::where('status', 'pending')->count();
        $purchaseOrdersPending = PurchaseOrder::whereIn('status', ['pending', 'approved'])->count();

        // Current calendar month revenue (sum of paid invoices)
        $monthlyRevenue = Invoice::where('status', 'paid')
            ->whereMonth('paid_at', Carbon::now()->month)
            ->whereYear('paid_at', Carbon::now()->year)
            ->sum('total_amount');

        // 2. Chart datasets (Last 6 Months: Jan -> Jun)
        $revenueChart = [];
        $purchasesChart = [];
        $materialConsumptionChart = [];

        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            
            // Monthly Paid Invoice Revenue
            $revSum = Invoice::where('status', 'paid')
                ->whereMonth('paid_at', $month->month)
                ->whereYear('paid_at', $month->year)
                ->sum('total_amount');
            $revenueChart[] = [
                'month' => $month->format('M'),
                'amount' => (float) $revSum
            ];

            // Monthly PO Totals
            $poSum = PurchaseOrder::whereIn('status', ['approved', 'received'])
                ->whereMonth('created_at', $month->month)
                ->whereYear('created_at', $month->year)
                ->sum('total_amount');
            $purchasesChart[] = [
                'month' => $month->format('M'),
                'amount' => (float) $poSum
            ];

            // Monthly Material Consumption Cost
            $dispSum = MaterialDispatch::whereMonth('dispatched_at', $month->month)
                ->whereYear('dispatched_at', $month->year)
                ->sum('total_cost');
            $materialConsumptionChart[] = [
                'month' => $month->format('M'),
                'amount' => (float) $dispSum
            ];
        }

        // Project Status distribution (Pie Chart)
        $projectStatusChart = [
            ['id' => 0, 'value' => Project::where('status', 'active')->count(), 'label' => 'Active'],
            ['id' => 1, 'value' => Project::where('status', 'in_progress')->count(), 'label' => 'In Progress'],
            ['id' => 2, 'value' => Project::where('status', 'completed')->count(), 'label' => 'Completed'],
            ['id' => 3, 'value' => Project::where('status', 'pending')->count(), 'label' => 'Pending']
        ];

        // Site-wise project progress percentage list
        $activeProjects = Project::whereIn('status', ['active', 'in_progress'])->get();
        $siteWiseProgress = $activeProjects->map(function ($project) {
            $latestProgress = $project->siteProgresses()->latest()->first();
            return [
                'project_id' => $project->id,
                'project_name' => $project->name,
                'progress_percentage' => $latestProgress ? (float) $latestProgress->progress_percentage : 0.0,
                'last_updated' => $latestProgress ? $latestProgress->created_at->diffForHumans() : 'No updates yet',
            ];
        });

        // Material Budget limits
        $projects = Project::select('id', 'name', 'material_budget')->get();
        $materialCostVsBudget = $projects->map(function ($project) {
            $totalCost = MaterialDispatch::where('project_id', $project->id)->sum('total_cost');
            return [
                'project_id' => $project->id,
                'project_name' => $project->name,
                'budget' => (float) $project->material_budget,
                'actual_cost' => (float) $totalCost,
                'remaining' => (float) ($project->material_budget - $totalCost),
                'percentage_used' => $project->material_budget > 0 
                    ? round(($totalCost / $project->material_budget) * 100, 2) 
                    : 0
            ];
        });

        // 3. Recent Feeds Lists
        // Last 5 Activities (Logs)
        $recentActivities = ActivityLog::with('user:id,name,email')
            ->latest()
            ->limit(5)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'user' => $log->user ? $log->user->name : 'System',
                    'action' => $log->action,
                    'description' => $log->description,
                    'time' => $log->created_at->diffForHumans()
                ];
            });

        // Last 5 Quotations
        $recentQuotations = Quotation::latest()->limit(5)->get()->map(function ($quote) {
            return [
                'id' => $quote->id,
                'client_name' => $quote->customer ? $quote->customer->name : 'N/A',
                'title' => $quote->title,
                'amount' => (float) $quote->total,
                'status' => $quote->status,
                'time' => $quote->created_at->diffForHumans()
            ];
        });

        // Last 5 Purchases
        $recentPurchases = PurchaseOrder::latest()->limit(5)->get()->map(function ($po) {
            return [
                'id' => $po->id,
                'po_number' => $po->po_number,
                'vendor_name' => $po->vendor_name,
                'amount' => (float) $po->total_amount,
                'status' => $po->status,
                'time' => $po->created_at->diffForHumans()
            ];
        });

        // Last 5 Material Dispatches
        $recentDispatches = MaterialDispatch::with(['project:id,name', 'items.material:id,name'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(function ($disp) {
                $firstItem = $disp->items->first();
                $materialName = 'N/A';
                if ($firstItem && $firstItem->material) {
                    $materialName = $firstItem->material->name;
                    if ($disp->items->count() > 1) {
                        $materialName .= ' (+' . ($disp->items->count() - 1) . ' more)';
                    }
                }
                $qty = (float) $disp->items->sum('quantity_dispatched');
                
                return [
                    'id' => $disp->id,
                    'project_name' => $disp->project ? $disp->project->name : 'N/A',
                    'material_name' => $materialName,
                    'quantity' => $qty,
                    'cost' => (float) ($disp->total_cost ?? 0),
                    'time' => $disp->dispatched_at ? $disp->dispatched_at->diffForHumans() : 'N/A'
                ];
            });

        // 4. Alert Notifications Panel
        $notifications = [];

        // Inventory Low Stock warning (< 15 units)
        $lowStock = Material::where('stock_quantity', '<', 15)->get();
        foreach ($lowStock as $mat) {
            $notifications[] = [
                'id' => 'stock_' . $mat->id,
                'type' => 'warning',
                'message' => "Low stock warning: '{$mat->name}' only has {$mat->stock_quantity} {$mat->unit} remaining."
            ];
        }

        // Invoice overdue warning
        $overdue = Invoice::with('project:id,name')
            ->where('status', 'pending')
            ->where('due_date', '<', Carbon::now())
            ->get();
        foreach ($overdue as $inv) {
            $notifications[] = [
                'id' => 'invoice_' . $inv->id,
                'type' => 'error',
                'message' => "Overdue payment warning: Invoice '{$inv->invoice_number}' for '{$inv->project->name}' was due on {$inv->due_date->format('M d, Y')}."
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'kpi' => [
                    'total_active_projects' => $totalActiveProjects,
                    'projects_completed' => $projectsCompleted,
                    'projects_in_progress' => $projectsInProgress,
                    'materials_in_stock' => (float) $materialsInStock,
                    'materials_dispatched_today' => [
                        'count' => $dispatchedTodayCount,
                        'cost' => (float) $dispatchedTodayCost
                    ],
                    'pending_quotations' => $pendingQuotations,
                    'pending_invoices' => $pendingInvoices,
                    'purchase_orders_pending' => $purchaseOrdersPending,
                    'monthly_revenue' => (float) $monthlyRevenue,
                ],
                'charts' => [
                    'revenue' => $revenueChart,
                    'project_status' => $projectStatusChart,
                    'purchases' => $purchasesChart,
                    'material_consumption' => $materialConsumptionChart,
                    'site_wise_progress' => $siteWiseProgress,
                    'material_cost_vs_budget' => $materialCostVsBudget
                ],
                'lists' => [
                    'recent_activities' => $recentActivities,
                    'recent_quotations' => $recentQuotations,
                    'recent_purchases' => $recentPurchases,
                    'recent_dispatches' => $recentDispatches
                ],
                'notifications' => $notifications
            ]
        ]);
    }
}
