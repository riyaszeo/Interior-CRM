import React, { useState } from 'react';
import {
  Box, Typography, Button, TextField, MenuItem, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Chip, Paper, Grid, Divider, Card, CardContent,
  Tabs, Tab, Table, TableBody, TableCell, TableHead,
  TableRow, TableContainer, Alert,
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, Clear as ClearIcon,
  Visibility as ViewIcon, Receipt as InvoiceIcon,
  AttachMoney as PaymentIcon, Cancel as CancelIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';

import {
  useInvoicesList, useInvoiceDetails, useCreateInvoice,
  useRecordPayment, useCancelInvoice, useInvoiceFormOptions,
} from '../hooks/useInvoices';

import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import { useCompanyDetails } from '../hooks/useCompany';

// ── Constants & Helpers ────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  draft:          { label: 'Draft',          color: 'default' as const },
  unpaid:         { label: 'Unpaid',         color: 'error' as const },
  partially_paid: { label: 'Partially Paid', color: 'warning' as const },
  paid:           { label: 'Paid',           color: 'success' as const },
  cancelled:      { label: 'Cancelled',      color: 'default' as const },
};

const TYPE_CONFIG = {
  advance: { label: 'Advance Invoice', color: 'primary' as const },
  running: { label: 'Running Invoice', color: 'info' as const },
  final:   { label: 'Final Invoice',   color: 'secondary' as const },
};

