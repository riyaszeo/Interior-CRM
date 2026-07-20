import React, { useState } from 'react';
import {
  Box, Typography, Button, TextField, MenuItem, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Chip, Tooltip, Paper, Grid, Divider,
  Tabs, Tab, Table, TableBody, TableCell, TableHead,
  TableRow, TableContainer, Switch, FormControlLabel,
  InputAdornment, Card, CardContent,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, Clear as ClearIcon,
  QrCode as QrIcon, Inventory as InventoryIcon,
  Warning as WarningIcon, Category as CategoryIcon,
  Store as WarehouseIcon, History as LedgerIcon,
  SwapHoriz as AdjustIcon, BookmarkBorder as ReserveIcon,
} from '@mui/icons-material';

// Hook imports
import {
  useMaterialsList, useMaterialFormOptions,
  useCreateMaterial, useUpdateMaterial, useDeleteMaterial,
  useCategoriesList, useCreateCategory, useUpdateCategory, useDeleteCategory,
  useBrandsList, useCreateBrand, useUpdateBrand, useDeleteBrand,
} from '../hooks/useMaterials';
import type { Material, MaterialFormData, MaterialCategory, MaterialBrand } from '../hooks/useMaterials';

import {
  useWarehousesList, useCreateWarehouse, useUpdateWarehouse, useDeleteWarehouse,
  useStocksList, useLedgerList, useAdjustStock, useReserveStock, useInventoryFormOptions,
  useTransferStock,
} from '../hooks/useInventory';
import { useBranchesList, useBranchWarehouses } from '../hooks/useBranches';
import type { Warehouse } from '../hooks/useInventory';

import { useToast } from '../context/ToastContext';
import { DataTable } from '../components/DataTable';
import type { ColumnDefinition } from '../components/DataTable';

// ── Constants ──────────────────────────────────────────────────────────────────

const GST_RATES = [0, 5, 12, 18, 28];

