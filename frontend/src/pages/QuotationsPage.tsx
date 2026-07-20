import React, { useState, useRef } from 'react';
import {
  Box, Typography, Button, TextField, MenuItem, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Chip, Tooltip, Paper, Grid, Divider, Table, TableHead, TableBody,
  TableRow, TableCell, TableContainer, Card, CardContent, Alert,
  Tabs, Tab, Menu,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, Clear as ClearIcon, Visibility as VisibilityIcon,
  AddCircleOutlined as AddRowIcon, RemoveCircleOutlined as RemoveRowIcon,
  CheckCircle as ApproveIcon, Cancel as RejectIcon, Send as SendIcon,
  Autorenew as ConvertIcon, Print as PrintIcon,
  WhatsApp as WhatsAppIcon, Email as EmailIcon,
  Share as ShareIcon, ContentCopy as CopyIcon, Close as CloseIcon,
} from '@mui/icons-material';
import {
  useQuotationsList, useQuotationDetails, useQuotationFormOptions,
  useCreateQuotation, useUpdateQuotation, useDeleteQuotation,
  useUpdateQuotationStatus, useConvertToProject,
} from '../hooks/useQuotations';
import { useCompanyDetails } from '../hooks/useCompany';
import type { Quotation, QuotationFormData } from '../hooks/useQuotations';
import { useToast } from '../context/ToastContext';
import { DataTable } from '../components/DataTable';
import type { ColumnDefinition } from '../components/DataTable';

const statusColors: Record<string, 'default' | 'info' | 'warning' | 'success' | 'error'> = {
  draft: 'default', sent: 'info', approved: 'success', rejected: 'error',
};

