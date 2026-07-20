<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\MaterialConsumption;
use App\Models\Project;
use App\Models\PurchaseOrder;
use App\Models\Vendor;
use App\Models\WarehouseStock;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    use ApiResponse;

    public function dashboard(): JsonResponse
    {
        $totalProjects = Project::count();
        
        $revenueBilled = (float) Invoice::where('status', '!=', 'cancelled')->sum('total_amount');
        $collectionsReceived = (float) Invoice::where('status', '!=', 'cancelled')->sum('paid_amount');
        $outstandingReceivables = $revenueBilled - $collectionsReceived;

        $purchaseSpend = (float) PurchaseOrder::whereIn('status', ['approved', 'completed'])->sum('total_amount');

        // Calculate total inventory asset value
        $inventoryValue = (float) DB::table('warehouse_stocks')
            ->join('materials', 'warehouse_stocks.material_id', '=', 'materials.id')
            ->sum(DB::raw('warehouse_stocks.current_stock * materials.purchase_price'));

        return $this->successResponse([
            'total_projects'          => $totalProjects,
            'revenue_billed'           => $revenueBilled,
            'collections_received'     => $collectionsReceived,
            'outstanding_receivables'  => $outstandingReceivables,
            'purchase_spend'          => $purchaseSpend,
            'inventory_value'         => $inventoryValue,
        ], 'Dashboard summary report retrieved.');
    }

    public function projects(): JsonResponse
    {
        $projects = Project::select('id', 'name', 'project_code', 'budget', 'estimated_cost', 'actual_cost', 'completion_percent')
            ->withCount('progressLogs')
            ->get()
            ->map(function ($p) {
                $invoiced = (float) Invoice::where('project_id', $p->id)->where('status', '!=', 'cancelled')->sum('total_amount');
                $paid = (float) Invoice::where('project_id', $p->id)->where('status', '!=', 'cancelled')->sum('paid_amount');
                
                return [
                    'id'                 => $p->id,
                    'name'               => $p->name,
                    'project_code'       => $p->project_code,
                    'budget'             => (float) $p->budget,
                    'estimated_cost'     => (float) $p->estimated_cost,
                    'actual_cost'        => (float) $p->actual_cost,
                    'completion_percent' => $p->completion_percent,
                    'total_invoiced'     => $invoiced,
                    'total_collected'    => $paid,
                    'outstanding'        => $invoiced - $paid,
                    'progress_logs_count'=> $p->progress_logs_count,
                ];
            });

        return $this->successResponse($projects, 'Project performance report retrieved.');
    }

    public function purchases(): JsonResponse
    {
        // PO counts by status
        $byStatus = DB::table('purchase_orders')
            ->select('status', DB::raw('count(*) as count'), DB::raw('sum(total_amount) as total'))
            ->groupBy('status')
            ->get();

        // PO spends by vendor
        $byVendor = DB::table('purchase_orders')
            ->join('vendors', 'purchase_orders.vendor_id', '=', 'vendors.id')
            ->select('vendors.name', DB::raw('count(*) as count'), DB::raw('sum(total_amount) as total'))
            ->groupBy('vendors.id', 'vendors.name')
            ->orderByDesc('total')
            ->get();

        return $this->successResponse([
            'by_status' => $byStatus,
            'by_vendor' => $byVendor,
        ], 'Purchase order reports retrieved.');
    }

    public function stock(): JsonResponse
    {
        $stocks = WarehouseStock::with(['material', 'warehouse'])
            ->get()
            ->map(function ($s) {
                return [
                    'id'             => $s->id,
                    'warehouse'      => $s->warehouse?->name,
                    'material_name'  => $s->material?->name,
                    'sku'            => $s->material?->sku,
                    'current_stock'  => (float) $s->current_stock,
                    'reserved_stock' => (float) $s->reserved_stock,
                    'reorder_level'  => (float) ($s->material?->reorder_level ?? 10),
                    'purchase_price' => (float) ($s->material?->purchase_price ?? 0),
                    'stock_value'    => (float) ($s->current_stock * ($s->material?->purchase_price ?? 0)),
                    'unit'           => $s->material?->unit,
                    'needs_reorder'  => $s->current_stock <= ($s->material?->reorder_level ?? 10),
                ];
            });

        return $this->successResponse($stocks, 'Warehouse stock ledger reports retrieved.');
    }

    public function site(): JsonResponse
    {
        $siteActivity = Project::select('id', 'name', 'project_code')
            ->withCount(['progressLogs', 'workerAttendances', 'siteExpenses'])
            ->get()
            ->map(function ($p) {
                $totalExpensesClaimed = (float) DB::table('site_expenses')
                    ->where('project_id', $p->id)
                    ->sum('amount');

                $approvedExpenses = (float) DB::table('site_expenses')
                    ->where('project_id', $p->id)
                    ->where('status', 'approved')
                    ->sum('amount');

                return [
                    'id'               => $p->id,
                    'name'             => $p->name,
                    'project_code'     => $p->project_code,
                    'diary_logs_count' => $p->progress_logs_count,
                    'attendance_count' => $p->worker_attendances_count,
                    'expenses_count'   => $p->site_expenses_count,
                    'expenses_claimed' => $totalExpensesClaimed,
                    'expenses_approved'=> $approvedExpenses,
                ];
            });

        return $this->successResponse($siteActivity, 'Daily site progress reports retrieved.');
    }

    public function materialConsumption(): JsonResponse
    {
        $consumptions = MaterialConsumption::with(['project', 'material', 'warehouse'])
            ->orderByDesc('consumption_date')
            ->get()
            ->map(function ($c) {
                $val = (float) ($c->quantity_consumed * ($c->material?->purchase_price ?? 0));
                return [
                    'id'                => $c->id,
                    'project_name'      => $c->project?->name,
                    'material_name'     => $c->material?->name,
                    'sku'               => $c->material?->sku,
                    'warehouse'         => $c->warehouse?->name,
                    'quantity_consumed' => (float) $c->quantity_consumed,
                    'unit'              => $c->material?->unit,
                    'unit_cost'         => (float) ($c->material?->purchase_price ?? 0),
                    'total_cost'        => $val,
                    'date'              => $c->consumption_date,
                    'notes'             => $c->notes,
                ];
            });

        return $this->successResponse($consumptions, 'Material consumption audit reports retrieved.');
    }

    public function vendors(): JsonResponse
    {
        $vendors = Vendor::select('id', 'name', 'contact_name', 'email', 'phone')
            ->get()
            ->map(function ($v) {
                $poCount = PurchaseOrder::where('vendor_id', $v->id)->count();
                $poSpend = (float) PurchaseOrder::where('vendor_id', $v->id)->whereIn('status', ['approved', 'completed'])->sum('total_amount');
                $pendingInvoice = (float) DB::table('purchase_invoices')
                    ->where('purchase_orders.vendor_id', $v->id)
                    ->join('purchase_orders', 'purchase_invoices.purchase_order_id', '=', 'purchase_orders.id')
                    ->where('purchase_invoices.status', 'pending')
                    ->sum('purchase_invoices.total_amount');

                return [
                    'id'              => $v->id,
                    'name'            => $v->name,
                    'contact_name'    => $v->contact_name,
                    'email'           => $v->email,
                    'phone'           => $v->phone,
                    'po_count'        => $poCount,
                    'po_spend'        => $poSpend,
                    'pending_payment' => $pendingInvoice,
                ];
            });

        return $this->successResponse($vendors, 'Vendor performance reports retrieved.');
    }

    public function customers(): JsonResponse
    {
        $customers = Customer::select('id', 'name', 'contact_name', 'contact_email', 'contact_phone')
            ->get()
            ->map(function ($c) {
                $projects = Project::where('customer_id', $c->id)->get();
                $projectCount = $projects->count();
                
                $projectIds = $projects->pluck('id')->toArray();
                $invoiced = 0;
                $collected = 0;

                if (count($projectIds) > 0) {
                    $invoiced = (float) Invoice::whereIn('project_id', $projectIds)->where('status', '!=', 'cancelled')->sum('total_amount');
                    $collected = (float) Invoice::whereIn('project_id', $projectIds)->where('status', '!=', 'cancelled')->sum('paid_amount');
                }

                return [
                    'id'              => $c->id,
                    'name'            => $c->name,
                    'contact_name'    => $c->contact_name,
                    'email'           => $c->contact_email,
                    'phone'           => $c->contact_phone,
                    'projects_count'  => $projectCount,
                    'total_invoiced'  => $invoiced,
                    'total_collected' => $collected,
                    'outstanding'     => $invoiced - $collected,
                ];
            });

        return $this->successResponse($customers, 'Customer balance and billing reports retrieved.');
    }

    public function profitability(): JsonResponse
    {
        $profitability = Project::select('id', 'name', 'project_code', 'budget', 'actual_cost')
            ->get()
            ->map(function ($p) {
                $revenue = (float) Invoice::where('project_id', $p->id)->where('status', '!=', 'cancelled')->sum('total_amount');
                $collections = (float) Invoice::where('project_id', $p->id)->where('status', '!=', 'cancelled')->sum('paid_amount');
                
                // Expenses incurred
                $materialCost = (float) DB::table('material_consumptions')
                    ->where('project_id', $p->id)
                    ->join('materials', 'material_consumptions.material_id', '=', 'materials.id')
                    ->sum(DB::raw('material_consumptions.quantity_consumed * materials.purchase_price'));

                $attendanceCount = DB::table('worker_attendances')
                    ->where('project_id', $p->id)
                    ->where('status', 'present')
                    ->count();
                // Estimate laborer cost at average ₹800 per present worker day
                $laborCost = $attendanceCount * 800;

                $pettyExpenses = (float) DB::table('site_expenses')
                    ->where('project_id', $p->id)
                    ->where('status', 'approved')
                    ->sum('amount');

                $totalCostIncurred = $materialCost + $laborCost + $pettyExpenses;
                $netProfit = $revenue - $totalCostIncurred;
                $profitMargin = $revenue > 0 ? ($netProfit / $revenue) * 100 : 0;

                return [
                    'id'               => $p->id,
                    'name'             => $p->name,
                    'project_code'     => $p->project_code,
                    'billed_revenue'   => $revenue,
                    'collected_revenue'=> $collections,
                    'material_expense' => $materialCost,
                    'labor_expense'    => $laborCost,
                    'petty_expense'    => $pettyExpenses,
                    'total_incurred'   => $totalCostIncurred,
                    'net_profit'       => $netProfit,
                    'profit_margin'    => round($profitMargin, 2),
                ];
            });

        return $this->successResponse($profitability, 'Project profitability reports retrieved.');
    }
}
