import React, { useState } from 'react';
import {
  Box, Typography, Button, TextField, MenuItem, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Chip, Paper, Grid, Divider, Card,
  Tabs, Tab, Table, TableBody, TableCell, TableHead,
  TableRow, TableContainer, InputAdornment, Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  LocalShipping as ShippingIcon,
  People as VendorsIcon, CheckCircle as CheckIcon,
  ReceiptLong as ReceiptIcon, KeyboardReturn as ReturnIcon,
  Assignment as POIcon,
  Visibility as ViewIcon, DoneAll as CompleteIcon,
} from '@mui/icons-material';
import {
  useVendorsList, useCreateVendor, useUpdateVendor, useDeleteVendor,
  usePOsList, usePODetails, usePOFormOptions, useCreatePO, useUpdatePO, useUpdatePOStatus,
  useGRNsList, useGRNDetails, useCreateGRN, useCompleteGRN,
  usePurchaseInvoicesList, useCreatePurchaseInvoice, useUpdatePurchaseInvoice,
  usePurchaseReturnsList, usePurchaseReturnDetails, useCreatePurchaseReturn, useCompletePurchaseReturn,
} from '../hooks/usePurchases';
import type { Vendor, PurchaseOrder, PurchaseOrderItem, PurchaseInvoice } from '../hooks/usePurchases';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'info' | 'warning' | 'success' | 'error' | 'primary' }> = {
  draft:            { label: 'Draft',             color: 'default' },
  pending_approval: { label: 'Pending Approval',   color: 'warning' },
  approved:         { label: 'Approved',          color: 'info' },
  rejected:         { label: 'Rejected',          color: 'error' },
  ordered:          { label: 'Ordered',           color: 'primary' },
  received:         { label: 'Received',          color: 'success' },
  cancelled:        { label: 'Cancelled',         color: 'error' },
};

const GRN_STATUS_CONFIG = {
  draft:     { label: 'Draft',     color: 'warning' as const },
  completed: { label: 'Completed', color: 'success' as const },
  cancelled: { label: 'Cancelled', color: 'error' as const },
};

const INV_STATUS_CONFIG = {
  unpaid:         { label: 'Unpaid',         color: 'warning' as const },
  paid:           { label: 'Paid',           color: 'success' as const },
  partially_paid: { label: 'Partially Paid', color: 'info' as const },
  cancelled:      { label: 'Cancelled',      color: 'error' as const },
};

const RET_STATUS_CONFIG = {
  pending:   { label: 'Pending Deduction', color: 'warning' as const },
  completed: { label: 'Completed',         color: 'success' as const },
  cancelled: { label: 'Cancelled',         color: 'error' as const },
};