const parseMeasurementsToSqft = (inputString: string): number | null => {
  if (!inputString) return null;
  
  // Normalize quotes and separators
  const normalized = inputString
    .replace(/''/g, '"')
    .replace(/’/g, "'")
    .replace(/”/g, '"');
    
  // Global regex matching dimension pairs:
  // e.g. "8'0\"x7'0\"", "10.6*7", "12'6\" x 7'0\"", "10.6'*7'"
  // Group 1: Dim 1 feet/decimal
  // Group 2: Dim 1 optional inches (if using 'X" or 'X'')
  // Group 3: Dim 2 feet/decimal
  // Group 4: Dim 2 optional inches
  const regex = /([0-9.]+)\s*(?:'\s*([0-9.]+)?\s*")?'?\s*(?:x|\*|by)\s*([0-9.]+)\s*(?:'\s*([0-9.]+)?\s*")?'?/gi;

  let match;
  let totalSqft = 0;
  let foundAny = false;

  while ((match = regex.exec(normalized)) !== null) {
    const d1_feet = parseFloat(match[1]);
    const d1_inches = match[2] ? parseFloat(match[2]) : 0;
    const d1 = d1_feet + (d1_inches / 12);

    const d2_feet = parseFloat(match[3]);
    const d2_inches = match[4] ? parseFloat(match[4]) : 0;
    const d2 = d2_feet + (d2_inches / 12);

    if (!isNaN(d1) && !isNaN(d2)) {
      totalSqft += d1 * d2;
      foundAny = true;
    }
  }
  
  return foundAny ? parseFloat(totalSqft.toFixed(2)) : null;
};

const defaultItem = (room_name = 'Room 1') => ({
  room_name, item_name: '', material_id: null as number | null, description: '', width: null as number | null, height: null as number | null, units: 1, quantity: 1, unit_price: 0,
});

const DEFAULT_TERMS = `1. This quotation is valid for 30 days from the date of issue.
2. 50% advance payment required before commencement of work.
3. Balance 50% payable upon completion and handover.
4. Any additional work or changes will be charged separately.
5. Materials may vary subject to availability; substitutes of equal quality may be used.
6. GST will be charged as applicable.`;

export const QuotationsPage: React.FC = () => {
  const { showToast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  // List state
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState({ current_page: 1, per_page: 10, total: 0, last_page: 1 });

  const { data: listData, isLoading: listLoading } = useQuotationsList(
    pagination.current_page, searchQuery, statusFilter, sortField, sortOrder
  );
  const { data: optionsData } = useQuotationFormOptions();

  // Detail drawer
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [drawerTab, setDrawerTab] = useState(0);
  const { data: detailData, isLoading: detailLoading } = useQuotationDetails(previewId);
  const { data: companyData } = useCompanyDetails();
  const company = companyData?.data;

  // Share menu anchor
  const [shareAnchor, setShareAnchor] = useState<null | HTMLElement>(null);

  // Form modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<QuotationFormData>({
    customer_id: null, project_id: null, title: '', status: 'draft',
    labor_charges: 0, additional_charges: 0, discount_amount: 0, gst_rate: 18,
    terms_conditions: DEFAULT_TERMS, items: [defaultItem()],
  });

  // Mutations
  const createMutation = useCreateQuotation();
  const updateMutation = useUpdateQuotation();
  const deleteMutation = useDeleteQuotation();
  const statusMutation = useUpdateQuotationStatus();
  const convertMutation = useConvertToProject();

  const customers = optionsData?.data?.customers || [];
  const projects = optionsData?.data?.projects || [];
  const materials = optionsData?.data?.materials || [];

  // Pagination sync
  React.useEffect(() => {
    if (listData?.data?.pagination) {
      const p = listData.data.pagination;
      setPagination(prev => ({ ...prev, total: p.total, last_page: p.last_page }));
    }
  }, [listData]);

  const rows = listData?.data?.items || [];

  // Computed totals
  const computedSubtotal = formData.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const gstBase = computedSubtotal + formData.labor_charges + formData.additional_charges - formData.discount_amount;
  const computedGstAmount = gstBase * (formData.gst_rate / 100);
  const computedTotal = gstBase + computedGstAmount;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(search);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleSort = (field: string) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const openCreate = () => {
    setEditingQuotation(null);
    setFormData({ customer_id: null, project_id: null, title: '', status: 'draft', labor_charges: 0, additional_charges: 0, discount_amount: 0, gst_rate: 18, terms_conditions: DEFAULT_TERMS, items: [defaultItem('Kitchen')] });
    setModalOpen(true);
  };

  const openEdit = (q: Quotation) => {
    setEditingQuotation(q);
    setFormData({
      customer_id: q.customer_id, project_id: q.project_id, title: q.title,
      status: q.status, labor_charges: parseFloat(q.labor_charges),
      additional_charges: parseFloat(q.additional_charges),
      discount_amount: parseFloat(q.discount_amount), gst_rate: parseFloat(q.gst_rate),
      terms_conditions: q.terms_conditions || DEFAULT_TERMS,
      items: (q.items && q.items.length > 0)
        ? q.items.map(i => ({ room_name: i.room_name, item_name: i.item_name || i.description || '', material_id: i.material_id, description: i.description || '', width: i.width ? parseFloat(String(i.width)) : null, height: i.height ? parseFloat(String(i.height)) : null, units: i.units ? parseFloat(String(i.units)) : 1, quantity: parseFloat(String(i.quantity)), unit_price: parseFloat(String(i.unit_price)) }))
        : [defaultItem('Kitchen')],
    });
    setModalOpen(true);
  };

  const updateItem = (idx: number, field: string, value: any) => {
    setFormData(prev => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], [field]: value };
      const updated = items[idx];
      
      if (['width', 'height', 'units'].includes(field)) {
        if (updated.width && updated.height) {
          items[idx].quantity = parseFloat((updated.width * updated.height * (updated.units || 1)).toFixed(2));
        }
      }
      if (field === 'material_id' && value) {
        const mat = materials.find(m => m.id === Number(value));
        if (mat) items[idx].unit_price = parseFloat(mat.cost_price);
      }
      return { ...prev, items };
    });
  };

  const addRoom = () => {
    const uniqueRooms = new Set(formData.items.map(i => i.room_name));
    const newRoomName = `Room ${uniqueRooms.size + 1}`;
    setFormData(prev => ({ ...prev, items: [...prev.items, defaultItem(newRoomName)] }));
  };

  const addItemToRoom = (roomName: string) => {
    setFormData(prev => ({ ...prev, items: [...prev.items, defaultItem(roomName)] }));
  };

  const renameRoom = (oldName: string, newName: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(i => i.room_name === oldName ? { ...i, room_name: newName } : i)
    }));
  };

  const removeRoom = (roomName: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(i => i.room_name !== roomName)
    }));
  };

  const removeItem = (idx: number) => setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) { showToast('Quotation title is required.', 'warning'); return; }
    if (formData.items.length === 0) { showToast('At least one line item is required.', 'warning'); return; }
    for (const item of formData.items) {
      if (!item.room_name.trim()) { showToast('Room name is required for all items.', 'warning'); return; }
    }

    setFormLoading(true);
    try {
      const payload = { ...formData, items: formData.items.map(i => ({ ...i, material_id: i.material_id || null })) };
      if (editingQuotation) {
        const res = await updateMutation.mutateAsync({ id: editingQuotation.id, data: payload });
        if (res.success) { showToast('Quotation updated successfully.', 'success'); setModalOpen(false); }
      } else {
        const res = await createMutation.mutateAsync(payload);
        if (res.success) { showToast(`Quotation ${res.data.qtn_number} created!`, 'success'); setModalOpen(false); }
      }
    } catch (err: any) {
      showToast(err.message || 'Save failed.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Archive this quotation?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      showToast('Quotation archived.', 'success');
      if (previewId === id) setPreviewId(null);
    } catch (err: any) { showToast(err.message || 'Delete failed.', 'error'); }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      const res = await statusMutation.mutateAsync({ id, status });
      if (res.success) showToast(`Status updated to ${status}.`, 'success');
    } catch (err: any) { showToast(err.message || 'Status update failed.', 'error'); }
  };

  const handleConvert = async (id: number) => {
    if (!window.confirm('Convert this approved quotation into a new Project?')) return;
    try {
      const res = await convertMutation.mutateAsync(id);
      if (res.success) { showToast('Project created from quotation!', 'success'); setPreviewId(null); }
    } catch (err: any) { showToast(err.message || 'Conversion failed.', 'error'); }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setShareAnchor(event.currentTarget);
  };

  const handleShareClose = () => {
    setShareAnchor(null);
  };

  const handleCopyLink = () => {
    if (!preview) return;
    const text = `Quotation: ${preview.qtn_number}\nTitle: ${preview.title}\nGrand Total: ₹${previewTotal.toLocaleString('en-IN')}\n\nClient Name: ${preview.customer?.name || '—'}`;
    navigator.clipboard.writeText(text);
    showToast('Quotation details copied to clipboard!', 'success');
    handleShareClose();
  };

  const columns: ColumnDefinition[] = [
    {
      field: 'qtn_number', headerName: 'Quotation No.', sortable: true,
      render: (row: Quotation) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main' }}>{row.qtn_number || 'N/A'}</Typography>
          <Typography variant="caption" color="text.secondary">{row.title}</Typography>
        </Box>
      ),
    },
    {
      field: 'customer', headerName: 'Customer', sortable: false,
      render: (row: Quotation) => (
        <Typography variant="body2">{row.customer?.name || '—'}</Typography>
      ),
    },
    {
      field: 'total', headerName: 'Total Amount', sortable: true,
      render: (row: Quotation) => (
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          ₹{parseFloat(row.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Typography>
      ),
    },
    {
      field: 'status', headerName: 'Status', sortable: true,
      render: (row: Quotation) => (
        <Chip label={row.status.toUpperCase()} color={statusColors[row.status]} size="small" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
      ),
    },
    {
      field: 'actions', headerName: 'Actions', sortable: false,
      render: (row: Quotation) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Preview Quotation"><IconButton size="small" onClick={() => { setPreviewId(row.id); setDrawerTab(0); }} color="primary"><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(row)} color="info"><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Archive"><IconButton size="small" onClick={() => handleDelete(row.id)} color="error"><DeleteIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  const preview = detailData?.data;
  const previewTotal = preview ? parseFloat(preview.total) : 0;
  const previewSub = preview ? parseFloat(preview.subtotal) : 0;
  const previewGst = preview ? parseFloat(preview.gst_amount) : 0;
  const previewDiscount = preview ? parseFloat(preview.discount_amount) : 0;
  const previewLabor = preview ? parseFloat(preview.labor_charges) : 0;
  const previewAdditional = preview ? parseFloat(preview.additional_charges) : 0;
  const gstRate = preview ? parseFloat(preview.gst_rate) : 0;
  const hasGst = gstRate > 0;

  // Group items by room
  const itemsByRoom = preview?.items?.reduce((acc: Record<string, typeof preview.items>, item) => {
    if (!item) return acc;
    const room = item.room_name || 'General';
    if (!acc[room]) acc[room] = [];
    acc[room].push(item);
    return acc;
  }, {}) ?? {};

  return (
    <Box sx={{ pb: 6 }}>
      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Quotation Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Create room-wise estimates, manage approval workflows and convert to projects
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{
          py: 1.2, px: 2.5, borderRadius: 3.5,
          background: 'linear-gradient(135deg, #7c4dff 0%, #b47cff 100%)',
          boxShadow: '0 4px 15px rgba(124, 77, 255, 0.3)',
        }}>
          New Quotation
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 4, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: 'flex', flexGrow: 1, gap: 1 }}>
          <TextField size="small" placeholder="Search by quotation number, title, or customer..."
            value={search} onChange={e => setSearch(e.target.value)} sx={{ flexGrow: 1 }}
            slotProps={{ input: { startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />, endAdornment: search && <IconButton size="small" onClick={() => { setSearch(''); setSearchQuery(''); }} edge="end"><ClearIcon fontSize="small" /></IconButton> } }}
          />
          <Button type="submit" variant="outlined">Search</Button>
        </Box>
        <TextField select size="small" label="Filter by Status" value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPagination(prev => ({ ...prev, current_page: 1 })); }} sx={{ minWidth: 180 }}>
          <MenuItem value="all">All Statuses</MenuItem>
          <MenuItem value="draft">Draft</MenuItem>
          <MenuItem value="sent">Sent</MenuItem>
          <MenuItem value="approved">Approved</MenuItem>
          <MenuItem value="rejected">Rejected</MenuItem>
        </TextField>
      </Paper>

      {/* Table */}
      <DataTable columns={columns} rows={rows} pagination={pagination}
        onPageChange={page => setPagination(prev => ({ ...prev, current_page: page }))}
        onRowsPerPageChange={perPage => setPagination(prev => ({ ...prev, per_page: perPage, current_page: 1 }))}
        sortField={sortField} sortOrder={sortOrder} onSort={handleSort} loading={listLoading}
      />

      {/* ===== PREVIEW DIALOG ===== */}
      <Dialog 
        open={previewId !== null} 
        onClose={() => setPreviewId(null)}
        maxWidth="md"
        fullWidth
        slotProps={{ 
          paper: { sx: { borderRadius: 4, maxHeight: '90vh', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' } },
          backdrop: { sx: { backdropFilter: 'blur(4px)', backgroundColor: 'rgba(15, 23, 42, 0.3)' } }
        }}
      >
        <DialogTitle className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Quotation Preview</Typography>
            {preview && (
              <Typography variant="caption" color="text.secondary">
                {preview.qtn_number} &bull; {preview.title}
              </Typography>
            )}
          </Box>
          <IconButton size="small" onClick={() => setPreviewId(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 4 }}>
          {detailLoading || !preview ? (
            <Box sx={{ display: 'flex', minHeight: '40vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
              <CircularProgress />
              <Typography variant="caption" color="text.secondary">Loading quotation details...</Typography>
            </Box>
          ) : (
            <>
              <Tabs 
                value={drawerTab} 
                onChange={(_, v) => setDrawerTab(v)} 
                className="no-print" 
                sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
              >
                <Tab label="Document Preview" sx={{ fontWeight: 700 }} />
                <Tab label="Approval & Actions" sx={{ fontWeight: 700 }} />
              </Tabs>

              {/* TAB 0: Professional Preview Document */}
              {drawerTab === 0 && (
                <Box>
                  {/* Action Toolbar */}
                  <Box className="no-print" sx={{ display: 'flex', gap: 1.5, mb: 4, bgcolor: 'primary.light', p: 2, borderRadius: 3, alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.dark' }}>
                      Ready to print or share? Select an action:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button 
                        variant="contained" 
                        size="small" 
                        startIcon={<PrintIcon />} 
                        onClick={handlePrint}
                        sx={{ borderRadius: 2 }}
                      >
                        Print Quotation
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<ShareIcon />}
                        onClick={handleShareClick}
                        sx={{ borderRadius: 2, bgcolor: '#FFFFFF' }}
                      >
                        Share Options
                      </Button>
                      <Menu
                        anchorEl={shareAnchor}
                        open={Boolean(shareAnchor)}
                        onClose={handleShareClose}
                      >
                        <MenuItem onClick={() => {
                          const text = `Hi, please find your quotation *${preview.qtn_number}* for *${preview.title}*. Total: ₹${previewTotal.toLocaleString('en-IN')}. Please review and confirm.`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                          handleShareClose();
                        }}>
                          <WhatsAppIcon fontSize="small" sx={{ mr: 1, color: '#25D366' }} /> Share on WhatsApp
                        </MenuItem>
                        <MenuItem onClick={() => {
                          const subject = `Quotation ${preview.qtn_number} - ${preview.title}`;
                          const body = `Dear ${preview.customer?.name || 'Client'},\n\nPlease find your quotation attached.\n\nQuotation No: ${preview.qtn_number}\nTitle: ${preview.title}\nTotal: ₹${previewTotal.toLocaleString('en-IN')}\n\nKind regards,\n${company?.name || 'Interior Studio'}`;
                          window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                          handleShareClose();
                        }}>
                          <EmailIcon fontSize="small" sx={{ mr: 1, color: '#3B82F6' }} /> Share via Email
                        </MenuItem>
                        <MenuItem onClick={handleCopyLink}>
                          <CopyIcon fontSize="small" sx={{ mr: 1 }} /> Copy Quotation Info
                        </MenuItem>
                      </Menu>
                    </Box>
                  </Box>

                  {/* Printable Page Sheet Container */}
                  <Box ref={printRef} className="print-area">
                    {/* Letterhead Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, pb: 3, borderBottom: '3px solid', borderColor: 'primary.main', alignItems: 'flex-start' }}>
                      <Box>
                        {company?.logo_url ? (
                          <img 
                            src={company.logo_url} 
                            alt={company.name} 
                            style={{ maxHeight: 65, maxWidth: 220, objectFit: 'contain', display: 'block', marginBottom: 8 }} 
                          />
                        ) : (
                          <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main', mb: 0.5 }}>
                            {company?.name || 'INTERIOR STUDIO'}
                          </Typography>
                        )}
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {company?.name || 'Interior Studio'}
                        </Typography>
                        {company?.address && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 320, mt: 0.5, lineHeight: 1.3 }}>{company.address}</Typography>}
                        {company?.gstn && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>GSTIN: {company.gstn}</Typography>}
                        {(company?.contact_no || company?.email || company?.website) && (
                          <Box sx={{ mt: 0.5 }}>
                            {company?.contact_no && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Phone: {company.contact_no}</Typography>}
                            {company?.email && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Email: {company.email}</Typography>}
                            {company?.website && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Website: {company.website}</Typography>}
                          </Box>
                        )}
                      </Box>
                      
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h4" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: 0.5 }}>QUOTATION</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 800, color: 'primary.main', mt: 0.5 }}>{preview.qtn_number}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          Date: {new Date(preview.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </Typography>
                        <Chip label={preview.status.toUpperCase()} color={statusColors[preview.status]} size="small" sx={{ mt: 1.5, fontWeight: 800, fontSize: '0.65rem' }} className="no-print" />
                      </Box>
                    </Box>

                    {/* Client & Project Information */}
                    <Grid container spacing={4} sx={{ mb: 4 }}>
                      <Grid size={6}>
                        <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 1 }}>Bill To</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 0.5, color: 'text.primary' }}>{preview.customer?.name || '—'}</Typography>
                        {preview.customer?.phone && <Typography variant="body2" color="text.secondary">Phone: {preview.customer.phone}</Typography>}
                        {preview.customer?.email && <Typography variant="body2" color="text.secondary">Email: {preview.customer.email}</Typography>}
                        {preview.customer?.site_address && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, display: 'block', lineHeight: 1.3 }}>{preview.customer.site_address}</Typography>}
                      </Grid>
                      <Grid size={6}>
                        <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 1 }}>Project Workspace</Typography>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mt: 0.5, color: 'text.primary' }}>{preview.project?.name || 'Pending Assignment'}</Typography>
                        <Typography variant="body2" color="text.secondary">{preview.title}</Typography>
                        {preview.project?.site_address && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, display: 'block', lineHeight: 1.3 }}>{preview.project.site_address}</Typography>}
                      </Grid>
                    </Grid>

                    {/* Items by room */}
                    {Object.entries(itemsByRoom).map(([room, items]) => (
                      <Box key={room} sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, bgcolor: 'primary.main', color: '#fff', px: 2, py: 0.8, borderRadius: 1.5, letterSpacing: 0.5 }}>
                          {room}
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ mt: 1, borderRadius: 2 }}>
                          <Table size="small">
                            <TableHead sx={{ bgcolor: 'grey.50' }}>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 700, width: '40%' }}>Item Details</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="center">Dimensions</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Qty (Sqft)</TableCell>
                                <TableCell sx={{ fontWeight: 700 }} align="right">Price/Sqft</TableCell>
                                {hasGst && <TableCell sx={{ fontWeight: 700 }} align="right">GST</TableCell>}
                                <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {items?.map((item: any, idx: number) => {
                                const itemQty = parseFloat(String(item?.quantity || 0));
                                const itemPrice = parseFloat(String(item?.unit_price || 0));
                                const itemSubtotal = itemQty * itemPrice;
                                const itemGstVal = hasGst ? (itemSubtotal * gstRate) / 100 : 0;
                                const itemAmount = itemSubtotal + itemGstVal;

                                return (
                                  <TableRow key={idx} sx={{ '&:nth-of-type(even)': { bgcolor: 'grey.50' } }}>
                                    <TableCell sx={{ verticalAlign: 'middle', fontWeight: 600 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{item?.item_name || item?.description || '—'}</Typography>
                                      {item?.item_name && item?.description && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{item.description}</Typography>}
                                    </TableCell>
                                    <TableCell align="center" sx={{ verticalAlign: 'middle', fontSize: '0.8rem' }}>
                                      {item?.width && item?.height ? `${item.width}' x ${item.height}' ${item.units && item.units > 1 ? `(${item.units} units)` : ''}` : '—'}
                                    </TableCell>
                                    <TableCell align="right" sx={{ verticalAlign: 'middle' }}>{itemQty.toFixed(2)}</TableCell>
                                    <TableCell align="right" sx={{ verticalAlign: 'middle' }}>₹{itemPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</TableCell>
                                    {hasGst && (
                                      <TableCell align="right" sx={{ verticalAlign: 'middle' }}>
                                        ₹{itemGstVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ({gstRate}%)
                                      </TableCell>
                                    )}
                                    <TableCell align="right" sx={{ fontWeight: 700, verticalAlign: 'middle' }}>
                                      ₹{itemAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </Box>
                    ))}

                    {/* Financial Summary */}
                    <Box sx={{ ml: 'auto', maxWidth: 360, mt: 4 }}>
                      {[
                        { label: 'Sub Total', value: previewSub },
                        { label: `Labor Charges`, value: previewLabor },
                        { label: `Additional Charges`, value: previewAdditional },
                        { label: `Discount`, value: -previewDiscount },
                        ...(hasGst ? [{ label: `GST (${gstRate}%)`, value: previewGst }] : []),
                      ].map(({ label, value }) => (
                        <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.8, borderBottom: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="body2" color="text.secondary">{label}</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: value < 0 ? 'error.main' : 'inherit' }}>
                            {value < 0 ? '-' : ''}₹{Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </Typography>
                        </Box>
                      ))}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1.5, mt: 0.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800 }}>GRAND TOTAL</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main' }}>
                          ₹{previewTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Terms */}
                    {preview.terms_conditions && (
                      <Box sx={{ mt: 5, p: 3, bgcolor: '#F8FAFC', borderRadius: 3, borderLeft: '4px solid', borderColor: 'primary.main', pageBreakInside: 'avoid' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>Terms & Conditions</Typography>
                        <Typography variant="caption" sx={{ whiteSpace: 'pre-line', color: 'text.secondary', display: 'block', lineHeight: 1.4 }}>
                          {preview.terms_conditions}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              {/* TAB 1: Workflow Actions */}
              {drawerTab === 1 && (
                <Box className="no-print" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Status Workflow */}
                  <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>Approval Workflow</Typography>
                      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        {preview.status === 'draft' && (
                          <Button variant="contained" startIcon={<SendIcon />} color="info" onClick={() => handleStatusChange(preview.id, 'sent')}>
                            Mark as Sent
                          </Button>
                        )}
                        {preview.status === 'sent' && (
                          <>
                            <Button variant="contained" startIcon={<ApproveIcon />} color="success" onClick={() => handleStatusChange(preview.id, 'approved')}>
                              Approve
                            </Button>
                            <Button variant="outlined" startIcon={<RejectIcon />} color="error" onClick={() => handleStatusChange(preview.id, 'rejected')}>
                              Reject
                            </Button>
                          </>
                        )}
                        {preview.status === 'approved' && !preview.project_id && (
                          <Button variant="contained" startIcon={<ConvertIcon />}
                            sx={{ background: 'linear-gradient(135deg, #7c4dff 0%, #b47cff 100%)' }}
                            onClick={() => handleConvert(preview.id)}>
                            Convert to Project
                          </Button>
                        )}
                        {preview.status === 'approved' && preview.project_id && (
                          <Alert severity="success" sx={{ flex: 1 }}>
                            This quotation has been converted to a project.
                          </Alert>
                        )}
                        {preview.status === 'rejected' && (
                          <Button variant="outlined" onClick={() => handleStatusChange(preview.id, 'draft')}>
                            Revert to Draft
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Edit Quick Access */}
                  <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>Edit & Manage</Typography>
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => { openEdit(preview); setPreviewId(null); }}>
                          Edit Quotation
                        </Button>
                        <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => { handleDelete(preview.id); }}>
                          Archive
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== CREATE / EDIT MODAL ===== */}
      <Dialog open={modalOpen} onClose={() => !formLoading && setModalOpen(false)} maxWidth="lg" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4, maxHeight: '90vh' } } }}>
        <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid', borderColor: 'divider' }}>
          {editingQuotation ? `Edit Quotation — ${editingQuotation.qtn_number}` : 'Create New Quotation'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>

            {/* Basic Info */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: 'primary.main' }}>Basic Information</Typography>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <TextField fullWidth required label="Quotation Title" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} />
                </Grid>
                <Grid size={6}>
                  <TextField fullWidth select label="Customer" value={formData.customer_id ?? ''} onChange={e => setFormData(p => ({ ...p, customer_id: Number(e.target.value) || null }))}>
                    <MenuItem value="">No Customer</MenuItem>
                    {customers.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={6}>
                  <TextField fullWidth select label="Link to Project (Optional)" value={formData.project_id ?? ''} onChange={e => setFormData(p => ({ ...p, project_id: Number(e.target.value) || null }))}>
                    <MenuItem value="">No Project</MenuItem>
                    {projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={6}>
                  <TextField fullWidth select label="Status" value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}>
                    <MenuItem value="draft">Draft</MenuItem>
                    <MenuItem value="sent">Sent</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={6}>
                  <TextField fullWidth select label="GST Rate (%)" value={formData.gst_rate} onChange={e => setFormData(p => ({ ...p, gst_rate: Number(e.target.value) }))}>
                    {[0, 5, 12, 18, 28].map(r => <MenuItem key={r} value={r}>{r}%</MenuItem>)}
                  </TextField>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Room-wise Items */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>Room-wise Estimation</Typography>
                <Button startIcon={<AddRowIcon />} size="small" variant="contained" onClick={addRoom}>Add Room</Button>
              </Box>
              
              {Array.from(new Set(formData.items.map(i => i.room_name))).map((roomName, roomIdx) => {
                const roomItems = formData.items.map((item, idx) => ({ item, idx })).filter(x => x.item.room_name === roomName);
                
                return (
                  <Card variant="outlined" key={roomIdx} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
                    <Box sx={{ bgcolor: 'action.hover', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
                      <TextField 
                        size="small"
                        variant="outlined"
                        value={roomName}
                        onChange={e => renameRoom(roomName, e.target.value)}
                        sx={{ width: 250, '& .MuiOutlinedInput-root': { bgcolor: 'background.paper', fontWeight: 600 } }}
                      />
                      <Box>
                        <Button size="small" startIcon={<AddRowIcon />} onClick={() => addItemToRoom(roomName)} sx={{ mr: 1 }}>Add Item</Button>
                        <Tooltip title="Remove entire room">
                          <span>
                            <IconButton size="small" color="error" onClick={() => removeRoom(roomName)} disabled={new Set(formData.items.map(i => i.room_name)).size <= 1}>
                              <RemoveRowIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Box>
                    </Box>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, width: '20%' }}>Item Name</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: '25%' }}>Description / Material</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 85 }} align="center">W (ft)</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 85 }} align="center">H (ft)</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 75 }} align="center">Units</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 90 }} align="right">Qty/Sqft</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 100 }} align="right">Price/Sqft</TableCell>
                            <TableCell sx={{ fontWeight: 600, width: 100 }} align="right">Total (₹)</TableCell>
                            <TableCell sx={{ width: 40 }} />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {roomItems.map(({ item, idx }) => {
                            const rowTotal = item.quantity * item.unit_price;
                            const hideSpinners = { '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { display: 'none' }, '& input[type=number]': { MozAppearance: 'textfield' } };
                            return (
                              <TableRow key={idx}>
                                <TableCell sx={{ verticalAlign: 'top' }}>
                                  <TextField size="small" fullWidth placeholder="e.g. Door" value={item.item_name}
                                    onChange={e => updateItem(idx, 'item_name', e.target.value)} required />
                                </TableCell>
                                <TableCell sx={{ verticalAlign: 'top' }}>
                                  <TextField size="small" fullWidth placeholder="e.g. Plywood with laminate" value={item.description}
                                    onChange={e => updateItem(idx, 'description', e.target.value)} />
                                </TableCell>
                                <TableCell sx={{ verticalAlign: 'top' }}>
                                  <TextField size="small" type="number" placeholder="W" value={item.width ?? ''}
                                    sx={hideSpinners}
                                    onChange={e => updateItem(idx, 'width', e.target.value ? parseFloat(e.target.value) : null)} />
                                </TableCell>
                                <TableCell sx={{ verticalAlign: 'top' }}>
                                  <TextField size="small" type="number" placeholder="H" value={item.height ?? ''}
                                    sx={hideSpinners}
                                    onChange={e => updateItem(idx, 'height', e.target.value ? parseFloat(e.target.value) : null)} />
                                </TableCell>
                                <TableCell sx={{ verticalAlign: 'top' }}>
                                  <TextField size="small" type="number" value={item.units ?? ''}
                                    sx={hideSpinners}
                                    onChange={e => updateItem(idx, 'units', e.target.value ? parseFloat(e.target.value) : null)} />
                                </TableCell>
                                <TableCell sx={{ verticalAlign: 'top' }}>
                                  <TextField size="small" type="number" value={item.quantity}
                                    sx={hideSpinners}
                                    onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                    slotProps={{ input: { inputProps: { min: 0.01, step: 0.01 } } }} />
                                </TableCell>
                                <TableCell sx={{ verticalAlign: 'top' }}>
                                  <TextField size="small" type="number" value={item.unit_price}
                                    sx={hideSpinners}
                                    onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                    slotProps={{ input: { inputProps: { min: 0, step: 0.01 } } }} />
                                </TableCell>
                                <TableCell align="right" sx={{ fontWeight: 700, pt: 1.5, verticalAlign: 'top' }}>
                                  ₹{rowTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell sx={{ verticalAlign: 'top' }}>
                                  <Tooltip title="Remove item">
                                    <span>
                                      <IconButton size="small" color="error" onClick={() => removeItem(idx)} disabled={formData.items.length <= 1}>
                                        <RemoveRowIcon fontSize="small" />
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Card>
                );
              })}
            </Box>

            <Divider />

            {/* Financial Adjustments + Live Totals */}
            <Grid container spacing={2}>
              <Grid size={8}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: 'primary.main' }}>Adjustments</Typography>
                <Grid container spacing={2}>
                  <Grid size={6}>
                    <TextField fullWidth label="Labor Charges (₹)" type="number" value={formData.labor_charges}
                      onChange={e => setFormData(p => ({ ...p, labor_charges: parseFloat(e.target.value) || 0 }))} />
                  </Grid>
                  <Grid size={6}>
                    <TextField fullWidth label="Additional Charges (₹)" type="number" value={formData.additional_charges}
                      onChange={e => setFormData(p => ({ ...p, additional_charges: parseFloat(e.target.value) || 0 }))} />
                  </Grid>
                  <Grid size={6}>
                    <TextField fullWidth label="Discount Amount (₹)" type="number" value={formData.discount_amount}
                      onChange={e => setFormData(p => ({ ...p, discount_amount: parseFloat(e.target.value) || 0 }))} />
                  </Grid>
                </Grid>
              </Grid>
              <Grid size={4}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, bgcolor: 'action.hover' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>Live Total</Typography>
                  {[
                    { label: 'Subtotal', val: computedSubtotal },
                    { label: 'Labor', val: formData.labor_charges },
                    { label: 'Additional', val: formData.additional_charges },
                    { label: 'Discount', val: -formData.discount_amount },
                    { label: `GST (${formData.gst_rate}%)`, val: computedGstAmount },
                  ].map(({ label, val }) => (
                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">{label}</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: val < 0 ? 'error.main' : 'inherit' }}>
                        {val < 0 ? '-' : ''}₹{Math.abs(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  ))}
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>TOTAL</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: 'primary.main' }}>
                      ₹{computedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            <Divider />

            {/* Terms & Conditions */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: 'primary.main' }}>Terms & Conditions</Typography>
              <TextField fullWidth multiline rows={5} value={formData.terms_conditions}
                onChange={e => setFormData(p => ({ ...p, terms_conditions: e.target.value }))} />
            </Box>

          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
            <Button onClick={() => setModalOpen(false)} disabled={formLoading} variant="outlined">Cancel</Button>
            <Button type="submit" disabled={formLoading} variant="contained" color="primary">
              {formLoading ? <CircularProgress size={20} color="inherit" /> : editingQuotation ? 'Update Quotation' : 'Create Quotation'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
