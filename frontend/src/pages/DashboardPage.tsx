import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  List,
  Chip,
  Paper,
  CircularProgress,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon,
  Inventory as InventoryIcon,
  LocalShipping as LocalShippingIcon,
  AttachMoney as AttachMoneyIcon,
  Warning as WarningIcon,
  Receipt as ReceiptIcon,
  RequestPage as RequestPageIcon,
  ShoppingBag as ShoppingBagIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useDashboard } from '../hooks/useDashboard';
import { RevenueChart } from '../components/dashboard/RevenueChart';
import { ProjectStatusChart } from '../components/dashboard/ProjectStatusChart';
import { PurchasesChart } from '../components/dashboard/PurchasesChart';
import { ConsumptionChart } from '../components/dashboard/ConsumptionChart';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const CustomTabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const { data, isLoading, error, refetch, isFetching } = useDashboard();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: 2 }}>
        <CircularProgress color="primary" />
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
          Fetching Dashboard Intelligence...
        </Typography>
      </Box>
    );
  }

  if (error || !data || !data.success) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <WarningIcon color="error" sx={{ fontSize: 48 }} />
        <Typography variant="h6" sx={{ mt: 2, fontWeight: 700 }}>
          Error Retrieving Operational Metrics
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
          Please confirm that the Laravel Backend is serving requests.
        </Typography>
        <IconButton onClick={() => refetch()} sx={{ mt: 2, border: '1px solid', borderColor: 'divider' }}>
          <RefreshIcon />
        </IconButton>
      </Box>
    );
  }

  const { kpi, charts, lists } = data.data;

  return (
    <Box sx={{ pb: 6 }}>
      
      {/* Header section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Executive Control Center</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Live status of site progress, financial health, and material dispatches (Refreshing automatically)
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isFetching && <CircularProgress size={20} color="primary" />}
          <IconButton onClick={() => refetch()} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>


      {/* Top KPI Cards (Grid layout) */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        
        {/* KPI 1: Monthly Revenue */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', p: 3 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.05em' }}>MONTHLY REVENUE</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 1, color: 'text.primary' }}>${kpi.monthly_revenue.toLocaleString()}</Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>Paid invoices (current month)</Typography>
              </Box>
              <Box sx={{ bgcolor: 'rgba(109, 40, 217, 0.08)', width: 40, height: 40, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1 }}>
                <AttachMoneyIcon sx={{ fontSize: 20, color: '#6D28D9' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 2: Active Projects */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', p: 3 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.05em' }}>ACTIVE PROJECTS</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 1, color: 'text.primary' }}>{kpi.total_active_projects}</Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>Running: {kpi.projects_in_progress}</Typography>
              </Box>
              <Box sx={{ bgcolor: 'rgba(59, 130, 246, 0.08)', width: 40, height: 40, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1 }}>
                <AssignmentIcon sx={{ fontSize: 20, color: '#3B82F6' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 3: Stock Items */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', p: 3 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.05em' }}>STOCK ITEMS</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 1, color: 'text.primary' }}>{kpi.materials_in_stock.toLocaleString()}</Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>Total materials count</Typography>
              </Box>
              <Box sx={{ bgcolor: 'rgba(16, 185, 129, 0.08)', width: 40, height: 40, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1 }}>
                <InventoryIcon sx={{ fontSize: 20, color: '#10B981' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 4: Dispatched Today */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
          <Card>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', p: 3 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.05em' }}>DISPATCHED TODAY</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, mt: 1, color: 'text.primary' }}>{kpi.materials_dispatched_today.count}</Typography>
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>Total cost: ${kpi.materials_dispatched_today.cost.toLocaleString()}</Typography>
              </Box>
              <Box sx={{ bgcolor: 'rgba(245, 158, 11, 0.08)', width: 40, height: 40, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 1 }}>
                <LocalShippingIcon sx={{ fontSize: 20, color: '#F59E0B' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* KPI 5: Pending Invoices */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper sx={{ p: 2.5, borderRadius: 3.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid', borderColor: 'divider' }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>PENDING INVOICES</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5 }}>{kpi.pending_invoices} Invoices</Typography>
            </Box>
            <Box sx={{ bgcolor: 'rgba(239, 68, 68, 0.08)', p: 1, borderRadius: 2 }}>
              <ReceiptIcon color="error" />
            </Box>
          </Paper>
        </Grid>

        {/* KPI 6: Pending Purchase Orders */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper sx={{ p: 2.5, borderRadius: 3.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid', borderColor: 'divider' }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>PENDING PURCHASES</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5 }}>{kpi.purchase_orders_pending} Orders</Typography>
            </Box>
            <Box sx={{ bgcolor: 'rgba(59, 130, 246, 0.08)', p: 1, borderRadius: 2 }}>
              <ShoppingBagIcon color="primary" />
            </Box>
          </Paper>
        </Grid>

        {/* KPI 7: Pending Quotations */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper sx={{ p: 2.5, borderRadius: 3.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid', borderColor: 'divider' }}>
            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>PENDING QUOTATIONS</Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.5 }}>{kpi.pending_quotations} Quotations</Typography>
            </Box>
            <Box sx={{ bgcolor: 'rgba(245, 158, 11, 0.08)', p: 1, borderRadius: 2 }}>
              <RequestPageIcon color="warning" />
            </Box>
          </Paper>
        </Grid>

      </Grid>

      {/* Visual Charts Grid (2x2 Layout) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        
        {/* Chart 1: Revenue Line Chart */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>Revenue Trend</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>Monthly comparison of paid invoices</Typography>
              <RevenueChart data={charts.revenue} />
            </CardContent>
          </Card>
        </Grid>

        {/* Chart 2: Project Status Pie Chart */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>Project Deliveries</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>Status distribution of registered projects</Typography>
              <ProjectStatusChart data={charts.project_status} />
            </CardContent>
          </Card>
        </Grid>

        {/* Chart 3: Purchase Orders Bar Chart */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>Procurement Costs</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>Monthly purchase orders approved totals</Typography>
              <PurchasesChart data={charts.purchases} />
            </CardContent>
          </Card>
        </Grid>

        {/* Chart 4: Consumption Bar Chart */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>Material Consumption</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>Monthly aggregated site dispatch values</Typography>
              <ConsumptionChart data={charts.material_consumption} />
            </CardContent>
          </Card>
        </Grid>

      </Grid>

      {/* Tabs list for logs, quotes, purchases, dispatches */}
      <Card sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 2 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard operation lists">
            <Tab label="Recent Dispatches" sx={{ fontWeight: 700 }} />
            <Tab label="Recent Purchases" sx={{ fontWeight: 700 }} />
            <Tab label="Recent Quotations" sx={{ fontWeight: 700 }} />
            <Tab label="Latest Activities" sx={{ fontWeight: 700 }} />
            <Tab label="Site Progress" sx={{ fontWeight: 700 }} />
            <Tab label="Material Budgets" sx={{ fontWeight: 700 }} />
          </Tabs>
        </Box>
        <CardContent sx={{ px: 3, pb: 3 }}>

          {/* TAB 0: Recent Dispatches */}
          <CustomTabPanel value={tabValue} index={0}>
            <List sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {lists.recent_dispatches.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>No recent dispatches</Typography>
              ) : (
                lists.recent_dispatches.map((disp) => (
                  <Paper key={disp.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {disp.material_name} &rarr; {disp.project_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                          Qty: {disp.quantity} • Dispatched {disp.time}
                        </Typography>
                      </Box>
                      <Chip label={`$${disp.cost.toLocaleString()}`} color="secondary" size="small" sx={{ fontWeight: 800 }} />
                    </Box>
                  </Paper>
                ))
              )}
            </List>
          </CustomTabPanel>

          {/* TAB 1: Recent Purchases */}
          <CustomTabPanel value={tabValue} index={1}>
            <List sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {lists.recent_purchases.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>No recent purchases</Typography>
              ) : (
                lists.recent_purchases.map((po) => (
                  <Paper key={po.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {po.vendor_name} ({po.po_number})
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                          Issued {po.time}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Chip 
                          label={po.status.toUpperCase()} 
                          color={po.status === 'received' ? 'success' : po.status === 'approved' ? 'info' : 'warning'} 
                          size="small" 
                          sx={{ fontWeight: 700, fontSize: '0.65rem' }} 
                        />
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          ${po.amount.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                ))
              )}
            </List>
          </CustomTabPanel>

          {/* TAB 2: Recent Quotations */}
          <CustomTabPanel value={tabValue} index={2}>
            <List sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {lists.recent_quotations.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>No recent quotations</Typography>
              ) : (
                lists.recent_quotations.map((quote) => (
                  <Paper key={quote.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{quote.title}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                          Client: {quote.client_name} • Created {quote.time}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Chip 
                          label={quote.status.toUpperCase()} 
                          color={quote.status === 'approved' ? 'success' : 'warning'} 
                          size="small" 
                          sx={{ fontWeight: 700, fontSize: '0.65rem' }} 
                        />
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>
                          ${quote.amount.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                ))
              )}
            </List>
          </CustomTabPanel>

          {/* TAB 3: Latest Activities */}
          <CustomTabPanel value={tabValue} index={3}>
            <List sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {lists.recent_activities.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>No recent activities</Typography>
              ) : (
                lists.recent_activities.map((log) => (
                  <Paper key={log.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <HistoryIcon color="disabled" sx={{ mt: 0.2 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{log.description}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                          User: {log.user} • Action: {log.action} • {log.time}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                ))
              )}
            </List>
          </CustomTabPanel>

          {/* TAB 4: Site Progress */}
          <CustomTabPanel value={tabValue} index={4}>
            <List sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {charts.site_wise_progress.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>No active projects progress</Typography>
              ) : (
                charts.site_wise_progress.map((site) => (
                  <Box key={site.project_id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{site.project_name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Updated {site.last_updated}</Typography>
                      </Box>
                      <Chip 
                        label={`${site.progress_percentage}%`} 
                        color={site.progress_percentage === 100 ? "success" : "primary"} 
                        size="small" 
                        sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                      />
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={site.progress_percentage} 
                      color={site.progress_percentage === 100 ? "success" : "primary"} 
                      sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover' }} 
                    />
                  </Box>
                ))
              )}
            </List>
          </CustomTabPanel>

          {/* TAB 5: Material Budgets */}
          <CustomTabPanel value={tabValue} index={5}>
            <List sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {charts.material_cost_vs_budget.map((proj) => {
                const isOverBudget = proj.remaining < 0;
                return (
                  <Box key={proj.project_id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{proj.project_name}</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Budget: ${proj.budget.toLocaleString()}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>|</Typography>
                          <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>Spent: ${proj.actual_cost.toLocaleString()}</Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontWeight: 700, 
                            color: isOverBudget ? 'error.main' : 'success.main',
                            display: 'block'
                          }}
                        >
                          {isOverBudget ? `Over by $${Math.abs(proj.remaining).toLocaleString()}` : `$${proj.remaining.toLocaleString()} remaining`}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{proj.percentage_used}% utilized</Typography>
                      </Box>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={Math.min(proj.percentage_used, 100)} 
                      color={isOverBudget ? "error" : proj.percentage_used > 85 ? "warning" : "success"} 
                      sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover' }} 
                    />
                  </Box>
                );
              })}
            </List>
          </CustomTabPanel>

        </CardContent>
      </Card>

    </Box>
  );
};