const formatINR = (val: string | number) =>
  `₹${parseFloat(String(val || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const emptyForm: MaterialFormData = {
  name: '', description: '', sku: '', hsn_code: '', gst_rate: 18,
  category_id: null, brand_id: null, unit_id: null, unit: '',
  cost_price: 0, purchase_price: 0, selling_price: 0,
  stock_quantity: 0, reorder_level: 0, barcode: '', is_active: true,
};

// ── Barcode & QR Preview Component ────────────────────────────────────────────

const BarcodeQrCell: React.FC<{ material: Material }> = ({ material }) => {
  const API_BASE = 'http://localhost:8000/api';
  const token = localStorage.getItem('auth_token') || '';

  return (
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
      <Tooltip title={
        <Box sx={{ p: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: 'block', color: '#FFFFFF' }}>Barcode</Typography>
          <img
            src={`${API_BASE}/materials/${material.id}/barcode?token=${token}`}
            alt="barcode"
            style={{ maxWidth: 140, display: 'block', background: '#fff', borderRadius: 4, padding: 4 }}
            onError={e => (e.currentTarget.style.display = 'none')}
          />
          <Typography variant="caption" sx={{ fontFamily: 'monospace', mt: 0.5, display: 'block', color: '#E5E7EB' }}>
            {material.barcode || material.sku}
          </Typography>
        </Box>
      } arrow>
        <IconButton size="small" color="default">
          <InventoryIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title={
        <Box sx={{ p: 0.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, mb: 0.5, display: 'block', color: '#FFFFFF' }}>QR Code</Typography>
          <img
            src={`${API_BASE}/materials/${material.id}/qrcode?token=${token}`}
            alt="qr"
            style={{ width: 100, height: 100, display: 'block', background: '#fff', borderRadius: 4, padding: 4 }}
            onError={e => (e.currentTarget.style.display = 'none')}
          />
        </Box>
      } arrow>
        <IconButton size="small" color="primary">
          <QrIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

// ── Lookup Manager Table ───────────────────────────────────────────────────────

interface LookupTableProps<T extends { id: number; name: string; materials_count?: number; description?: string | null }> {
  label: string;
  rows: T[];
  onAdd: (data: any) => Promise<any>;
  onEdit: (id: number, data: any) => Promise<any>;
  onDelete: (id: number) => Promise<any>;
  extraFormFields?: (form: any, setForm: React.Dispatch<React.SetStateAction<any>>) => React.ReactNode;
  isPending?: boolean;
}

function LookupTable<T extends { id: number; name: string; materials_count?: number; description?: string | null }>({
  label, rows, onAdd, onEdit, onDelete, extraFormFields, isPending
}: LookupTableProps<T>) {
  const { showToast } = useToast();
  const [form, setForm] = useState<any>({ name: '', description: '' });
  const [editing, setEditing] = useState<T | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openAdd = () => { setEditing(null); setForm({ name: '', description: '' }); setDialogOpen(true); };
  const openEdit = (row: T) => { setEditing(row); setForm({ name: row.name, description: row.description || '', ...(row as any) }); setDialogOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) { showToast('Name is required.', 'warning'); return; }
    try {
      if (editing) {
        await onEdit(editing.id, form);
        showToast(`${label} updated.`, 'success');
      } else {
        await onAdd(form);
        showToast(`${label} created.`, 'success');
      }
      setDialogOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Save failed.', 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{label}s</Typography>
        <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={openAdd}>Add {label}</Button>
      </Box>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 800 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 800 }} align="center">Materials</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>No {label.toLowerCase()}s added yet</TableCell></TableRow>
            ) : rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {(row as any).color && (
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: (row as any).color, flexShrink: 0 }} />
                    )}
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.name}</Typography>
                    {(row as any).abbreviation && (
                      <Chip label={(row as any).abbreviation} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                    {row.description || '—'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip label={row.materials_count ?? 0} size="small" color={(row.materials_count ?? 0) > 0 ? 'primary' : 'default'} />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="info" onClick={() => openEdit(row)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" color="error" onClick={async () => {
                    if ((row.materials_count ?? 0) > 0 && !window.confirm(`This ${label.toLowerCase()} has ${row.materials_count} materials. Delete anyway?`)) return;
                    if (!window.confirm(`Delete ${row.name}?`)) return;
                    try { await onDelete(row.id); showToast(`${label} deleted.`, 'success'); }
                    catch (err: any) { showToast(err.message, 'error'); }
                  }}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>{editing ? `Edit ${label}` : `Add ${label}`}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField fullWidth required label="Name" value={form.name} onChange={e => setForm((p: any) => ({ ...p, name: e.target.value }))} />
            <TextField fullWidth multiline rows={2} label="Description" value={form.description} onChange={e => setForm((p: any) => ({ ...p, description: e.target.value }))} />
            {extraFormFields?.(form, setForm)}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={isPending}>
              {isPending ? <CircularProgress size={18} /> : editing ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE INVENTORY SUITE
// ═══════════════════════════════════════════════════════════════════════════════

export const MaterialsPage: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState(0);

  // Pagination states
  const [whPage] = useState(1);
  const [stockPage] = useState(1);
  const [ledgerPage] = useState(1);

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 0: MATERIAL CATALOG DATA & HANDLERS
  // ───────────────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [brandFilter, setBrandFilter] = useState<number | null>(null);
  const [statusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [poPagination, setPoPagination] = useState({ current_page: 1, per_page: 15, total: 0, last_page: 1 });

  const { data: listData, isLoading: catalogLoading } = useMaterialsList(
    poPagination.current_page, searchQuery, categoryFilter, brandFilter,
    statusFilter, sortBy, sortOrder, poPagination.per_page
  );
  const { data: optionsData } = useMaterialFormOptions();
  const { data: categoriesData } = useCategoriesList();
  const { data: brandsData } = useBrandsList();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Material | null>(null);
  const [formData, setFormData] = useState<MaterialFormData>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);

  const createM = useCreateMaterial();
  const updateM = useUpdateMaterial();
  const deleteM = useDeleteMaterial();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();

  React.useEffect(() => {
    if (listData?.data?.pagination) {
      const p = listData.data.pagination;
      setPoPagination(prev => ({ ...prev, total: p.total, last_page: p.last_page }));
    }
  }, [listData]);

  const rows = listData?.data?.items || [];
  const options = optionsData?.data;
  const categories = categoriesData?.data || [];
  const brands = brandsData?.data || [];

  const handlePOAdd = () => { setEditing(null); setFormData(emptyForm); setModalOpen(true); };
  const handlePOEdit = (m: Material) => {
    setEditing(m);
    setFormData({
      name: m.name, description: m.description || '', sku: m.sku,
      hsn_code: m.hsn_code || '', gst_rate: parseFloat(m.gst_rate),
      category_id: m.category_id, brand_id: m.brand_id, unit_id: m.unit_id,
      unit: m.unit, cost_price: parseFloat(m.cost_price),
      purchase_price: parseFloat(m.purchase_price),
      selling_price: parseFloat(m.selling_price),
      stock_quantity: parseFloat(m.stock_quantity),
      reorder_level: parseFloat(m.reorder_level),
      barcode: m.barcode || '', is_active: m.is_active,
    });
    setModalOpen(true);
  };

  const handlePOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) { showToast('Name and SKU are required.', 'warning'); return; }
    setFormLoading(true);
    try {
      const payload = { ...formData, cost_price: formData.purchase_price };
      if (editing) {
        await updateM.mutateAsync({ id: editing.id, data: payload });
        showToast('Material updated.', 'success');
      } else {
        await createM.mutateAsync(payload);
        showToast(`${formData.name} added to catalog.`, 'success');
      }
      setModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Save failed.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 1: WAREHOUSE REGISTRY
  // ───────────────────────────────────────────────────────────────────────────
  const { data: warehousesData, isLoading: whLoading } = useWarehousesList(whPage, '');
  const [whModal, setWhModal] = useState(false);
  const [editingWh, setEditingWh] = useState<Warehouse | null>(null);
  const [whForm, setWhForm] = useState({ name: '', location: '', contact_number: '', is_active: true });

  const createWh = useCreateWarehouse();
  const updateWh = useUpdateWarehouse();
  const deleteWh = useDeleteWarehouse();

  const handleWhSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whForm.name.trim()) return;
    try {
      if (editingWh) {
        await updateWh.mutateAsync({ id: editingWh.id, data: whForm });
        showToast('Warehouse updated.', 'success');
      } else {
        await createWh.mutateAsync(whForm);
        showToast('Warehouse registered.', 'success');
      }
      setWhModal(false);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 2: WAREHOUSE STOCK STATUS
  // ───────────────────────────────────────────────────────────────────────────
  const [stockWhFilter, setStockWhFilter] = useState<number | null>(null);
  const [stockMatFilter, setStockMatFilter] = useState<number | null>(null);
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const { data: stocksData, isLoading: stocksLoading } = useStocksList(stockPage, stockWhFilter, stockMatFilter, '', lowStockFilter);

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 3: STOCK LEDGER AUDIT
  // ───────────────────────────────────────────────────────────────────────────
  const [ledgerWhFilter, setLedgerWhFilter] = useState<number | null>(null);
  const [ledgerMatFilter, setLedgerMatFilter] = useState<number | null>(null);
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('');
  const { data: ledgerData, isLoading: ledgerLoading } = useLedgerList(ledgerPage, ledgerWhFilter, ledgerMatFilter, ledgerTypeFilter);

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 4: ADJUSTMENTS & RESERVATIONS
  // ───────────────────────────────────────────────────────────────────────────
  const { data: invOptionsData } = useInventoryFormOptions();
  const invOptions = invOptionsData?.data;

  // Adjustment State
  const [adjustForm, setAdjustForm] = useState({ warehouse_id: '', material_id: '', batch_id: '', transaction_type: 'adjustment', quantity: 0, notes: '', source_type: '', source_name: '' });
  const adjustMutation = useAdjustStock();

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustForm.warehouse_id || !adjustForm.material_id || adjustForm.quantity === 0) {
      showToast('Warehouse, Material and Quantity are required.', 'warning');
      return;
    }
    try {
      let finalNotes = adjustForm.notes;
      if (adjustForm.source_type && adjustForm.source_name) {
        finalNotes = `Received from ${adjustForm.source_type}: ${adjustForm.source_name}. ${finalNotes}`.trim();
      }

      await adjustMutation.mutateAsync({
        warehouse_id: Number(adjustForm.warehouse_id),
        material_id: Number(adjustForm.material_id),
        batch_id: adjustForm.batch_id ? Number(adjustForm.batch_id) : null,
        transaction_type: adjustForm.transaction_type,
        quantity: adjustForm.quantity,
        notes: finalNotes,
      });
      showToast('Inventory stock adjusted successfully.', 'success');
      setAdjustForm({ warehouse_id: '', material_id: '', batch_id: '', transaction_type: 'adjustment', quantity: 0, notes: '', source_type: '', source_name: '' });
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Reservation State
  const [reserveForm, setReserveForm] = useState({ warehouse_id: '', material_id: '', batch_id: '', project_id: '', quantity: 0, action: 'reserve' as 'reserve' | 'release' });
  const reserveMutation = useReserveStock();

  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reserveForm.warehouse_id || !reserveForm.material_id || !reserveForm.project_id || reserveForm.quantity <= 0) {
      showToast('All fields and positive quantity are required.', 'warning');
      return;
    }
    try {
      await reserveMutation.mutateAsync({
        warehouse_id: Number(reserveForm.warehouse_id),
        material_id: Number(reserveForm.material_id),
        batch_id: reserveForm.batch_id ? Number(reserveForm.batch_id) : null,
        project_id: Number(reserveForm.project_id),
        quantity: reserveForm.quantity,
        action: reserveForm.action,
      });
      showToast(`Stock reserved successfully for project.`, 'success');
      setReserveForm({ warehouse_id: '', material_id: '', batch_id: '', project_id: '', quantity: 0, action: 'reserve' });
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Stock Transfer State
  const [transferForm, setTransferForm] = useState({
    source_warehouse_id: '',
    material_id: '',
    batch_id: '',
    quantity: 0,
    destination_branch_id: '',
    destination_warehouse_id: '',
    notes: '',
  });

  const transferMutation = useTransferStock();
  const { data: branchesRes } = useBranchesList();
  const branchesList = branchesRes?.data || [];

  const { data: destWarehousesRes, isLoading: loadingDestWh } = useBranchWarehouses(
    transferForm.destination_branch_id ? Number(transferForm.destination_branch_id) : null
  );
  const destWarehouses = destWarehousesRes?.data || [];

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !transferForm.source_warehouse_id ||
      !transferForm.material_id ||
      transferForm.quantity <= 0 ||
      !transferForm.destination_branch_id ||
      !transferForm.destination_warehouse_id
    ) {
      showToast('Please fill out all required fields.', 'warning');
      return;
    }

    try {
      await transferMutation.mutateAsync({
        source_warehouse_id: Number(transferForm.source_warehouse_id),
        material_id: Number(transferForm.material_id),
        quantity: Number(transferForm.quantity),
        destination_branch_id: Number(transferForm.destination_branch_id),
        destination_warehouse_id: Number(transferForm.destination_warehouse_id),
        batch_id: transferForm.batch_id ? Number(transferForm.batch_id) : null,
        notes: transferForm.notes,
      });
      showToast('Stock transfer executed successfully.', 'success');
      setTransferForm({
        source_warehouse_id: '',
        material_id: '',
        batch_id: '',
        quantity: 0,
        destination_branch_id: '',
        destination_warehouse_id: '',
        notes: '',
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to transfer stock.', 'error');
    }
  };

  // ── Materials table sorting helper ──────────────────────────────────────────
  const handleSort = (field: string) => {
    const isAsc = sortBy === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(field);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // COLUMN DEFINITIONS
  // ═══════════════════════════════════════════════════════════════════════════

  const catalogColumns: ColumnDefinition[] = [
    {
      field: 'name', headerName: 'Material',
      render: (row: Material) => (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>{row.name}</Typography>
            {!row.is_active && <Chip label="Inactive" size="small" color="error" sx={{ fontSize: '0.6rem', height: 18 }} />}
          </Box>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{row.sku}</Typography>
          {row.category && (
            <Chip label={row.category.name} size="small"
              sx={{ ml: 0, mt: 0.3, fontSize: '0.6rem', height: 18, bgcolor: row.category.color + '22', color: row.category.color, fontWeight: 700, display: 'block', width: 'fit-content' }} />
          )}
        </Box>
      ),
    },
    {
      field: 'brand', headerName: 'Brand',
      render: (row: Material) => <Typography variant="caption" color="text.secondary">{row.brand?.name || '—'}</Typography>,
    },
    {
      field: 'hsn_gst', headerName: 'HSN / GST',
      render: (row: Material) => (
        <Box>
          <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block' }}>{row.hsn_code || '—'}</Typography>
          <Chip label={`${row.gst_rate}% GST`} size="small" variant="outlined" sx={{ fontSize: '0.6rem', height: 18 }} />
        </Box>
      ),
    },
    {
      field: 'purchase_price', headerName: 'Buy / Sell',
      render: (row: Material) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>{formatINR(row.purchase_price)}</Typography>
          <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700 }}>{formatINR(row.selling_price)}</Typography>
        </Box>
      ),
    },
    {
      field: 'stock_quantity', headerName: 'Catalog Qty',
      render: (row: Material) => (
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {parseFloat(row.stock_quantity)} {row.unitModel?.abbreviation || row.unit}
        </Typography>
      ),
    },
    {
      field: 'codes', headerName: 'Barcode / QR',
      render: (row: Material) => <BarcodeQrCell material={row} />,
    },
    {
      field: 'actions', headerName: 'Actions',
      render: (row: Material) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" color="info" onClick={() => handlePOEdit(row)}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => { if (window.confirm('Archive material?')) deleteM.mutateAsync(row.id); }}><DeleteIcon fontSize="small" /></IconButton>
        </Box>
      ),
    },
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN SUITE RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Inventory Hub</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage material master catalogs, allocate batches, track multiple warehouses, adjustments, and reservations.
          </Typography>
        </Box>
        {activeTab === 0 && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={handlePOAdd}
            sx={{ py: 1.2, px: 2.5, borderRadius: 3.5, background: 'linear-gradient(135deg, #7c4dff 0%, #b47cff 100%)' }}>
            Add Material
          </Button>
        )}
        {activeTab === 1 && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingWh(null); setWhForm({ name: '', location: '', contact_number: '', is_active: true }); setWhModal(true); }}
            sx={{ py: 1.2, px: 2.5, borderRadius: 3.5, background: 'linear-gradient(135deg, #7c4dff 0%, #b47cff 100%)' }}>
            Add Warehouse
          </Button>
        )}
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={(_, v) => { setActiveTab(v); }} variant="scrollable"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2, '& .MuiTab-root': { fontWeight: 700 } }}>
          <Tab icon={<CategoryIcon fontSize="small" />} iconPosition="start" label="Material Master" />
          <Tab icon={<WarehouseIcon fontSize="small" />} iconPosition="start" label="Warehouses" />
          <Tab icon={<InventoryIcon fontSize="small" />} iconPosition="start" label="Stock Levels" />
          <Tab icon={<LedgerIcon fontSize="small" />} iconPosition="start" label="Stock Ledger Audit" />
          <Tab icon={<AdjustIcon fontSize="small" />} iconPosition="start" label="Adjustments & Reserves" />
        </Tabs>
      </Paper>

      {/* Dynamic Content */}
      <Box>
        {activeTab === 0 && renderCatalogTab()}
        {activeTab === 1 && renderWarehouseTab()}
        {activeTab === 2 && renderStocksTab()}
        {activeTab === 3 && renderLedgerTab()}
        {activeTab === 4 && renderAdjustmentsTab()}
      </Box>

      {/* Forms & Dialogs */}
      {renderWhDialog()}
      {renderMaterialDialog()}
    </Box>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB RENDERERS
  // ═══════════════════════════════════════════════════════════════════════════

  // Tab 0: Catalog
  function renderCatalogTab() {
    return (
      <Box>
        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 4, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box component="form" onSubmit={e => { e.preventDefault(); setSearchQuery(search); setPoPagination(p => ({ ...p, current_page: 1 })); }}
            sx={{ display: 'flex', flexGrow: 1, gap: 1 }}>
            <TextField size="small" placeholder="Search catalog..." value={search}
              onChange={e => setSearch(e.target.value)} sx={{ flexGrow: 1 }}
              slotProps={{ input: { startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />, endAdornment: search && <IconButton size="small" onClick={() => { setSearch(''); setSearchQuery(''); }}><ClearIcon fontSize="small" /></IconButton> } }} />
            <Button type="submit" variant="outlined">Search</Button>
          </Box>
          <TextField select size="small" label="Category" value={categoryFilter ?? ''} onChange={e => { setCategoryFilter(e.target.value ? Number(e.target.value) : null); setPoPagination(p => ({ ...p, current_page: 1 })); }} sx={{ minWidth: 160 }}>
            <MenuItem value="">All Categories</MenuItem>
            {options?.categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Brand" value={brandFilter ?? ''} onChange={e => { setBrandFilter(e.target.value ? Number(e.target.value) : null); setPoPagination(p => ({ ...p, current_page: 1 })); }} sx={{ minWidth: 140 }}>
            <MenuItem value="">All Brands</MenuItem>
            {options?.brands.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
          </TextField>
        </Paper>

        <DataTable columns={catalogColumns} rows={rows} pagination={poPagination}
          onPageChange={page => setPoPagination(p => ({ ...p, current_page: page }))}
          onRowsPerPageChange={perPage => setPoPagination(p => ({ ...p, per_page: perPage, current_page: 1 }))}
          sortField={sortBy} sortOrder={sortOrder} onSort={handleSort} loading={catalogLoading} />

        {/* Lookups management */}
        <Paper sx={{ mt: 4, borderRadius: 4, overflow: 'hidden' }}>
          <Box sx={{ px: 3, pt: 2.5, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Lookup Categories & Brands</Typography>
          </Box>
          <Grid container spacing={3} sx={{ p: 3 }}>
            <Grid size={6}>
              <LookupTable<MaterialCategory> label="Category" rows={categories}
                onAdd={data => createCat.mutateAsync(data)} onEdit={(id, data) => updateCat.mutateAsync({ id, data })} onDelete={id => deleteCat.mutateAsync(id)}
                isPending={createCat.isPending || updateCat.isPending}
                extraFormFields={(f, sf) => <TextField fullWidth label="Hex Color" value={f.color || '#7c4dff'} onChange={e => sf((p: any) => ({ ...p, color: e.target.value }))} />} />
            </Grid>
            <Grid size={6}>
              <LookupTable<MaterialBrand> label="Brand" rows={brands}
                onAdd={data => createBrand.mutateAsync(data)} onEdit={(id, data) => updateBrand.mutateAsync({ id, data })} onDelete={id => deleteBrand.mutateAsync(id)}
                isPending={createBrand.isPending || updateBrand.isPending} />
            </Grid>
          </Grid>
        </Paper>
      </Box>
    );
  }

  // Tab 1: Warehouses
  function renderWarehouseTab() {
    const warehouses = warehousesData?.data?.items || [];
    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Warehouse Name</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Location Address</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Contact Details</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {whLoading ? (
                <TableRow><TableCell colSpan={5} align="center"><CircularProgress /></TableCell></TableRow>
              ) : warehouses.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ color: 'text.secondary' }}>No warehouses registered</TableCell></TableRow>
              ) : warehouses.map(wh => (
                <TableRow key={wh.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{wh.name}</TableCell>
                  <TableCell>{wh.location}</TableCell>
                  <TableCell>{wh.contact_number || '—'}</TableCell>
                  <TableCell>
                    <Chip label={wh.is_active ? 'Active' : 'Inactive'} color={wh.is_active ? 'success' : 'default'} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="info" onClick={() => {
                      setEditingWh(wh);
                      setWhForm({ name: wh.name, location: wh.location, contact_number: wh.contact_number || '', is_active: wh.is_active });
                      setWhModal(true);
                    }}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => { if (window.confirm('Delete warehouse?')) deleteWh.mutateAsync(wh.id); }}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    );
  }

  // Tab 2: Stock Levels
  function renderStocksTab() {
    const stocks = stocksData?.data?.items || [];
    return (
      <Box>
        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField select size="small" label="Warehouse" value={stockWhFilter ?? ''} onChange={e => { setStockWhFilter(e.target.value ? Number(e.target.value) : null); }} sx={{ minWidth: 200 }}>
            <MenuItem value="">All Warehouses</MenuItem>
            {invOptions?.warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Material" value={stockMatFilter ?? ''} onChange={e => { setStockMatFilter(e.target.value ? Number(e.target.value) : null); }} sx={{ minWidth: 200 }}>
            <MenuItem value="">All Materials</MenuItem>
            {invOptions?.materials.map(m => <MenuItem key={m.id} value={m.id}>{m.name} ({m.sku})</MenuItem>)}
          </TextField>
          <FormControlLabel control={<Switch checked={lowStockFilter} onChange={e => { setLowStockFilter(e.target.checked); }} color="error" />} label="Low Stock / Reorder alerts only" />
        </Paper>

        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <TableContainer>
            <Table size="medium">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Warehouse</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Material</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Batch No.</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Opening Stock</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Current Stock</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Reserved Qty</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Available Stock</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Alerts</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stocksLoading ? (
                  <TableRow><TableCell colSpan={8} align="center"><CircularProgress /></TableCell></TableRow>
                ) : stocks.length === 0 ? (
                  <TableRow><TableCell colSpan={8} align="center" sx={{ color: 'text.secondary' }}>No inventory stocks recorded matching criteria</TableCell></TableRow>
                ) : stocks.map(stock => {
                  const current = parseFloat(stock.current_stock);
                  const reorder = parseFloat(stock.material?.reorder_level || '0');
                  const unit = stock.material?.unit || '';
                  const isLow = current <= reorder && reorder > 0;
                  const available = current - parseFloat(stock.reserved_stock);

                  return (
                    <TableRow key={stock.id} hover>
                      <TableCell sx={{ fontWeight: 700 }}>{stock.warehouse?.name}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{stock.material?.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{stock.material?.sku}</Typography>
                      </TableCell>
                      <TableCell>{stock.batch?.batch_number ? <Chip label={stock.batch.batch_number} size="small" variant="outlined" /> : '—'}</TableCell>
                      <TableCell align="right">{parseFloat(stock.opening_stock)} {unit}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{current} {unit}</TableCell>
                      <TableCell align="right" sx={{ color: parseFloat(stock.reserved_stock) > 0 ? 'warning.main' : 'inherit' }}>
                        {parseFloat(stock.reserved_stock)} {unit}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: available > 0 ? 'success.main' : 'error.main' }}>
                        {available} {unit}
                      </TableCell>
                      <TableCell>
                        {isLow ? <Chip label="Low Stock Alert" size="small" color="warning" icon={<WarningIcon />} sx={{ fontWeight: 800 }} /> :
                          current === 0 ? <Chip label="Out of Stock" size="small" color="error" sx={{ fontWeight: 800 }} /> :
                            <Chip label="Good Stock" size="small" color="success" sx={{ fontWeight: 800 }} />}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    );
  }

  // Tab 3: Stock Ledger Audit Log
  function renderLedgerTab() {
    const ledger = ledgerData?.data?.items || [];
    return (
      <Box>
        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField select size="small" label="Warehouse" value={ledgerWhFilter ?? ''} onChange={e => { setLedgerWhFilter(e.target.value ? Number(e.target.value) : null); }} sx={{ minWidth: 200 }}>
            <MenuItem value="">All Warehouses</MenuItem>
            {invOptions?.warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Material" value={ledgerMatFilter ?? ''} onChange={e => { setLedgerMatFilter(e.target.value ? Number(e.target.value) : null); }} sx={{ minWidth: 200 }}>
            <MenuItem value="">All Materials</MenuItem>
            {invOptions?.materials.map(m => <MenuItem key={m.id} value={m.id}>{m.name} ({m.sku})</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Transaction Type" value={ledgerTypeFilter} onChange={e => { setLedgerTypeFilter(e.target.value); }} sx={{ minWidth: 180 }}>
            <MenuItem value="">All Movements</MenuItem>
            <MenuItem value="opening">Opening Stock</MenuItem>
            <MenuItem value="receipt">PO Goods Receipt</MenuItem>
            <MenuItem value="dispatch">Material Dispatch</MenuItem>
            <MenuItem value="return">Purchase Return</MenuItem>
            <MenuItem value="adjustment">Manual Adjustment</MenuItem>
            <MenuItem value="reserve">Project Reservation</MenuItem>
            <MenuItem value="release">Release Reservation</MenuItem>
          </TextField>
        </Paper>

        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <TableContainer>
            <Table size="medium">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Warehouse</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Material</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Batch</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 800 }} align="right">Movement Qty</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Reference / Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ledgerLoading ? (
                  <TableRow><TableCell colSpan={7} align="center"><CircularProgress /></TableCell></TableRow>
                ) : ledger.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ color: 'text.secondary' }}>No transaction ledger records recorded</TableCell></TableRow>
                ) : ledger.map(log => {
                  const qty = parseFloat(log.quantity);
                  const isPositive = qty > 0;
                  return (
                    <TableRow key={log.id} hover>
                      <TableCell>{formatDate(log.transaction_date)}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{log.warehouse?.name}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{log.material?.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{log.material?.sku}</Typography>
                      </TableCell>
                      <TableCell>{log.batch?.batch_number ? <Chip label={log.batch.batch_number} size="small" variant="outlined" /> : '—'}</TableCell>
                      <TableCell>
                        <Chip label={log.transaction_type.toUpperCase()} size="small"
                          color={log.transaction_type === 'receipt' || log.transaction_type === 'opening' ? 'success' :
                            log.transaction_type === 'dispatch' || log.transaction_type === 'reserve' ? 'error' : 'default'}
                          sx={{ fontSize: '0.6rem', fontWeight: 800 }} />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: isPositive ? 'success.main' : 'error.main' }}>
                        {isPositive ? `+${qty}` : qty}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{log.notes || '—'}</Typography>
                        {log.reference_type && (
                          <Typography variant="caption" color="text.secondary">
                            Ref: {log.reference_type} #{log.reference_id}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    );
  }

  // Tab 4: Adjustments & Reservations forms
  function renderAdjustmentsTab() {
    return (
      <Grid container spacing={3}>
        {/* Manual Stock Adjustments Card */}
        <Grid size={4}>
          <Card variant="outlined" sx={{ borderRadius: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <AdjustIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Manual Stock Adjustment</Typography>
              </Box>
              <Divider sx={{ mb: 2.5 }} />
              <form onSubmit={handleAdjustSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField select fullWidth required label="Warehouse" value={adjustForm.warehouse_id} onChange={e => setAdjustForm(p => ({ ...p, warehouse_id: e.target.value }))}>
                    {invOptions?.warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                  </TextField>
                  <TextField select fullWidth required label="Material" value={adjustForm.material_id} onChange={e => setAdjustForm(p => ({ ...p, material_id: e.target.value }))}>
                    {invOptions?.materials.map(m => <MenuItem key={m.id} value={m.id}>{m.name} ({m.sku})</MenuItem>)}
                  </TextField>
                  <TextField select fullWidth label="Batch No (optional)" value={adjustForm.batch_id} onChange={e => setAdjustForm(p => ({ ...p, batch_id: e.target.value }))}>
                    <MenuItem value="">No Batch Allocation</MenuItem>
                    {invOptions?.batches.filter(b => b.material_id === Number(adjustForm.material_id)).map(b => <MenuItem key={b.id} value={b.id}>{b.batch_number}</MenuItem>)}
                  </TextField>
                  <TextField select fullWidth label="Adjustment Action" value={adjustForm.transaction_type} onChange={e => setAdjustForm(p => ({ ...p, transaction_type: e.target.value }))}>
                    <MenuItem value="adjustment">Manual Adjustment</MenuItem>
                    <MenuItem value="opening">Opening Stock Registration</MenuItem>
                    <MenuItem value="receipt">Goods Addition Receipt</MenuItem>
                    <MenuItem value="dispatch">Wastage / Dispatch deduction</MenuItem>
                  </TextField>
                  <TextField type="number" fullWidth required label="Qty to Adjust" helperText="Input negative value to deduct stock" value={adjustForm.quantity} onChange={e => setAdjustForm(p => ({ ...p, quantity: Number(e.target.value) }))} />
                  
                  {['receipt', 'adjustment', 'opening'].includes(adjustForm.transaction_type) && (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField select fullWidth label="Source Type (Optional)" value={adjustForm.source_type} onChange={e => setAdjustForm(p => ({ ...p, source_type: e.target.value }))}>
                        <MenuItem value="">None</MenuItem>
                        <MenuItem value="Customer">Customer</MenuItem>
                        <MenuItem value="Supplier">Supplier / Vendor</MenuItem>
                        <MenuItem value="Internal">Internal / Other</MenuItem>
                      </TextField>
                      <TextField fullWidth label="Source Name (Optional)" value={adjustForm.source_name} onChange={e => setAdjustForm(p => ({ ...p, source_name: e.target.value }))} disabled={!adjustForm.source_type} placeholder="e.g. John Doe" />
                    </Box>
                  )}

                  <TextField fullWidth multiline rows={2} label="Remarks Notes" value={adjustForm.notes} onChange={e => setAdjustForm(p => ({ ...p, notes: e.target.value }))} placeholder="Explain stock variance..." />

                  <Button type="submit" variant="contained" disabled={adjustMutation.isPending} sx={{ py: 1, mt: 1 }}>Execute Adjustment</Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Project Reservations Card */}
        <Grid size={4}>
          <Card variant="outlined" sx={{ borderRadius: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <ReserveIcon color="secondary" />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Project Material Reservations</Typography>
              </Box>
              <Divider sx={{ mb: 2.5 }} />
              <form onSubmit={handleReserveSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField select fullWidth required label="Linked Project" value={reserveForm.project_id} onChange={e => setReserveForm(p => ({ ...p, project_id: e.target.value }))}>
                    {invOptions?.projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                  </TextField>
                  <TextField select fullWidth required label="Source Warehouse" value={reserveForm.warehouse_id} onChange={e => setReserveForm(p => ({ ...p, warehouse_id: e.target.value }))}>
                    {invOptions?.warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                  </TextField>
                  <TextField select fullWidth required label="Material to Reserve" value={reserveForm.material_id} onChange={e => setReserveForm(p => ({ ...p, material_id: e.target.value }))}>
                    {invOptions?.materials.map(m => <MenuItem key={m.id} value={m.id}>{m.name} ({m.sku})</MenuItem>)}
                  </TextField>
                  <TextField select fullWidth label="Batch Allocation (optional)" value={reserveForm.batch_id} onChange={e => setReserveForm(p => ({ ...p, batch_id: e.target.value }))}>
                    <MenuItem value="">No Batch Allocation</MenuItem>
                    {invOptions?.batches.filter(b => b.material_id === Number(reserveForm.material_id)).map(b => <MenuItem key={b.id} value={b.id}>{b.batch_number}</MenuItem>)}
                  </TextField>
                  <TextField type="number" fullWidth required label="Quantity" value={reserveForm.quantity} onChange={e => setReserveForm(p => ({ ...p, quantity: Number(e.target.value) }))} />
                  <TextField select fullWidth label="Reservation Action" value={reserveForm.action} onChange={e => setReserveForm(p => ({ ...p, action: e.target.value as any }))}>
                    <MenuItem value="reserve">Reserve Stock (Locks for project)</MenuItem>
                    <MenuItem value="release">Release Reserved Stock (Return to pool)</MenuItem>
                  </TextField>

                  <Button type="submit" variant="contained" color="secondary" disabled={reserveMutation.isPending} sx={{ py: 1, mt: 1 }}>Process Reservation</Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Stock Transfer Card */}
        <Grid size={4}>
          <Card variant="outlined" sx={{ borderRadius: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <AdjustIcon sx={{ color: '#059669' }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Move / Transfer Stock</Typography>
              </Box>
              <Divider sx={{ mb: 2.5 }} />
              <form onSubmit={handleTransferSubmit}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField select fullWidth required label="Source Warehouse" value={transferForm.source_warehouse_id} onChange={e => setTransferForm(p => ({ ...p, source_warehouse_id: e.target.value }))}>
                    {invOptions?.warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                  </TextField>
                  <TextField select fullWidth required label="Material" value={transferForm.material_id} onChange={e => setTransferForm(p => ({ ...p, material_id: e.target.value }))}>
                    {invOptions?.materials.map(m => <MenuItem key={m.id} value={m.id}>{m.name} ({m.sku})</MenuItem>)}
                  </TextField>
                  <TextField select fullWidth label="Batch No (optional)" value={transferForm.batch_id} onChange={e => setTransferForm(p => ({ ...p, batch_id: e.target.value }))}>
                    <MenuItem value="">No Batch Allocation</MenuItem>
                    {invOptions?.batches.filter(b => b.material_id === Number(transferForm.material_id)).map(b => <MenuItem key={b.id} value={b.id}>{b.batch_number}</MenuItem>)}
                  </TextField>
                  <TextField type="number" fullWidth required label="Quantity to Move" value={transferForm.quantity || ''} onChange={e => setTransferForm(p => ({ ...p, quantity: Number(e.target.value) }))} />
                  
                  <TextField select fullWidth required label="Destination Branch" value={transferForm.destination_branch_id} onChange={e => setTransferForm(p => ({ ...p, destination_branch_id: e.target.value, destination_warehouse_id: '' }))}>
                    {branchesList.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                  </TextField>

                  <TextField select fullWidth required label="Destination Warehouse" value={transferForm.destination_warehouse_id} onChange={e => setTransferForm(p => ({ ...p, destination_warehouse_id: e.target.value }))} disabled={!transferForm.destination_branch_id || loadingDestWh}>
                    {loadingDestWh ? (
                      <MenuItem value="" disabled>Loading warehouses...</MenuItem>
                    ) : destWarehouses.length === 0 ? (
                      <MenuItem value="" disabled>No warehouses found</MenuItem>
                    ) : (
                      destWarehouses.map((w: any) => <MenuItem key={w.id} value={w.id}>{w.name} ({w.location})</MenuItem>)
                    )}
                  </TextField>
                  
                  <TextField fullWidth multiline rows={1} label="Transfer Remarks" value={transferForm.notes} onChange={e => setTransferForm(p => ({ ...p, notes: e.target.value }))} placeholder="Reason for transfer..." />

                  <Button type="submit" variant="contained" disabled={transferMutation.isPending} sx={{ py: 1, mt: 1, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}>
                    {transferMutation.isPending ? 'Executing...' : 'Execute Stock Move'}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POPUP FORM DIALOGS
  // ═══════════════════════════════════════════════════════════════════════════

  // Warehouse registry dialog
  function renderWhDialog() {
    return (
      <Dialog open={whModal} onClose={() => setWhModal(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>{editingWh ? 'Edit Warehouse Location' : 'Register Warehouse'}</DialogTitle>
        <form onSubmit={handleWhSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField fullWidth required label="Warehouse Name" value={whForm.name} onChange={e => setWhForm(p => ({ ...p, name: e.target.value }))} />
            <TextField fullWidth required label="Location / Street Address" value={whForm.location} onChange={e => setWhForm(p => ({ ...p, location: e.target.value }))} />
            <TextField fullWidth label="Contact Phone Number" value={whForm.contact_number} onChange={e => setWhForm(p => ({ ...p, contact_number: e.target.value }))} />
            <FormControlLabel control={<Switch checked={whForm.is_active} onChange={e => setWhForm(p => ({ ...p, is_active: e.target.checked }))} color="success" />} label="Warehouse is Active" />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setWhModal(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={createWh.isPending || updateWh.isPending}>Save Warehouse</Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }

  // Material master dialog
  function renderMaterialDialog() {
    return (
      <Dialog open={modalOpen} onClose={() => !formLoading && setModalOpen(false)} maxWidth="md" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid', borderColor: 'divider' }}>
          {editing ? `Edit — ${editing.sku}` : 'Add New Material'}
        </DialogTitle>
        <form onSubmit={handlePOSubmit}>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2.5}>

              {/* Basic Info */}
              <Grid size={12}>
                <Divider sx={{ mb: 1 }}><Chip label="Basic Information" size="small" sx={{ fontWeight: 700 }} /></Divider>
              </Grid>
              <Grid size={8}>
                <TextField fullWidth required label="Material Name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
              </Grid>
              <Grid size={4}>
                <TextField fullWidth required label="SKU Code" value={formData.sku} onChange={e => setFormData(p => ({ ...p, sku: e.target.value.toUpperCase() }))} slotProps={{ input: { sx: { fontFamily: 'monospace', fontWeight: 700 } } }} />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth multiline rows={2} label="Description" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
              </Grid>
              <Grid size={4}>
                <TextField fullWidth select label="Category" value={formData.category_id ?? ''} onChange={e => setFormData(p => ({ ...p, category_id: Number(e.target.value) || null }))}>
                  <MenuItem value="">None</MenuItem>
                  {options?.categories.map(c => <MenuItem key={c.id} value={c.id}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color }} />{c.name}</Box></MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={4}>
                <TextField fullWidth select label="Brand" value={formData.brand_id ?? ''} onChange={e => setFormData(p => ({ ...p, brand_id: Number(e.target.value) || null }))}>
                  <MenuItem value="">None</MenuItem>
                  {options?.brands.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={4}>
                <TextField fullWidth select label="Unit of Measurement" value={formData.unit_id ?? ''} onChange={e => { const u = options?.units.find(u => u.id === Number(e.target.value)); setFormData(p => ({ ...p, unit_id: Number(e.target.value) || null, unit: u?.abbreviation || p.unit })); }}>
                  <MenuItem value="">None</MenuItem>
                  {options?.units.map(u => <MenuItem key={u.id} value={u.id}>{u.name} ({u.abbreviation})</MenuItem>)}
                </TextField>
              </Grid>

              {/* Compliance */}
              <Grid size={12}>
                <Divider sx={{ mb: 1 }}><Chip label="Compliance & Tax" size="small" sx={{ fontWeight: 700 }} /></Divider>
              </Grid>
              <Grid size={4}>
                <TextField fullWidth label="HSN Code" value={formData.hsn_code} onChange={e => setFormData(p => ({ ...p, hsn_code: e.target.value }))}
                  placeholder="e.g. 6802" slotProps={{ input: { sx: { fontFamily: 'monospace' } } }} />
              </Grid>
              <Grid size={4}>
                <TextField fullWidth select label="GST Rate" value={formData.gst_rate} onChange={e => setFormData(p => ({ ...p, gst_rate: Number(e.target.value) }))}>
                  {GST_RATES.map(r => <MenuItem key={r} value={r}>{r}% GST</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={4}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">GST on Selling Price</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: 'warning.main' }}>
                    {formatINR((formData.selling_price * formData.gst_rate) / 100)}
                  </Typography>
                </Paper>
              </Grid>

              {/* Pricing */}
              <Grid size={12}>
                <Divider sx={{ mb: 1 }}><Chip label="Pricing" size="small" sx={{ fontWeight: 700 }} /></Divider>
              </Grid>
              <Grid size={4}>
                <TextField fullWidth type="number" label="Purchase Price (₹)" value={formData.purchase_price}
                  onChange={e => setFormData(p => ({ ...p, purchase_price: Number(e.target.value), cost_price: Number(e.target.value) }))}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment>, inputProps: { min: 0, step: 0.01 } } }} />
              </Grid>
              <Grid size={4}>
                <TextField fullWidth type="number" label="Selling Price (₹)" value={formData.selling_price}
                  onChange={e => setFormData(p => ({ ...p, selling_price: Number(e.target.value) }))}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment>, inputProps: { min: 0, step: 0.01 } } }} />
              </Grid>
              <Grid size={4}>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">Gross Margin</Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: formData.selling_price > formData.purchase_price ? 'success.main' : 'error.main' }}>
                    {formData.purchase_price > 0
                      ? `${(((formData.selling_price - formData.purchase_price) / formData.purchase_price) * 100).toFixed(1)}%`
                      : '—'}
                  </Typography>
                </Paper>
              </Grid>

              {/* Inventory details */}
              <Grid size={12}>
                <Divider sx={{ mb: 1 }}><Chip label="Inventory" size="small" sx={{ fontWeight: 700 }} /></Divider>
              </Grid>
              <Grid size={4}>
                <TextField fullWidth type="number" label="Reorder Level" value={formData.reorder_level}
                  onChange={e => setFormData(p => ({ ...p, reorder_level: Number(e.target.value) }))}
                  slotProps={{ input: { inputProps: { min: 0, step: 0.01 } } }}
                  helperText="Low stock alert triggers when current stock ≤ this" />
              </Grid>
              <Grid size={4}>
                <FormControlLabel control={<Switch checked={formData.is_active} onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked }))} color="success" />} label={formData.is_active ? 'Active in catalog' : 'Inactive'} sx={{ mt: 1 }} />
              </Grid>

              {/* Barcode */}
              <Grid size={4}>
                <TextField fullWidth label="Barcode" value={formData.barcode}
                  onChange={e => setFormData(p => ({ ...p, barcode: e.target.value }))}
                  slotProps={{ input: { sx: { fontFamily: 'monospace' } } }}
                  helperText="Auto-generated from SKU if left blank" />
              </Grid>

            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button onClick={() => setModalOpen(false)} disabled={formLoading} variant="outlined">Cancel</Button>
            <Button type="submit" disabled={formLoading} variant="contained">
              {formLoading ? <CircularProgress size={20} color="inherit" /> : editing ? 'Update Material' : 'Add to Catalog'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }
};

export default MaterialsPage;
