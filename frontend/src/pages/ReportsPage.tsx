import React, { useState } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, CircularProgress,
  Grid, Card, CardContent, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip,
  LinearProgress, Alert, AlertTitle,
} from '@mui/material';
import {
  Assessment as ReportIcon, Assignment as ProjectIcon,
  ShoppingBag as PurchaseIcon, Inventory as StockIcon,
  Timeline as SiteIcon, LocalMall as MaterialIcon,
  Business as VendorIcon, People as CustomerIcon,
  MonetizationOn as ProfitIcon,
} from '@mui/icons-material';

import {
  useDashboardReport, useProjectsReport, usePurchasesReport,
  useStockReport, useSiteReport, useMaterialConsumptionReport,
  useVendorsReport, useCustomersReport, useProfitabilityReport,
} from '../hooks/useReports';

// ── Financial Helpers ────────────────────────────────────────────────────────

const formatINR = (val: string | number) =>
  `₹${parseFloat(String(val || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  // Load all reports data
  const { data: dbData, isLoading: dbLoad } = useDashboardReport();
  const { data: projData, isLoading: projLoad } = useProjectsReport();
  const { data: purData, isLoading: purLoad } = usePurchasesReport();
  const { data: stockData, isLoading: stockLoad } = useStockReport();
  const { data: siteData, isLoading: siteLoad } = useSiteReport();
  const { data: mcData, isLoading: mcLoad } = useMaterialConsumptionReport();
  const { data: venData, isLoading: venLoad } = useVendorsReport();
  const { data: custData, isLoading: custLoad } = useCustomersReport();
  const { data: profitData, isLoading: profitLoad } = useProfitabilityReport();

  return (
    <Box sx={{ pb: 6 }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Business Reports & Analytics</Typography>
        <Typography variant="body2" color="text.secondary">
          Track project costs, inventory stock ledger warning lists, site diary metrics, and financial profitability margins.
        </Typography>
      </Box>

      {/* Tabs Menu */}
      <Paper sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2, '& .MuiTab-root': { fontWeight: 700 } }}>
          <Tab icon={<ReportIcon fontSize="small" />} iconPosition="start" label="Dashboard Summary" />
          <Tab icon={<ProjectIcon fontSize="small" />} iconPosition="start" label="Projects" />
          <Tab icon={<PurchaseIcon fontSize="small" />} iconPosition="start" label="Purchases" />
          <Tab icon={<StockIcon fontSize="small" />} iconPosition="start" label="Stock Levels" />
          <Tab icon={<MaterialIcon fontSize="small" />} iconPosition="start" label="Consumptions" />
          <Tab icon={<SiteIcon fontSize="small" />} iconPosition="start" label="Site Diary" />
          <Tab icon={<VendorIcon fontSize="small" />} iconPosition="start" label="Vendors" />
          <Tab icon={<CustomerIcon fontSize="small" />} iconPosition="start" label="Customers" />
          <Tab icon={<ProfitIcon fontSize="small" />} iconPosition="start" label="Profitability (P&L)" />
        </Tabs>
      </Paper>

      {/* Tabs Content */}
      <Box>
        {activeTab === 0 && renderDashboardSummary()}
        {activeTab === 1 && renderProjectsReport()}
        {activeTab === 2 && renderPurchasesReport()}
        {activeTab === 3 && renderStockReport()}
        {activeTab === 4 && renderMaterialConsumptionReport()}
        {activeTab === 5 && renderSiteDiaryReport()}
        {activeTab === 6 && renderVendorsReport()}
        {activeTab === 7 && renderCustomersReport()}
        {activeTab === 8 && renderProfitabilityReport()}
      </Box>
    </Box>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 0: DASHBOARD SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════

  function renderDashboardSummary() {
    if (dbLoad) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
    const db = dbData?.data;
    if (!db) return <Alert severity="info">No dashboard summary data available.</Alert>;

    const cards = [
      { label: 'Total Revenue Billed', val: formatINR(db.revenue_billed), desc: 'Invoices raised', color: '#7c4dff' },
      { label: 'Collections Received', val: formatINR(db.collections_received), desc: 'Payments settled', color: '#4caf50' },
      { label: 'Outstanding Receivables', val: formatINR(db.outstanding_receivables), desc: 'Unpaid balance invoices', color: '#ff9800' },
      { label: 'Active Projects Registered', val: db.total_projects, desc: 'Across all workspaces', color: '#00e5ff' },
      { label: 'Purchase spends', val: formatINR(db.purchase_spend), desc: 'POs approved', color: '#f44336' },
      { label: 'Warehouse Assets Value', val: formatINR(db.inventory_value), desc: 'Stock items valuation', color: '#e91e63' },
    ];

    return (
      <Grid container spacing={3}>
        {cards.map((c, i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card variant="outlined" sx={{ borderRadius: 4, height: '100%', borderLeft: `5px solid ${c.color}` }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>{c.label}</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, my: 1.5 }}>{c.val}</Typography>
                <Typography variant="body2" color="text.secondary">{c.desc}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 1: PROJECTS
  // ═══════════════════════════════════════════════════════════════════════════

  function renderProjectsReport() {
    if (projLoad) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
    const list = projData?.data || [];

    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Project Code</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Project Name</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Completion %</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Budget</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Estimated Cost</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Actual Cost</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Invoiced</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Collected</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Outstanding</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map(p => (
                <TableRow key={p.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{p.project_code}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{p.name}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress variant="determinate" value={p.completion_percent} sx={{ width: 80, height: 6, borderRadius: 3 }} />
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{p.completion_percent}%</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">{formatINR(p.budget)}</TableCell>
                  <TableCell align="right">{formatINR(p.estimated_cost)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: p.actual_cost > p.budget ? 'error.main' : 'inherit' }}>{formatINR(p.actual_cost)}</TableCell>
                  <TableCell align="right">{formatINR(p.total_invoiced)}</TableCell>
                  <TableCell align="right" sx={{ color: 'success.main' }}>{formatINR(p.total_collected)}</TableCell>
                  <TableCell align="right" sx={{ color: p.outstanding > 0 ? 'warning.main' : 'inherit' }}>{formatINR(p.outstanding)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 2: PURCHASES
  // ═══════════════════════════════════════════════════════════════════════════

  function renderPurchasesReport() {
    if (purLoad) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
    const data = purData?.data;
    if (!data) return <Alert severity="info">No purchases data available.</Alert>;

    return (
      <Grid container spacing={3}>
        {/* PO totals by Status */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>Purchase Orders by Status</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="right">PO Count</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="right">Spend Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.by_status.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ textTransform: 'capitalize', fontWeight: 700 }}>{item.status}</TableCell>
                        <TableCell align="right">{item.count}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{formatINR(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* PO totals by Vendor */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>Top Vendor Spends</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Vendor Name</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="right">PO Count</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="right">Purchase Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.by_vendor.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontWeight: 700 }}>{item.name}</TableCell>
                        <TableCell align="right">{item.count}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>{formatINR(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 3: STOCK LEVELS
  // ═══════════════════════════════════════════════════════════════════════════

  function renderStockReport() {
    if (stockLoad) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
    const list = stockData?.data || [];
    const alerts = list.filter(item => item.needs_reorder);

    return (
      <Grid container spacing={3}>
        {alerts.length > 0 && (
          <Grid size={12}>
            <Alert severity="warning" sx={{ borderRadius: 3 }}>
              <AlertTitle sx={{ fontWeight: 800 }}>Reorder Stock Alerts — {alerts.length} Items Low</AlertTitle>
              The following materials have fallen below minimum thresholds: <strong>{alerts.map(a => `${a.material_name} (${a.current_stock} ${a.unit})`).join(', ')}</strong>.
            </Alert>
          </Grid>
        )}

        <Grid size={12}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Warehouse</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Material</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>SKU</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Current Stock</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Reserved</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Reorder Level</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Purchase Price</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Stock Value</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.map(s => (
                    <TableRow key={s.id} hover>
                      <TableCell>{s.warehouse}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{s.material_name}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{s.sku}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{s.current_stock} {s.unit}</TableCell>
                      <TableCell align="right">{s.reserved_stock} {s.unit}</TableCell>
                      <TableCell align="right">{s.reorder_level} {s.unit}</TableCell>
                      <TableCell align="right">{formatINR(s.purchase_price)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>{formatINR(s.stock_value)}</TableCell>
                      <TableCell>
                        <Chip
                          label={s.needs_reorder ? 'Low Stock' : 'In Stock'}
                          color={s.needs_reorder ? 'warning' : 'success'}
                          size="small"
                          sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 4: MATERIAL CONSUMPTION
  // ═══════════════════════════════════════════════════════════════════════════

  function renderMaterialConsumptionReport() {
    if (mcLoad) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
    const list = mcData?.data || [];

    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Project</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Material</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Warehouse Source</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Qty Consumed</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Unit Cost</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Valuation Expense</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map(mc => (
                <TableRow key={mc.id} hover>
                  <TableCell>{formatDate(mc.date)}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{mc.project_name}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{mc.material_name}</TableCell>
                  <TableCell>{mc.warehouse}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{mc.quantity_consumed} {mc.unit}</TableCell>
                  <TableCell align="right">{formatINR(mc.unit_cost)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: 'error.main' }}>{formatINR(mc.total_cost)}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{mc.notes || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 5: SITE PROGRESS DIARY
  // ═══════════════════════════════════════════════════════════════════════════

  function renderSiteDiaryReport() {
    if (siteLoad) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
    const list = siteData?.data || [];

    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Project Code</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Project Name</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Progress Logs Count</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Labor Attendance count</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Petty Claims count</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Total Petty Cash Incurred</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Total Petty Cash Approved</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map(s => (
                <TableRow key={s.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{s.project_code}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{s.name}</TableCell>
                  <TableCell align="right">{s.diary_logs_count} updates</TableCell>
                  <TableCell align="right">{s.attendance_count} rolls</TableCell>
                  <TableCell align="right">{s.expenses_count} items</TableCell>
                  <TableCell align="right" sx={{ color: 'error.main' }}>{formatINR(s.expenses_claimed)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>{formatINR(s.expenses_approved)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 6: VENDORS
  // ═══════════════════════════════════════════════════════════════════════════

  function renderVendorsReport() {
    if (venLoad) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
    const list = venData?.data || [];

    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Vendor Name</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Contact Person</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Email / Phone</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Purchase Orders Count</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">PO Spends Total</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Pending Invoices Outstanding</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map(v => (
                <TableRow key={v.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{v.name}</TableCell>
                  <TableCell>{v.contact_name || '—'}</TableCell>
                  <TableCell>{v.email}<br />{v.phone}</TableCell>
                  <TableCell align="right">{v.po_count} orders</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{formatINR(v.po_spend)}</TableCell>
                  <TableCell align="right" sx={{ color: 'warning.main', fontWeight: 800 }}>{formatINR(v.pending_payment)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 7: CUSTOMERS
  // ═══════════════════════════════════════════════════════════════════════════

  function renderCustomersReport() {
    if (custLoad) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
    const list = custData?.data || [];

    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Customer Name</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Contact Person</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Email / Phone</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Projects Assigned</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Total Invoiced</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Total Collected</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Receivables Outstanding</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map(c => (
                <TableRow key={c.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{c.name}</TableCell>
                  <TableCell>{c.contact_name || '—'}</TableCell>
                  <TableCell>{c.email}<br />{c.phone}</TableCell>
                  <TableCell align="right">{c.projects_count} projects</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{formatINR(c.total_invoiced)}</TableCell>
                  <TableCell align="right" sx={{ color: 'success.main' }}>{formatINR(c.total_collected)}</TableCell>
                  <TableCell align="right" sx={{ color: c.outstanding > 0 ? 'error.main' : 'inherit', fontWeight: 800 }}>{formatINR(c.outstanding)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB 8: PROFITABILITY (P&L)
  // ═══════════════════════════════════════════════════════════════════════════

  function renderProfitabilityReport() {
    if (profitLoad) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
    const list = profitData?.data || [];

    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Project Name</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Revenue (Billed)</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Material Cost</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Labour Wages (Est)</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Approved Petty cash</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Total Incurred Cost</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Net Profit</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Profit Margin</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map(p => {
                const isLoss = p.net_profit < 0;
                return (
                  <TableRow key={p.id} hover>
                    <TableCell sx={{ fontWeight: 800 }}>
                      {p.name}
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>{p.project_code}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>{formatINR(p.billed_revenue)}</TableCell>
                    <TableCell align="right">{formatINR(p.material_expense)}</TableCell>
                    <TableCell align="right">{formatINR(p.labor_expense)}</TableCell>
                    <TableCell align="right">{formatINR(p.petty_expense)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{formatINR(p.total_incurred)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: isLoss ? 'error.main' : 'primary.main' }}>
                      {formatINR(p.net_profit)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${p.profit_margin}%`}
                        color={isLoss ? 'error' : p.profit_margin > 20 ? 'success' : 'primary'}
                        sx={{ fontWeight: 800, minWidth: 70 }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    );
  }
};
export default ReportsPage;
