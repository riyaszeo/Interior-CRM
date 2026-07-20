import React, { useState, useRef } from 'react';
import {
  Box, Typography, Button, TextField, MenuItem, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Chip, Tooltip, Paper, Grid, Divider, LinearProgress,
  Card, CardContent, Tabs, Tab, Avatar, List, ListItem,
  ListItemText, ListItemAvatar, ListItemSecondaryAction,
  Badge, Alert, Breadcrumbs, Link, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, Clear as ClearIcon, ArrowBack as BackIcon,
  CheckCircle as CheckIcon, RadioButtonUnchecked as PendingIcon,
  Warning as DelayedIcon, Assignment as ProjectIcon,
  Group as TeamIcon, Description as DocIcon,
  CalendarToday as CalIcon, AttachMoney as MoneyIcon,
  CloudUpload as UploadIcon,
  PersonAdd as AddPersonIcon, Close as CloseIcon,
  NavigateNext as NavNextIcon, LocationOn as LocationIcon,
  Phone as PhoneIcon, Person as PersonIcon,
  CheckCircleOutlined as ApprovedIcon,
  Receipt as ExpenseIcon,
  PlayCircleOutlined as VideoIcon, FactCheck as AttendanceIcon,
} from '@mui/icons-material';
import {
  useProjectsList, useProjectDetails, useUsersList,
  useCreateProject, useUpdateProject, useDeleteProject,
  useAddMilestone, useUpdateMilestone, useDeleteMilestone,
  useAddProgressLog, useAddTeamMember, useRemoveTeamMember,
  useUploadDocument, useDeleteDocument,
  useApproveProgressLog, useLogMaterialConsumption,
  useLogWorkerAttendance, useLogExpense, useProcessExpenseApproval,
} from '../hooks/useProjects';
import { useDispatchFormOptions } from '../hooks/useDispatches';
import type { Project, ProjectFormData } from '../hooks/useProjects';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { DataTable } from '../components/DataTable';
import type { ColumnDefinition } from '../components/DataTable';

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'info' | 'warning' | 'success' | 'error' | 'primary' }> = {
  pending:     { label: 'Pending',     color: 'default' },
  active:      { label: 'Active',      color: 'info' },
  in_progress: { label: 'In Progress', color: 'warning' },
  completed:   { label: 'Completed',   color: 'success' },
  on_hold:     { label: 'On Hold',     color: 'error' },
};

const MILESTONE_STATUS_CONFIG = {
  pending:   { icon: <PendingIcon />,  color: 'text.secondary', label: 'Pending' },
  completed: { icon: <CheckIcon />,    color: 'success.main',   label: 'Completed' },
  delayed:   { icon: <DelayedIcon />,  color: 'warning.main',   label: 'Delayed' },
};