const formatINR = (val: string | number) =>
  `₹${parseFloat(String(val || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const InvoicesPage: React.FC = () => {
  const { showToast } = useToast();
  const { hasPermission, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  // Pagination & Filter States
  const page = 1;
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 0: INVOICES REGISTERS
  // ───────────────────────────────────────────────────────────────────────────
  const { data: invoicesData, isLoading: listLoading } = useInvoicesList(
    page, statusFilter, typeFilter, searchQuery
  );

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [detailModal, setDetailModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);

  const { data: detailData, isLoading: detailLoading } = useInvoiceDetails(selectedInvoiceId);
  const invoice = detailData?.data;
  const { data: companyData } = useCompanyDetails();
  const company = companyData?.data;

  const recordPaymentMutation = useRecordPayment();
  const cancelInvoiceMutation = useCancelInvoice();

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paid_at: new Date().toISOString().split('T')[0],
  });

  const handleCancelInvoice = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this invoice? This will reverse any project cost updates.')) return;
    try {
      await cancelInvoiceMutation.mutateAsync(id);
      showToast('Invoice marked as cancelled.', 'info');
      setDetailModal(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCollectPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || !paymentForm.amount) return;
    try {
      await recordPaymentMutation.mutateAsync({
        id: selectedInvoiceId,
        amount: Number(paymentForm.amount),
        paid_at: paymentForm.paid_at,
      });
      showToast('Payment recorded successfully.', 'success');
      setPaymentModal(false);
      setPaymentForm({ amount: '', paid_at: new Date().toISOString().split('T')[0] });
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 1: CREATE INVOICE FORM
  // ───────────────────────────────────────────────────────────────────────────
  const { data: formOptionsData } = useInvoiceFormOptions();
  const options = formOptionsData?.data;

  const [invForm, setInvForm] = useState({
    project_id: '',
    quotation_id: '',
    invoice_type: 'running' as 'advance' | 'running' | 'final',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +15 days
    payment_terms: '',
    discount_amount: 0,
    tax_type: 'local' as 'local' | 'igst',
    notes: '',
    items: [{ description: '', hsn_code: '9983', quantity: 1, unit_price: 0, gst_rate: 18 }],
  });

  const createInvoiceMutation = useCreateInvoice();

  const handleQuotationSelection = (qId: string) => {
    const qtn = options?.quotations.find(q => q.id === Number(qId));
    if (qtn) {
      // Fetch quotation details
      apiClient.get<any>(`/quotations/${qtn.id}`).then((res: any) => {
        const fullQ = res.data;
        
        // Auto-fill lines from quotation estimation
        const formattedItems = fullQ.rooms.flatMap((room: any) => 
          room.items.map((item: any) => ({
            description: `${room.room_name} — ${item.item_name} (${item.notes || ''})`,
            hsn_code: '9983',
            quantity: parseFloat(item.quantity),
            unit_price: parseFloat(item.rate),
            gst_rate: 18,
          }))
        );

        setInvForm(p => ({
          ...p,
          quotation_id: String(qtn.id),
          project_id: String(qtn.project_id),
          items: formattedItems.length > 0 ? formattedItems : [{ description: `Sign-off Billing for Qtn: ${qtn.qtn_number}`, hsn_code: '9983', quantity: 1, unit_price: parseFloat(qtn.total) / 1.18, gst_rate: 18 }],
        }));
      });
    } else {
      setInvForm(p => ({ ...p, quotation_id: '', items: [{ description: '', hsn_code: '9983', quantity: 1, unit_price: 0, gst_rate: 18 }] }));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const items = [...invForm.items];
    (items[index] as any)[field] = value;
    setInvForm(p => ({ ...p, items }));
  };

  const handleAddItem = () => {
    setInvForm(p => ({
      ...p,
      items: [...p.items, { description: '', hsn_code: '9983', quantity: 1, unit_price: 0, gst_rate: 18 }],
    }));
  };

  const handleRemoveItem = (index: number) => {
    const items = invForm.items.filter((_, i) => i !== index);
    setInvForm(p => ({ ...p, items }));
  };

  // Real-time computations
  const subtotal = invForm.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const gstTotal = invForm.items.reduce((sum, item) => sum + ((item.quantity * item.unit_price * item.gst_rate) / 100), 0);
  const totalAmount = (subtotal - invForm.discount_amount) + gstTotal;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invForm.project_id || invForm.items.length === 0) {
      showToast('Project and at least one item line are required.', 'warning');
      return;
    }
    try {
      await createInvoiceMutation.mutateAsync({
        project_id: Number(invForm.project_id),
        quotation_id: invForm.quotation_id ? Number(invForm.quotation_id) : null,
        invoice_type: invForm.invoice_type,
        invoice_date: invForm.invoice_date,
        due_date: invForm.due_date,
        payment_terms: invForm.payment_terms,
        discount_amount: Number(invForm.discount_amount),
        tax_type: invForm.tax_type,
        notes: invForm.notes,
        items: invForm.items.map(i => ({
          description: i.description,
          hsn_code: i.hsn_code,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          gst_rate: Number(i.gst_rate),
        })),
      });
      showToast('GST Invoice generated successfully.', 'success');
      setInvForm({
        project_id: '',
        quotation_id: '',
        invoice_type: 'running',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        payment_terms: '',
        discount_amount: 0,
        tax_type: 'local',
        notes: '',
        items: [{ description: '', hsn_code: '9983', quantity: 1, unit_price: 0, gst_rate: 18 }],
      });
      setActiveTab(0);
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
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Invoices & Customer Billing</Typography>
          <Typography variant="body2" color="text.secondary">
            Generate GST tax invoices, manage advance payments, track progress billing, and record collections.
          </Typography>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2, '& .MuiTab-root': { fontWeight: 700 } }}>
          <Tab icon={<InvoiceIcon fontSize="small" />} iconPosition="start" label="Billing Registers" />
          <Tab icon={<AddIcon fontSize="small" />} iconPosition="start" label="Generate GST Invoice" />
        </Tabs>
      </Paper>

      {/* Filters strip for Tab 0 */}
      {activeTab === 0 && (
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box component="form" onSubmit={e => { e.preventDefault(); setSearchQuery(searchVal); }} sx={{ display: 'flex', flexGrow: 1, gap: 1 }}>
            <TextField size="small" placeholder="Search invoice no, client..." value={searchVal}
              onChange={e => setSearchVal(e.target.value)} sx={{ flexGrow: 1 }}
              slotProps={{ input: { startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />, endAdornment: searchVal && <IconButton size="small" onClick={() => { setSearchVal(''); setSearchQuery(''); }}><ClearIcon fontSize="small" /></IconButton> } }} />
            <Button type="submit" variant="outlined">Search</Button>
          </Box>
          <TextField select size="small" label="Billing Type" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="">All Billing Types</MenuItem>
            <MenuItem value="advance">Advance Invoices</MenuItem>
            <MenuItem value="running">Running progress</MenuItem>
            <MenuItem value="final">Final settlement</MenuItem>
          </TextField>
          <TextField select size="small" label="Receipt Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="unpaid">Unpaid</MenuItem>
            <MenuItem value="partially_paid">Partially Paid</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>
        </Paper>
      )}

      {/* Dynamic Content */}
      <Box>
        {activeTab === 0 && renderRegistersTab()}
        {activeTab === 1 && renderCreateInvoiceForm()}
      </Box>

      {/* Popups */}
      {renderInvoiceDetailDialog()}
      {renderCollectPaymentDialog()}
    </Box>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // REGISTER GRID
  // ═══════════════════════════════════════════════════════════════════════════

  function renderRegistersTab() {
    const items = invoicesData?.data?.items || [];
    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Invoice Number</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Project</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Billing Type</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Invoice Date</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Invoice Value</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Paid Balance</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {listLoading ? (
                <TableRow><TableCell colSpan={9} align="center"><CircularProgress /></TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ color: 'text.secondary' }}>No invoices billed yet</TableCell></TableRow>
              ) : items.map(inv => {
                const confStatus = STATUS_CONFIG[inv.status] || { label: inv.status, color: 'default' };
                const confType = TYPE_CONFIG[inv.invoice_type] || { label: inv.invoice_type, color: 'default' };
                return (
                  <TableRow key={inv.id} hover>
                    <TableCell sx={{ fontWeight: 800, color: 'primary.main', cursor: 'pointer' }} onClick={() => { setSelectedInvoiceId(inv.id); setDetailModal(true); }}>
                      {inv.invoice_number}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{inv.project?.name}</TableCell>
                    <TableCell>{inv.project?.customer?.name || '—'}</TableCell>
                    <TableCell>
                      <Chip label={confType.label} color={confType.color} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>{formatDate(inv.invoice_date)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>{formatINR(inv.total_amount)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>{formatINR(inv.paid_amount)}</TableCell>
                    <TableCell>
                      <Chip label={confStatus.label} color={confStatus.color} size="small" sx={{ fontWeight: 800 }} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary" onClick={() => { setSelectedInvoiceId(inv.id); setDetailModal(true); }}><ViewIcon fontSize="small" /></IconButton>
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

  // ═══════════════════════════════════════════════════════════════════════════
  // CREATE INVOICE FORM
  // ═══════════════════════════════════════════════════════════════════════════

  function renderCreateInvoiceForm() {
    return (
      <Card variant="outlined" sx={{ borderRadius: 4, maxWidth: 1000, mx: 'auto' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Generate GST Customer Invoice</Typography>
          <Divider sx={{ mb: 3 }} />
          <form onSubmit={handleCreateSubmit}>
            <Grid container spacing={3}>
              {/* Pick Quote Link */}
              <Grid size={12}>
                <TextField select fullWidth label="Link Approved Estimation Quotation (optional)" value={invForm.quotation_id} onChange={e => handleQuotationSelection(e.target.value)} helperText="Links with an approved estimate quotation to pull client parameters and rooms estimation details">
                  <MenuItem value="">Direct Invoice (No Estimate Link)</MenuItem>
                  {options?.quotations.map(q => <MenuItem key={q.id} value={q.id}>{q.qtn_number} — {q.title} ({formatINR(q.total)})</MenuItem>)}
                </TextField>
              </Grid>

              {/* Project Link */}
              <Grid size={6}>
                <TextField select fullWidth required label="Target Project" value={invForm.project_id} onChange={e => setInvForm(p => ({ ...p, project_id: e.target.value }))} disabled={!!invForm.quotation_id}>
                  {options?.projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name} ({p.project_code})</MenuItem>)}
                </TextField>
              </Grid>

              {/* Invoice Type */}
              <Grid size={6}>
                <TextField select fullWidth required label="Invoice Type" value={invForm.invoice_type} onChange={e => setInvForm(p => ({ ...p, invoice_type: e.target.value as any }))}>
                  <MenuItem value="advance">Advance Invoice (Mobilization billing)</MenuItem>
                  <MenuItem value="running">Running Invoice (Progress billing)</MenuItem>
                  <MenuItem value="final">Final Invoice (Settlement billing)</MenuItem>
                </TextField>
              </Grid>

              {/* Dates */}
              <Grid size={4}>
                <TextField type="date" fullWidth required label="Invoice Date" value={invForm.invoice_date} onChange={e => setInvForm(p => ({ ...p, invoice_date: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={4}>
                <TextField type="date" fullWidth required label="Due Date" value={invForm.due_date} onChange={e => setInvForm(p => ({ ...p, due_date: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>

              {/* Taxation Zone */}
              <Grid size={4}>
                <TextField select fullWidth required label="Billing GST Type" value={invForm.tax_type} onChange={e => setInvForm(p => ({ ...p, tax_type: e.target.value as any }))}>
                  <MenuItem value="local">Local Billing (CGST + SGST split)</MenuItem>
                  <MenuItem value="igst">Interstate Billing (IGST consolidated)</MenuItem>
                </TextField>
              </Grid>

              {/* Payment terms */}
              <Grid size={6}>
                <TextField fullWidth multiline rows={2} label="Payment Terms & Conditions" value={invForm.payment_terms} onChange={e => setInvForm(p => ({ ...p, payment_terms: e.target.value }))} placeholder="e.g. 50% mobilization advance. Balance on completion." />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth multiline rows={2} label="Notes" value={invForm.notes} onChange={e => setInvForm(p => ({ ...p, notes: e.target.value }))} placeholder="Additional invoice notes visible to client..." />
              </Grid>

              <Grid size={12}>
                <Divider><Typography variant="subtitle2" sx={{ px: 1, fontWeight: 800 }}>Billing Invoice Items</Typography></Divider>
              </Grid>

              {invForm.items.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ width: '100%', ml: 0, mb: 1, alignItems: 'center' }}>
                  <Grid size={5}>
                    <TextField fullWidth required size="small" label="Item Description" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} placeholder="e.g. Bedroom ceiling work" />
                  </Grid>
                  <Grid size={2}>
                    <TextField fullWidth size="small" label="HSN" value={item.hsn_code} onChange={e => handleItemChange(index, 'hsn_code', e.target.value)} placeholder="9983" />
                  </Grid>
                  <Grid size={1.5}>
                    <TextField type="number" fullWidth required size="small" label="Qty" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))} />
                  </Grid>
                  <Grid size={2.0}>
                    <TextField type="number" fullWidth required size="small" label="Rate (₹)" value={item.unit_price} onChange={e => handleItemChange(index, 'unit_price', Number(e.target.value))} />
                  </Grid>
                  <Grid size={1.0}>
                    <TextField type="number" fullWidth required size="small" label="GST %" value={item.gst_rate} onChange={e => handleItemChange(index, 'gst_rate', Number(e.target.value))} />
                  </Grid>
                  <Grid size={0.5}>
                    <IconButton size="small" color="error" disabled={invForm.items.length <= 1} onClick={() => handleRemoveItem(index)}><CancelIcon fontSize="small" /></IconButton>
                  </Grid>
                </Grid>
              ))}

              <Grid size={12}>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddItem} size="small">Add Billing Row</Button>
              </Grid>

              {/* Discount Amount */}
              <Grid size={12}>
                <Divider sx={{ my: 1 }} />
              </Grid>
              <Grid size={8}></Grid>
              <Grid size={4}>
                <TextField type="number" fullWidth size="small" label="Discount Amount (₹)" value={invForm.discount_amount || ''} onChange={e => setInvForm(p => ({ ...p, discount_amount: Number(e.target.value) }))} />
              </Grid>

              {/* Real-time GST Summary Panel */}
              <Grid size={12}>
                <Paper variant="outlined" sx={{ p: 2.5, bgcolor: 'action.hover', display: 'flex', flexDirection: 'column', gap: 1.5, borderRadius: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Billing Subtotal:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatINR(subtotal)}</Typography>
                  </Box>
                  {invForm.discount_amount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'error.main' }}>
                      <Typography variant="body2">Discount Offset:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>-{formatINR(invForm.discount_amount)}</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      {invForm.tax_type === 'igst' ? 'Consolidated IGST (18%):' : 'GST Breakdown (9% CGST + 9% SGST):'}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatINR(gstTotal)}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>Total Billing Value (Inc Taxes):</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: 'primary.main' }}>{formatINR(totalAmount)}</Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* Submit Buttons */}
              <Grid size={12} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button onClick={() => setActiveTab(0)} variant="outlined">Cancel</Button>
                <Button type="submit" variant="contained" disabled={createInvoiceMutation.isPending}>Generate GST Invoice</Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POPUP PREVIEWS
  // ═══════════════════════════════════════════════════════════════════════════

  // GST Invoice Professional Preview Modal
  function renderInvoiceDetailDialog() {
    if (detailLoading) {
      return (
        <Dialog open={detailModal} onClose={() => setDetailModal(false)}>
          <DialogContent sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></DialogContent>
        </Dialog>
      );
    }
    if (!invoice) return null;

    const confType = TYPE_CONFIG[invoice.invoice_type] || { label: invoice.invoice_type, color: 'default' };
    const canCancel = invoice.status !== 'cancelled' && (hasPermission('projects:approve') || hasRole('superadmin'));
    const isUnpaid = invoice.status === 'unpaid' || invoice.status === 'partially_paid';

    return (
      <Dialog open={detailModal} onClose={() => setDetailModal(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogContent sx={{ p: 0 }}>
          {/* Professional Invoice Preview layout */}
          <Box sx={{ p: 5, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Header info */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                {company?.logo_url ? (
                  <img 
                    src={company.logo_url} 
                    alt={company.name} 
                    style={{ maxHeight: 60, maxWidth: 200, objectFit: 'contain', display: 'block', marginBottom: 8 }} 
                  />
                ) : (
                  <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <InvoiceIcon /> {company?.name || 'INTERIOR STUDIO'}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {company?.name || 'Interior Studio'}
                </Typography>
                {company?.address && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 320, mt: 0.5, lineHeight: 1.3 }}>
                    {company.address}
                  </Typography>
                )}
                {company?.gstn && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>
                    GSTIN: {company.gstn}
                  </Typography>
                )}
                {(company?.contact_no || company?.email || company?.website) && (
                  <Box sx={{ mt: 0.5 }}>
                    {company?.contact_no && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Phone: {company.contact_no}</Typography>}
                    {company?.email && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Email: {company.email}</Typography>}
                    {company?.website && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Website: {company.website}</Typography>}
                  </Box>
                )}
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h5" sx={{ fontWeight: 900 }}>TAX INVOICE</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>{invoice.invoice_number}</Typography>
                <Chip label={confType.label} color={confType.color} size="small" variant="outlined" sx={{ mt: 1, fontWeight: 700 }} />
              </Box>
            </Box>

            <Divider />

            {/* Billed To / From parameters */}
            <Grid container spacing={2}>
              <Grid size={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Billed To:</Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, mt: 0.5 }}>{invoice.project?.customer?.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Project: <strong>{invoice.project?.name}</strong><br />
                  Site: {invoice.project?.site_address || '—'}
                </Typography>
              </Grid>
              <Grid size={6} sx={{ textAlign: 'right' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>Invoice Dates:</Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Invoice Date: <strong>{formatDate(invoice.invoice_date)}</strong><br />
                  Due Date: <strong style={{ color: isUnpaid ? '#f44336' : 'inherit' }}>{formatDate(invoice.due_date)}</strong>
                </Typography>
              </Grid>
            </Grid>

            {/* Items Table */}
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Sl.</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Billing Description</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>HSN</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Qty</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Unit Price</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">GST %</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Total Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.items?.map((item, idx) => (
                    <TableRow key={item.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{item.description}</TableCell>
                      <TableCell>{item.hsn_code || '—'}</TableCell>
                      <TableCell align="right">{parseFloat(item.quantity)}</TableCell>
                      <TableCell align="right">{formatINR(item.unit_price)}</TableCell>
                      <TableCell align="right">{parseFloat(item.gst_rate)}%</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatINR(item.total_price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Financial breakdown layout */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 3 }}>
              {/* Left Side: Payment terms & Notes */}
              <Box sx={{ flex: 1, minWidth: 280 }}>
                {invoice.payment_terms && (
                  <Paper sx={{ p: 2, bgcolor: 'action.hover', borderLeft: '3px solid #7c4dff', mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 800 }}>Payment Terms</Typography>
                    <Typography variant="body2">{invoice.payment_terms}</Typography>
                  </Paper>
                )}
                {invoice.notes && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
                    Note: {invoice.notes}
                  </Typography>
                )}
              </Box>

              {/* Right Side: GST math breakdown */}
              <Box sx={{ minWidth: 320, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Billing Subtotal:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatINR(invoice.subtotal)}</Typography>
                </Box>
                {parseFloat(invoice.discount_amount) > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'error.main' }}>
                    <Typography variant="body2">Discount Offset:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>-{formatINR(invoice.discount_amount)}</Typography>
                  </Box>
                )}

                {/* CGST + SGST split info */}
                {parseFloat(invoice.cgst) > 0 && (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Central GST (CGST):</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatINR(invoice.cgst)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">State GST (SGST):</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatINR(invoice.sgst)}</Typography>
                    </Box>
                  </>
                )}
                {parseFloat(invoice.igst) > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Integrated GST (IGST):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatINR(invoice.igst)}</Typography>
                  </Box>
                )}

                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body1" sx={{ fontWeight: 900 }}>Grand Total (Inc GST):</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 900, color: 'primary.main' }}>{formatINR(invoice.total_amount)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', color: 'success.main' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>Collected Balance:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatINR(invoice.paid_amount)}</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 4, pb: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          {isUnpaid && (
            <Button variant="contained" color="success" startIcon={<PaymentIcon />} onClick={() => setPaymentModal(true)}>
              Record Payment Collection
            </Button>
          )}
          {canCancel && (
            <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => handleCancelInvoice(invoice.id)}>
              Cancel Invoice
            </Button>
          )}
          <Button onClick={() => setDetailModal(false)} variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Collect Payment Collection Dialog
  function renderCollectPaymentDialog() {
    return (
      <Dialog open={paymentModal} onClose={() => setPaymentModal(false)} maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Record Payment Collection</DialogTitle>
        <form onSubmit={handleCollectPaymentSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {invoice && (
              <Alert severity="info" icon={<InfoIcon />}>
                Remaining balance: <strong>{formatINR(parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount))}</strong>
              </Alert>
            )}
            <TextField type="number" fullWidth required label="Amount Collected (₹)" value={paymentForm.amount} onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))} slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }} />
            <TextField type="date" fullWidth required label="Receipt Date" value={paymentForm.paid_at} onChange={e => setPaymentForm(p => ({ ...p, paid_at: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setPaymentModal(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" color="success" disabled={recordPaymentMutation.isPending}>Record Collection</Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }
};