const formatINR = (val: string | number) =>
  `₹${parseFloat(String(val || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ═══════════════════════════════════════════════════════════════════════════════
// PURCHASE MODULE PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const PurchaseModulePage: React.FC = () => {
  const { showToast } = useToast();
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  // States
  const [page, setPage] = useState(1);

  // Lookup data
  const { data: optionsData } = usePOFormOptions();
  const options = optionsData?.data;

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 0: PURCHASE ORDERS
  // ───────────────────────────────────────────────────────────────────────────
  const { data: posData, isLoading: posLoading } = usePOsList(page, '', '', null);
  const [selectedPOId, setSelectedPOId] = useState<number | null>(null);
  const { data: poDetailsData } = usePODetails(selectedPOId);
  const [poDetailModal, setPoDetailModal] = useState(false);

  const [poModal, setPoModal] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [poForm, setPoForm] = useState({
    vendor_id: '', project_id: '', order_date: new Date().toISOString().split('T')[0],
    delivery_date: '', discount: 0, notes: '', terms_conditions: '',
    items: [] as Array<{ material_id: string; quantity: number; unit_price: number; tax_rate: number }>
  });

  const createPO = useCreatePO();
  const updatePO = useUpdatePO();
  const updatePOStatus = useUpdatePOStatus();

  const handlePOAdd = () => {
    setEditingPO(null);
    setPoForm({
      vendor_id: '', project_id: '', order_date: new Date().toISOString().split('T')[0],
      delivery_date: '', discount: 0, notes: '', terms_conditions: '',
      items: [{ material_id: '', quantity: 1, unit_price: 0, tax_rate: 18 }]
    });
    setPoModal(true);
  };

  const handlePOEdit = (po: PurchaseOrder) => {
    setEditingPO(po);
    setPoForm({
      vendor_id: String(po.vendor_id),
      project_id: po.project_id ? String(po.project_id) : '',
      order_date: po.order_date,
      delivery_date: po.delivery_date || '',
      discount: parseFloat(po.discount),
      notes: po.notes || '',
      terms_conditions: po.terms_conditions || '',
      items: (po.items || []).map((i: PurchaseOrderItem) => ({
        material_id: String(i.material_id),
        quantity: parseFloat(i.quantity),
        unit_price: parseFloat(i.unit_price),
        tax_rate: parseFloat(i.tax_rate),
      }))
    });
    setPoModal(true);
  };

  const handlePOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poForm.vendor_id || poForm.items.length === 0) {
      showToast('Vendor and at least one item are required.', 'warning');
      return;
    }
    try {
      if (editingPO) {
        await updatePO.mutateAsync({ id: editingPO.id, data: poForm });
        showToast('Purchase Order updated.', 'success');
      } else {
        await createPO.mutateAsync(poForm);
        showToast('Purchase Order created in Draft.', 'success');
      }
      setPoModal(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handlePOStatus = async (id: number, status: string) => {
    try {
      await updatePOStatus.mutateAsync({ id, status });
      showToast(`Purchase Order status updated to: ${status}`, 'success');
      if (selectedPOId === id) {
        setSelectedPOId(id); // Reload detail
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 1: GOODS RECEIPT NOTES (GRN)
  // ───────────────────────────────────────────────────────────────────────────
  const { data: grnsData, isLoading: grnsLoading } = useGRNsList(page);
  const [grnModal, setGrnModal] = useState(false);
  const [selectedGRNId, setSelectedGRNId] = useState<number | null>(null);
  const { data: grnDetailsData } = useGRNDetails(selectedGRNId);
  const [grnDetailModal, setGrnDetailModal] = useState(false);

  const [grnForm, setGrnForm] = useState({
    purchase_order_id: '', received_date: new Date().toISOString().split('T')[0], notes: '',
    items: [] as Array<{ purchase_order_item_id: number; material_id: number; material_name: string; quantity_ordered: number; quantity_received: number; quantity_accepted: number; quantity_rejected: number; rejection_reason: string }>
  });

  const createGRN = useCreateGRN();
  const completeGRN = useCompleteGRN();

  const handleGRNAdd = (po: PurchaseOrder) => {
    setGrnForm({
      purchase_order_id: String(po.id),
      received_date: new Date().toISOString().split('T')[0],
      notes: '',
      items: (po.items || []).map((i: PurchaseOrderItem) => ({
        purchase_order_item_id: i.id,
        material_id: i.material_id,
        material_name: i.material?.name || 'Unknown Material',
        quantity_ordered: parseFloat(i.quantity) - parseFloat(i.received_quantity),
        quantity_received: parseFloat(i.quantity) - parseFloat(i.received_quantity),
        quantity_accepted: parseFloat(i.quantity) - parseFloat(i.received_quantity),
        quantity_rejected: 0,
        rejection_reason: '',
      }))
    });
    setGrnModal(true);
  };

  const handleGRNSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createGRN.mutateAsync(grnForm);
      showToast('Goods Receipt Note created in Draft.', 'success');
      setGrnModal(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleGRNComplete = async (id: number) => {
    if (!window.confirm('Complete this GRN? This will permanently add quantities to material stock levels.')) return;
    try {
      await completeGRN.mutateAsync(id);
      showToast('GRN completed! Stock levels updated.', 'success');
      setGrnDetailModal(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 2: VENDORS
  // ───────────────────────────────────────────────────────────────────────────
  const { data: vendorsData, isLoading: vendorsLoading } = useVendorsList(page, '');
  const [vendorModal, setVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorForm, setVendorForm] = useState({
    name: '', company_name: '', email: '', phone: '', address: '', gst_number: '', payment_terms: ''
  });

  const createVendor = useCreateVendor();
  const updateVendor = useUpdateVendor();
  const deleteVendor = useDeleteVendor();

  const handleVendorAdd = () => {
    setEditingVendor(null);
    setVendorForm({ name: '', company_name: '', email: '', phone: '', address: '', gst_number: '', payment_terms: '' });
    setVendorModal(true);
  };

  const handleVendorEdit = (v: Vendor) => {
    setEditingVendor(v);
    setVendorForm({
      name: v.name, company_name: v.company_name, email: v.email || '',
      phone: v.phone || '', address: v.address || '', gst_number: v.gst_number || '', payment_terms: v.payment_terms || ''
    });
    setVendorModal(true);
  };

  const handleVendorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVendor) {
        await updateVendor.mutateAsync({ id: editingVendor.id, data: vendorForm });
        showToast('Vendor information updated.', 'success');
      } else {
        await createVendor.mutateAsync(vendorForm);
        showToast('Vendor registered.', 'success');
      }
      setVendorModal(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 3: PURCHASE INVOICES
  // ───────────────────────────────────────────────────────────────────────────
  const { data: invoicesData, isLoading: invoicesLoading } = usePurchaseInvoicesList(page);
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    invoice_number: '', invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0], purchase_order_id: '',
    vendor_id: '', subtotal: 0, tax_amount: 0, total_amount: 0, status: 'unpaid'
  });

  const createInvoice = useCreatePurchaseInvoice();
  const updateInvoice = useUpdatePurchaseInvoice();

  const handleInvoiceAdd = (po?: PurchaseOrder) => {
    setInvoiceForm({
      invoice_number: '',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date().toISOString().split('T')[0],
      purchase_order_id: po ? String(po.id) : '',
      vendor_id: po ? String(po.vendor_id) : '',
      subtotal: po ? parseFloat(po.subtotal) : 0,
      tax_amount: po ? parseFloat(po.tax_amount) : 0,
      total_amount: po ? parseFloat(po.total_amount) : 0,
      status: 'unpaid'
    });
    setInvoiceModal(true);
  };

  const handleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createInvoice.mutateAsync(invoiceForm);
      showToast('Vendor invoice recorded.', 'success');
      setInvoiceModal(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handlePayInvoice = async (invoice: PurchaseInvoice) => {
    if (!window.confirm('Mark this invoice as fully paid?')) return;
    try {
      await updateInvoice.mutateAsync({
        id: invoice.id,
        data: {
          status: 'paid',
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: 'Bank Transfer'
        }
      });
      showToast('Invoice marked as Paid.', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 4: PURCHASE RETURNS
  // ───────────────────────────────────────────────────────────────────────────
  const { data: returnsData, isLoading: returnsLoading } = usePurchaseReturnsList(page);
  const [returnModal, setReturnModal] = useState(false);
  const [selectedReturnId, setSelectedReturnId] = useState<number | null>(null);
  const { data: returnDetailsData } = usePurchaseReturnDetails(selectedReturnId);
  const [returnDetailModal, setReturnDetailModal] = useState(false);

  const [returnForm, setReturnForm] = useState({
    purchase_order_id: '', vendor_id: '', return_date: new Date().toISOString().split('T')[0], return_reason: '',
    items: [] as Array<{ material_id: string; quantity: number; unit_price: number }>
  });

  const createReturn = useCreatePurchaseReturn();
  const completeReturn = useCompletePurchaseReturn();

  const handleReturnAdd = (po: PurchaseOrder) => {
    setReturnForm({
      purchase_order_id: String(po.id),
      vendor_id: String(po.vendor_id),
      return_date: new Date().toISOString().split('T')[0],
      return_reason: '',
      items: (po.items || []).map((i: PurchaseOrderItem) => ({
        material_id: String(i.material_id),
        quantity: parseFloat(i.received_quantity),
        unit_price: parseFloat(i.unit_price)
      }))
    });
    setReturnModal(true);
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createReturn.mutateAsync(returnForm);
      showToast('Purchase Return transaction drafted.', 'success');
      setReturnModal(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleReturnComplete = async (id: number) => {
    if (!window.confirm('Process return completion? This will permanently deduct quantities from material stock levels.')) return;
    try {
      await completeReturn.mutateAsync(id);
      showToast('Return completed! Inventory adjusted.', 'success');
      setReturnDetailModal(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER SWITCH
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <Box sx={{ pb: 6 }}>
      {/* Title */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Purchase & Procurement</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage vendor registries, submit purchase orders, execute store receiving notes, record vendor invoices, and track returns.
          </Typography>
        </Box>
        {activeTab === 0 && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handlePOAdd}
            sx={{ py: 1.2, px: 2.5, borderRadius: 3.5, background: 'linear-gradient(135deg, #7c4dff 0%, #b47cff 100%)' }}>
            New Purchase Order
          </Button>
        )}
        {activeTab === 2 && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleVendorAdd}
            sx={{ py: 1.2, px: 2.5, borderRadius: 3.5, background: 'linear-gradient(135deg, #7c4dff 0%, #b47cff 100%)' }}>
            Register Vendor
          </Button>
        )}
        {activeTab === 3 && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleInvoiceAdd()}
            sx={{ py: 1.2, px: 2.5, borderRadius: 3.5, background: 'linear-gradient(135deg, #7c4dff 0%, #b47cff 100%)' }}>
            Record Invoice
          </Button>
        )}
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={(_, v) => { setActiveTab(v); setPage(1); }} variant="scrollable"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2, '& .MuiTab-root': { fontWeight: 700 } }}>
          <Tab icon={<POIcon fontSize="small" />} iconPosition="start" label="Purchase Orders" />
          <Tab icon={<ShippingIcon fontSize="small" />} iconPosition="start" label="Goods Receipts (GRN)" />
          <Tab icon={<VendorsIcon fontSize="small" />} iconPosition="start" label="Vendors" />
          <Tab icon={<ReceiptIcon fontSize="small" />} iconPosition="start" label="Vendor Invoices" />
          <Tab icon={<ReturnIcon fontSize="small" />} iconPosition="start" label="Purchase Returns" />
        </Tabs>
      </Paper>

      {/* Dynamic Content */}
      <Box>
        {activeTab === 0 && renderPOList()}
        {activeTab === 1 && renderGRNList()}
        {activeTab === 2 && renderVendorList()}
        {activeTab === 3 && renderInvoiceList()}
        {activeTab === 4 && renderReturnList()}
      </Box>

      {/* Modals and Overlays */}
      {renderPOFormDialog()}
      {renderPODetailDialog()}
      {renderGRNFormDialog()}
      {renderGRNDetailDialog()}
      {renderVendorFormDialog()}
      {renderInvoiceFormDialog()}
      {renderReturnFormDialog()}
      {renderReturnDetailDialog()}
    </Box>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // LIST RENDERERS
  // ═══════════════════════════════════════════════════════════════════════════

  function renderPOList() {
    const pos = posData?.data?.items || [];
    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table size="medium">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>PO Number</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Vendor</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Project</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Order Date</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {posLoading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : pos.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>No Purchase Orders recorded</TableCell></TableRow>
              ) : pos.map(po => {
                const cfg = STATUS_CONFIG[po.status] || STATUS_CONFIG.draft;
                return (
                  <TableRow key={po.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: 'primary.main', cursor: 'pointer' }} onClick={() => { setSelectedPOId(po.id); setPoDetailModal(true); }}>
                      {po.po_number}
                    </TableCell>
                    <TableCell>{po.vendor?.name}</TableCell>
                    <TableCell>{po.project?.name || '—'}</TableCell>
                    <TableCell>{formatDate(po.order_date)}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{formatINR(po.total_amount)}</TableCell>
                    <TableCell><Chip label={cfg.label} color={cfg.color} size="small" sx={{ fontWeight: 800, fontSize: '0.65rem' }} /></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => { setSelectedPOId(po.id); setPoDetailModal(true); }} color="primary"><ViewIcon fontSize="small" /></IconButton>
                      {po.status === 'draft' && (
                        <IconButton size="small" onClick={() => handlePOEdit(po)} color="info"><EditIcon fontSize="small" /></IconButton>
                      )}
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

  function renderGRNList() {
    const grns = grnsData?.data?.items || [];
    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table size="medium">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>GRN Number</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>PO Reference</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Supplier</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Received Date</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Receiver</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {grnsLoading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : grns.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>No Goods Receipts documented</TableCell></TableRow>
              ) : grns.map(grn => {
                const cfg = GRN_STATUS_CONFIG[grn.status] || GRN_STATUS_CONFIG.draft;
                return (
                  <TableRow key={grn.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: 'primary.main', cursor: 'pointer' }} onClick={() => { setSelectedGRNId(grn.id); setGrnDetailModal(true); }}>
                      {grn.grn_number}
                    </TableCell>
                    <TableCell>{grn.purchase_order?.po_number}</TableCell>
                    <TableCell>{grn.purchase_order?.vendor?.name}</TableCell>
                    <TableCell>{formatDate(grn.received_date)}</TableCell>
                    <TableCell>{grn.receiver?.name}</TableCell>
                    <TableCell><Chip label={cfg.label} color={cfg.color} size="small" sx={{ fontWeight: 800, fontSize: '0.65rem' }} /></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => { setSelectedGRNId(grn.id); setGrnDetailModal(true); }} color="primary"><ViewIcon fontSize="small" /></IconButton>
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

  function renderVendorList() {
    const vendors = vendorsData?.data?.items || [];
    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table size="medium">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Supplier Name</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Company Name</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Contact Details</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>GSTIN</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Payment Terms</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {vendorsLoading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : vendors.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No Suppliers registered</TableCell></TableRow>
              ) : vendors.map(v => (
                <TableRow key={v.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{v.name}</TableCell>
                  <TableCell>{v.company_name}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{v.email || '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">{v.phone || '—'}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{v.gst_number || '—'}</TableCell>
                  <TableCell>{v.payment_terms || '—'}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleVendorEdit(v)} color="info"><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => { if (window.confirm(`Archive ${v.name}?`)) deleteVendor.mutateAsync(v.id); }} color="error"><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    );
  }

  function renderInvoiceList() {
    const invoices = invoicesData?.data?.items || [];
    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table size="medium">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Bill Number</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>PO Reference</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Supplier</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Invoice Date</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Due Date</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Total Amount</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoicesLoading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : invoices.length === 0 ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>No Purchase Invoices logged</TableCell></TableRow>
              ) : invoices.map(inv => {
                const cfg = INV_STATUS_CONFIG[inv.status] || INV_STATUS_CONFIG.unpaid;
                return (
                  <TableRow key={inv.id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{inv.invoice_number}</TableCell>
                    <TableCell>{inv.purchase_order?.po_number || 'Direct'}</TableCell>
                    <TableCell>{inv.vendor?.name}</TableCell>
                    <TableCell>{formatDate(inv.invoice_date)}</TableCell>
                    <TableCell sx={{ color: new Date(inv.due_date) < new Date() && inv.status === 'unpaid' ? 'error.main' : 'inherit' }}>
                      {formatDate(inv.due_date)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{formatINR(inv.total_amount)}</TableCell>
                    <TableCell><Chip label={cfg.label} color={cfg.color} size="small" sx={{ fontWeight: 800, fontSize: '0.65rem' }} /></TableCell>
                    <TableCell align="right">
                      {inv.status === 'unpaid' && (
                        <Button size="small" variant="outlined" color="success" onClick={() => handlePayInvoice(inv)} startIcon={<CheckIcon />}>Pay</Button>
                      )}
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

  function renderReturnList() {
    const returns = returnsData?.data?.items || [];
    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table size="medium">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Return Code</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>PO Reference</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Supplier</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Return Date</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Refund Expected</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {returnsLoading ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : returns.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>No Purchase Returns documented</TableCell></TableRow>
              ) : returns.map(ret => {
                const cfg = RET_STATUS_CONFIG[ret.status] || RET_STATUS_CONFIG.pending;
                return (
                  <TableRow key={ret.id} hover>
                    <TableCell sx={{ fontWeight: 700, color: 'primary.main', cursor: 'pointer' }} onClick={() => { setSelectedReturnId(ret.id); setReturnDetailModal(true); }}>
                      {ret.return_number}
                    </TableCell>
                    <TableCell>{ret.purchase_order?.po_number || 'Direct'}</TableCell>
                    <TableCell>{ret.vendor?.name}</TableCell>
                    <TableCell>{formatDate(ret.return_date)}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>{formatINR(ret.total_refund_amount)}</TableCell>
                    <TableCell><Chip label={cfg.label} color={cfg.color} size="small" sx={{ fontWeight: 800, fontSize: '0.65rem' }} /></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => { setSelectedReturnId(ret.id); setReturnDetailModal(true); }} color="primary"><ViewIcon fontSize="small" /></IconButton>
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
  // MODALS & DIALOGS
  // ═══════════════════════════════════════════════════════════════════════════

  function renderPOFormDialog() {
    return (
      <Dialog open={poModal} onClose={() => setPoModal(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>{editingPO ? `Edit Purchase Order — ${editingPO.po_number}` : 'Create Purchase Order'}</DialogTitle>
        <form onSubmit={handlePOSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={6}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Autocomplete
                    options={options?.vendors || []}
                    getOptionLabel={(v) => `${v.name} (${v.company_name})`}
                    value={options?.vendors.find(v => String(v.id) === poForm.vendor_id) || null}
                    onChange={(e, val) => setPoForm(p => ({ ...p, vendor_id: val ? String(val.id) : '' }))}
                    fullWidth
                    renderInput={(params) => <TextField {...params} label="Supplier" required />}
                  />
                  <IconButton color="primary" onClick={handleVendorAdd} title="Quick Add Vendor" sx={{ border: '1px dashed', borderRadius: 2 }}>
                    <AddIcon />
                  </IconButton>
                </Box>
              </Grid>
              <Grid size={6}>
                <TextField select fullWidth label="Linked Project" value={poForm.project_id} onChange={e => setPoForm(p => ({ ...p, project_id: e.target.value }))}>
                  <MenuItem value="">Direct Stock (No Project Link)</MenuItem>
                  {options?.projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={6}>
                <TextField type="date" fullWidth required label="Order Date" value={poForm.order_date} onChange={e => setPoForm(p => ({ ...p, order_date: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={6}>
                <TextField type="date" fullWidth label="Expected Delivery Date" value={poForm.delivery_date} onChange={e => setPoForm(p => ({ ...p, delivery_date: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
            </Grid>

            <Divider><Typography variant="subtitle2" sx={{ px: 1, fontWeight: 800 }}>Items</Typography></Divider>

            {poForm.items.map((item, index) => (
              <Grid container spacing={1.5} key={index} sx={{ alignItems: 'center' }}>
                <Grid size={4}>
                  <TextField select fullWidth required size="small" label="Material" value={item.material_id}
                    onChange={e => {
                      const mId = e.target.value;
                      const mat = options?.materials.find(m => m.id === Number(mId));
                      const items = [...poForm.items];
                      items[index].material_id = mId;
                      items[index].unit_price = mat ? parseFloat(mat.purchase_price) : 0;
                      items[index].tax_rate = mat ? parseFloat(mat.gst_rate) : 18;
                      setPoForm(p => ({ ...p, items }));
                    }}>
                    {options?.materials.map(m => <MenuItem key={m.id} value={m.id}>{m.name} ({m.sku})</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid size={2.5}>
                  <TextField type="number" fullWidth required size="small" label="Qty" value={item.quantity}
                    onChange={e => {
                      const items = [...poForm.items];
                      items[index].quantity = Number(e.target.value);
                      setPoForm(p => ({ ...p, items }));
                    }} slotProps={{ input: { inputProps: { min: 0.01, step: 0.01 } } }} />
                </Grid>
                <Grid size={2.5}>
                  <TextField type="number" fullWidth required size="small" label="Rate (₹)" value={item.unit_price}
                    onChange={e => {
                      const items = [...poForm.items];
                      items[index].unit_price = Number(e.target.value);
                      setPoForm(p => ({ ...p, items }));
                    }} slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment>, inputProps: { min: 0, step: 0.01 } } }} />
                </Grid>
                <Grid size={2.2}>
                  <TextField select fullWidth size="small" label="GST Rate" value={item.tax_rate}
                    onChange={e => {
                      const items = [...poForm.items];
                      items[index].tax_rate = Number(e.target.value);
                      setPoForm(p => ({ ...p, items }));
                    }}>
                    <MenuItem value={0}>0%</MenuItem>
                    <MenuItem value={5}>5%</MenuItem>
                    <MenuItem value={12}>12%</MenuItem>
                    <MenuItem value={18}>18%</MenuItem>
                    <MenuItem value={28}>28%</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={0.8}>
                  <IconButton size="small" color="error" disabled={poForm.items.length === 1}
                    onClick={() => {
                      const items = poForm.items.filter((_, idx) => idx !== index);
                      setPoForm(p => ({ ...p, items }));
                    }}><DeleteIcon /></IconButton>
                </Grid>
              </Grid>
            ))}

            <Button startIcon={<AddIcon />} variant="outlined" size="small" sx={{ alignSelf: 'flex-start' }}
              onClick={() => setPoForm(p => ({ ...p, items: [...p.items, { material_id: '', quantity: 1, unit_price: 0, tax_rate: 18 }] }))}>
              Add Item
            </Button>

            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField type="number" fullWidth label="Discount (₹)" value={poForm.discount} onChange={e => setPoForm(p => ({ ...p, discount: Number(e.target.value) }))} slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth multiline rows={2} label="Notes" value={poForm.notes} onChange={e => setPoForm(p => ({ ...p, notes: e.target.value }))} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setPoModal(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={createPO.isPending || updatePO.isPending}>Submit</Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }

  function renderPODetailDialog() {
    const po = poDetailsData?.data;
    if (!po) return null;
    const cfg = STATUS_CONFIG[po.status] || STATUS_CONFIG.draft;
    const canApprove = hasPermission('purchase_orders:approve') && po.status === 'pending_approval';

    return (
      <Dialog open={poDetailModal} onClose={() => setPoDetailModal(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{po.po_number}</Typography>
            <Typography variant="caption" color="text.secondary">Vendor: {po.vendor?.name}</Typography>
          </Box>
          <Chip label={cfg.label} color={cfg.color} sx={{ fontWeight: 800 }} />
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={6}>
              <Typography variant="caption" color="text.secondary">Order Details</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>Order Date: {formatDate(po.order_date)}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>Expected Delivery: {formatDate(po.delivery_date)}</Typography>
              <Typography variant="body2">Payment Terms: {po.vendor?.payment_terms || '—'}</Typography>
            </Grid>
            <Grid size={6}>
              <Typography variant="caption" color="text.secondary">Project Assignment</Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{po.project?.name || 'Store Inventory stock'}</Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Purchase Items</Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Material</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Qty Ordered</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Qty Received</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Rate</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">GST %</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {po.items?.map(i => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{i.material?.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{i.material?.sku}</Typography>
                    </TableCell>
                    <TableCell align="right">{parseFloat(i.quantity)} {i.material?.unit}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: parseFloat(i.received_quantity) > 0 ? 'success.main' : 'inherit' }}>
                      {parseFloat(i.received_quantity)} {i.material?.unit}
                    </TableCell>
                    <TableCell align="right">{formatINR(i.unit_price)}</TableCell>
                    <TableCell align="right">{parseFloat(i.tax_rate)}%</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{formatINR(i.total_amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, mt: 2 }}>
            <Typography variant="body2">Subtotal: <strong>{formatINR(po.subtotal)}</strong></Typography>
            <Typography variant="body2">Tax Amount: <strong>+{formatINR(po.tax_amount)}</strong></Typography>
            {parseFloat(po.discount) > 0 && <Typography variant="body2">Discount: <strong>-{formatINR(po.discount)}</strong></Typography>}
            <Typography variant="h6" color="primary">Total Amount: <strong>{formatINR(po.total_amount)}</strong></Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyItems: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {po.status === 'draft' && (
              <Button variant="contained" color="warning" onClick={() => handlePOStatus(po.id, 'pending_approval')}>Submit for Approval</Button>
            )}
            {canApprove && (
              <>
                <Button variant="contained" color="success" onClick={() => handlePOStatus(po.id, 'approved')}>Approve PO</Button>
                <Button variant="contained" color="error" onClick={() => handlePOStatus(po.id, 'rejected')}>Reject PO</Button>
              </>
            )}
            {po.status === 'approved' && (
              <Button variant="contained" color="primary" onClick={() => handlePOStatus(po.id, 'ordered')}>Order (PO Sent)</Button>
            )}
            {(po.status === 'ordered' || po.status === 'approved') && (
              <Button variant="outlined" color="success" startIcon={<ShippingIcon />} onClick={() => { setPoDetailModal(false); handleGRNAdd(po); }}>Receive Goods (GRN)</Button>
            )}
            {po.status === 'received' && (
              <Button variant="outlined" color="info" startIcon={<ReceiptIcon />} onClick={() => { setPoDetailModal(false); handleInvoiceAdd(po); }}>Record Vendor Bill</Button>
            )}
            {po.items?.some(i => parseFloat(i.received_quantity) > 0) && (
              <Button variant="outlined" color="error" startIcon={<ReturnIcon />} onClick={() => { setPoDetailModal(false); handleReturnAdd(po); }}>Return Goods</Button>
            )}
          </Box>
          <Button onClick={() => setPoDetailModal(false)} variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  function renderGRNFormDialog() {
    return (
      <Dialog open={grnModal} onClose={() => setGrnModal(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Create Goods Receipt Note (GRN)</DialogTitle>
        <form onSubmit={handleGRNSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField type="date" fullWidth required label="Receipt Date" value={grnForm.received_date} onChange={e => setGrnForm(p => ({ ...p, received_date: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth multiline rows={2} label="Receipt Notes" value={grnForm.notes} onChange={e => setGrnForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any notes about delivery, packing, damage..." />
              </Grid>
            </Grid>

            <Divider><Typography variant="subtitle2" sx={{ px: 1, fontWeight: 800 }}>Quantities Check</Typography></Divider>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Material</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Pending</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Received</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Accepted</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Rejected</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Rejection Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {grnForm.items.map((item, idx) => (
                    <TableRow key={item.purchase_order_item_id}>
                      <TableCell>{item.material_name}</TableCell>
                      <TableCell align="right">{item.quantity_ordered}</TableCell>
                      <TableCell align="right">
                        <input type="number" value={item.quantity_received} step="0.01" style={{ width: 60, textAlign: 'right' }}
                          onChange={e => {
                            const items = [...grnForm.items];
                            items[idx].quantity_received = Number(e.target.value);
                            items[idx].quantity_accepted = Number(e.target.value) - items[idx].quantity_rejected;
                            setGrnForm(p => ({ ...p, items }));
                          }} />
                      </TableCell>
                      <TableCell align="right">
                        <input type="number" value={item.quantity_accepted} step="0.01" style={{ width: 60, textAlign: 'right' }}
                          onChange={e => {
                            const items = [...grnForm.items];
                            items[idx].quantity_accepted = Number(e.target.value);
                            items[idx].quantity_rejected = items[idx].quantity_received - Number(e.target.value);
                            setGrnForm(p => ({ ...p, items }));
                          }} />
                      </TableCell>
                      <TableCell align="right">
                        <input type="number" value={item.quantity_rejected} step="0.01" style={{ width: 60, textAlign: 'right' }}
                          onChange={e => {
                            const items = [...grnForm.items];
                            items[idx].quantity_rejected = Number(e.target.value);
                            items[idx].quantity_accepted = items[idx].quantity_received - Number(e.target.value);
                            setGrnForm(p => ({ ...p, items }));
                          }} />
                      </TableCell>
                      <TableCell>
                        <input type="text" value={item.rejection_reason} placeholder="Damage description..." style={{ width: '100%' }}
                          onChange={e => {
                            const items = [...grnForm.items];
                            items[idx].rejection_reason = e.target.value;
                            setGrnForm(p => ({ ...p, items }));
                          }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setGrnModal(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={createGRN.isPending}>Save GRN</Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }

  function renderGRNDetailDialog() {
    const grn = grnDetailsData?.data;
    if (!grn) return null;
    const cfg = GRN_STATUS_CONFIG[grn.status] || GRN_STATUS_CONFIG.draft;
    const canComplete = hasPermission('purchase_orders:receive') && grn.status === 'draft';

    return (
      <Dialog open={grnDetailModal} onClose={() => setGrnDetailModal(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{grn.grn_number}</Typography>
            <Typography variant="caption" color="text.secondary">PO Link: {grn.purchase_order?.po_number}</Typography>
          </Box>
          <Chip label={cfg.label} color={cfg.color} sx={{ fontWeight: 800 }} />
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3} sx={{ mb: 2 }}>
            <Grid size={6}>
              <Typography variant="body2">Received Date: <strong>{formatDate(grn.received_date)}</strong></Typography>
              <Typography variant="body2">Received By: <strong>{grn.receiver?.name}</strong></Typography>
            </Grid>
            {grn.notes && (
              <Grid size={12}>
                <Typography variant="caption" color="text.secondary">Receipt Notes</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{grn.notes}</Typography>
              </Grid>
            )}
          </Grid>

          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Items Check List</Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Material</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Qty Ordered</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Qty Received</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Accepted</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Rejected</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Rejection Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {grn.items?.map(i => (
                  <TableRow key={i.id}>
                    <TableCell>{i.material?.name}</TableCell>
                    <TableCell align="right">{parseFloat(i.quantity_ordered)}</TableCell>
                    <TableCell align="right">{parseFloat(i.quantity_received)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: 'success.main' }}>{parseFloat(i.quantity_accepted)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: parseFloat(i.quantity_rejected) > 0 ? 'error.main' : 'inherit' }}>
                      {parseFloat(i.quantity_rejected)}
                    </TableCell>
                    <TableCell>{i.rejection_reason || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {canComplete && (
            <Button variant="contained" color="success" startIcon={<CompleteIcon />} onClick={() => handleGRNComplete(grn.id)} disabled={completeGRN.isPending}>Complete GRN (Add Stock)</Button>
          )}
          <Button onClick={() => setGrnDetailModal(false)} variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  function renderVendorFormDialog() {
    return (
      <Dialog open={vendorModal} onClose={() => setVendorModal(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>{editingVendor ? 'Edit Supplier' : 'Register New Supplier'}</DialogTitle>
        <form onSubmit={handleVendorSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField fullWidth required label="Supplier Name (e.g. Woodland Suppliers)" value={vendorForm.name} onChange={e => setVendorForm(p => ({ ...p, name: e.target.value }))} />
            <TextField fullWidth required label="Company Trade Name" value={vendorForm.company_name} onChange={e => setVendorForm(p => ({ ...p, company_name: e.target.value }))} />
            <TextField fullWidth type="email" label="Email Address" value={vendorForm.email} onChange={e => setVendorForm(p => ({ ...p, email: e.target.value }))} />
            <TextField fullWidth label="Phone Contact" value={vendorForm.phone} onChange={e => setVendorForm(p => ({ ...p, phone: e.target.value }))} />
            <TextField fullWidth multiline rows={2} label="Address" value={vendorForm.address} onChange={e => setVendorForm(p => ({ ...p, address: e.target.value }))} />
            <TextField fullWidth label="GSTIN Identification" value={vendorForm.gst_number} onChange={e => setVendorForm(p => ({ ...p, gst_number: e.target.value.toUpperCase() }))} slotProps={{ input: { sx: { fontFamily: 'monospace' } } }} />
            <TextField fullWidth label="Payment Terms" value={vendorForm.payment_terms} onChange={e => setVendorForm(p => ({ ...p, payment_terms: e.target.value }))} placeholder="e.g. Net 30, COD, Advance 50%" />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setVendorModal(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={createVendor.isPending || updateVendor.isPending}>Save Supplier</Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }

  function renderInvoiceFormDialog() {
    return (
      <Dialog open={invoiceModal} onClose={() => setInvoiceModal(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Record Vendor Bill / Purchase Invoice</DialogTitle>
        <form onSubmit={handleInvoiceSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField fullWidth required label="Bill Number / Invoice No." value={invoiceForm.invoice_number} onChange={e => setInvoiceForm(p => ({ ...p, invoice_number: e.target.value }))} />
              </Grid>
              <Grid size={6}>
                <TextField select fullWidth required label="Supplier" value={invoiceForm.vendor_id} onChange={e => setInvoiceForm(p => ({ ...p, vendor_id: e.target.value }))}>
                  {options?.vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={6}>
                <TextField select fullWidth label="PO Reference (optional)" value={invoiceForm.purchase_order_id} onChange={e => setInvoiceForm(p => ({ ...p, purchase_order_id: e.target.value }))}>
                  <MenuItem value="">None / Direct Bill</MenuItem>
                  {options?.vendors.find(v => String(v.id) === invoiceForm.vendor_id) ? (
                    // Optionally restrict by vendor later
                    options?.projects.map(p => <MenuItem key={p.id} value={p.id}>Project {p.name}</MenuItem>)
                  ) : null}
                </TextField>
              </Grid>
              <Grid size={6}>
                <TextField type="date" fullWidth required label="Bill Date" value={invoiceForm.invoice_date} onChange={e => setInvoiceForm(p => ({ ...p, invoice_date: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={6}>
                <TextField type="date" fullWidth required label="Due Date" value={invoiceForm.due_date} onChange={e => setInvoiceForm(p => ({ ...p, due_date: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={4}>
                <TextField type="number" fullWidth required label="Subtotal (₹)" value={invoiceForm.subtotal} onChange={e => setInvoiceForm(p => ({ ...p, subtotal: Number(e.target.value), total_amount: Number(e.target.value) + invoiceForm.tax_amount }))} />
              </Grid>
              <Grid size={4}>
                <TextField type="number" fullWidth required label="Tax (₹)" value={invoiceForm.tax_amount} onChange={e => setInvoiceForm(p => ({ ...p, tax_amount: Number(e.target.value), total_amount: invoiceForm.subtotal + Number(e.target.value) }))} />
              </Grid>
              <Grid size={4}>
                <TextField type="number" fullWidth required label="Total Bill (₹)" value={invoiceForm.total_amount} onChange={e => setInvoiceForm(p => ({ ...p, total_amount: Number(e.target.value) }))} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setInvoiceModal(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={createInvoice.isPending}>Save Bill</Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }

  function renderReturnFormDialog() {
    return (
      <Dialog open={returnModal} onClose={() => setReturnModal(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Draft Purchase Return</DialogTitle>
        <form onSubmit={handleReturnSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField type="date" fullWidth required label="Return Date" value={returnForm.return_date} onChange={e => setReturnForm(p => ({ ...p, return_date: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth multiline rows={2} required label="Reason for Return" value={returnForm.return_reason} onChange={e => setReturnForm(p => ({ ...p, return_reason: e.target.value }))} placeholder="Explain why materials are being returned to supplier..." />
              </Grid>
            </Grid>

            <Divider><Typography variant="subtitle2" sx={{ px: 1, fontWeight: 800 }}>Return Materials</Typography></Divider>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Material</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Received Stock</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Qty returning</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Unit Price</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Total Refund</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {returnForm.items.map((item, idx) => {
                    const mat = options?.materials.find(m => String(m.id) === item.material_id);
                    return (
                      <TableRow key={item.material_id}>
                        <TableCell>{mat?.name}</TableCell>
                        <TableCell align="right">{parseFloat(item.quantity.toString())}</TableCell>
                        <TableCell align="right">
                          <input type="number" value={item.quantity} step="0.01" style={{ width: 65, textAlign: 'right' }}
                            onChange={e => {
                              const items = [...returnForm.items];
                              items[idx].quantity = Number(e.target.value);
                              setReturnForm(p => ({ ...p, items }));
                            }} />
                        </TableCell>
                        <TableCell align="right">{formatINR(item.unit_price)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {formatINR(item.quantity * item.unit_price)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setReturnModal(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={createReturn.isPending}>Draft Return</Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }

  function renderReturnDetailDialog() {
    const ret = returnDetailsData?.data;
    if (!ret) return null;
    const cfg = RET_STATUS_CONFIG[ret.status] || RET_STATUS_CONFIG.pending;
    const canComplete = ret.status === 'pending';

    return (
      <Dialog open={returnDetailModal} onClose={() => setReturnDetailModal(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>{ret.return_number}</Typography>
            <Typography variant="caption" color="text.secondary">Supplier: {ret.vendor?.name}</Typography>
          </Box>
          <Chip label={cfg.label} color={cfg.color} sx={{ fontWeight: 800 }} />
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3} sx={{ mb: 2 }}>
            <Grid size={6}>
              <Typography variant="body2">Return Date: <strong>{formatDate(ret.return_date)}</strong></Typography>
              <Typography variant="body2">Total Refund: <strong>{formatINR(ret.total_refund_amount)}</strong></Typography>
            </Grid>
            {ret.return_reason && (
              <Grid size={12}>
                <Typography variant="caption" color="text.secondary">Return Reason</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{ret.return_reason}</Typography>
              </Grid>
            )}
          </Grid>

          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Returned Items</Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Material</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Qty Returned</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Unit Price</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Refund Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ret.items?.map(i => (
                  <TableRow key={i.id}>
                    <TableCell>{i.material?.name}</TableCell>
                    <TableCell align="right">{parseFloat(i.quantity)}</TableCell>
                    <TableCell align="right">{formatINR(i.unit_price)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{formatINR(i.refund_amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {canComplete && (
            <Button variant="contained" color="success" startIcon={<CompleteIcon />} onClick={() => handleReturnComplete(ret.id)} disabled={completeReturn.isPending}>Complete Return (Deduct Stock)</Button>
          )}
          <Button onClick={() => setReturnDetailModal(false)} variant="outlined">Close</Button>
        </DialogActions>
      </Dialog>
    );
  }
};

export default PurchaseModulePage;
