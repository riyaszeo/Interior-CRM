import React, { useState } from 'react';
import {
  Box, Typography, Button, TextField, MenuItem, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Chip, Paper, Grid, Divider, Card, CardContent,
  Tabs, Tab, Table, TableBody, TableCell, TableHead,
  TableRow, TableContainer,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon, Clear as ClearIcon,
  LocalShipping as DispatchIcon, CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon, Assignment as RequestIcon,
  DirectionsCar as VehicleIcon, Person as DriverIcon,
  Phone as PhoneIcon, Visibility as ViewIcon,
  CheckCircleOutlined as DeliveryIcon,
} from '@mui/icons-material';

import {
  useRequestsList, useCreateRequest, useUpdateRequestStatus,
  useDispatchesList, useCreateDispatch, useUpdateDeliveryStatus, useDispatchFormOptions,
} from '../hooks/useDispatches';
import type { MaterialRequest } from '../hooks/useDispatches';

import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';

// ── Constants & Helpers ────────────────────────────────────────────────────────

const REQ_STATUS_CONFIG = {
  draft:            { label: 'Draft',             color: 'default' as const },
  pending_approval: { label: 'Pending Approval',   color: 'warning' as const },
  approved:         { label: 'Approved',          color: 'info' as const },
  rejected:         { label: 'Rejected',          color: 'error' as const },
  dispatched:       { label: 'Dispatched',        color: 'success' as const },
  cancelled:         { label: 'Cancelled',         color: 'default' as const },
};

const DEL_STATUS_CONFIG = {
  pending:    { label: 'Pending',     color: 'warning' as const },
  in_transit: { label: 'In Transit',  color: 'info' as const },
  delivered:  { label: 'Delivered',   color: 'success' as const },
  failed:     { label: 'Failed',      color: 'error' as const },
};

