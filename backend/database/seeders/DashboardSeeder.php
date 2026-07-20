<?php

namespace Database\Seeders;

use App\Models\Project;
use App\Models\Material;
use App\Models\MaterialDispatch;
use App\Models\Quotation;
use App\Models\Invoice;
use App\Models\PurchaseOrder;
use App\Models\SiteProgress;
use App\Models\Customer;
use App\Models\CustomerDocument;
use App\Models\QuotationItem;
use App\Models\ProjectMilestone;
use App\Models\ProjectProgressLog;
use App\Models\ProjectTeamMember;
use App\Models\User;
use App\Models\MaterialCategory;
use App\Models\MaterialBrand;
use App\Models\MaterialUnit;
use App\Models\Vendor;
use App\Models\PurchaseOrderItem;
use App\Models\GoodsReceiptNote;
use App\Models\GoodsReceiptNoteItem;
use App\Models\PurchaseInvoice;
use App\Models\PurchaseReturn;
use App\Models\PurchaseReturnItem;
use App\Models\Warehouse;
use App\Models\MaterialBatch;
use App\Models\WarehouseStock;
use App\Models\StockLedger;
use App\Models\MaterialRequest;
use App\Models\MaterialRequestItem;
use App\Models\MaterialDispatchItem;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DashboardSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 0. Seed Customers
        $c1 = Customer::create([
            'name' => 'Acme Corp Interiors',
            'contact_name' => 'John Doe',
            'contact_phone' => '+1 (555) 019-2834',
            'contact_email' => 'johndoe@acmecorp.com',
            'gst_number' => '27AAAAA1111A1Z1',
            'billing_address' => '123 Industrial Parkway, Suite 100, San Francisco, CA',
            'site_address' => 'Corporate Office Hub Site, 456 Financial Blvd, San Francisco, CA',
            'lead_status' => 'active',
            'notes' => 'High priority enterprise client. Preferred wood materials.',
        ]);

        $c2 = Customer::create([
            'name' => 'Sophia Loren Designs',
            'contact_name' => 'Sophia Loren',
            'contact_phone' => '+1 (555) 014-9988',
            'contact_email' => 'sophia@lorenstyles.com',
            'gst_number' => '27BBBBB2222B2Z2',
            'billing_address' => '789 Luxury Heights, Penthouse B, New York, NY',
            'site_address' => 'Luxury Penthouse Suite, 888 Plaza Ave, New York, NY',
            'lead_status' => 'active',
            'notes' => 'Likes premium Italian marble and tempered glass designs.',
        ]);

        $c3 = Customer::create([
            'name' => 'Modern Living Inc',
            'contact_name' => 'Alice Smith',
            'contact_phone' => '+1 (555) 012-3456',
            'contact_email' => 'alice@modernliving.com',
            'gst_number' => '27CCCCC3333C3Z3',
            'billing_address' => '500 Oak St, Chicago, IL',
            'site_address' => 'Modern Minimalist Villa, 101 Lakefront Dr, Chicago, IL',
            'lead_status' => 'proposal',
            'notes' => 'Proposal phase for multi-villa remodel contracts.',
        ]);

        $c4 = Customer::create([
            'name' => 'Brew & Co',
            'contact_name' => 'Marcus Aurelius',
            'contact_phone' => '+1 (555) 017-1717',
            'contact_email' => 'marcus@brewco.com',
            'gst_number' => null,
            'billing_address' => '12 Coffee Ln, Seattle, WA',
            'site_address' => 'Cozy Cafe Bistro, 34 Pike Place, Seattle, WA',
            'lead_status' => 'lead',
        ]);

        $c5 = Customer::create([
            'name' => 'Loft Spaces LLC',
            'contact_name' => 'Chloe Bennett',
            'contact_phone' => '+1 (555) 019-9090',
            'contact_email' => 'chloe@loftspaces.net',
            'gst_number' => '27DDDDD4444D4Z4',
            'billing_address' => '90 Industrial Dr, Los Angeles, CA',
            'site_address' => 'Urban Loft Apartment, 222 Sunset Blvd, Los Angeles, CA',
            'lead_status' => 'contacted',
        ]);

        // Seed Customer Documents
        CustomerDocument::create([
            'customer_id' => $c1->id,
            'file_name' => 'acme_office_layout_v2.pdf',
            'file_path' => '/storage/documents/acme_office_layout_v2.pdf',
            'file_type' => 'pdf',
        ]);

        CustomerDocument::create([
            'customer_id' => $c2->id,
            'file_name' => 'sophia_loren_agreement.pdf',
            'file_path' => '/storage/documents/sophia_loren_agreement.pdf',
            'file_type' => 'pdf',
        ]);

        CustomerDocument::create([
            'customer_id' => $c3->id,
            'file_name' => 'villa_proposal_slides.pdf',
            'file_path' => '/storage/documents/villa_proposal_slides.pdf',
            'file_type' => 'pdf',
        ]);

        // 1. Seed Projects linked to Customers
        // Fetch users seeded by RolePermissionSeeder for team assignment
        $manager1  = User::where('email', 'superadmin@interior.com')->first();
        $engineer1 = User::where('email', 'siteengineer@interior.com')->first();
        $supervisor = User::where('email', 'supervisor@interior.com')->first();
        $pm        = User::where('email', 'projectmanager@interior.com')->first();

        $penthouse = Project::create([
            'name'               => 'Luxury Penthouse Suite',
            'description'        => 'Full interior renovation of a 4,500 sqft luxury penthouse including living spaces, master bedroom, and rooftop terrace.',
            'status'             => 'in_progress',
            'budget'             => 150000.00,
            'material_budget'    => 45000.00,
            'estimated_cost'     => 138000.00,
            'actual_cost'        => 62500.00,
            'completion_percent' => 45,
            'start_date'         => Carbon::now()->subDays(30),
            'end_date'           => Carbon::now()->addDays(60),
            'customer_id'        => $c2->id,
            'project_manager_id' => $pm?->id,
            'site_address'       => 'Luxury Penthouse Suite, 888 Plaza Ave, New York, NY',
            'site_contact_name'  => 'Sophia Loren',
            'site_contact_phone' => '+1 (555) 014-9988',
        ]);

        $villa = Project::create([
            'name'               => 'Modern Minimalist Villa',
            'description'        => 'Modern minimalist interior design for a 6-bedroom lakefront villa emphasizing clean lines and natural materials.',
            'status'             => 'active',
            'budget'             => 280000.00,
            'material_budget'    => 80000.00,
            'estimated_cost'     => 265000.00,
            'actual_cost'        => 18000.00,
            'completion_percent' => 12,
            'start_date'         => Carbon::now()->subDays(15),
            'end_date'           => Carbon::now()->addDays(120),
            'customer_id'        => $c3->id,
            'project_manager_id' => $pm?->id,
            'site_address'       => 'Modern Minimalist Villa, 101 Lakefront Dr, Chicago, IL',
            'site_contact_name'  => 'Alice Smith',
            'site_contact_phone' => '+1 (555) 012-3456',
        ]);

        $office = Project::create([
            'name'               => 'Corporate Office Hub',
            'description'        => 'Complete fit-out of 12,000 sqft corporate office space including reception, open office, 8 cabins, and 2 boardrooms.',
            'status'             => 'completed',
            'budget'             => 420000.00,
            'material_budget'    => 120000.00,
            'estimated_cost'     => 415000.00,
            'actual_cost'        => 408000.00,
            'completion_percent' => 100,
            'start_date'         => Carbon::now()->subDays(90),
            'end_date'           => Carbon::now()->subDays(5),
            'customer_id'        => $c1->id,
            'project_manager_id' => $manager1?->id,
            'site_address'       => 'Corporate Office Hub Site, 456 Financial Blvd, San Francisco, CA',
            'site_contact_name'  => 'John Doe',
            'site_contact_phone' => '+1 (555) 019-2834',
        ]);

        $cafe = Project::create([
            'name'               => 'Cozy Cafe Bistro',
            'description'        => 'Rustic-industrial interior fit-out for a 1,200 sqft cafe space including kitchen, seating area, and outdoor terrace.',
            'status'             => 'pending',
            'budget'             => 65000.00,
            'material_budget'    => 20000.00,
            'estimated_cost'     => 62000.00,
            'actual_cost'        => 0,
            'completion_percent' => 0,
            'start_date'         => Carbon::now()->addDays(10),
            'end_date'           => Carbon::now()->addDays(50),
            'customer_id'        => $c4->id,
            'site_address'       => 'Cozy Cafe Bistro, 34 Pike Place, Seattle, WA',
            'site_contact_name'  => 'Marcus Aurelius',
            'site_contact_phone' => '+1 (555) 017-1717',
        ]);

        $loft = Project::create([
            'name'               => 'Urban Loft Apartment',
            'description'        => 'Contemporary loft redesign with open-plan living, mezzanine bedroom, and exposed brick accent walls.',
            'status'             => 'in_progress',
            'budget'             => 110000.00,
            'material_budget'    => 35000.00,
            'estimated_cost'     => 105000.00,
            'actual_cost'        => 28000.00,
            'completion_percent' => 28,
            'start_date'         => Carbon::now()->subDays(20),
            'end_date'           => Carbon::now()->addDays(40),
            'customer_id'        => $c5->id,
            'project_manager_id' => $pm?->id,
            'site_address'       => 'Urban Loft Apartment, 222 Sunset Blvd, Los Angeles, CA',
            'site_contact_name'  => 'Chloe Bennett',
            'site_contact_phone' => '+1 (555) 019-9090',
        ]);

        // ── Milestones ─────────────────────────────────────────────────────────
        // Penthouse milestones
        ProjectMilestone::create(['project_id' => $penthouse->id, 'title' => 'Site Survey & Measurement', 'description' => 'Complete site survey, finalize measurements and layout approval.', 'due_date' => Carbon::now()->subDays(25), 'status' => 'completed', 'completed_at' => Carbon::now()->subDays(24)]);
        ProjectMilestone::create(['project_id' => $penthouse->id, 'title' => 'Material Procurement', 'description' => 'Order and receive marble tiles, teak wood, LED fixtures, and glass panels.', 'due_date' => Carbon::now()->subDays(10), 'status' => 'completed', 'completed_at' => Carbon::now()->subDays(8)]);
        ProjectMilestone::create(['project_id' => $penthouse->id, 'title' => 'Flooring & Partition Works', 'description' => 'Install marble flooring in living room and master bedroom, glass partitions.', 'due_date' => Carbon::now()->addDays(15), 'status' => 'pending']);
        ProjectMilestone::create(['project_id' => $penthouse->id, 'title' => 'Electrical & Lighting', 'description' => 'Install LED spotlight grid, ambient lighting, and electrical fittings.', 'due_date' => Carbon::now()->addDays(35), 'status' => 'pending']);
        ProjectMilestone::create(['project_id' => $penthouse->id, 'title' => 'Final Finishing & Handover', 'description' => 'Painting, furnishing placement, snag list resolution, and client handover.', 'due_date' => Carbon::now()->addDays(58), 'status' => 'pending']);

        // Office milestones (all completed)
        ProjectMilestone::create(['project_id' => $office->id, 'title' => 'Site Preparation & Demolition', 'due_date' => Carbon::now()->subDays(85), 'status' => 'completed', 'completed_at' => Carbon::now()->subDays(84)]);
        ProjectMilestone::create(['project_id' => $office->id, 'title' => 'Structural & Civil Works', 'due_date' => Carbon::now()->subDays(70), 'status' => 'completed', 'completed_at' => Carbon::now()->subDays(68)]);
        ProjectMilestone::create(['project_id' => $office->id, 'title' => 'Flooring & Wall Cladding', 'due_date' => Carbon::now()->subDays(45), 'status' => 'completed', 'completed_at' => Carbon::now()->subDays(43)]);
        ProjectMilestone::create(['project_id' => $office->id, 'title' => 'Furniture & Fixtures', 'due_date' => Carbon::now()->subDays(20), 'status' => 'completed', 'completed_at' => Carbon::now()->subDays(18)]);
        ProjectMilestone::create(['project_id' => $office->id, 'title' => 'Client Handover', 'due_date' => Carbon::now()->subDays(5), 'status' => 'completed', 'completed_at' => Carbon::now()->subDays(5)]);

        // Villa milestones
        ProjectMilestone::create(['project_id' => $villa->id, 'title' => 'Design Finalization', 'description' => 'Get final client sign-off on mood boards and 3D renders.', 'due_date' => Carbon::now()->subDays(5), 'status' => 'completed', 'completed_at' => Carbon::now()->subDays(4)]);
        ProjectMilestone::create(['project_id' => $villa->id, 'title' => 'Procurement Phase 1', 'description' => 'Order marble tiles, wood panels and custom furniture.', 'due_date' => Carbon::now()->addDays(20), 'status' => 'pending']);
        ProjectMilestone::create(['project_id' => $villa->id, 'title' => 'Interior Works', 'description' => 'All internal fit-out across 6 rooms.', 'due_date' => Carbon::now()->addDays(80), 'status' => 'pending']);

        // Loft milestones
        ProjectMilestone::create(['project_id' => $loft->id, 'title' => 'Demolition & Prep', 'due_date' => Carbon::now()->subDays(15), 'status' => 'completed', 'completed_at' => Carbon::now()->subDays(14)]);
        ProjectMilestone::create(['project_id' => $loft->id, 'title' => 'Exposed Brick & Plaster Works', 'due_date' => Carbon::now()->addDays(10), 'status' => 'pending']);
        ProjectMilestone::create(['project_id' => $loft->id, 'title' => 'Mezzanine Structure', 'due_date' => Carbon::now()->addDays(25), 'status' => 'pending']);

        // ── Progress Logs ──────────────────────────────────────────────────────
        $loggedBy = $engineer1?->id ?? $manager1?->id;

        // Penthouse progress
        ProjectProgressLog::create(['project_id' => $penthouse->id, 'logged_by' => $loggedBy, 'log_date' => Carbon::now()->subDays(28), 'description' => 'Site cleared and base measurements confirmed. Approved layout drawings received from architect.', 'completion_percent' => 5]);
        ProjectProgressLog::create(['project_id' => $penthouse->id, 'logged_by' => $loggedBy, 'log_date' => Carbon::now()->subDays(20), 'description' => 'All marble tiles and teak wood planks delivered to site. Quantity verified against purchase order.', 'completion_percent' => 15]);
        ProjectProgressLog::create(['project_id' => $penthouse->id, 'logged_by' => $loggedBy, 'log_date' => Carbon::now()->subDays(10), 'description' => 'Flooring work started in master bedroom. 60% of marble tiling complete. Glass partitions installed in living area.', 'completion_percent' => 35]);
        ProjectProgressLog::create(['project_id' => $penthouse->id, 'logged_by' => $loggedBy, 'log_date' => Carbon::now()->subDays(2), 'description' => 'Master bedroom flooring fully complete. LED spotlight grid installation started in living room. 45% overall project completion.', 'completion_percent' => 45]);

        // Office progress (completed)
        ProjectProgressLog::create(['project_id' => $office->id, 'logged_by' => $loggedBy, 'log_date' => Carbon::now()->subDays(80), 'description' => 'Demolition of old partitions complete. Civil baseline works started.', 'completion_percent' => 10]);
        ProjectProgressLog::create(['project_id' => $office->id, 'logged_by' => $loggedBy, 'log_date' => Carbon::now()->subDays(60), 'description' => 'All flooring and wall cladding complete. Electrical conduits laid.', 'completion_percent' => 50]);
        ProjectProgressLog::create(['project_id' => $office->id, 'logged_by' => $loggedBy, 'log_date' => Carbon::now()->subDays(20), 'description' => 'Furniture installation complete. AV systems and data cabling done.', 'completion_percent' => 90]);
        ProjectProgressLog::create(['project_id' => $office->id, 'logged_by' => $loggedBy, 'log_date' => Carbon::now()->subDays(5), 'description' => 'All snag items resolved. Client inspection done and handover completed.', 'completion_percent' => 100]);

        // Loft progress
        ProjectProgressLog::create(['project_id' => $loft->id, 'logged_by' => $loggedBy, 'log_date' => Carbon::now()->subDays(18), 'description' => 'Demolition of false ceiling and old partition walls complete. Site ready for new works.', 'completion_percent' => 10]);
        ProjectProgressLog::create(['project_id' => $loft->id, 'logged_by' => $loggedBy, 'log_date' => Carbon::now()->subDays(5), 'description' => 'Brick feature wall plastering 50% done. Mezzanine steel frame fabrication in progress.', 'completion_percent' => 28]);

        // ── Team Members ───────────────────────────────────────────────────────
        if ($engineer1) {
            ProjectTeamMember::create(['project_id' => $penthouse->id, 'user_id' => $engineer1->id, 'role' => 'Site Engineer', 'assigned_at' => now()]);
            ProjectTeamMember::create(['project_id' => $villa->id, 'user_id' => $engineer1->id, 'role' => 'Site Engineer', 'assigned_at' => now()]);
            ProjectTeamMember::create(['project_id' => $loft->id, 'user_id' => $engineer1->id, 'role' => 'Site Engineer', 'assigned_at' => now()]);
        }
        if ($supervisor) {
            ProjectTeamMember::create(['project_id' => $penthouse->id, 'user_id' => $supervisor->id, 'role' => 'Supervisor', 'assigned_at' => now()]);
            ProjectTeamMember::create(['project_id' => $office->id, 'user_id' => $supervisor->id, 'role' => 'Supervisor', 'assigned_at' => now()]);
        }
        if ($pm) {
            ProjectTeamMember::create(['project_id' => $penthouse->id, 'user_id' => $pm->id, 'role' => 'Project Manager', 'assigned_at' => now()]);
            ProjectTeamMember::create(['project_id' => $villa->id, 'user_id' => $pm->id, 'role' => 'Project Manager', 'assigned_at' => now()]);
            ProjectTeamMember::create(['project_id' => $loft->id, 'user_id' => $pm->id, 'role' => 'Project Manager', 'assigned_at' => now()]);
        }

        // ── 2a. Seed Material Lookup Tables ──────────────────────────────────

        // Categories
        $catFlooring  = MaterialCategory::create(['name' => 'Flooring',           'description' => 'All floor covering materials',            'color' => '#8d6e63']);
        $catWall      = MaterialCategory::create(['name' => 'Wall & Ceiling',     'description' => 'Wall cladding, paint and ceiling finishes', 'color' => '#7986cb']);
        $catLighting  = MaterialCategory::create(['name' => 'Lighting',           'description' => 'LED, spot, and ambient lighting fixtures',  'color' => '#ffd54f']);
        $catGlass     = MaterialCategory::create(['name' => 'Glass & Partitions', 'description' => 'Tempered glass, mirrors, and partitions',   'color' => '#4dd0e1']);
        $catFurniture = MaterialCategory::create(['name' => 'Furniture & Joinery','description' => 'Custom and standard furniture items',       'color' => '#a5d6a7']);
        $catHardware  = MaterialCategory::create(['name' => 'Hardware & Fittings','description' => 'Screws, handles, locks, and fittings',     'color' => '#ef9a9a']);

        // Sub-category example
        MaterialCategory::create(['name' => 'Marble & Stone', 'description' => 'Natural stone and marble tiles', 'color' => '#ce93d8', 'parent_id' => $catFlooring->id]);
        MaterialCategory::create(['name' => 'Wood Flooring',  'description' => 'Teak, oak, and engineered wood',  'color' => '#ffcc80', 'parent_id' => $catFlooring->id]);

        // Brands
        $brandAsian  = MaterialBrand::create(['name' => 'Asian Paints',  'description' => 'Premium paint manufacturer']);
        $brandSaint  = MaterialBrand::create(['name' => 'Saint-Gobain',   'description' => 'Glass and building materials leader']);
        $brandGranitex = MaterialBrand::create(['name' => 'Granitex',    'description' => 'Imported marble and granite supplier']);
        $brandPhilips  = MaterialBrand::create(['name' => 'Philips',     'description' => 'LED lighting solutions']);
        $brandCenturyply = MaterialBrand::create(['name' => 'CenturyPly', 'description' => 'Premium plywood and wood products']);

        // Units
        $unitPcs   = MaterialUnit::create(['name' => 'Pieces',        'abbreviation' => 'pcs']);
        $unitSqft  = MaterialUnit::create(['name' => 'Square Feet',   'abbreviation' => 'sqft']);
        $unitRft   = MaterialUnit::create(['name' => 'Running Feet',  'abbreviation' => 'rft']);
        $unitLitre = MaterialUnit::create(['name' => 'Litres',        'abbreviation' => 'ltr']);
        $unitKg    = MaterialUnit::create(['name' => 'Kilograms',     'abbreviation' => 'kg']);
        $unitBox   = MaterialUnit::create(['name' => 'Box',           'abbreviation' => 'box']);
        $unitSet   = MaterialUnit::create(['name' => 'Set',           'abbreviation' => 'set']);

        // ── 2b. Seed Materials (enriched) ─────────────────────────────────────

        $wood = Material::create([
            'name'           => 'Teak Wood Planks',
            'description'    => 'Premium grade teak wood planks for flooring and paneling. Moisture resistant.',
            'sku'            => 'MAT-TEK-001',
            'hsn_code'       => '4407',
            'gst_rate'       => 12.00,
            'stock_quantity' => 450.00,
            'reorder_level'  => 100.00,
            'unit'           => 'pcs',
            'unit_id'        => $unitPcs->id,
            'category_id'    => $catFlooring->id,
            'brand_id'       => $brandCenturyply->id,
            'cost_price'     => 35.00,
            'purchase_price' => 35.00,
            'selling_price'  => 52.00,
            'is_active'      => true,
        ]);

        $paint = Material::create([
            'name'           => 'Premium Matte Paint (White)',
            'description'    => 'Interior grade premium matte finish paint. 15 litre drum.',
            'sku'            => 'MAT-PNT-002',
            'hsn_code'       => '3209',
            'gst_rate'       => 18.00,
            'stock_quantity' => 8.00,
            'reorder_level'  => 20.00,  // low stock — triggers reorder alert
            'unit'           => 'liters',
            'unit_id'        => $unitLitre->id,
            'category_id'    => $catWall->id,
            'brand_id'       => $brandAsian->id,
            'cost_price'     => 18.50,
            'purchase_price' => 18.50,
            'selling_price'  => 24.00,
            'is_active'      => true,
        ]);

        $glass = Material::create([
            'name'           => 'Tempered Glass Sheets',
            'description'    => '8mm toughened glass panels for partitions and shower cubicles.',
            'sku'            => 'MAT-GLS-003',
            'hsn_code'       => '7007',
            'gst_rate'       => 18.00,
            'stock_quantity' => 85.00,
            'reorder_level'  => 30.00,
            'unit'           => 'sqft',
            'unit_id'        => $unitSqft->id,
            'category_id'    => $catGlass->id,
            'brand_id'       => $brandSaint->id,
            'cost_price'     => 45.00,
            'purchase_price' => 45.00,
            'selling_price'  => 68.00,
            'is_active'      => true,
        ]);

        $tiles = Material::create([
            'name'           => 'Italian Marble Tiles',
            'description'    => 'Imported Italian Carrara white marble tiles. 60x60 cm format.',
            'sku'            => 'MAT-MAR-004',
            'hsn_code'       => '6802',
            'gst_rate'       => 12.00,
            'stock_quantity' => 350.00,
            'reorder_level'  => 80.00,
            'unit'           => 'sqft',
            'unit_id'        => $unitSqft->id,
            'category_id'    => $catFlooring->id,
            'brand_id'       => $brandGranitex->id,
            'cost_price'     => 65.00,
            'purchase_price' => 65.00,
            'selling_price'  => 95.00,
            'is_active'      => true,
        ]);

        $led = Material::create([
            'name'           => 'LED Spotlight Fixtures',
            'description'    => '12W GU10 LED spotlight fixtures. Dimmable. Warm white 3000K.',
            'sku'            => 'MAT-LGT-005',
            'hsn_code'       => '9405',
            'gst_rate'       => 18.00,
            'stock_quantity' => 280.00,
            'reorder_level'  => 50.00,
            'unit'           => 'pcs',
            'unit_id'        => $unitPcs->id,
            'category_id'    => $catLighting->id,
            'brand_id'       => $brandPhilips->id,
            'cost_price'     => 12.00,
            'purchase_price' => 12.00,
            'selling_price'  => 18.00,
            'is_active'      => true,
        ]);

        // Additional materials for catalog depth
        Material::create([
            'name' => 'Gypsum False Ceiling Board', 'description' => '12mm gypsum board for false ceilings. Fire resistant.',
            'sku' => 'MAT-GYP-006', 'hsn_code' => '6809', 'gst_rate' => 12.00,
            'stock_quantity' => 120.00, 'reorder_level' => 40.00,
            'unit' => 'sqft', 'unit_id' => $unitSqft->id, 'category_id' => $catWall->id,
            'cost_price' => 8.00, 'purchase_price' => 8.00, 'selling_price' => 12.00, 'is_active' => true,
        ]);
        Material::create([
            'name' => 'Aluminium Section (2 inch)', 'description' => '2-inch aluminium hollow section for partition framing.',
            'sku' => 'MAT-ALU-007', 'hsn_code' => '7604', 'gst_rate' => 18.00,
            'stock_quantity' => 5.00, 'reorder_level' => 25.00,  // low stock
            'unit' => 'rft', 'unit_id' => $unitRft->id, 'category_id' => $catHardware->id,
            'cost_price' => 4.50, 'purchase_price' => 4.50, 'selling_price' => 6.50, 'is_active' => true,
        ]);
        Material::create([
            'name' => 'Ceramic Wall Tiles (30x60)', 'description' => 'Matt finish ceramic tiles for walls.',
            'sku' => 'MAT-CER-008', 'hsn_code' => '6908', 'gst_rate' => 12.00,
            'stock_quantity' => 600.00, 'reorder_level' => 100.00,
            'unit' => 'sqft', 'unit_id' => $unitSqft->id, 'category_id' => $catWall->id,
            'cost_price' => 9.00, 'purchase_price' => 9.00, 'selling_price' => 14.00, 'is_active' => true,
        ]);
        Material::create([
            'name' => 'SS Door Handle Set', 'description' => 'Stainless steel lever handle set with rose and lock body.',
            'sku' => 'MAT-HWR-009', 'hsn_code' => '8302', 'gst_rate' => 18.00,
            'stock_quantity' => 45.00, 'reorder_level' => 10.00,
            'unit' => 'set', 'unit_id' => $unitSet->id, 'category_id' => $catHardware->id,
            'cost_price' => 850.00, 'purchase_price' => 850.00, 'selling_price' => 1250.00, 'is_active' => true,
        ]);
        Material::create([
            'name' => 'Vinyl Plank Flooring', 'description' => 'Click-lock SPC vinyl plank. Waterproof. 5mm wear layer.',
            'sku' => 'MAT-VNL-010', 'hsn_code' => '3918', 'gst_rate' => 18.00,
            'stock_quantity' => 0.00, 'reorder_level' => 50.00,  // out of stock
            'unit' => 'sqft', 'unit_id' => $unitSqft->id, 'category_id' => $catFlooring->id,
            'cost_price' => 22.00, 'purchase_price' => 22.00, 'selling_price' => 32.00, 'is_active' => true,
        ]);


        // 3. Obsolete dispatch seeding block removed to conform with Phase 8 & 9 multi-warehouse stock systems.

        // 4. Seed Quotations with room-wise items using the new schema

        // Quotation 1 - Luxury Penthouse (Approved)
        $q1Items = [
            ['room' => 'Living Room', 'desc' => 'Teak Wood Flooring', 'mat' => $wood, 'qty' => 80, 'up' => 35.00],
            ['room' => 'Living Room', 'desc' => 'Italian Marble Accent Wall', 'mat' => $tiles, 'qty' => 60, 'up' => 65.00],
            ['room' => 'Master Bedroom', 'desc' => 'LED Spotlight Grid', 'mat' => $led, 'qty' => 24, 'up' => 12.00],
            ['room' => 'Master Bedroom', 'desc' => 'Tempered Glass Partition', 'mat' => $glass, 'qty' => 40, 'up' => 45.00],
            ['room' => 'Bathroom', 'desc' => 'Premium Marble Tiles', 'mat' => $tiles, 'qty' => 30, 'up' => 65.00],
        ];
        $q1Sub = collect($q1Items)->sum(fn($i) => $i['qty'] * $i['up']);
        $q1Labor = 18000.00;
        $q1Add = 5000.00;
        $q1Discount = 3000.00;
        $q1Gst = 18.0;
        $q1GstAmt = ($q1Sub + $q1Labor + $q1Add - $q1Discount) * ($q1Gst / 100);
        $q1Total = $q1Sub + $q1Labor + $q1Add - $q1Discount + $q1GstAmt;

        $q1 = Quotation::create([
            'project_id' => $penthouse->id,
            'customer_id' => $c2->id,
            'title' => 'Luxury Penthouse Renovation Proposal',
            'status' => 'approved',
            'subtotal' => $q1Sub,
            'gst_rate' => $q1Gst,
            'gst_amount' => $q1GstAmt,
            'discount_amount' => $q1Discount,
            'labor_charges' => $q1Labor,
            'additional_charges' => $q1Add,
            'total' => $q1Total,
            'terms_conditions' => "1. 50% advance payment required before work commencement.\n2. Balance due within 15 days of project handover.\n3. Materials sourced are premium grade as specified.\n4. Any changes after approval may attract additional costs.",
        ]);
        foreach ($q1Items as $item) {
            QuotationItem::create([
                'quotation_id' => $q1->id,
                'room_name' => $item['room'],
                'material_id' => $item['mat']->id,
                'description' => $item['desc'],
                'quantity' => $item['qty'],
                'unit_price' => $item['up'],
                'total_price' => $item['qty'] * $item['up'],
            ]);
        }

        // Quotation 2 - Corporate Office (Approved)
        $q2Items = [
            ['room' => 'Reception Area', 'desc' => 'Premium Matte Paint Finish', 'mat' => $paint, 'qty' => 50, 'up' => 18.50],
            ['room' => 'Reception Area', 'desc' => 'LED Ambiance Lighting', 'mat' => $led, 'qty' => 40, 'up' => 12.00],
            ['room' => 'Conference Room', 'desc' => 'Tempered Glass Panels', 'mat' => $glass, 'qty' => 120, 'up' => 45.00],
            ['room' => 'Executive Cabin', 'desc' => 'Teak Wood Paneling', 'mat' => $wood, 'qty' => 150, 'up' => 35.00],
            ['room' => 'Open Office Floor', 'desc' => 'Italian Marble Flooring', 'mat' => $tiles, 'qty' => 500, 'up' => 65.00],
        ];
        $q2Sub = collect($q2Items)->sum(fn($i) => $i['qty'] * $i['up']);
        $q2Labor = 45000.00;
        $q2Add = 12000.00;
        $q2Discount = 8000.00;
        $q2Gst = 18.0;
        $q2GstAmt = ($q2Sub + $q2Labor + $q2Add - $q2Discount) * ($q2Gst / 100);
        $q2Total = $q2Sub + $q2Labor + $q2Add - $q2Discount + $q2GstAmt;

        $q2 = Quotation::create([
            'project_id' => $office->id,
            'customer_id' => $c1->id,
            'title' => 'Corporate Office Layout Plan',
            'status' => 'approved',
            'subtotal' => $q2Sub,
            'gst_rate' => $q2Gst,
            'gst_amount' => $q2GstAmt,
            'discount_amount' => $q2Discount,
            'labor_charges' => $q2Labor,
            'additional_charges' => $q2Add,
            'total' => $q2Total,
            'terms_conditions' => "1. Payment in three installments: 40% advance, 40% mid-project, 20% on completion.\n2. Client to provide site access during working hours.\n3. All permits and approvals are client's responsibility.\n4. Warranty: 1 year on workmanship.",
        ]);
        foreach ($q2Items as $item) {
            QuotationItem::create([
                'quotation_id' => $q2->id,
                'room_name' => $item['room'],
                'material_id' => $item['mat']->id,
                'description' => $item['desc'],
                'quantity' => $item['qty'],
                'unit_price' => $item['up'],
                'total_price' => $item['qty'] * $item['up'],
            ]);
        }

        // Quotation 3 - Modern Villa (Sent)
        $q3Items = [
            ['room' => 'Master Bedroom', 'desc' => 'Teak Wood Wardrobe Frame', 'mat' => $wood, 'qty' => 60, 'up' => 35.00],
            ['room' => 'Living Room', 'desc' => 'Marble Flooring', 'mat' => $tiles, 'qty' => 200, 'up' => 65.00],
            ['room' => 'Kitchen', 'desc' => 'Glass Backsplash', 'mat' => $glass, 'qty' => 35, 'up' => 45.00],
        ];
        $q3Sub = collect($q3Items)->sum(fn($i) => $i['qty'] * $i['up']);
        $q3Labor = 22000.00;
        $q3Add = 3500.00;
        $q3Discount = 2000.00;
        $q3Gst = 18.0;
        $q3GstAmt = ($q3Sub + $q3Labor + $q3Add - $q3Discount) * ($q3Gst / 100);
        $q3Total = $q3Sub + $q3Labor + $q3Add - $q3Discount + $q3GstAmt;

        $q3 = Quotation::create([
            'project_id' => $villa->id,
            'customer_id' => $c3->id,
            'title' => 'Modern Minimalist Villa Interior Plan',
            'status' => 'sent',
            'subtotal' => $q3Sub,
            'gst_rate' => $q3Gst,
            'gst_amount' => $q3GstAmt,
            'discount_amount' => $q3Discount,
            'labor_charges' => $q3Labor,
            'additional_charges' => $q3Add,
            'total' => $q3Total,
            'terms_conditions' => "1. Quotation valid for 30 days from issue date.\n2. Site survey required before final order.\n3. GST as applicable at time of invoice.",
        ]);
        foreach ($q3Items as $item) {
            QuotationItem::create([
                'quotation_id' => $q3->id,
                'room_name' => $item['room'],
                'material_id' => $item['mat']->id,
                'description' => $item['desc'],
                'quantity' => $item['qty'],
                'unit_price' => $item['up'],
                'total_price' => $item['qty'] * $item['up'],
            ]);
        }

        // Quotation 4 - Cafe (Draft)
        $q4Items = [
            ['room' => 'Cafe Floor', 'desc' => 'Teak Wood Flooring Strips', 'mat' => $wood, 'qty' => 100, 'up' => 35.00],
            ['room' => 'Counter Area', 'desc' => 'Marble Countertop', 'mat' => $tiles, 'qty' => 25, 'up' => 65.00],
            ['room' => 'Ceiling', 'desc' => 'LED Strip Lighting', 'mat' => $led, 'qty' => 30, 'up' => 12.00],
        ];
        $q4Sub = collect($q4Items)->sum(fn($i) => $i['qty'] * $i['up']);
        $q4Labor = 8000.00;
        $q4Add = 1500.00;
        $q4Discount = 500.00;
        $q4Gst = 18.0;
        $q4GstAmt = ($q4Sub + $q4Labor + $q4Add - $q4Discount) * ($q4Gst / 100);
        $q4Total = $q4Sub + $q4Labor + $q4Add - $q4Discount + $q4GstAmt;

        $q4 = Quotation::create([
            'project_id' => $cafe->id,
            'customer_id' => $c4->id,
            'title' => 'Cozy Cafe Bistro Interior Design',
            'status' => 'draft',
            'subtotal' => $q4Sub,
            'gst_rate' => $q4Gst,
            'gst_amount' => $q4GstAmt,
            'discount_amount' => $q4Discount,
            'labor_charges' => $q4Labor,
            'additional_charges' => $q4Add,
            'total' => $q4Total,
            'terms_conditions' => "1. Draft pending client feedback.\n2. Final material selections to be confirmed.",
        ]);
        foreach ($q4Items as $item) {
            QuotationItem::create([
                'quotation_id' => $q4->id,
                'room_name' => $item['room'],
                'material_id' => $item['mat']->id,
                'description' => $item['desc'],
                'quantity' => $item['qty'],
                'unit_price' => $item['up'],
                'total_price' => $item['qty'] * $item['up'],
            ]);
        }

        // 5. Seed Invoices with new schema (Advance, Running, Final and GST details)
        $inv1 = Invoice::create([
            'project_id'      => $office->id,
            'invoice_number'  => 'INV-2026-0001',
            'invoice_type'    => 'advance',
            'invoice_date'    => Carbon::now()->subDays(60)->toDateString(),
            'due_date'        => Carbon::now()->subDays(60)->toDateString(),
            'payment_terms'   => '50% advance on sign-off.',
            'subtotal'        => 169491.53,
            'discount_amount' => 0.00,
            'tax_rate'        => 18.00,
            'cgst'            => 15254.24,
            'sgst'            => 15254.24,
            'total_gst'       => 30508.47,
            'total_amount'    => 200000.00,
            'status'          => 'paid',
            'paid_amount'     => 200000.00,
            'paid_at'         => Carbon::now()->subDays(55),
            'notes'           => 'Initial project mobilization fee.',
        ]);
        \App\Models\InvoiceItem::create([
            'invoice_id'  => $inv1->id,
            'description' => 'Project Mobilization Advance Payment (50% sign-off)',
            'hsn_code'    => '9983',
            'quantity'    => 1,
            'unit_price'  => 169491.53,
            'total_price' => 169491.53,
            'gst_rate'    => 18.00,
            'gst_amount'  => 30508.47,
        ]);

        $inv2 = Invoice::create([
            'project_id'      => $office->id,
            'invoice_number'  => 'INV-2026-0002',
            'invoice_type'    => 'running',
            'invoice_date'    => Carbon::now()->subDays(10)->toDateString(),
            'due_date'        => Carbon::now()->subDays(5)->toDateString(),
            'payment_terms'   => 'Net 15 days.',
            'subtotal'        => 186440.68,
            'discount_amount' => 0.00,
            'tax_rate'        => 18.00,
            'cgst'            => 16779.66,
            'sgst'            => 16779.66,
            'total_gst'       => 33559.32,
            'total_amount'    => 220000.00,
            'status'          => 'paid',
            'paid_amount'     => 220000.00,
            'paid_at'         => Carbon::now()->subDays(8),
            'notes'           => 'First progress billing for framing work.',
        ]);
        \App\Models\InvoiceItem::create([
            'invoice_id'  => $inv2->id,
            'description' => 'Running Bill — Milestone 1 (Framing and ceiling structural framing completed)',
            'hsn_code'    => '9983',
            'quantity'    => 1,
            'unit_price'  => 186440.68,
            'total_price' => 186440.68,
            'gst_rate'    => 18.00,
            'gst_amount'  => 33559.32,
        ]);

        $inv3 = Invoice::create([
            'project_id'      => $penthouse->id,
            'invoice_number'  => 'INV-2026-0003',
            'invoice_type'    => 'advance',
            'invoice_date'    => Carbon::now()->subDays(5)->toDateString(),
            'due_date'        => Carbon::now()->subDays(5)->toDateString(),
            'payment_terms'   => 'Immediate.',
            'subtotal'        => 42372.88,
            'discount_amount' => 0.00,
            'tax_rate'        => 18.00,
            'cgst'            => 3813.56,
            'sgst'            => 3813.56,
            'total_gst'       => 7627.12,
            'total_amount'    => 50000.00,
            'status'          => 'paid',
            'paid_amount'     => 50000.00,
            'paid_at'         => Carbon::now()->subDays(4),
        ]);
        \App\Models\InvoiceItem::create([
            'invoice_id'  => $inv3->id,
            'description' => 'Mobilization Advance Payment (Luxury Penthouse Suite)',
            'hsn_code'    => '9983',
            'quantity'    => 1,
            'unit_price'  => 42372.88,
            'total_price' => 42372.88,
            'gst_rate'    => 18.00,
            'gst_amount'  => 7627.12,
        ]);

        $inv4 = Invoice::create([
            'project_id'      => $penthouse->id,
            'invoice_number'  => 'INV-2026-0004',
            'invoice_type'    => 'running',
            'invoice_date'    => Carbon::now()->toDateString(),
            'due_date'        => Carbon::now()->addDays(15)->toDateString(),
            'payment_terms'   => 'Net 15 days.',
            'subtotal'        => 42372.88,
            'discount_amount' => 0.00,
            'tax_rate'        => 18.00,
            'cgst'            => 3813.56,
            'sgst'            => 3813.56,
            'total_gst'       => 7627.12,
            'total_amount'    => 50000.00,
            'status'          => 'unpaid',
            'paid_amount'     => 0.00,
        ]);
        \App\Models\InvoiceItem::create([
            'invoice_id'  => $inv4->id,
            'description' => 'Running Bill — Milestone 2 (Drywall and base coating completed)',
            'hsn_code'    => '9983',
            'quantity'    => 1,
            'unit_price'  => 42372.88,
            'total_price' => 42372.88,
            'gst_rate'    => 18.00,
            'gst_amount'  => 7627.12,
        ]);

        $inv5 = Invoice::create([
            'project_id'      => $villa->id,
            'invoice_number'  => 'INV-2026-0005',
            'invoice_type'    => 'running',
            'invoice_date'    => Carbon::now()->toDateString(),
            'due_date'        => Carbon::now()->addDays(5)->toDateString(),
            'payment_terms'   => 'Net 15 days.',
            'subtotal'        => 67796.61,
            'discount_amount' => 0.00,
            'tax_rate'        => 18.00,
            'cgst'            => 6101.69,
            'sgst'            => 6101.69,
            'total_gst'       => 12203.39,
            'total_amount'    => 80000.00,
            'status'          => 'unpaid',
            'paid_amount'     => 0.00,
        ]);
        \App\Models\InvoiceItem::create([
            'invoice_id'  => $inv5->id,
            'description' => 'Running Bill — Electrical wiring and cabling installation completed',
            'hsn_code'    => '9983',
            'quantity'    => 1,
            'unit_price'  => 67796.61,
            'total_price' => 67796.61,
            'gst_rate'    => 18.00,
            'gst_amount'  => 12203.39,
        ]);

        // Historical Paid Invoices
        for ($i = 1; $i <= 3; $i++) {
            $monthDate = Carbon::now()->subMonths($i);
            $amount = 100000 + ($i * 15000);
            $sub = $amount / 1.18;
            $gst = $sub * 0.18;
            $hinv = Invoice::create([
                'project_id'      => $office->id,
                'invoice_number'  => "INV-HIST-000{$i}",
                'invoice_type'    => 'running',
                'invoice_date'    => $monthDate->copy()->subDays(5)->toDateString(),
                'due_date'        => $monthDate->copy()->toDateString(),
                'payment_terms'   => 'Net 15 days.',
                'subtotal'        => round($sub, 2),
                'discount_amount' => 0.00,
                'tax_rate'        => 18.00,
                'cgst'            => round($gst / 2, 2),
                'sgst'            => round($gst / 2, 2),
                'total_gst'       => round($gst, 2),
                'total_amount'    => round($amount, 2),
                'status'          => 'paid',
                'paid_amount'     => round($amount, 2),
                'paid_at'         => $monthDate->copy()->subDays(2),
            ]);
            \App\Models\InvoiceItem::create([
                'invoice_id'  => $hinv->id,
                'description' => "Running progress billing for historical sprint {$i}",
                'hsn_code'    => '9983',
                'quantity'    => 1,
                'unit_price'  => round($sub, 2),
                'total_price' => round($sub, 2),
                'gst_rate'    => 18.00,
                'gst_amount'  => round($gst, 2),
            ]);
        }

        // ── 6. Seed Purchase Module (Vendors, POs, Items, GRNs, Invoices, Returns) ──

        // Vendors
        $vWood = Vendor::create([
            'name' => 'Woodland Suppliers Ltd',
            'company_name' => 'Woodland Supplies Co.',
            'email' => 'sales@woodland.com',
            'phone' => '+1 (555) 019-1122',
            'address' => '44 Forestry Lane, Portland, OR',
            'gst_number' => 'GST-WOOD-88229',
            'payment_terms' => 'Net 30',
        ]);

        $vPaint = Vendor::create([
            'name' => 'Paint World Ltd',
            'company_name' => 'Paint World & Coating',
            'email' => 'orders@paintworld.com',
            'phone' => '+1 (555) 019-3344',
            'address' => '102 Pigment Way, Cleveland, OH',
            'gst_number' => 'GST-PNT-19283',
            'payment_terms' => 'Advance 50%',
        ]);

        $vGlass = Vendor::create([
            'name' => 'Glass & Glaze Co',
            'company_name' => 'Glass Glazing Solutions',
            'email' => 'info@glassglaze.com',
            'phone' => '+1 (555) 019-5566',
            'address' => '78 Crystal Blvd, Toledo, OH',
            'gst_number' => 'GST-GLS-38492',
            'payment_terms' => 'Net 15',
        ]);

        $vMarble = Vendor::create([
            'name' => 'Marble Craft Inc',
            'company_name' => 'Marble Craft Stoneworks',
            'email' => 'support@marblecraft.com',
            'phone' => '+1 (555) 019-7788',
            'address' => '12 Quarry Road, Carrara, IT',
            'gst_number' => 'GST-MAR-48293',
            'payment_terms' => 'Net 45',
        ]);

        // PO 1: Woodland Suppliers - Pending Approval
        $po1 = PurchaseOrder::create([
            'po_number' => 'PO-2026-101',
            'vendor_id' => $vWood->id,
            'project_id' => $penthouse->id,
            'order_date' => Carbon::now()->subDays(5),
            'delivery_date' => Carbon::now()->addDays(10),
            'subtotal' => 3500.00,
            'tax_amount' => 630.00,
            'discount' => 200.00,
            'total_amount' => 3930.00,
            'status' => 'pending_approval',
            'notes' => 'Teak wood for penthouse balcony ceiling paneling.',
            'terms_conditions' => 'Standard Woodland delivery agreement.',
        ]);
        $po1->items()->create([
            'material_id' => $wood->id,
            'quantity' => 100.00,
            'unit_price' => 35.00,
            'tax_rate' => 18.00,
            'tax_amount' => 630.00,
            'total_amount' => 4130.00,
        ]);

        // PO 2: Paint World - Approved
        $po2 = PurchaseOrder::create([
            'po_number' => 'PO-2026-102',
            'vendor_id' => $vPaint->id,
            'project_id' => $loft->id,
            'order_date' => Carbon::now()->subDays(3),
            'delivery_date' => Carbon::now()->addDays(5),
            'subtotal' => 370.00,
            'tax_amount' => 66.60,
            'discount' => 0,
            'total_amount' => 436.60,
            'status' => 'approved',
            'approved_by' => $manager1?->id ?? 1,
            'approved_at' => Carbon::now()->subDays(2),
            'notes' => 'White matte paint for loft walls.',
        ]);
        $po2->items()->create([
            'material_id' => $paint->id,
            'quantity' => 20.00,
            'unit_price' => 18.50,
            'tax_rate' => 18.00,
            'tax_amount' => 66.60,
            'total_amount' => 436.60,
        ]);

        // PO 3: Glass & Glaze Co - Received (fully received via completed GRN)
        $po3 = PurchaseOrder::create([
            'po_number' => 'PO-2026-103',
            'vendor_id' => $vGlass->id,
            'project_id' => $villa->id,
            'order_date' => Carbon::now()->subDays(10),
            'delivery_date' => Carbon::now()->subDays(4),
            'subtotal' => 2250.00,
            'tax_amount' => 405.00,
            'discount' => 100.00,
            'total_amount' => 2555.00,
            'status' => 'received',
            'approved_by' => $manager1?->id ?? 1,
            'approved_at' => Carbon::now()->subDays(9),
            'notes' => 'Tempered glass sheets for villa shower stalls.',
        ]);
        $po3Item = $po3->items()->create([
            'material_id' => $glass->id,
            'quantity' => 50.00,
            'unit_price' => 45.00,
            'tax_rate' => 18.00,
            'tax_amount' => 405.00,
            'total_amount' => 2655.00,
            'received_quantity' => 50.00,
        ]);

        // Seed Completed GRN for PO 3 (completing it updates stock levels)
        $grn1 = GoodsReceiptNote::create([
            'grn_number' => 'GRN-2026-103',
            'purchase_order_id' => $po3->id,
            'received_date' => Carbon::now()->subDays(4)->toDateString(),
            'received_by' => $supervisor?->id ?? 1,
            'status' => 'completed',
            'notes' => 'Received in perfect condition.',
        ]);
        $grn1->items()->create([
            'purchase_order_item_id' => $po3Item->id,
            'material_id' => $glass->id,
            'quantity_ordered' => 50.00,
            'quantity_received' => 50.00,
            'quantity_accepted' => 50.00,
            'quantity_rejected' => 0,
        ]);

        // PO 4: Marble Craft - Ordered (with draft GRN)
        $po4 = PurchaseOrder::create([
            'po_number' => 'PO-2026-104',
            'vendor_id' => $vMarble->id,
            'project_id' => $penthouse->id,
            'order_date' => Carbon::now()->subDays(6),
            'delivery_date' => Carbon::now()->subDays(1),
            'subtotal' => 6500.00,
            'tax_amount' => 780.00,
            'discount' => 300.00,
            'total_amount' => 6980.00,
            'status' => 'ordered',
            'approved_by' => $manager1?->id ?? 1,
            'approved_at' => Carbon::now()->subDays(5),
            'notes' => 'Italian marble tiles for penthouse kitchen floors.',
        ]);
        $po4Item = $po4->items()->create([
            'material_id' => $tiles->id,
            'quantity' => 100.00,
            'unit_price' => 65.00,
            'tax_rate' => 12.00,
            'tax_amount' => 780.00,
            'total_amount' => 7280.00,
            'received_quantity' => 0,
        ]);

        // Draft GRN for PO 4 (not completed yet, so stock not added)
        $grn2 = GoodsReceiptNote::create([
            'grn_number' => 'GRN-2026-104',
            'purchase_order_id' => $po4->id,
            'received_date' => Carbon::now()->subDays(1)->toDateString(),
            'received_by' => $supervisor?->id ?? 1,
            'status' => 'draft',
            'notes' => 'Awaiting quality inspection.',
        ]);
        $grn2->items()->create([
            'purchase_order_item_id' => $po4Item->id,
            'material_id' => $tiles->id,
            'quantity_ordered' => 100.00,
            'quantity_received' => 100.00,
            'quantity_accepted' => 95.00,
            'quantity_rejected' => 5.00,
            'rejection_reason' => 'Chipped corners on 5 tiles.',
        ]);

        // Historical received POs for analytics
        for ($i = 1; $i <= 6; $i++) {
            $monthDate = Carbon::now()->subMonths($i);
            $hpo = PurchaseOrder::create([
                'po_number' => "PO-HIST-10{$i}",
                'vendor_id' => $i % 2 === 0 ? $vWood->id : $vMarble->id,
                'order_date' => $monthDate->copy()->subDays(12),
                'delivery_date' => $monthDate->copy()->subDays(10),
                'subtotal' => 15000 + ($i * 3000),
                'tax_amount' => (15000 + ($i * 3000)) * 0.18,
                'discount' => 500.00,
                'total_amount' => (15000 + ($i * 3000)) * 1.18 - 500,
                'status' => 'received',
                'created_at' => $monthDate->copy()->subDays(12),
            ]);
            $hpoItem = $hpo->items()->create([
                'material_id' => $i % 2 === 0 ? $wood->id : $tiles->id,
                'quantity' => 100,
                'unit_price' => $i % 2 === 0 ? 35.00 : 65.00,
                'tax_rate' => 18.00,
                'tax_amount' => 100 * ($i % 2 === 0 ? 35.00 : 65.00) * 0.18,
                'total_amount' => 100 * ($i % 2 === 0 ? 35.00 : 65.00) * 1.18,
                'received_quantity' => 100,
            ]);

            // Complete GRN for historical tracking
            $hgrn = GoodsReceiptNote::create([
                'grn_number' => "GRN-HIST-10{$i}",
                'purchase_order_id' => $hpo->id,
                'received_date' => $monthDate->copy()->subDays(10)->toDateString(),
                'received_by' => 1,
                'status' => 'completed',
            ]);
            $hgrn->items()->create([
                'purchase_order_item_id' => $hpoItem->id,
                'material_id' => $hpoItem->material_id,
                'quantity_ordered' => 100,
                'quantity_received' => 100,
                'quantity_accepted' => 100,
            ]);
        }

        // ── Seed Purchase Invoices ──────────────────────────────────────────
        // Paid invoice for PO 3
        PurchaseInvoice::create([
            'invoice_number' => 'INV-GLASS-5002',
            'invoice_date' => Carbon::now()->subDays(4),
            'due_date' => Carbon::now()->addDays(11),
            'purchase_order_id' => $po3->id,
            'vendor_id' => $vGlass->id,
            'subtotal' => 2250.00,
            'tax_amount' => 405.00,
            'total_amount' => 2655.00,
            'status' => 'paid',
            'payment_date' => Carbon::now()->subDays(2)->toDateString(),
            'payment_method' => 'Bank Transfer',
        ]);

        // Unpaid invoice for PO 2
        PurchaseInvoice::create([
            'invoice_number' => 'INV-PAINT-9921',
            'invoice_date' => Carbon::now()->subDays(2),
            'due_date' => Carbon::now()->addDays(28),
            'purchase_order_id' => $po2->id,
            'vendor_id' => $vPaint->id,
            'subtotal' => 370.00,
            'tax_amount' => 66.60,
            'total_amount' => 436.60,
            'status' => 'unpaid',
        ]);

        // ── Seed Purchase Return ─────────────────────────────────────────────
        // Return 10 glass sheets from PO 3
        $ret1 = PurchaseReturn::create([
            'return_number' => 'PR-2026-001',
            'purchase_order_id' => $po3->id,
            'vendor_id' => $vGlass->id,
            'return_date' => Carbon::now()->subDays(1),
            'return_reason' => '10 glass sheets found to have hairline cracks during installation.',
            'status' => 'completed',
            'total_refund_amount' => 450.00,
        ]);
        $ret1->items()->create([
            'material_id' => $glass->id,
            'quantity' => 10.00,
            'unit_price' => 45.00,
            'refund_amount' => 450.00,
        ]);
        // Deduct 10 sheets from glass stock level
        $glass->stock_quantity -= 10;
        $glass->save();

        // 7. Seed Site Progress
        SiteProgress::create([
            'project_id' => $penthouse->id,
            'progress_percentage' => 65.00,
            'update_notes' => 'Drywall complete, marble flooring installation in progress.',
        ]);

        SiteProgress::create([
            'project_id' => $villa->id,
            'progress_percentage' => 30.00,
            'update_notes' => 'Framing completed, plumbing and electrical rough-ins started.',
        ]);

        SiteProgress::create([
            'project_id' => $office->id,
            'progress_percentage' => 100.00,
            'update_notes' => 'Project completed and handed over to client.',
        ]);

        SiteProgress::create([
            'project_id' => $loft->id,
            'progress_percentage' => 45.00,
            'update_notes' => 'Plastering completed, first coat of paint started.',
        ]);

        SiteProgress::create([
            'project_id' => $cafe->id,
            'progress_percentage' => 0.00,
            'update_notes' => 'Awaiting final approval on materials and startup design.',
        ]);

        // ── 8. Seed Warehouses ───────────────────────────────────────────────
        $whCentral = Warehouse::create([
            'name'           => 'Central Noida Warehouse',
            'location'       => 'Sector 62, Noida, UP',
            'contact_number' => '+91 99887 76655',
            'is_active'      => true,
        ]);

        $whSite = Warehouse::create([
            'name'           => 'Bangalore Site Yard',
            'location'       => 'Indiranagar, Bangalore, KA',
            'contact_number' => '+91 88776 65544',
            'is_active'      => true,
        ]);

        // ── 9. Seed Batches ──────────────────────────────────────────────────
        $bWood = MaterialBatch::create([
            'material_id'        => $wood->id,
            'batch_number'       => 'BT-TEK-001',
            'manufacturing_date' => Carbon::now()->subMonths(3)->toDateString(),
            'supplier_id'        => $vWood->id,
        ]);

        $bPaint = MaterialBatch::create([
            'material_id'        => $paint->id,
            'batch_number'       => 'BT-PNT-099',
            'expiry_date'        => Carbon::now()->addYear()->toDateString(),
            'manufacturing_date' => Carbon::now()->subMonths(1)->toDateString(),
            'supplier_id'        => $vPaint->id,
        ]);

        $bMarble = MaterialBatch::create([
            'material_id'        => $tiles->id,
            'batch_number'       => 'BT-MAR-005',
            'manufacturing_date' => Carbon::now()->subMonths(4)->toDateString(),
            'supplier_id'        => $vMarble->id,
        ]);

        // ── 10. Seed Warehouse Stocks ────────────────────────────────────────
        // Central Warehouse Stock levels
        $stockWoodCentral = WarehouseStock::create([
            'warehouse_id'   => $whCentral->id,
            'material_id'    => $wood->id,
            'batch_id'       => $bWood->id,
            'opening_stock'  => 300.00,
            'current_stock'  => 400.00,
            'reserved_stock' => 50.00, // 50 reserved for penthouse project
        ]);

        $stockPaintCentral = WarehouseStock::create([
            'warehouse_id'   => $whCentral->id,
            'material_id'    => $paint->id,
            'batch_id'       => $bPaint->id,
            'opening_stock'  => 5.00,
            'current_stock'  => 8.00,
            'reserved_stock' => 0.00,
        ]);

        $stockMarbleCentral = WarehouseStock::create([
            'warehouse_id'   => $whCentral->id,
            'material_id'    => $tiles->id,
            'batch_id'       => $bMarble->id,
            'opening_stock'  => 200.00,
            'current_stock'  => 250.00,
            'reserved_stock' => 20.00,
        ]);

        // Bangalore Site Hub stock levels
        WarehouseStock::create([
            'warehouse_id'   => $whSite->id,
            'material_id'    => $wood->id,
            'batch_id'       => $bWood->id,
            'opening_stock'  => 50.00,
            'current_stock'  => 50.00,
            'reserved_stock' => 0.00,
        ]);

        WarehouseStock::create([
            'warehouse_id'   => $whSite->id,
            'material_id'    => $tiles->id,
            'batch_id'       => $bMarble->id,
            'opening_stock'  => 100.00,
            'current_stock'  => 100.00,
            'reserved_stock' => 0.00,
        ]);

        // ── 11. Seed Stock Ledgers ───────────────────────────────────────────
        StockLedger::create([
            'warehouse_id'     => $whCentral->id,
            'material_id'      => $wood->id,
            'batch_id'         => $bWood->id,
            'transaction_type' => 'opening',
            'quantity'         => 300.00,
            'notes'            => 'Warehouse opening balance',
            'transaction_date' => Carbon::now()->subMonths(1)->toDateString(),
        ]);

        StockLedger::create([
            'warehouse_id'     => $whCentral->id,
            'material_id'      => $wood->id,
            'batch_id'         => $bWood->id,
            'transaction_type' => 'receipt',
            'quantity'         => 100.00,
            'notes'            => 'Goods received via PO-2026-101',
            'transaction_date' => Carbon::now()->subDays(2)->toDateString(),
        ]);

        StockLedger::create([
            'warehouse_id'     => $whCentral->id,
            'material_id'      => $wood->id,
            'batch_id'         => $bWood->id,
            'transaction_type' => 'reserve',
            'quantity'         => -50.00,
            'notes'            => 'Reserved for balcony ceiling',
            'transaction_date' => Carbon::now()->subDay()->toDateString(),
        ]);

        // Adjust Central Noida wood stock level for seeded dispatch
        // Dispatched 30 planks of Teak Wood, so current stock becomes 400 - 30 = 370
        $stockWoodCentral->update([
            'current_stock' => 370.00
        ]);

        // ── 12. Seed Material Requests ────────────────────────────────────────
        $mr1 = MaterialRequest::create([
            'request_number' => 'MR-20260706-0001',
            'project_id'     => $penthouse->id,
            'warehouse_id'   => $whCentral->id,
            'requested_by'   => 8, // Supervisor user
            'status'         => 'dispatched',
            'requested_date' => Carbon::now()->subDays(3)->toDateString(),
            'approved_by'    => 2, // Project Manager
            'approved_at'    => Carbon::now()->subDays(2),
            'notes'          => 'Urgent requirement of Teak Wood planks for ceiling work.',
        ]);

        MaterialRequestItem::create([
            'material_request_id' => $mr1->id,
            'material_id'         => $wood->id,
            'quantity_requested'  => 30.00,
            'quantity_approved'   => 30.00,
            'notes'               => 'High priority',
        ]);

        $mr2 = MaterialRequest::create([
            'request_number' => 'MR-20260706-0002',
            'project_id'     => $loft->id,
            'warehouse_id'   => $whCentral->id,
            'requested_by'   => 7, // Site Engineer user
            'status'         => 'pending_approval',
            'requested_date' => Carbon::now()->toDateString(),
            'notes'          => 'Paint requirement for primary bedroom walls.',
        ]);

        MaterialRequestItem::create([
            'material_request_id' => $mr2->id,
            'material_id'         => $paint->id,
            'quantity_requested'  => 5.00,
            'notes'               => 'Standard room coverage',
        ]);

        // ── 13. Seed Material Dispatches ──────────────────────────────────────
        $md1 = MaterialDispatch::create([
            'dispatch_number'     => 'MD-20260706-0001',
            'material_request_id' => $mr1->id,
            'project_id'          => $penthouse->id,
            'warehouse_id'        => $whCentral->id,
            'dispatched_by'       => 1, // Super Admin
            'dispatched_at'       => Carbon::now()->subDays(2),
            'vehicle_number'      => 'DL-3C-AA-9988',
            'driver_name'         => 'Ram Singh',
            'driver_phone'        => '+91 98765 43210',
            'receiver_name'       => 'Supervisor Anil',
            'receiver_phone'      => '+91 99998 88877',
            'delivery_status'     => 'delivered',
            'delivery_notes'      => 'Delivered safely at site yard.',
            'delivery_date'       => Carbon::now()->subDays(2)->addHours(4),
            'total_cost'          => 1050.00, // 30 planks * 35 cost
        ]);

        MaterialDispatchItem::create([
            'material_dispatch_id' => $md1->id,
            'material_id'          => $wood->id,
            'batch_id'             => $bWood->id,
            'quantity_dispatched'  => 30.00,
            'cost_price'           => 35.00,
            'total_cost'           => 1050.00,
        ]);

        // Log the ledger transaction corresponding to the seeded dispatch
        StockLedger::create([
            'warehouse_id'     => $whCentral->id,
            'material_id'      => $wood->id,
            'batch_id'         => $bWood->id,
            'transaction_type' => 'dispatch',
            'quantity'         => -30.00,
            'reference_type'   => 'MaterialDispatch',
            'reference_id'     => $md1->id,
            'notes'            => 'Dispatched to Project: Luxury Penthouse Suite',
            'transaction_date' => Carbon::now()->subDays(2)->toDateString(),
        ]);

        // ── 14. Seed Site Progress - Material Consumption ─────────────────────
        \App\Models\MaterialConsumption::create([
            'project_id'        => $penthouse->id,
            'warehouse_id'      => $whCentral->id,
            'material_id'       => $wood->id,
            'batch_id'          => $bWood->id,
            'quantity_consumed' => 12.50,
            'consumption_date'  => Carbon::now()->subDay()->toDateString(),
            'logged_by'         => 8, // Supervisor user
            'notes'             => 'Planks consumed for primary bedroom balcony framing.',
        ]);

        // ── 15. Seed Site Progress - Worker Attendance ────────────────────────
        \App\Models\WorkerAttendance::create([
            'project_id'      => $penthouse->id,
            'worker_name'     => 'Karan Johar',
            'worker_type'     => 'Carpenter',
            'attendance_date' => Carbon::now()->toDateString(),
            'status'          => 'present',
            'logged_by'       => 8,
        ]);

        \App\Models\WorkerAttendance::create([
            'project_id'      => $penthouse->id,
            'worker_name'     => 'Rajeev Sen',
            'worker_type'     => 'Painter',
            'attendance_date' => Carbon::now()->toDateString(),
            'status'          => 'present',
            'logged_by'       => 8,
        ]);

        \App\Models\WorkerAttendance::create([
            'project_id'      => $penthouse->id,
            'worker_name'     => 'Amitabh B.',
            'worker_type'     => 'Helper',
            'attendance_date' => Carbon::now()->toDateString(),
            'status'          => 'half_day',
            'logged_by'       => 8,
        ]);

        // ── 16. Seed Site Progress - Site Expenses ─────────────────────────────
        \App\Models\SiteExpense::create([
            'project_id'   => $penthouse->id,
            'title'        => 'Local transport auto fare for supervisor',
            'amount'       => 350.00,
            'expense_date' => Carbon::now()->subDays(2)->toDateString(),
            'category'     => 'transport',
            'status'       => 'approved',
            'logged_by'    => 8,
            'approved_by'  => 2, // Project Manager
        ]);

        \App\Models\SiteExpense::create([
            'project_id'   => $penthouse->id,
            'title'        => 'Emergency nails and glue petty purchase',
            'amount'       => 980.00,
            'expense_date' => Carbon::now()->subDay()->toDateString(),
            'category'     => 'petty_purchase',
            'status'       => 'pending',
            'logged_by'    => 8,
        ]);
    }
}