const formatINR = (val: string | number) =>
  `₹${parseFloat(String(val)).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const empty: ProjectFormData = {
  name: '', description: '', status: 'pending',
  site_address: '', site_contact_name: '', site_contact_phone: '',
  budget: 0, material_budget: 0, estimated_cost: 0, actual_cost: 0,
  completion_percent: 0, start_date: '', end_date: '',
  customer_id: null, project_manager_id: null,
};

// ── Completion Ring ────────────────────────────────────────────────────────────

const CompletionRing: React.FC<{ percent: number; size?: number }> = ({ percent, size = 64 }) => {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = percent >= 100 ? '#4caf50' : percent >= 50 ? '#ff9800' : '#7c4dff';
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      </svg>
      <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="caption" sx={{ fontWeight: 900, fontSize: size > 56 ? '0.75rem' : '0.6rem', color }}>{percent}%</Typography>
      </Box>
    </Box>
  );
};

// ── ProjectsPage ───────────────────────────────────────────────────────────────

export const ProjectsPage: React.FC = () => {
  const { showToast } = useToast();
  const { hasPermission, hasRole } = useAuth();

  // View: 'list' | 'detail'
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // List state
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState({ current_page: 1, per_page: 10, total: 0, last_page: 1 });

  const { data: listData, isLoading } = useProjectsList(
    pagination.current_page, searchQuery, statusFilter, sortField, sortOrder, pagination.per_page
  );
  const { data: detailData, isLoading: detailLoading } = useProjectDetails(selectedId);
  const { data: usersData } = useUsersList();

  React.useEffect(() => {
    if (listData?.data?.pagination) {
      const p = listData.data.pagination;
      setPagination(prev => ({ ...prev, total: p.total, last_page: p.last_page }));
    }
  }, [listData]);

  const rows = listData?.data?.items || [];
  const project = detailData?.data;
  const users = usersData?.data || [];

  // Create/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<ProjectFormData>(empty);
  const [formLoading, setFormLoading] = useState(false);

  // Detail tabs
  const [activeTab, setActiveTab] = useState(0);

  // Sub-resource dialogs
  const [milestoneDialog, setMilestoneDialog] = useState(false);
  const [progressDialog, setProgressDialog] = useState(false);
  const [teamDialog, setTeamDialog] = useState(false);

  const [milestoneForm, setMilestoneForm] = useState({ title: '', description: '', due_date: '', status: 'pending' });
  const [progressForm, setProgressForm] = useState({ log_date: new Date().toISOString().split('T')[0], description: '', completion_percent: 0 });
  const [teamForm, setTeamForm] = useState({ user_id: 0, role: '' });

  // Phase 10 Site Progress sub-dialog states
  const [mcDialog, setMcDialog] = useState(false);
  const [mcForm, setMcForm] = useState<{
    warehouse_id: number | '';
    material_id: number | '';
    batch_id: number | '';
    quantity_consumed: number;
    consumption_date: string;
    notes: string;
  }>({
    warehouse_id: '',
    material_id: '',
    batch_id: '',
    quantity_consumed: 0,
    consumption_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [waDialog, setWaDialog] = useState(false);
  const [waForm, setWaForm] = useState({ attendance_date: new Date().toISOString().split('T')[0], items: [{ worker_name: '', worker_type: 'Carpenter', status: 'present' as 'present' | 'absent' | 'half_day' }] });

  const [seDialog, setSeDialog] = useState(false);
  const [seForm, setSeForm] = useState<{ title: string; amount: string; expense_date: string; category: string; receipt: File | null }>({ title: '', amount: '', expense_date: new Date().toISOString().split('T')[0], category: 'petty_purchase', receipt: null });

  const [caDialog, setCaDialog] = useState(false);
  const [caForm, setCaForm] = useState({ logId: 0, customer_approved: true, customer_feedback: '' });

  const [mediaPreview, setMediaPreview] = useState<{ open: boolean; url: string; title: string; type: 'image' | 'video' | 'document' }>({ open: false, url: '', title: '', type: 'image' });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dispatch Form Options for Material Consumptions
  const { data: dispatchFormOptions } = useDispatchFormOptions();
  const dispatchOptions = dispatchFormOptions?.data;

  // Mutations
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();
  const deleteMutation = useDeleteProject();
  const addMilestone = useAddMilestone(selectedId ?? 0);
  const updateMilestone = useUpdateMilestone(selectedId ?? 0);
  const deleteMilestone = useDeleteMilestone(selectedId ?? 0);
  const addProgressLog = useAddProgressLog(selectedId ?? 0);
  const addTeamMember = useAddTeamMember(selectedId ?? 0);
  const removeTeamMember = useRemoveTeamMember(selectedId ?? 0);
  const uploadDoc = useUploadDocument(selectedId ?? 0);
  const deleteDoc = useDeleteDocument(selectedId ?? 0);

  // Phase 10 Mutations
  const approveProgress = useApproveProgressLog(selectedId ?? 0);
  const logConsumption = useLogMaterialConsumption(selectedId ?? 0);
  const logAttendance = useLogWorkerAttendance(selectedId ?? 0);
  const logExpense = useLogExpense(selectedId ?? 0);
  const approveExpense = useProcessExpenseApproval(selectedId ?? 0);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingProject(null);
    setFormData(empty);
    setModalOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditingProject(p);
    setFormData({
      name: p.name, description: p.description || '', status: p.status,
      site_address: p.site_address || '', site_contact_name: p.site_contact_name || '',
      site_contact_phone: p.site_contact_phone || '',
      budget: parseFloat(p.budget), material_budget: parseFloat(p.material_budget),
      estimated_cost: parseFloat(p.estimated_cost), actual_cost: parseFloat(p.actual_cost),
      completion_percent: p.completion_percent,
      start_date: p.start_date ? p.start_date.split('T')[0] : '',
      end_date: p.end_date ? p.end_date.split('T')[0] : '',
      customer_id: p.customer_id, project_manager_id: p.project_manager_id,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { showToast('Project name is required.', 'warning'); return; }
    setFormLoading(true);
    try {
      if (editingProject) {
        await updateMutation.mutateAsync({ id: editingProject.id, data: formData });
        showToast('Project updated.', 'success');
        if (selectedId === editingProject.id) {
          // refresh detail
        }
      } else {
        const res = await createMutation.mutateAsync(formData);
        showToast(`Project ${res.data.project_code} created!`, 'success');
      }
      setModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Save failed.', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Archive this project?')) return;
    await deleteMutation.mutateAsync(id);
    showToast('Project archived.', 'success');
    if (selectedId === id) setView('list');
  };

  const openDetail = (p: Project) => {
    setSelectedId(p.id);
    setActiveTab(0);
    setView('detail');
  };

  const handleSort = (field: string) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneForm.title) { showToast('Title is required.', 'warning'); return; }
    await addMilestone.mutateAsync(milestoneForm);
    showToast('Milestone added.', 'success');
    setMilestoneDialog(false);
    setMilestoneForm({ title: '', description: '', due_date: '', status: 'pending' });
  };

  const handleToggleMilestone = async (mid: number, current: string) => {
    const newStatus = current === 'completed' ? 'pending' : 'completed';
    const data: any = { status: newStatus };
    if (newStatus === 'completed') data.completed_at = new Date().toISOString();
    else data.completed_at = null;
    await updateMilestone.mutateAsync({ mid, data });
    showToast(`Milestone marked as ${newStatus}.`, 'success');
  };

  const handleAddProgressLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progressForm.description) { showToast('Description is required.', 'warning'); return; }
    await addProgressLog.mutateAsync(progressForm);
    showToast('Progress log saved.', 'success');
    setProgressDialog(false);
    setProgressForm({ log_date: new Date().toISOString().split('T')[0], description: '', completion_percent: project?.completion_percent ?? 0 });
  };

  const handleAddTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.user_id) { showToast('Select a user.', 'warning'); return; }
    await addTeamMember.mutateAsync(teamForm);
    showToast('Team member added.', 'success');
    setTeamDialog(false);
    setTeamForm({ user_id: 0, role: '' });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadDoc.mutateAsync(file);
    showToast('File uploaded.', 'success');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── KPI Cards ──────────────────────────────────────────────────────────────

  const allRows = rows;
  const kpis = [
    { label: 'Active', count: allRows.filter(p => p.status === 'active' || p.status === 'in_progress').length, color: '#4fc3f7' },
    { label: 'Completed', count: allRows.filter(p => p.status === 'completed').length, color: '#81c784' },
    { label: 'Pending', count: allRows.filter(p => p.status === 'pending').length, color: '#ffb74d' },
    { label: 'On Hold', count: allRows.filter(p => p.status === 'on_hold').length, color: '#e57373' },
  ];

  // ── Table Columns ──────────────────────────────────────────────────────────

  const columns: ColumnDefinition[] = [
    {
      field: 'project_code', headerName: 'Project', sortable: true,
      render: (row: Project) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 800, color: 'primary.main', cursor: 'pointer' }}
            onClick={() => openDetail(row)}>{row.project_code || 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary">{row.name}</Typography>
        </Box>
      ),
    },
    {
      field: 'customer', headerName: 'Customer',
      render: (row: Project) => <Typography variant="body2">{row.customer?.name || '—'}</Typography>,
    },
    {
      field: 'status', headerName: 'Status', sortable: true,
      render: (row: Project) => {
        const cfg = STATUS_CONFIG[row.status] || { label: row.status, color: 'default' };
        return <Chip label={cfg.label} color={cfg.color} size="small" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />;
      },
    },
    {
      field: 'completion_percent', headerName: 'Progress', sortable: true,
      render: (row: Project) => (
        <Box sx={{ minWidth: 100 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
            <Typography variant="caption" color="text.secondary">Completion</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>{row.completion_percent}%</Typography>
          </Box>
          <LinearProgress variant="determinate" value={row.completion_percent}
            sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': {
                background: row.completion_percent >= 100 ? 'linear-gradient(90deg,#4caf50,#81c784)' :
                  row.completion_percent >= 50 ? 'linear-gradient(90deg,#ff9800,#ffb74d)' :
                    'linear-gradient(90deg,#7c4dff,#b47cff)',
              }
            }}
          />
        </Box>
      ),
    },
    {
      field: 'budget', headerName: 'Budget', sortable: true,
      render: (row: Project) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatINR(row.budget)}</Typography>
          <Typography variant="caption" color="text.secondary">Est: {formatINR(row.estimated_cost)}</Typography>
        </Box>
      ),
    },
    {
      field: 'end_date', headerName: 'Deadline', sortable: true,
      render: (row: Project) => (
        <Typography variant="body2" sx={{
          color: row.end_date && new Date(row.end_date) < new Date() && row.status !== 'completed' ? 'error.main' : 'inherit'
        }}>{formatDate(row.end_date)}</Typography>
      ),
    },
    {
      field: 'actions', headerName: 'Actions',
      render: (row: Project) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => openDetail(row)} color="primary"><ProjectIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit(row)} color="info"><EditIcon fontSize="small" /></IconButton>
          </Tooltip>
          <Tooltip title="Archive">
            <IconButton size="small" onClick={() => handleDelete(row.id)} color="error"><DeleteIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: LIST VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  if (view === 'list') {
    return (
      <Box sx={{ pb: 6 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>Project Management</Typography>
            <Typography variant="body2" color="text.secondary">The heart of your interior ERP — track every site, budget, and milestone</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
            sx={{ py: 1.2, px: 2.5, borderRadius: 3.5, background: 'linear-gradient(135deg, #7c4dff 0%, #b47cff 100%)', boxShadow: '0 4px 15px rgba(124,77,255,0.3)' }}>
            New Project
          </Button>
        </Box>

        {/* KPI Mini Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {kpis.map(k => (
            <Grid key={k.label} size={3}>
              <Paper sx={{ p: 2, borderRadius: 4, textAlign: 'center', borderTop: `3px solid ${k.color}` }}>
                <Typography variant="h4" sx={{ fontWeight: 900, color: k.color }}>{k.count}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{k.label}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 4, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Box component="form" onSubmit={e => { e.preventDefault(); setSearchQuery(search); setPagination(p => ({ ...p, current_page: 1 })); }}
            sx={{ display: 'flex', flexGrow: 1, gap: 1 }}>
            <TextField size="small" placeholder="Search by name, code, or customer..." value={search}
              onChange={e => setSearch(e.target.value)} sx={{ flexGrow: 1 }}
              slotProps={{ input: { startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />, endAdornment: search && <IconButton size="small" onClick={() => { setSearch(''); setSearchQuery(''); }} edge="end"><ClearIcon fontSize="small" /></IconButton> } }} />
            <Button type="submit" variant="outlined">Search</Button>
          </Box>
          <TextField select size="small" label="Status" value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, current_page: 1 })); }} sx={{ minWidth: 160 }}>
            <MenuItem value="all">All Projects</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="in_progress">In Progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="on_hold">On Hold</MenuItem>
          </TextField>
        </Paper>

        <DataTable columns={columns} rows={rows} pagination={pagination}
          onPageChange={page => setPagination(p => ({ ...p, current_page: page }))}
          onRowsPerPageChange={perPage => setPagination(p => ({ ...p, per_page: perPage, current_page: 1 }))}
          sortField={sortField} sortOrder={sortOrder} onSort={handleSort} loading={isLoading} />

        {renderModal()}
      </Box>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: DETAIL VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <Box sx={{ pb: 6 }}>
      {/* Breadcrumb nav */}
      <Breadcrumbs separator={<NavNextIcon fontSize="small" />} sx={{ mb: 2 }}>
        <Link component="button" underline="hover" sx={{ cursor: 'pointer', fontWeight: 700, color: 'text.secondary', border: 'none', bgcolor: 'transparent' }}
          onClick={() => setView('list')}>
          Projects
        </Link>
        <Typography sx={{ fontWeight: 700 }} color="text.primary">
          {project?.project_code || 'Loading...'}
        </Typography>
      </Breadcrumbs>

      {detailLoading || !project ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>
      ) : (
        <>
          {/* Project Header Card */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 4, background: 'linear-gradient(135deg, rgba(124,77,255,0.08) 0%, transparent 60%)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Typography variant="h4" sx={{ fontWeight: 900 }}>{project.name}</Typography>
                  <Chip label={STATUS_CONFIG[project.status]?.label || project.status} color={STATUS_CONFIG[project.status]?.color || 'default'} size="small" sx={{ fontWeight: 800 }} />
                </Box>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'primary.main', fontWeight: 700, mb: 1 }}>{project.project_code}</Typography>
                {project.description && <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 600 }}>{project.description}</Typography>}
                <Box sx={{ display: 'flex', gap: 3, mt: 1.5, flexWrap: 'wrap' }}>
                  {project.customer && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><PersonIcon fontSize="small" color="disabled" /><Typography variant="caption" color="text.secondary">{project.customer.name}</Typography></Box>}
                  {project.start_date && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><CalIcon fontSize="small" color="disabled" /><Typography variant="caption" color="text.secondary">{formatDate(project.start_date)} → {formatDate(project.end_date)}</Typography></Box>}
                  {project.manager && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><GroupIcon fontSize="small" color="disabled" /><Typography variant="caption" color="text.secondary">PM: {project.manager.name}</Typography></Box>}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <CompletionRing percent={project.completion_percent} size={80} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button startIcon={<EditIcon />} variant="outlined" size="small" onClick={() => openEdit(project)}>Edit</Button>
                  <Button startIcon={<BackIcon />} variant="outlined" size="small" onClick={() => setView('list')}>All Projects</Button>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Tabs */}
          <Paper sx={{ borderRadius: 4, overflow: 'hidden' }}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable"
              sx={{ borderBottom: 1, borderColor: 'divider', px: 2, '& .MuiTab-root': { fontWeight: 700 } }}>
              <Tab label="Overview" />
              <Tab label={<Badge badgeContent={project.milestones?.length} color="primary">Milestones</Badge>} />
              <Tab label={<Badge badgeContent={project.progressLogs?.length} color="info">Progress Log</Badge>} />
              <Tab label={<Badge badgeContent={project.documents?.length} color="secondary">Documents</Badge>} />
              <Tab label="Financial" />
              <Tab label={<Badge badgeContent={project.materialConsumptions?.length} color="warning">Consumption</Badge>} />
              <Tab label={<Badge badgeContent={project.workerAttendances?.length} color="success">Attendance</Badge>} />
              <Tab label={<Badge badgeContent={project.siteExpenses?.length} color="error">Expenses</Badge>} />
            </Tabs>

            <Box sx={{ p: 3 }}>
              {/* ── TAB 0: OVERVIEW ── */}
              {activeTab === 0 && (
                <Grid container spacing={3}>
                  {/* Site Info */}
                  <Grid size={6}>
                    <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
                      <CardContent>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationIcon fontSize="small" color="primary" /> Site Information
                        </Typography>
                        {project.site_address ? (
                          <>
                            <Typography variant="body2" sx={{ mb: 1 }}>{project.site_address}</Typography>
                            {project.site_contact_name && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                                <PersonIcon fontSize="small" color="disabled" />
                                <Typography variant="body2">{project.site_contact_name}</Typography>
                              </Box>
                            )}
                            {project.site_contact_phone && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <PhoneIcon fontSize="small" color="disabled" />
                                <Typography variant="body2">{project.site_contact_phone}</Typography>
                              </Box>
                            )}
                          </>
                        ) : (
                          <Alert severity="info" variant="outlined">No site information added yet.</Alert>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Team Members */}
                  <Grid size={6}>
                    <Card variant="outlined" sx={{ borderRadius: 3, height: '100%' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TeamIcon fontSize="small" color="primary" /> Team Members
                          </Typography>
                          <Button size="small" startIcon={<AddPersonIcon />} onClick={() => setTeamDialog(true)}>Add</Button>
                        </Box>
                        {project.teamMembers?.length ? (
                          <List dense disablePadding>
                            {project.teamMembers.map(m => (
                              <ListItem key={m.id} disableGutters>
                                <ListItemAvatar>
                                  <Avatar sx={{ width: 32, height: 32, fontSize: '0.85rem', bgcolor: 'primary.main' }}>
                                    {m.user?.name?.[0] ?? '?'}
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText primary={m.user?.name} secondary={m.role || 'Team Member'} slotProps={{ primary: { sx: { fontWeight: 700, fontSize: '0.875rem' } } }} />
                                <ListItemSecondaryAction>
                                  <IconButton size="small" color="error" onClick={() => removeTeamMember.mutateAsync(m.user_id)}>
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </ListItemSecondaryAction>
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Alert severity="info" variant="outlined">No team members assigned.</Alert>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Linked Quotations & Invoices */}
                  {(project.quotations?.length || project.invoices?.length) ? (
                    <Grid size={12}>
                      <Card variant="outlined" sx={{ borderRadius: 3 }}>
                        <CardContent>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>Linked Documents</Typography>
                          <Grid container spacing={2}>
                            {project.quotations?.map(q => (
                              <Grid key={q.id} size={4}>
                                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main' }}>{q.qtn_number}</Typography>
                                  <Typography variant="body2" noWrap>{q.title}</Typography>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                    <Chip label={q.status} size="small" sx={{ fontSize: '0.6rem' }} />
                                    <Typography variant="caption" sx={{ fontWeight: 700 }}>{formatINR(q.total)}</Typography>
                                  </Box>
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  ) : null}
                </Grid>
              )}

              {/* ── TAB 1: MILESTONES ── */}
              {activeTab === 1 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Project Milestones</Typography>
                    <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={() => setMilestoneDialog(true)}>Add Milestone</Button>
                  </Box>
                  {!project.milestones?.length ? (
                    <Alert severity="info">No milestones added yet. Add your first milestone to track key deliverables.</Alert>
                  ) : (
                    <Box sx={{ position: 'relative', pl: 3, '&::before': { content: '""', position: 'absolute', left: 11, top: 0, bottom: 0, width: 2, bgcolor: 'divider' } }}>
                      {project.milestones.map((m) => {
                        const cfg = MILESTONE_STATUS_CONFIG[m.status] || MILESTONE_STATUS_CONFIG.pending;
                        return (
                          <Box key={m.id} sx={{ display: 'flex', gap: 2, mb: 2.5, position: 'relative' }}>
                            <Box sx={{ position: 'absolute', left: -26, top: 4, color: cfg.color, bgcolor: 'background.paper', borderRadius: '50%', display: 'flex' }}>
                              {cfg.icon}
                            </Box>
                            <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: 3, borderLeft: `4px solid`, borderColor: m.status === 'completed' ? 'success.main' : m.status === 'delayed' ? 'warning.main' : 'divider' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 800, textDecoration: m.status === 'completed' ? 'line-through' : 'none', color: m.status === 'completed' ? 'text.secondary' : 'text.primary' }}>
                                    {m.title}
                                  </Typography>
                                  {m.description && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.3 }}>{m.description}</Typography>}
                                  <Box sx={{ display: 'flex', gap: 2, mt: 0.8 }}>
                                    {m.due_date && <Typography variant="caption" color="text.secondary">Due: {formatDate(m.due_date)}</Typography>}
                                    {m.completed_at && <Typography variant="caption" color="success.main">Completed: {formatDate(m.completed_at)}</Typography>}
                                  </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                  <Tooltip title={m.status === 'completed' ? 'Mark Pending' : 'Mark Complete'}>
                                    <IconButton size="small" onClick={() => handleToggleMilestone(m.id, m.status)}
                                      color={m.status === 'completed' ? 'success' : 'default'}>
                                      <CheckIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <IconButton size="small" color="error" onClick={() => { if (window.confirm('Delete milestone?')) deleteMilestone.mutateAsync(m.id); }}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                            </Paper>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Box>
              )}

              {/* ── TAB 2: PROGRESS LOG ── */}
              {activeTab === 2 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Daily Progress Log</Typography>
                    <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={() => { setProgressForm({ log_date: new Date().toISOString().split('T')[0], description: '', completion_percent: project.completion_percent }); setProgressDialog(true); }}>
                      Log Progress
                    </Button>
                  </Box>
                  {!project.progressLogs?.length ? (
                    <Alert severity="info">No progress entries yet. Log your first daily update.</Alert>
                  ) : (
                    project.progressLogs.map(log => (
                      <Paper key={log.id} variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', bgcolor: 'action.hover', px: 1, py: 0.3, borderRadius: 1 }}>
                                {formatDate(log.log_date)}
                              </Typography>
                              {log.logger && <Typography variant="caption" color="text.secondary">by {log.logger.name}</Typography>}
                            </Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>{log.description}</Typography>
                            
                            {/* Customer Approval Section */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mt: 1.5 }}>
                              {log.customer_approved ? (
                                <Tooltip title={log.customer_feedback || 'No details'}>
                                  <Chip icon={<ApprovedIcon fontSize="small" />} label="Client Approved" color="success" size="small" sx={{ fontWeight: 800 }} />
                                </Tooltip>
                              ) : (
                                <>
                                  <Chip label="Pending Sign-off" size="small" variant="outlined" sx={{ fontWeight: 800 }} />
                                  <Button size="small" sx={{ textTransform: 'none', py: 0 }} onClick={() => { setCaForm({ logId: log.id, customer_approved: true, customer_feedback: '' }); setCaDialog(true); }}>
                                    Record Sign-off
                                  </Button>
                                </>
                              )}
                              {log.customer_feedback && (
                                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                  Feedback: "{log.customer_feedback}"
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right', ml: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main' }}>{log.completion_percent}%</Typography>
                            <Typography variant="caption" color="text.secondary">Completion</Typography>
                          </Box>
                        </Box>
                      </Paper>
                    ))
                  )}
                </Box>
              )}

              {/* ── TAB 3: DOCUMENTS ── */}
              {activeTab === 3 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Site media & documents</Typography>
                    <Box>
                      <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileUpload}
                        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt" />
                      <Button startIcon={uploadDoc.isPending ? <CircularProgress size={16} /> : <UploadIcon />}
                        variant="outlined" size="small" disabled={uploadDoc.isPending}
                        onClick={() => fileInputRef.current?.click()}>
                        Upload Site Media
                      </Button>
                    </Box>
                  </Box>

                  {!project.documents?.length ? (
                    <Alert severity="info">No media files uploaded yet. Upload site progress images, videos or drawings.</Alert>
                  ) : (
                    <Grid container spacing={2}>
                      {project.documents.map(doc => (
                        <Grid key={doc.id} size={{ xs: 12, sm: 6, md: 4 }}>
                          <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
                            onClick={() => {
                              if (doc.file_type === 'image' || doc.file_type === 'video') {
                                setMediaPreview({ open: true, url: doc.url, title: doc.file_name, type: doc.file_type });
                              }
                            }}>
                            {doc.file_type === 'image' ? (
                              <Box sx={{ height: 140, overflow: 'hidden', position: 'relative' }}>
                                <img src={doc.url} alt={doc.file_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <Box sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.6)', borderRadius: 1, px: 1, py: 0.2 }}>
                                  <Typography variant="caption" sx={{ color: '#fff', fontWeight: 800 }}>Image</Typography>
                                </Box>
                              </Box>
                            ) : doc.file_type === 'video' ? (
                              <Box sx={{ height: 140, overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#000' }}>
                                <VideoIcon sx={{ fontSize: 48, color: '#fff', opacity: 0.8 }} />
                                <Box sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'primary.main', borderRadius: 1, px: 1, py: 0.2 }}>
                                  <Typography variant="caption" sx={{ color: '#fff', fontWeight: 800 }}>Video</Typography>
                                </Box>
                              </Box>
                            ) : (
                              <Box sx={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'action.hover' }}>
                                <DocIcon sx={{ fontSize: 48, color: 'primary.main', opacity: 0.5 }} />
                              </Box>
                            )}
                            <Box sx={{ p: 1.5 }}>
                              <Typography variant="body2" noWrap sx={{ fontWeight: 700, mb: 0.3 }}>{doc.file_name}</Typography>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="caption" color="text.secondary">
                                  {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : '—'}
                                </Typography>
                                <Box onClick={e => e.stopPropagation()}>
                                  <Tooltip title="Open / Download">
                                    <IconButton size="small" component="a" href={doc.url} target="_blank"><DocIcon fontSize="small" /></IconButton>
                                  </Tooltip>
                                  <IconButton size="small" color="error" onClick={() => { if (window.confirm('Delete this file?')) deleteDoc.mutateAsync(doc.id); }}>
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              )}

              {/* ── TAB 4: FINANCIAL ── */}
              {activeTab === 4 && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 3 }}>Financial Overview</Typography>
                  <Grid container spacing={3}>
                    {[
                      { label: 'Total Budget', val: project.budget, color: '#7c4dff', icon: <MoneyIcon /> },
                      { label: 'Material Budget', val: project.material_budget, color: '#2196f3', icon: <MoneyIcon /> },
                      { label: 'Estimated Cost', val: project.estimated_cost, color: '#ff9800', icon: <MoneyIcon /> },
                      { label: 'Actual Cost', val: project.actual_cost, color: '#f44336', icon: <MoneyIcon /> },
                    ].map(item => (
                      <Grid key={item.label} size={{ xs: 12, sm: 6, md: 3 }}>
                        <Paper sx={{ p: 2.5, borderRadius: 3, borderTop: `3px solid ${item.color}`, textAlign: 'center' }}>
                          <Typography variant="h5" sx={{ fontWeight: 900, color: item.color }}>{formatINR(item.val)}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</Typography>
                        </Paper>
                      </Grid>
                    ))}

                    {/* Cost vs Budget bars */}
                    <Grid size={12}>
                      <Card variant="outlined" sx={{ borderRadius: 3 }}>
                        <CardContent>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>Budget Utilization</Typography>
                          {[
                            { label: 'Budget Used (Actual / Budget)', val: (parseFloat(project.actual_cost) / parseFloat(project.budget)) * 100, actual: project.actual_cost, total: project.budget },
                            { label: 'Estimation Accuracy (Actual / Estimated)', val: parseFloat(project.estimated_cost) > 0 ? (parseFloat(project.actual_cost) / parseFloat(project.estimated_cost)) * 100 : 0, actual: project.actual_cost, total: project.estimated_cost },
                            { label: 'Remaining Budget', val: Math.max(0, ((parseFloat(project.budget) - parseFloat(project.actual_cost)) / parseFloat(project.budget)) * 100), actual: (parseFloat(project.budget) - parseFloat(project.actual_cost)).toString(), total: project.budget },
                          ].map(bar => (
                            <Box key={bar.label} sx={{ mb: 2.5 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">{bar.label}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatINR(bar.actual)} / {formatINR(bar.total)} ({Math.min(bar.val, 999).toFixed(1)}%)</Typography>
                              </Box>
                              <LinearProgress variant="determinate" value={Math.min(bar.val, 100)}
                                sx={{ height: 10, borderRadius: 5, bgcolor: 'action.hover',
                                  '& .MuiLinearProgress-bar': { background: bar.val > 100 ? 'linear-gradient(90deg,#f44336,#ef9a9a)' : bar.val > 80 ? 'linear-gradient(90deg,#ff9800,#ffb74d)' : 'linear-gradient(90deg,#4caf50,#81c784)' }
                                }} />
                            </Box>
                          ))}
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Linked Invoices */}
                    {project.invoices?.length ? (
                      <Grid size={12}>
                        <Card variant="outlined" sx={{ borderRadius: 3 }}>
                          <CardContent>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>Invoices</Typography>
                            {project.invoices.map(inv => (
                              <Box key={inv.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{inv.invoice_number}</Typography>
                                <Chip label={inv.status} size="small" sx={{ fontSize: '0.65rem' }} />
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatINR(inv.amount)}</Typography>
                              </Box>
                            ))}
                          </CardContent>
                        </Card>
                      </Grid>
                    ) : null}
                  </Grid>
                </Box>
              )}

              {/* ── TAB 5: MATERIAL CONSUMPTION ── */}
              {activeTab === 5 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Material Consumptions Log</Typography>
                    <Button startIcon={<AddIcon />} variant="outlined" size="small" onClick={() => { setMcForm({ warehouse_id: '', material_id: '', batch_id: '', quantity_consumed: 0, consumption_date: new Date().toISOString().split('T')[0], notes: '' }); setMcDialog(true); }}>
                      Log Consumption
                    </Button>
                  </Box>
                  {!project.materialConsumptions?.length ? (
                    <Alert severity="info">No material consumptions recorded yet for this project.</Alert>
                  ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: 'action.hover' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Material</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Source Warehouse</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Batch Number</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} align="right">Qty Consumed</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Logged By</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Notes</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {project.materialConsumptions.map(mc => (
                            <TableRow key={mc.id} hover>
                              <TableCell>{formatDate(mc.consumption_date)}</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>{mc.material?.name}</TableCell>
                              <TableCell>{mc.warehouse?.name}</TableCell>
                              <TableCell>{mc.batch?.batch_number ? <Chip label={mc.batch.batch_number} size="small" variant="outlined" /> : '—'}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>{parseFloat(mc.quantity_consumed)} {mc.material?.unit}</TableCell>
                              <TableCell>{mc.logger?.name}</TableCell>
                              <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{mc.notes || '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {/* ── TAB 6: WORKER ATTENDANCE ── */}
              {activeTab === 6 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Daily Site Attendance Register</Typography>
                    <Button startIcon={<AttendanceIcon />} variant="outlined" size="small" onClick={() => { setWaForm({ attendance_date: new Date().toISOString().split('T')[0], items: [{ worker_name: '', worker_type: 'Carpenter', status: 'present' }] }); setWaDialog(true); }}>
                      Log Attendance
                    </Button>
                  </Box>
                  {!project.workerAttendances?.length ? (
                    <Alert severity="info">No worker attendance logs saved yet.</Alert>
                  ) : (
                    <Grid container spacing={2}>
                      {/* Group attendance records by date */}
                      {Array.from(new Set(project.workerAttendances.map(a => a.attendance_date))).map(dateStr => {
                        const records = project.workerAttendances?.filter(a => a.attendance_date === dateStr) || [];
                        const presentCount = records.filter(r => r.status === 'present').length;
                        const halfDayCount = records.filter(r => r.status === 'half_day').length;
                        return (
                          <Grid key={dateStr} size={{ xs: 12, md: 6 }}>
                            <Card variant="outlined" sx={{ borderRadius: 3 }}>
                              <CardContent sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                                    {formatDate(dateStr)}
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Chip label={`Present: ${presentCount}`} size="small" color="success" />
                                    {halfDayCount > 0 && <Chip label={`Half Day: ${halfDayCount}`} size="small" color="warning" />}
                                  </Box>
                                </Box>
                                <Divider sx={{ mb: 1 }} />
                                <List disablePadding sx={{ maxHeight: 200, overflowY: 'auto' }}>
                                  {records.map(r => (
                                    <ListItem key={r.id} sx={{ px: 0, py: 0.5 }}>
                                      <ListItemText
                                        primary={<Typography variant="body2" sx={{ fontWeight: 700 }}>{r.worker_name}</Typography>}
                                        secondary={<Typography variant="caption" color="text.secondary">{r.worker_type}</Typography>}
                                      />
                                      <Chip
                                        label={r.status === 'present' ? 'Present' : r.status === 'half_day' ? 'Half Day' : 'Absent'}
                                        color={r.status === 'present' ? 'success' : r.status === 'half_day' ? 'warning' : 'error'}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontWeight: 800, fontSize: '0.65rem' }}
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              </CardContent>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  )}
                </Box>
              )}

              {/* ── TAB 7: SITE EXPENSES ── */}
              {activeTab === 7 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Site Petty Cash Expenses</Typography>
                    <Button startIcon={<ExpenseIcon />} variant="outlined" size="small" onClick={() => { setSeForm({ title: '', amount: '', expense_date: new Date().toISOString().split('T')[0], category: 'petty_purchase', receipt: null }); setSeDialog(true); }}>
                      Log Site Expense
                    </Button>
                  </Box>
                  {!project.siteExpenses?.length ? (
                    <Alert severity="info">No expenses logged for this project yet.</Alert>
                  ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3 }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: 'action.hover' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Expense Title</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} align="right">Amount</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Logged By</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Receipt</TableCell>
                            <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                            <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {project.siteExpenses.map(exp => {
                            const isPending = exp.status === 'pending';
                            const canReview = hasPermission('projects:approve') || hasRole('superadmin');
                            return (
                              <TableRow key={exp.id} hover>
                                <TableCell>{formatDate(exp.expense_date)}</TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>{exp.title}</TableCell>
                                <TableCell sx={{ textTransform: 'capitalize' }}>{exp.category.replace('_', ' ')}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 800, color: 'error.main' }}>{formatINR(exp.amount)}</TableCell>
                                <TableCell>{exp.logger?.name}</TableCell>
                                <TableCell>
                                  {exp.receipt_path ? (
                                    <Button size="small" component="a" href={`http://localhost:8000/storage/${exp.receipt_path}`} target="_blank" startIcon={<DocIcon fontSize="small" />}>
                                      View Receipt
                                    </Button>
                                  ) : (
                                    <Typography variant="caption" color="text.secondary">No receipt</Typography>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={exp.status}
                                    color={exp.status === 'approved' ? 'success' : exp.status === 'rejected' ? 'error' : 'warning'}
                                    size="small"
                                    sx={{ fontWeight: 800, textTransform: 'capitalize' }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  {isPending && canReview ? (
                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                      <Button size="small" color="success" variant="outlined" sx={{ py: 0 }} onClick={async () => {
                                        try {
                                          await approveExpense.mutateAsync({ expenseId: exp.id, status: 'approved' });
                                          showToast('Expense approved. Added to project actual costs.', 'success');
                                        } catch (err: any) { showToast(err.message, 'error'); }
                                      }}>Approve</Button>
                                      <Button size="small" color="error" variant="outlined" sx={{ py: 0 }} onClick={async () => {
                                        try {
                                          await approveExpense.mutateAsync({ expenseId: exp.id, status: 'rejected' });
                                          showToast('Expense claim rejected.', 'info');
                                        } catch (err: any) { showToast(err.message, 'error'); }
                                      }}>Reject</Button>
                                    </Box>
                                  ) : exp.status === 'approved' && exp.approver ? (
                                    <Typography variant="caption" color="text.secondary">Approved by {exp.approver.name}</Typography>
                                  ) : '—'}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </>
      )}

      {/* Sub-dialogs */}
      {renderMilestoneDialog()}
      {renderProgressDialog()}
      {renderTeamDialog()}
      {renderModal()}
      {renderMaterialConsumptionDialog()}
      {renderWorkerAttendanceDialog()}
      {renderSiteExpenseDialog()}
      {renderCustomerApprovalDialog()}
      {renderMediaPreviewDialog()}
    </Box>
  );

  // ── Modal / Dialog renderers (defined as inner functions to avoid repeated code) ──

  function renderModal() {
    return (
      <Dialog open={modalOpen} onClose={() => !formLoading && setModalOpen(false)} maxWidth="md" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid', borderColor: 'divider' }}>
          {editingProject ? `Edit — ${editingProject.project_code}` : 'Register New Project'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>

            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField fullWidth required label="Project Name" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
              </Grid>
              <Grid size={12}>
                <TextField fullWidth multiline rows={2} label="Description" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth select label="Status" value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="on_hold">On Hold</MenuItem>
                </TextField>
              </Grid>
              <Grid size={6}>
                <TextField fullWidth type="number" label="Completion %" value={formData.completion_percent} onChange={e => setFormData(p => ({ ...p, completion_percent: Number(e.target.value) }))} slotProps={{ input: { inputProps: { min: 0, max: 100 } } }} />
              </Grid>
            </Grid>

            <Divider><Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', px: 1, textTransform: 'uppercase', letterSpacing: 1 }}>Site Information</Typography></Divider>

            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField fullWidth label="Site Address" value={formData.site_address} onChange={e => setFormData(p => ({ ...p, site_address: e.target.value }))} />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth label="Site Contact Name" value={formData.site_contact_name} onChange={e => setFormData(p => ({ ...p, site_contact_name: e.target.value }))} />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth label="Site Contact Phone" value={formData.site_contact_phone} onChange={e => setFormData(p => ({ ...p, site_contact_phone: e.target.value }))} />
              </Grid>
            </Grid>

            <Divider><Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', px: 1, textTransform: 'uppercase', letterSpacing: 1 }}>Budget & Timeline</Typography></Divider>

            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField fullWidth type="number" label="Total Budget (₹)" value={formData.budget} onChange={e => setFormData(p => ({ ...p, budget: Number(e.target.value) }))} slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth type="number" label="Material Budget (₹)" value={formData.material_budget} onChange={e => setFormData(p => ({ ...p, material_budget: Number(e.target.value) }))} slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth type="number" label="Estimated Cost (₹)" value={formData.estimated_cost} onChange={e => setFormData(p => ({ ...p, estimated_cost: Number(e.target.value) }))} slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth type="number" label="Actual Cost (₹)" value={formData.actual_cost} onChange={e => setFormData(p => ({ ...p, actual_cost: Number(e.target.value) }))} slotProps={{ input: { startAdornment: <InputAdornment position="start">₹</InputAdornment> } }} />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth type="date" label="Start Date" value={formData.start_date} onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth type="date" label="End Date" value={formData.end_date} onChange={e => setFormData(p => ({ ...p, end_date: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
              <Grid size={6}>
                <TextField fullWidth select label="Project Manager" value={formData.project_manager_id ?? ''} onChange={e => setFormData(p => ({ ...p, project_manager_id: Number(e.target.value) || null }))}>
                  <MenuItem value="">None</MenuItem>
                  {users.map(u => <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>

          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            <Button onClick={() => setModalOpen(false)} disabled={formLoading} variant="outlined">Cancel</Button>
            <Button type="submit" disabled={formLoading} variant="contained">
              {formLoading ? <CircularProgress size={20} color="inherit" /> : editingProject ? 'Update Project' : 'Create Project'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }

  function renderMilestoneDialog() {
    return (
      <Dialog open={milestoneDialog} onClose={() => setMilestoneDialog(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Add Milestone</DialogTitle>
        <form onSubmit={handleAddMilestone}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField fullWidth required label="Milestone Title" value={milestoneForm.title} onChange={e => setMilestoneForm(p => ({ ...p, title: e.target.value }))} />
            <TextField fullWidth multiline rows={2} label="Description (optional)" value={milestoneForm.description} onChange={e => setMilestoneForm(p => ({ ...p, description: e.target.value }))} />
            <Grid container spacing={2}>
              <Grid size={6}><TextField fullWidth type="date" label="Due Date" value={milestoneForm.due_date} onChange={e => setMilestoneForm(p => ({ ...p, due_date: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} /></Grid>
              <Grid size={6}>
                <TextField fullWidth select label="Status" value={milestoneForm.status} onChange={e => setMilestoneForm(p => ({ ...p, status: e.target.value }))}>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="delayed">Delayed</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setMilestoneDialog(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={addMilestone.isPending}>
              {addMilestone.isPending ? <CircularProgress size={18} /> : 'Add Milestone'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }

  function renderProgressDialog() {
    return (
      <Dialog open={progressDialog} onClose={() => setProgressDialog(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Log Progress Update</DialogTitle>
        <form onSubmit={handleAddProgressLog}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField fullWidth type="date" label="Log Date" value={progressForm.log_date} onChange={e => setProgressForm(p => ({ ...p, log_date: e.target.value }))} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField fullWidth multiline rows={3} required label="Progress Description" value={progressForm.description} onChange={e => setProgressForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe what work was done today..." />
            <Box>
              <Typography variant="body2" gutterBottom sx={{ fontWeight: 700 }}>
                Overall Completion: <span style={{ color: '#7c4dff' }}>{progressForm.completion_percent}%</span>
              </Typography>
              <input type="range" min={0} max={100} value={progressForm.completion_percent}
                onChange={e => setProgressForm(p => ({ ...p, completion_percent: Number(e.target.value) }))}
                style={{ width: '100%', accentColor: '#7c4dff' }} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setProgressDialog(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={addProgressLog.isPending}>
              {addProgressLog.isPending ? <CircularProgress size={18} /> : 'Save Log'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }

  function renderTeamDialog() {
    return (
      <Dialog open={teamDialog} onClose={() => setTeamDialog(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Add Team Member</DialogTitle>
        <form onSubmit={handleAddTeamMember}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField fullWidth select label="Select User" value={teamForm.user_id || ''} onChange={e => setTeamForm(p => ({ ...p, user_id: Number(e.target.value) }))}>
              <MenuItem value="">Choose a team member...</MenuItem>
              {users.map(u => (
                <MenuItem key={u.id} value={u.id}>
                  {u.name} — {u.roles.join(', ')}
                </MenuItem>
              ))}
            </TextField>
            <TextField fullWidth label="Role on this Project" value={teamForm.role} onChange={e => setTeamForm(p => ({ ...p, role: e.target.value }))} placeholder="e.g. Site Engineer, Supervisor..." />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setTeamDialog(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={addTeamMember.isPending}>
              {addTeamMember.isPending ? <CircularProgress size={18} /> : 'Add Member'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }

  // ── Material Consumption Dialog ───────────────────────────────────────────
  function renderMaterialConsumptionDialog() {
    return (
      <Dialog open={mcDialog} onClose={() => setMcDialog(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Log Material Consumption</DialogTitle>
        <form onSubmit={async e => {
          e.preventDefault();
          if (!mcForm.warehouse_id || !mcForm.material_id || !mcForm.quantity_consumed) {
            showToast('Warehouse, Material, and Quantity are required.', 'warning');
            return;
          }
          try {
            await logConsumption.mutateAsync({
              warehouse_id: Number(mcForm.warehouse_id),
              material_id: Number(mcForm.material_id),
              batch_id: mcForm.batch_id ? Number(mcForm.batch_id) : null,
              quantity_consumed: mcForm.quantity_consumed,
              consumption_date: mcForm.consumption_date,
              notes: mcForm.notes,
            });
            showToast('Material consumption logged and warehouse stock updated.', 'success');
            setMcDialog(false);
          } catch (err: any) { showToast(err.message, 'error'); }
        }}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField select fullWidth label="Source Warehouse" value={mcForm.warehouse_id} onChange={e => setMcForm((p: any) => ({ ...p, warehouse_id: Number(e.target.value) }))} required>
              {dispatchOptions?.warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
            </TextField>

            <TextField select fullWidth label="Material" value={mcForm.material_id} onChange={e => setMcForm((p: any) => ({ ...p, material_id: Number(e.target.value), batch_id: '' }))} required>
              {dispatchOptions?.materials.map(m => <MenuItem key={m.id} value={m.id}>{m.name} ({m.sku})</MenuItem>)}
            </TextField>

            <TextField select fullWidth label="Batch Allocation" value={mcForm.batch_id} onChange={e => setMcForm((p: any) => ({ ...p, batch_id: Number(e.target.value) }))}>
              <MenuItem value="">No Batch Allocation</MenuItem>
              {dispatchOptions?.batches.filter(b => b.material_id === Number(mcForm.material_id)).map(b => (
                <MenuItem key={b.id} value={b.id}>{b.batch_number}</MenuItem>
              ))}
            </TextField>

            <TextField type="number" fullWidth label="Quantity Consumed" value={mcForm.quantity_consumed || ''} onChange={e => setMcForm((p: any) => ({ ...p, quantity_consumed: Number(e.target.value) }))} required slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }} />
            <TextField type="date" fullWidth label="Consumption Date" value={mcForm.consumption_date} onChange={e => setMcForm((p: any) => ({ ...p, consumption_date: e.target.value }))} required slotProps={{ inputLabel: { shrink: true } }} />
            <TextField fullWidth label="Line Remarks" value={mcForm.notes} onChange={e => setMcForm((p: any) => ({ ...p, notes: e.target.value }))} placeholder="Balcony cladding ceiling work..." />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setMcDialog(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={logConsumption.isPending}>Save Record</Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }

  // ── Worker Attendance Dialog ──────────────────────────────────────────────
  function renderWorkerAttendanceDialog() {
    const handleAddWorkerLine = () => {
      setWaForm(p => ({
        ...p,
        items: [...p.items, { worker_name: '', worker_type: 'Carpenter', status: 'present' }],
      }));
    };

    const handleRemoveWorkerLine = (idx: number) => {
      setWaForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
    };

    const handleWorkerChange = (idx: number, field: string, val: any) => {
      const items = [...waForm.items];
      (items[idx] as any)[field] = val;
      setWaForm(p => ({ ...p, items }));
    };

    return (
      <Dialog open={waDialog} onClose={() => setWaDialog(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Log Daily Attendance Register</DialogTitle>
        <form onSubmit={async e => {
          e.preventDefault();
          if (waForm.items.some(i => !i.worker_name.trim())) {
            showToast('All worker names are required.', 'warning');
            return;
          }
          try {
            await logAttendance.mutateAsync({
              attendance_date: waForm.attendance_date,
              items: waForm.items.map(i => ({ ...i, worker_name: i.worker_name.trim() })),
            });
            showToast('Worker attendance saved successfully.', 'success');
            setWaDialog(false);
          } catch (err: any) { showToast(err.message, 'error'); }
        }}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField type="date" fullWidth label="Attendance Date" value={waForm.attendance_date} onChange={e => setWaForm(p => ({ ...p, attendance_date: e.target.value }))} required slotProps={{ inputLabel: { shrink: true } }} />
            
            <Divider><Typography variant="subtitle2" sx={{ px: 1, fontWeight: 800 }}>Labour Register Lines</Typography></Divider>

            {waForm.items.map((item, index) => (
              <Grid container spacing={2} key={index} sx={{ width: '100%', ml: 0, alignItems: 'center', mb: 1 }}>
                <Grid size={5}>
                  <TextField fullWidth size="small" label="Worker Name" value={item.worker_name} onChange={e => handleWorkerChange(index, 'worker_name', e.target.value)} required placeholder="e.g. Karan Johar" />
                </Grid>
                <Grid size={3}>
                  <TextField select fullWidth size="small" label="Trade / Role" value={item.worker_type} onChange={e => handleWorkerChange(index, 'worker_type', e.target.value)} required>
                    {['Carpenter', 'Painter', 'Electrician', 'Plumber', 'Supervisor', 'Helper'].map(t => (
                      <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={3}>
                  <TextField select fullWidth size="small" label="Status" value={item.status} onChange={e => handleWorkerChange(index, 'status', e.target.value)} required>
                    <MenuItem value="present">Present (Full Day)</MenuItem>
                    <MenuItem value="half_day">Half Day</MenuItem>
                    <MenuItem value="absent">Absent</MenuItem>
                  </TextField>
                </Grid>
                <Grid size={1}>
                  <IconButton size="small" color="error" disabled={waForm.items.length <= 1} onClick={() => handleRemoveWorkerLine(index)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Grid>
              </Grid>
            ))}

            <Box>
              <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddWorkerLine} size="small">Add Worker Line</Button>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setWaDialog(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={logAttendance.isPending}>Save Attendance</Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }

  // ── Site Expense Dialog ───────────────────────────────────────────────────
  function renderSiteExpenseDialog() {
    return (
      <Dialog open={seDialog} onClose={() => setSeDialog(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Log Site petty expense claim</DialogTitle>
        <form onSubmit={async e => {
          e.preventDefault();
          if (!seForm.title || !seForm.amount || !seForm.expense_date) {
            showToast('Title, Amount, and Date are required.', 'warning');
            return;
          }
          try {
            await logExpense.mutateAsync({
              title: seForm.title,
              amount: Number(seForm.amount),
              expense_date: seForm.expense_date,
              category: seForm.category,
              receipt: seForm.receipt,
            });
            showToast('Petty expense recorded pending manager audit.', 'success');
            setSeDialog(false);
          } catch (err: any) { showToast(err.message, 'error'); }
        }}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField fullWidth label="Expense Claim Title" value={seForm.title} onChange={e => setSeForm(p => ({ ...p, title: e.target.value }))} required placeholder="Local transport auto fare..." />
            
            <TextField type="number" fullWidth label="Amount Incurred" value={seForm.amount} onChange={e => setSeForm(p => ({ ...p, amount: e.target.value }))} required slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }} />

            <TextField type="date" fullWidth label="Date Incurred" value={seForm.expense_date} onChange={e => setSeForm(p => ({ ...p, expense_date: e.target.value }))} required slotProps={{ inputLabel: { shrink: true } }} />

            <TextField select fullWidth label="Expense Category" value={seForm.category} onChange={e => setSeForm(p => ({ ...p, category: e.target.value }))} required>
              <MenuItem value="petty_purchase">Petty Purchase</MenuItem>
              <MenuItem value="food">Food & Meals</MenuItem>
              <MenuItem value="transport">Local Transport</MenuItem>
              <MenuItem value="tools">Site Tools</MenuItem>
              <MenuItem value="other">Other / Miscellaneous</MenuItem>
            </TextField>

            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Attach Invoice Receipt (optional)</Typography>
              <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={e => {
                const file = e.target.files?.[0] || null;
                setSeForm(p => ({ ...p, receipt: file }));
              }} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setSeDialog(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={logExpense.isPending}>Submit Claim</Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }

  // ── Customer Approval Dialog ──────────────────────────────────────────────
  function renderCustomerApprovalDialog() {
    return (
      <Dialog open={caDialog} onClose={() => setCaDialog(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 4 } } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Record Progress Approval Sign-off</DialogTitle>
        <form onSubmit={async e => {
          e.preventDefault();
          try {
            await approveProgress.mutateAsync({
              logId: caForm.logId,
              customer_approved: caForm.customer_approved,
              customer_feedback: caForm.customer_feedback.trim(),
            });
            showToast('Progress log sign-off successfully recorded.', 'success');
            setCaDialog(false);
          } catch (err: any) { showToast(err.message, 'error'); }
        }}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Typography variant="body2" color="text.secondary">
              Record customer confirmation and feedback notes on this daily progress update.
            </Typography>
            <TextField select fullWidth label="Client Sign-off Status" value={caForm.customer_approved ? 'yes' : 'no'} onChange={e => setCaForm(p => ({ ...p, customer_approved: e.target.value === 'yes' }))}>
              <MenuItem value="yes">Approved (Work satisfactory)</MenuItem>
              <MenuItem value="no">Not Approved / Needs rework</MenuItem>
            </TextField>
            <TextField fullWidth multiline rows={3} label="Customer Feedback Notes" value={caForm.customer_feedback} onChange={e => setCaForm(p => ({ ...p, customer_feedback: e.target.value }))} placeholder="satisfactory work, balcony looking clean..." />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setCaDialog(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" disabled={approveProgress.isPending}>Save Sign-off</Button>
          </DialogActions>
        </form>
      </Dialog>
    );
  }

  // ── Media Preview Lightbox Dialog ─────────────────────────────────────────
  function renderMediaPreviewDialog() {
    return (
      <Dialog open={mediaPreview.open} onClose={() => setMediaPreview(p => ({ ...p, open: false }))} maxWidth="md" fullWidth slotProps={{ paper: { sx: { bgcolor: '#000', borderRadius: 4, overflow: 'hidden' } } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{mediaPreview.title}</span>
          <IconButton onClick={() => setMediaPreview(p => ({ ...p, open: false }))} sx={{ color: '#fff' }}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          {mediaPreview.type === 'image' ? (
            <img src={mediaPreview.url} alt={mediaPreview.title} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }} />
          ) : mediaPreview.type === 'video' ? (
            <video src={mediaPreview.url} controls style={{ width: '100%', maxHeight: '75vh' }} autoPlay />
          ) : null}
        </DialogContent>
      </Dialog>
    );
  }
};

// Need to declare GroupIcon that was used in the detail header
const GroupIcon = TeamIcon;

export default ProjectsPage;