const formatINR = (val: string | number) =>
  `₹${parseFloat(String(val || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const DispatchesPage: React.FC = () => {
  const { showToast } = useToast();
  const { hasPermission, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  // Pagination variables
  const reqPage = 1;
  const dispPage = 1;

  // Filters
  const [projectFilter, setProjectFilter] = useState<number | null>(null);
  const [warehouseFilter, setWarehouseFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 0: REQUISITIONS
  // ───────────────────────────────────────────────────────────────────────────
  const { data: requestsData, isLoading: requestsLoading } = useRequestsList(
    reqPage, projectFilter, warehouseFilter, statusFilter, searchQuery
  );
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [reqDetailModal, setReqDetailModal] = useState(false);
  const updateReqStatus = useUpdateRequestStatus();

  // Approve items states
  const [approvedQuantities, setApprovedQuantities] = useState<Record<number, number>>({});

  const handleRequestDetail = (req: MaterialRequest) => {
    setSelectedRequestId(req.id);
    const qtys: Record<number, number> = {};
    req.items.forEach(i => {
      qtys[i.material_id] = parseFloat(i.quantity_requested);
    });
    setApprovedQuantities(qtys);
    setReqDetailModal(true);
  };

  const handleProcessRequestStatus = async (status: 'approved' | 'rejected') => {
    if (!selectedRequestId) return;
    try {
      const items = Object.entries(approvedQuantities).map(([matId, qty]) => ({
        material_id: Number(matId),
        quantity_approved: qty,
      }));

      await updateReqStatus.mutateAsync({
        id: selectedRequestId,
        status,
        items: status === 'approved' ? items : undefined,
      });

      showToast(`Material request ${status} successfully.`, 'success');
      setReqDetailModal(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 1: DISPATCH LOGS
  // ───────────────────────────────────────────────────────────────────────────
  const { data: dispatchesData, isLoading: dispatchesLoading } = useDispatchesList(
    dispPage, projectFilter, warehouseFilter, statusFilter, searchQuery
  );
  const [selectedDispatchId, setSelectedDispatchId] = useState<number | null>(null);
  const [dispDetailModal, setDispDetailModal] = useState(false);
  const updateDelivery = useUpdateDeliveryStatus();

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await updateDelivery.mutateAsync({ id, status, notes: `Status changed to ${status}` });
      showToast(`Delivery status updated to '${status}'.`, 'success');
      setDispDetailModal(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 2: REQUEST CREATION FORM
  // ───────────────────────────────────────────────────────────────────────────
  const { data: formOptionsData } = useDispatchFormOptions();
  const options = formOptionsData?.data;

  const [reqForm, setReqForm] = useState({
    project_id: '',
    warehouse_id: '',
    requested_date: new Date().toISOString().split('T')[0],
    notes: '',
    items: [{ material_id: '', quantity_requested: 1, notes: '' }],
  });
  const createRequestMutation = useCreateRequest();

  const handleReqItemChange = (index: number, field: string, value: any) => {
    const items = [...reqForm.items];
    (items[index] as any)[field] = value;
    setReqForm(p => ({ ...p, items }));
  };

  const handleAddReqItem = () => {
    setReqForm(p => ({
      ...p,
      items: [...p.items, { material_id: '', quantity_requested: 1, notes: '' }],
    }));
  };

  const handleRemoveReqItem = (index: number) => {
    const items = reqForm.items.filter((_, i) => i !== index);
    setReqForm(p => ({ ...p, items }));
  };

  const handleReqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqForm.project_id || !reqForm.warehouse_id || reqForm.items.length === 0) {
      showToast('Project, Warehouse and at least one item are required.', 'warning');
      return;
    }
    try {
      await createRequestMutation.mutateAsync({
        project_id: Number(reqForm.project_id),
        warehouse_id: Number(reqForm.warehouse_id),
        requested_date: reqForm.requested_date,
        notes: reqForm.notes,
        items: reqForm.items.map(i => ({
          material_id: Number(i.material_id),
          quantity_requested: Number(i.quantity_requested),
          notes: i.notes,
        })),
      });
      showToast('Material Request submitted successfully.', 'success');
      setReqForm({
        project_id: '',
        warehouse_id: '',
        requested_date: new Date().toISOString().split('T')[0],
        notes: '',
        items: [{ material_id: '', quantity_requested: 1, notes: '' }],
      });
      setActiveTab(0);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 3: DISPATCH LOGISTICS FORM
  // ───────────────────────────────────────────────────────────────────────────
  const [dispForm, setDispForm] = useState({
    material_request_id: '',
    project_id: '',
    warehouse_id: '',
    vehicle_number: '',
    driver_name: '',
    driver_phone: '',
    receiver_name: '',
    receiver_phone: '',
    delivery_status: 'pending' as 'pending' | 'in_transit' | 'delivered',
    delivery_notes: '',
    items: [{ material_id: '', batch_id: '', quantity_dispatched: 1 }],
  });
  const createDispatchMutation = useCreateDispatch();

  // Auto-populate when picking approved request link
  const handleRequestSelection = (requestId: string) => {
    const req = options?.approved_requests.find(r => r.id === Number(requestId));
    if (req) {
      // Fetch details of request
      apiClient.get<any>(`/material-requests/${req.id}`).then((res: any) => {
        const fullReq = res.data;
        setDispForm(p => ({
          ...p,
          material_request_id: String(req.id),
          project_id: String(req.project_id),
          warehouse_id: String(req.warehouse_id),
          items: fullReq.items.map((i: any) => ({
            material_id: String(i.material_id),
            batch_id: '',
            quantity_dispatched: parseFloat(i.quantity_approved || i.quantity_requested),
          })),
        }));
      });
    } else {
      setDispForm(p => ({ ...p, material_request_id: '', project_id: '', warehouse_id: '', items: [{ material_id: '', batch_id: '', quantity_dispatched: 1 }] }));
    }
  };

  const handleDispItemChange = (index: number, field: string, value: any) => {
    const items = [...dispForm.items];
    (items[index] as any)[field] = value;
    setDispForm(p => ({ ...p, items }));
  };

  const handleAddDispItem = () => {
    setDispForm(p => ({
      ...p,
      items: [...p.items, { material_id: '', batch_id: '', quantity_dispatched: 1 }],
    }));
  };

  const handleRemoveDispItem = (index: number) => {
    const items = dispForm.items.filter((_, i) => i !== index);
    setDispForm(p => ({ ...p, items }));
  };

  const handleDispSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispForm.project_id || !dispForm.warehouse_id || dispForm.items.length === 0) {
      showToast('Project, Warehouse and items are required.', 'warning');
      return;
    }
    try {
      await createDispatchMutation.mutateAsync({
        material_request_id: dispForm.material_request_id ? Number(dispForm.material_request_id) : null,
        project_id: Number(dispForm.project_id),
        warehouse_id: Number(dispForm.warehouse_id),
        vehicle_number: dispForm.vehicle_number,
        driver_name: dispForm.driver_name,
        driver_phone: dispForm.driver_phone,
        receiver_name: dispForm.receiver_name,
        receiver_phone: dispForm.receiver_phone,
        delivery_status: dispForm.delivery_status,
        delivery_notes: dispForm.delivery_notes,
        items: dispForm.items.map(i => ({
          material_id: Number(i.material_id),
          batch_id: i.batch_id ? Number(i.batch_id) : null,
          quantity_dispatched: Number(i.quantity_dispatched),
        })),
      });
      showToast('Materials dispatched & stock level updated.', 'success');
      setDispForm({
        material_request_id: '',
        project_id: '',
        warehouse_id: '',
        vehicle_number: '',
        driver_name: '',
        driver_phone: '',
        receiver_name: '',
        receiver_phone: '',
        delivery_status: 'pending',
        delivery_notes: '',
        items: [{ material_id: '', batch_id: '', quantity_dispatched: 1 }],
      });
      setActiveTab(1);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER SUITE
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Dispatch & Logistics</Typography>
          <Typography variant="body2" color="text.secondary">
            Process site requisitions, dispatch logistics, assign drivers, and monitor delivery statuses.
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={(_, v) => { setActiveTab(v); setStatusFilter(''); }} variant="scrollable"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2, '& .MuiTab-root': { fontWeight: 700 } }}>
          <Tab icon={<RequestIcon fontSize="small" />} iconPosition="start" label="Material Requests" />
          <Tab icon={<DispatchIcon fontSize="small" />} iconPosition="start" label="Dispatch Log History" />
          <Tab icon={<AddIcon fontSize="small" />} iconPosition="start" label="Request Requisition" />
          <Tab icon={<DispatchIcon fontSize="small" />} iconPosition="start" label="New Logistics Dispatch" />
        </Tabs>
      </Paper>

      {/* Filters Strip for tabs 0 & 1 */}
      {(activeTab === 0 || activeTab === 1) && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box component="form" onSubmit={e => { e.preventDefault(); setSearchQuery(searchVal); }} sx={{ display: 'flex', flexGrow: 1, gap: 1 }}>
            <TextField size="small" placeholder="Search by number, project..." value={searchVal}
              onChange={e => setSearchVal(e.target.value)} sx={{ flexGrow: 1 }}
              slotProps={{ input: { startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />, endAdornment: searchVal && <IconButton size="small" onClick={() => { setSearchVal(''); setSearchQuery(''); }}><ClearIcon fontSize="small" /></IconButton> } }} />
            <Button type="submit" variant="outlined">Search</Button>
          </Box>
          <TextField select size="small" label="Project" value={projectFilter ?? ''} onChange={e => { setProjectFilter(e.target.value ? Number(e.target.value) : null); }} sx={{ minWidth: 160 }}>
            <MenuItem value="">All Projects</MenuItem>
            {options?.projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Warehouse" value={warehouseFilter ?? ''} onChange={e => { setWarehouseFilter(e.target.value ? Number(e.target.value) : null); }} sx={{ minWidth: 160 }}>
            <MenuItem value="">All Warehouses</MenuItem>
            {options?.warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
          </TextField>
          {activeTab === 0 ? (
            <TextField select size="small" label="Request Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} sx={{ minWidth: 160 }}>
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="pending_approval">Pending Approval</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="dispatched">Dispatched</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </TextField>
          ) : (
            <TextField select size="small" label="Delivery" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} sx={{ minWidth: 160 }}>
              <MenuItem value="">All Deliveries</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="in_transit">In Transit</MenuItem>
              <MenuItem value="delivered">Delivered</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
            </TextField>
          )}
        </Paper>
      )}

      {/* Dynamic Content */}
      <Box>
        {activeTab === 0 && renderRequestsTab()}
        {activeTab === 1 && renderDispatchesTab()}
        {activeTab === 2 && renderCreateRequestForm()}
        {activeTab === 3 && renderCreateDispatchForm()}
      </Box>

      {/* Detail Dialogs */}
      {renderRequestDetailDialog()}
      {renderDispatchDetailDialog()}
    </Box>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB RENDERERS
  // ═══════════════════════════════════════════════════════════════════════════

  // Tab 0: Requests
  function renderRequestsTab() {
    const items = requestsData?.data?.items || [];
    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Request No.</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Project</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Source Warehouse</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Requested By</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requestsLoading ? (
                <TableRow><TableCell colSpan={7} align="center"><CircularProgress /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ color: 'text.secondary' }}>No material requests found</TableCell></TableRow>
              ) : items.map(req => {
                const conf = REQ_STATUS_CONFIG[req.status] || { label: req.status, color: 'default' };
                return (
                  <TableRow key={req.id} hover>
                    <TableCell sx={{ fontWeight: 800, color: 'primary.main', cursor: 'pointer' }} onClick={() => handleRequestDetail(req)}>
                      {req.request_number}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{req.project?.name}</TableCell>
                    <TableCell>{req.warehouse?.name}</TableCell>
                    <TableCell>{formatDate(req.requested_date)}</TableCell>
                    <TableCell>{req.requester?.name}</TableCell>
                    <TableCell>
                      <Chip label={conf.label} color={conf.color} size="small" sx={{ fontWeight: 800 }} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary" onClick={() => handleRequestDetail(req)}><ViewIcon fontSize="small" /></IconButton>
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

  // Tab 1: Dispatch History
  function renderDispatchesTab() {
    const items = dispatchesData?.data?.items || [];
    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Dispatch No.</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Project</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Driver Name</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Vehicle No.</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Dispatched Date</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Delivery Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dispatchesLoading ? (
                <TableRow><TableCell colSpan={7} align="center"><CircularProgress /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ color: 'text.secondary' }}>No dispatches recorded</TableCell></TableRow>
              ) : items.map(disp => {
                const conf = DEL_STATUS_CONFIG[disp.delivery_status] || { label: disp.delivery_status, color: 'default' };
                return (
                  <TableRow key={disp.id} hover>
                    <TableCell sx={{ fontWeight: 800, color: 'primary.main', cursor: 'pointer' }} onClick={() => { setSelectedDispatchId(disp.id); setDispDetailModal(true); }}>
                      {disp.dispatch_number}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{disp.project?.name}</TableCell>
                    <TableCell>{disp.driver_name || '—'}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{disp.vehicle_number || '—'}</TableCell>
                    <TableCell>{formatDate(disp.dispatched_at)}</TableCell>
                    <TableCell>
                      <Chip label={conf.label} color={conf.color} size="small" sx={{ fontWeight: 800 }} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary" onClick={() => { setSelectedDispatchId(disp.id); setDispDetailModal(true); }}><ViewIcon fontSize="small" /></IconButton>
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

  // Tab 2: Requisition form
  function renderCreateRequestForm() {
    return (
      <Card variant="outlined" sx={{ borderRadius: 4, maxWidth: 900, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Material Request Requisition</Typography>
          <Divider sx={{ mb: 3 }} />
          <form onSubmit={handleReqSubmit}>
            <Grid container spacing={3}>
              <Grid size={6}>
                <TextField select fullWidth required label="Target Project" value={reqForm.project_id} onChange={e => setReqForm(p => ({ ...p, project_id: e.target.value }))}>
                  {options?.projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={6}>
                <TextField select fullWidth required label="Source Warehouse" value={reqForm.warehouse_id} onChange={e => setReqForm(p => ({ ...p, warehouse_id: e.target.value }))}>
                  {options?.warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={6}>
                <TextField type="date" fullWidth required label="Requested Date" value={reqForm.requested_date} onChange={e => setReqForm(p => ({ ...p, requested_date: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth label="Additional Notes" value={reqForm.notes} onChange={e => setReqForm(p => ({ ...p, notes: e.target.value }))} placeholder="Explain site urgency..." />
              </Grid>

              <Grid size={12}>
                <Divider><Typography variant="subtitle2" sx={{ px: 1, fontWeight: 800 }}>Requested Material Lines</Typography></Divider>
              </Grid>

              {reqForm.items.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ width: '100%', ml: 0, mb: 1, alignItems: 'center' }}>
                  <Grid size={5}>
                    <TextField select fullWidth required size="small" label="Material" value={item.material_id} onChange={e => handleReqItemChange(index, 'material_id', e.target.value)}>
                      {options?.materials.map(m => <MenuItem key={m.id} value={m.id}>{m.name} ({m.sku})</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid size={3}>
                    <TextField type="number" fullWidth required size="small" label="Quantity Requested" value={item.quantity_requested} onChange={e => handleReqItemChange(index, 'quantity_requested', Number(e.target.value))} slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }} />
                  </Grid>
                  <Grid size={3}>
                    <TextField fullWidth size="small" label="Line Remark" value={item.notes} onChange={e => handleReqItemChange(index, 'notes', e.target.value)} placeholder="e.g. For flooring" />
                  </Grid>
                  <Grid size={1}>
                    <IconButton size="small" color="error" disabled={reqForm.items.length <= 1} onClick={() => handleRemoveReqItem(index)}><RejectedIcon fontSize="small" /></IconButton>
                  </Grid>
                </Grid>
              ))}

              <Grid size={12}>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddReqItem} size="small">Add Material Line</Button>
              </Grid>

              <Grid size={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button onClick={() => setActiveTab(0)} variant="outlined">Cancel</Button>
                <Button type="submit" variant="contained" disabled={createRequestMutation.isPending}>Submit Requisition</Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Tab 3: Dispatch Form
  function renderCreateDispatchForm() {
    return (
      <Card variant="outlined" sx={{ borderRadius: 4, maxWidth: 950, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Logistics Material Dispatch</Typography>
          <Divider sx={{ mb: 3 }} />
          <form onSubmit={handleDispSubmit}>
            <Grid container spacing={3}>
              {/* Linked Request */}
              <Grid size={12}>
                <TextField select fullWidth label="Link Approved Request (optional)" value={dispForm.material_request_id} onChange={e => handleRequestSelection(e.target.value)} helperText="Choose an approved request to auto-populate materials list">
                  <MenuItem value="">Direct Dispatch (No Link)</MenuItem>
                  {options?.approved_requests.map(r => <MenuItem key={r.id} value={r.id}>{r.request_number} (Proj: {r.project_id})</MenuItem>)}
                </TextField>
              </Grid>

              {/* Project & Warehouse */}
              <Grid size={6}>
                <TextField select fullWidth required label="Destination Project" value={dispForm.project_id} onChange={e => setDispForm(p => ({ ...p, project_id: e.target.value }))} disabled={!!dispForm.material_request_id}>
                  {options?.projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={6}>
                <TextField select fullWidth required label="Source Warehouse" value={dispForm.warehouse_id} onChange={e => setDispForm(p => ({ ...p, warehouse_id: e.target.value }))} disabled={!!dispForm.material_request_id}>
                  {options?.warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                </TextField>
              </Grid>

              {/* Transport Logistics */}
              <Grid size={12}>
                <Divider sx={{ my: 1 }}><Chip label="Logistics & Transport" size="small" sx={{ fontWeight: 700 }} /></Divider>
              </Grid>
              <Grid size={4}>
                <TextField fullWidth label="Vehicle Number" value={dispForm.vehicle_number} onChange={e => setDispForm(p => ({ ...p, vehicle_number: e.target.value.toUpperCase() }))} placeholder="e.g. DL-3C-AA-9988" />
              </Grid>
              <Grid size={4}>
                <TextField fullWidth label="Driver Name" value={dispForm.driver_name} onChange={e => setDispForm(p => ({ ...p, driver_name: e.target.value }))} placeholder="e.g. Ram Singh" />
              </Grid>
              <Grid size={4}>
                <TextField fullWidth label="Driver Phone" value={dispForm.driver_phone} onChange={e => setDispForm(p => ({ ...p, driver_phone: e.target.value }))} placeholder="e.g. +91 98765 43210" />
              </Grid>

              {/* Receiver contacts */}
              <Grid size={6}>
                <TextField fullWidth label="Receiver Name (at Site)" value={dispForm.receiver_name} onChange={e => setDispForm(p => ({ ...p, receiver_name: e.target.value }))} placeholder="e.g. Supervisor Anil" />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth label="Receiver Phone Number" value={dispForm.receiver_phone} onChange={e => setDispForm(p => ({ ...p, receiver_phone: e.target.value }))} placeholder="e.g. +91 99998 88877" />
              </Grid>

              <Grid size={6}>
                <TextField select fullWidth required label="Initial Delivery Status" value={dispForm.delivery_status} onChange={e => setDispForm(p => ({ ...p, delivery_status: e.target.value as any }))}>
                  <MenuItem value="pending">Pending Dispatch</MenuItem>
                  <MenuItem value="in_transit">In Transit (Vehicle Left)</MenuItem>
                  <MenuItem value="delivered">Delivered (Direct Transfer)</MenuItem>
                </TextField>
              </Grid>
              <Grid size={6}>
                <TextField fullWidth label="Logistics Notes" value={dispForm.delivery_notes} onChange={e => setDispForm(p => ({ ...p, delivery_notes: e.target.value }))} placeholder="E.g. Loading supervision check..." />
              </Grid>

              <Grid size={12}>
                <Divider><Typography variant="subtitle2" sx={{ px: 1, fontWeight: 800 }}>Dispatched Materials</Typography></Divider>
              </Grid>

              {dispForm.items.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ width: '100%', ml: 0, mb: 1, alignItems: 'center' }}>
                  <Grid size={5}>
                    <TextField select fullWidth required size="small" label="Material" value={item.material_id} onChange={e => handleDispItemChange(index, 'material_id', e.target.value)} disabled={!!dispForm.material_request_id}>
                      {options?.materials.map(m => <MenuItem key={m.id} value={m.id}>{m.name} ({m.sku})</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid size={3}>
                    <TextField select fullWidth required size="small" label="Batch Allocation" value={item.batch_id} onChange={e => handleDispItemChange(index, 'batch_id', e.target.value)}>
                      <MenuItem value="">No Batch Allocation</MenuItem>
                      {options?.batches.filter(b => b.material_id === Number(item.material_id)).map(b => <MenuItem key={b.id} value={b.id}>{b.batch_number}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid size={3}>
                    <TextField type="number" fullWidth required size="small" label="Quantity Dispatched" value={item.quantity_dispatched} onChange={e => handleDispItemChange(index, 'quantity_dispatched', Number(e.target.value))} slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }} />
                  </Grid>
                  <Grid size={1}>
                    <IconButton size="small" color="error" disabled={dispForm.items.length <= 1 || !!dispForm.material_request_id} onClick={() => handleRemoveDispItem(index)}><RejectedIcon fontSize="small" /></IconButton>
                  </Grid>
                </Grid>
              ))}

              {!dispForm.material_request_id && (
                <Grid size={12}>
                  <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddDispItem} size="small">Add Material Line</Button>
                </Grid>
              )}

              <Grid size={12} sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button onClick={() => setActiveTab(1)} variant="outlined">Cancel</Button>
                <Button type="submit" variant="contained" disabled={createDispatchMutation.isPending}>Execute Dispatch (Deduct Stock)</Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POPUP DETAILS DIALOGS
  // ═══════════════════════════════════════════════════════════════════════════

  // Material Request Detail & PM Approval Dialog
  function renderRequestDetailDialog() {
    const req = requestsData?.data?.items.find(r => r.id === selectedRequestId);
    if (!req) return null;

    const isPending = req.status === 'pending_approval';
    const canApprove = hasPermission('projects:approve') || hasRole('superadmin');

    return (
      <Dialog open={reqDetailModal} onClose={() => setReqDetailModal(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Requisition: {req.request_number}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">Project: <strong>{req.project?.name}</strong></Typography>
                <Typography variant="body2" color="text.secondary">Warehouse: <strong>{req.warehouse?.name}</strong></Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">Date Requested: <strong>{formatDate(req.requested_date)}</strong></Typography>
                <Typography variant="body2" color="text.secondary">Requested By: <strong>{req.requester?.name}</strong></Typography>
              </Grid>
            </Grid>

            {req.notes && (
              <Paper sx={{ p: 1.5, bgcolor: 'action.hover', borderLeft: '3px solid #7c4dff' }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Requisition Notes</Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{req.notes}</Typography>
              </Paper>
            )}

            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Requested Materials</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Material Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Qty Requested</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Qty Approved</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Remark</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {req.items.map(i => (
                    <TableRow key={i.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{i.material?.name}</TableCell>
                      <TableCell align="right">{parseFloat(i.quantity_requested)} {i.material?.unit}</TableCell>
                      <TableCell align="right">
                        {isPending && canApprove ? (
                          <TextField type="number" size="small" sx={{ width: 100 }} value={approvedQuantities[i.material_id] ?? parseFloat(i.quantity_requested)} onChange={e => setApprovedQuantities(p => ({ ...p, [i.material_id]: Number(e.target.value) }))} slotProps={{ htmlInput: { min: 0 } }} />
                        ) : (
                          `${parseFloat(i.quantity_approved)} ${i.material?.unit}`
                        )}
                      </TableCell>
                      <TableCell>{i.notes || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {isPending && canApprove && (
            <>
              <Button variant="contained" color="success" startIcon={<ApprovedIcon />} onClick={() => handleProcessRequestStatus('approved')}>Approve Requisition</Button>
              <Button variant="contained" color="error" startIcon={<RejectedIcon />} onClick={() => handleProcessRequestStatus('rejected')}>Reject Requisition</Button>
            </>
          )}
          <Button onClick={() => setReqDetailModal(false)} variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Material Dispatch Detail & Logistics Status Dialog
  function renderDispatchDetailDialog() {
    const disp = dispatchesData?.data?.items.find(d => d.id === selectedDispatchId);
    if (!disp) return null;

    const isPending = disp.delivery_status === 'pending';
    const isTransit = disp.delivery_status === 'in_transit';

    return (
      <Dialog open={dispDetailModal} onClose={() => setDispDetailModal(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Dispatch Record: {disp.dispatch_number}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">Destination Project: <strong>{disp.project?.name}</strong></Typography>
                <Typography variant="body2" color="text.secondary">Source Warehouse: <strong>{disp.warehouse?.name}</strong></Typography>
                <Typography variant="body2" color="text.secondary">Linked Request: <strong>{disp.request?.request_number || 'Direct Dispatch'}</strong></Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">Dispatched Date: <strong>{formatDate(disp.dispatched_at)}</strong></Typography>
                <Typography variant="body2" color="text.secondary">Dispatched By: <strong>{disp.dispatcher?.name}</strong></Typography>
                <Typography variant="body2" color="text.secondary">Dispatch Cost Value: <strong>{formatINR(disp.total_cost)}</strong></Typography>
              </Grid>
            </Grid>

            {/* Logistics Card info */}
            <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: 'action.hover' }}>
              <CardContent sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VehicleIcon fontSize="small" color="action" />
                  <Typography variant="body2">Vehicle: <strong>{disp.vehicle_number || '—'}</strong></Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DriverIcon fontSize="small" color="action" />
                  <Typography variant="body2">Driver: <strong>{disp.driver_name || '—'}</strong> ({disp.driver_phone || '—'})</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body2">Receiver: <strong>{disp.receiver_name || '—'}</strong> ({disp.receiver_phone || '—'})</Typography>
                </Box>
              </CardContent>
            </Card>

            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Dispatched Items</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Material Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Batch Number</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Qty Dispatched</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Cost Price</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Total Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {disp.items.map(i => (
                    <TableRow key={i.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{i.material?.name}</TableCell>
                      <TableCell>{i.batch?.batch_number ? <Chip label={i.batch.batch_number} size="small" variant="outlined" /> : '—'}</TableCell>
                      <TableCell align="right">{parseFloat(i.quantity_dispatched)} {i.material?.unit}</TableCell>
                      <TableCell align="right">{formatINR(i.cost_price)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatINR(i.total_cost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {isPending && (
            <Button variant="contained" color="info" startIcon={<DeliveryIcon />} onClick={() => handleUpdateStatus(disp.id, 'in_transit')}>Mark In Transit</Button>
          )}
          {isTransit && (
            <Button variant="contained" color="success" startIcon={<DeliveryIcon />} onClick={() => handleUpdateStatus(disp.id, 'delivered')}>Mark Delivered</Button>
          )}
          <Button onClick={() => setDispDetailModal(false)} variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>
    );
  }
};
