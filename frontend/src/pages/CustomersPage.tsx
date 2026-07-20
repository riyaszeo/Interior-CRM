import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Chip,
  Tooltip,
  Paper,
  Drawer,
  Tabs,
  Tab,
  Card,
  CardContent,
  List,
  ListItemText,
  ListItemIcon,
  Avatar,
  Divider,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Business as BusinessIcon,
  PinDrop as PinDropIcon,
  InsertDriveFile as FileIcon,
  History as HistoryIcon,
  Description as NoteIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import {
  useCustomersList,
  useCustomerDetails,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  useUploadDocument,
  useDeleteDocument
} from '../hooks/useCustomers';
import type { Customer } from '../hooks/useCustomers';
import { useToast } from '../context/ToastContext';
import { useForm } from '../hooks/useForm';
import { DataTable } from '../components/DataTable';
import type { ColumnDefinition } from '../components/DataTable';

// Color map for status chips
const statusColors: Record<string, 'info' | 'primary' | 'warning' | 'success' | 'default'> = {
  lead: 'default',
  contacted: 'info',
  proposal: 'warning',
  active: 'success',
  inactive: 'default',
};

export const CustomersPage: React.FC = () => {
  const { showToast } = useToast();

  // Search, filtering and sorting state
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 10,
    total: 0,
    last_page: 1,
  });

  // Query list
  const { data: listData, isLoading: listLoading } = useCustomersList(
    pagination.current_page,
    searchQuery,
    statusFilter,
    sortField,
    sortOrder
  );

  // Drawer Profile State
  const [profileId, setProfileId] = useState<number | null>(null);
  const { data: detailsData, isLoading: detailsLoading } = useCustomerDetails(profileId);
  const [tabValue, setTabValue] = useState(0);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [sameAsBilling, setSameAsBilling] = useState(false);

  // Mutations
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();
  const uploadDocMutation = useUploadDocument(profileId || 0);
  const deleteDocMutation = useDeleteDocument(profileId || 0);

  const [submitLoading, setSubmitLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Form setup using our validation hook
  const customerForm = useForm({
    name: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    gst_number: '',
    billing_address: '',
    site_address: '',
    lead_status: 'lead' as any,
    notes: '',
  }, {
    name: (val) => (!val ? 'Company or customer name is required' : null),
    contact_name: (val) => (!val ? 'Contact person name is required' : null),
    contact_phone: (val) => (!val ? 'Contact phone number is required' : null),
    contact_email: (val) => {
      if (!val) return null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !emailRegex.test(val) ? 'Invalid email format' : null;
    },
    billing_address: (val) => (!val ? 'Billing address is required' : null),
    site_address: (val) => (!val ? 'Site delivery address is required' : null),
    lead_status: (val) => (!val ? 'Lead status is required' : null),
  });

  // Re-map rows
  const rows = listData?.data?.items || [];

  // React to pagination updates
  React.useEffect(() => {
    if (listData?.data?.pagination) {
      const pag = listData.data.pagination;
      if (pag.total !== pagination.total || pag.current_page !== pagination.current_page) {
        setPagination(prev => ({
          ...prev,
          total: pag.total,
          last_page: pag.last_page
        }));
      }
    }
  }, [listData, pagination.total, pagination.current_page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(search);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleClearSearch = () => {
    setSearch('');
    setSearchQuery('');
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handleSort = (field: string) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setEditingCustomer(null);
    setSameAsBilling(false);
    customerForm.setValues({
      name: '',
      contact_name: '',
      contact_phone: '',
      contact_email: '',
      gst_number: '',
      billing_address: '',
      site_address: '',
      lead_status: 'lead' as any,
      notes: '',
    });
    customerForm.setErrors({});
    setModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setSameAsBilling(Boolean(customer.billing_address && customer.billing_address === customer.site_address));
    customerForm.setValues({
      name: customer.name,
      contact_name: customer.contact_name,
      contact_phone: customer.contact_phone,
      contact_email: customer.contact_email || '',
      gst_number: customer.gst_number || '',
      billing_address: customer.billing_address,
      site_address: customer.site_address,
      lead_status: customer.lead_status,
      notes: customer.notes || '',
    });
    customerForm.setErrors({});
    setModalOpen(true);
  };

  // Form Submit (Create / Edit)
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.validateAll()) {
      showToast('Please correct form errors.', 'warning');
      return;
    }

    setSubmitLoading(true);
    try {
      if (editingCustomer) {
        // Edit Customer
        const res = await updateMutation.mutateAsync({
          id: editingCustomer.id,
          data: customerForm.values as any,
        });
        if (res.success) {
          showToast('Customer details updated successfully.', 'success');
          setModalOpen(false);
        }
      } else {
        // Create Customer
        const res = await createMutation.mutateAsync(customerForm.values as any);
        if (res.success) {
          showToast('New customer registered successfully.', 'success');
          setModalOpen(false);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Operation failed.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Archive / Soft Delete Customer
  const handleDeleteCustomer = async (id: number) => {
    if (window.confirm('Are you sure you want to archive this customer? Linked projects and quotes will be preserved.')) {
      try {
        const res = await deleteMutation.mutateAsync(id);
        if (res.success) {
          showToast('Customer archived successfully.', 'success');
          if (profileId === id) setProfileId(null);
        }
      } catch (err: any) {
        showToast(err.message || 'Archiving failed.', 'error');
      }
    }
  };

  // Upload Document Action
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && profileId) {
      setUploadingFile(true);
      try {
        const res = await uploadDocMutation.mutateAsync(e.target.files[0]);
        if (res.success) {
          showToast('Document uploaded successfully.', 'success');
        }
      } catch (err: any) {
        showToast(err.message || 'Upload failed.', 'error');
      } finally {
        setUploadingFile(false);
      }
    }
  };

  // Delete Document Action
  const handleDeleteDoc = async (docId: number) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        const res = await deleteDocMutation.mutateAsync(docId);
        if (res.success) {
          showToast('Document deleted successfully.', 'success');
        }
      } catch (err: any) {
        showToast(err.message || 'Delete failed.', 'error');
      }
    }
  };

  // List Column Definitions
  const columns: ColumnDefinition[] = [
    {
      field: 'name',
      headerName: 'Company Name',
      sortable: true,
      render: (row: Customer) => (
        <Box sx={{ py: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>{row.name}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            GST: {row.gst_number || 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'contact_name',
      headerName: 'Contact Person',
      sortable: true,
      render: (row: Customer) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{row.contact_name}</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
            {row.contact_email}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'contact_phone',
      headerName: 'Phone',
      sortable: false,
    },
    {
      field: 'lead_status',
      headerName: 'Status',
      sortable: true,
      render: (row: Customer) => (
        <Chip
          label={row.lead_status.toUpperCase()}
          color={statusColors[row.lead_status]}
          size="small"
          sx={{ fontWeight: 800, fontSize: '0.65rem' }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      sortable: false,
      render: (row: Customer) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View Profile">
            <IconButton size="small" onClick={() => { setProfileId(row.id); setTabValue(0); }} color="primary">
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Customer">
            <IconButton size="small" onClick={() => handleOpenEdit(row)} color="info">
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Archive Customer">
            <IconButton size="small" onClick={() => handleDeleteCustomer(row.id)} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const profile = detailsData?.data;

  return (
    <Box sx={{ pb: 6 }}>
      
      {/* Header Panel */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Customer CRM Directory</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Register new clients, edit profiles, check timeline audit logs, and upload blueprints/tax files
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{
            py: 1.2,
            px: 2.5,
            borderRadius: 3.5,
            background: 'linear-gradient(135deg, #7c4dff 0%, #b47cff 100%)',
            boxShadow: '0 4px 15px rgba(124, 77, 255, 0.3)',
          }}
        >
          Add Customer
        </Button>
      </Box>

      {/* Filter and Search Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 4, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Box component="form" onSubmit={handleSearchSubmit} sx={{ display: 'flex', flexGrow: 1, gap: 1 }}>
          <TextField
            size="small"
            placeholder="Search by company name, contact, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flexGrow: 1 }}
            slotProps={{
              input: {
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />,
                endAdornment: search && (
                  <IconButton size="small" onClick={handleClearSearch} edge="end">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )
              }
            }}
          />
          <Button type="submit" variant="outlined" size="medium">
            Search
          </Button>
        </Box>

        <TextField
          select
          size="small"
          label="Filter by Lead Status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination(prev => ({ ...prev, current_page: 1 }));
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="all">All Lead Statuses</MenuItem>
          <MenuItem value="lead">Lead</MenuItem>
          <MenuItem value="contacted">Contacted</MenuItem>
          <MenuItem value="proposal">Proposal</MenuItem>
          <MenuItem value="active">Active Client</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </TextField>
      </Paper>

      {/* Table */}
      <DataTable
        columns={columns}
        rows={rows}
        pagination={pagination}
        onPageChange={(page) => setPagination(prev => ({ ...prev, current_page: page }))}
        onRowsPerPageChange={(perPage) => setPagination(prev => ({ ...prev, per_page: perPage, current_page: 1 }))}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        loading={listLoading}
      />

      {/* Profile Sidebar Drawer */}
      <Drawer
        anchor="right"
        open={profileId !== null}
        onClose={() => setProfileId(null)}
        slotProps={{
          backdrop: {
            sx: { bgcolor: 'rgba(0, 0, 0, 0.2)', backdropFilter: 'blur(2px)' }
          }
        }}
      >
        <Box sx={{ width: { xs: '100vw', sm: 550, md: 600 }, p: 3, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
          
          {detailsLoading || !profile ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={36} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Loading CRM Profile details...</Typography>
            </Box>
          ) : (
            <React.Fragment>
              
              {/* Header profile info */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>{profile.name}</Typography>
                  <Chip 
                    label={profile.lead_status.toUpperCase()} 
                    color={statusColors[profile.lead_status]} 
                    size="small" 
                    sx={{ fontWeight: 800, mt: 1, fontSize: '0.65rem' }} 
                  />
                </Box>
                <Button size="small" variant="outlined" onClick={() => setProfileId(null)}>Close</Button>
              </Box>
              
              <Divider sx={{ my: 1.5 }} />

              {/* CRM Tabs */}
              <Tabs value={tabValue} onChange={(_e, v) => setTabValue(v)} aria-label="customer profile widgets" sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tab label="Details" sx={{ fontWeight: 700 }} />
                <Tab label="Projects & Quotes" sx={{ fontWeight: 700 }} />
                <Tab label="Documents" sx={{ fontWeight: 700 }} />
                <Tab label="Activity History" sx={{ fontWeight: 700 }} />
              </Tabs>

              {/* TAB 0: Contact and Addresses */}
              {tabValue === 0 && (
                <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2.5, pr: 1 }}>
                  
                  {/* Contact details */}
                  <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Contact Person</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: 'primary.light', width: 32, height: 32 }}>
                          {profile.contact_name.charAt(0)}
                        </Avatar>
                        <ListItemText>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {profile.contact_name}
                          </Typography>
                        </ListItemText>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2.5, pl: 0.5, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon fontSize="inherit" color="disabled" />
                          <Typography variant="caption">{profile.contact_phone}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon fontSize="inherit" color="disabled" />
                          <Typography variant="caption">{profile.contact_email}</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* GST */}
                  <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>GSTIN Registration</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'primary.main' }}>
                        {profile.gst_number || 'No GST Registered (N/A)'}
                      </Typography>
                    </CardContent>
                  </Card>

                  {/* Addresses */}
                  <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <BusinessIcon fontSize="small" color="action" /> Billing Address
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', pl: 3 }}>
                          {profile.billing_address}
                        </Typography>
                      </Box>
                      <Divider />
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <PinDropIcon fontSize="small" color="action" /> Site Address
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', pl: 3 }}>
                          {profile.site_address}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>

                  {/* Notes */}
                  <Card variant="outlined" sx={{ borderRadius: 3, minHeight: 120 }}>
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <NoteIcon fontSize="small" color="action" /> Customer Notes
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                        {profile.notes || 'No notes added yet.'}
                      </Typography>
                    </CardContent>
                  </Card>

                </Box>
              )}

              {/* TAB 1: Projects & Quotations */}
              {tabValue === 1 && (
                <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3, pr: 1 }}>
                  
                  {/* Linked Projects */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>Customer Projects ({profile.projects?.length || 0})</Typography>
                    <List sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 0 }}>
                      {!profile.projects || profile.projects.length === 0 ? (
                        <Typography variant="body2" sx={{ color: 'text.secondary', pl: 1 }}>No projects associated with this client.</Typography>
                      ) : (
                        profile.projects.map((proj) => (
                          <Paper key={proj.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{proj.name}</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                                  Budget: ${parseFloat(proj.budget).toLocaleString()}
                                </Typography>
                              </Box>
                              <Chip 
                                label={proj.status.toUpperCase().replace('_', ' ')} 
                                color={proj.status === 'completed' ? 'success' : proj.status === 'in_progress' ? 'primary' : 'warning'} 
                                size="small" 
                                sx={{ fontWeight: 800, fontSize: '0.65rem' }} 
                              />
                            </Box>
                          </Paper>
                        ))
                      )}
                    </List>
                  </Box>

                  {/* Linked Quotations */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>Customer Quotations ({profile.quotations?.length || 0})</Typography>
                    <List sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 0 }}>
                      {!profile.quotations || profile.quotations.length === 0 ? (
                        <Typography variant="body2" sx={{ color: 'text.secondary', pl: 1 }}>No quotations associated with this client.</Typography>
                      ) : (
                        profile.quotations.map((quote) => (
                          <Paper key={quote.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>{quote.title}</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                                  Amount: ${parseFloat(quote.amount).toLocaleString()}
                                </Typography>
                              </Box>
                              <Chip 
                                label={quote.status.toUpperCase()} 
                                color={quote.status === 'approved' ? 'success' : quote.status === 'rejected' ? 'error' : 'warning'} 
                                size="small" 
                                sx={{ fontWeight: 800, fontSize: '0.65rem' }} 
                              />
                            </Box>
                          </Paper>
                        ))
                      )}
                    </List>
                  </Box>

                </Box>
              )}

              {/* TAB 2: Documents */}
              {tabValue === 2 && (
                <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2.5, pr: 1 }}>
                  
                  {/* Upload button */}
                  <Box>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={uploadingFile ? <CircularProgress size={20} /> : <UploadIcon />}
                      disabled={uploadingFile}
                      fullWidth
                      sx={{ py: 1.5, borderStyle: 'dashed', borderRadius: 3 }}
                    >
                      {uploadingFile ? 'Uploading Document...' : 'Upload Client Document'}
                      <input type="file" hidden onChange={handleFileUpload} />
                    </Button>
                  </Box>

                  {/* Documents list */}
                  <List sx={{ display: 'flex', flexDirection: 'column', gap: 1, p: 0 }}>
                    {!profile.documents || profile.documents.length === 0 ? (
                      <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                        No files uploaded for this client yet.
                      </Typography>
                    ) : (
                      profile.documents.map((doc) => (
                        <Paper key={doc.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, overflow: 'hidden' }}>
                              <ListItemIcon sx={{ minWidth: 'auto', color: 'primary.main' }}>
                                <FileIcon />
                              </ListItemIcon>
                              <ListItemText>
                                <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
                                  {doc.file_name}
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                  {doc.file_type.toUpperCase()}
                                </Typography>
                              </ListItemText>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="View Document">
                                <IconButton 
                                  size="small" 
                                  component="a" 
                                  href={`http://127.0.0.1:8000${doc.file_path}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  color="info"
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton size="small" onClick={() => handleDeleteDoc(doc.id)} color="error">
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </Paper>
                      ))
                    )}
                  </List>

                </Box>
              )}

              {/* TAB 3: Activity Timeline */}
              {tabValue === 3 && (
                <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1 }}>
                  <List sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 0 }}>
                    {!profile.timeline || profile.timeline.length === 0 ? (
                      <Typography variant="body2" sx={{ color: 'text.secondary', pl: 1 }}>No recorded activities for this client.</Typography>
                    ) : (
                      profile.timeline.map((item) => (
                        <Paper key={item.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5 }}>
                          <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <ListItemIcon sx={{ minWidth: 'auto', color: 'text.secondary', mt: 0.2 }}>
                              <HistoryIcon fontSize="small" />
                            </ListItemIcon>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {item.description}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                                User: {item.user_name} • Action: {item.action} • {item.time}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      ))
                    )}
                  </List>
                </Box>
              )}

            </React.Fragment>
          )}
        </Box>
      </Drawer>

      {/* Create / Edit Customer Modal */}
      <Dialog 
        open={modalOpen} 
        onClose={() => !submitLoading && setModalOpen(false)}
        slotProps={{
          paper: {
            sx: { borderRadius: 4, p: 1.5, width: '100%', maxWidth: 550 }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingCustomer ? 'Edit Customer CRM Details' : 'Register New Customer Profile'}
        </DialogTitle>
        <form onSubmit={handleFormSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, py: 1 }}>
            
            <TextField
              fullWidth
              label="Company or Customer Name"
              name="name"
              value={customerForm.values.name}
              onChange={customerForm.handleChange}
              error={Boolean(customerForm.errors.name)}
              helperText={customerForm.errors.name}
            />

            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Contact Person Name"
                  name="contact_name"
                  value={customerForm.values.contact_name}
                  onChange={customerForm.handleChange}
                  error={Boolean(customerForm.errors.contact_name)}
                  helperText={customerForm.errors.contact_name}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="GSTIN Number"
                  name="gst_number"
                  placeholder="e.g. 27AAAAA1111A1Z1"
                  value={customerForm.values.gst_number}
                  onChange={customerForm.handleChange}
                />
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Contact Phone"
                  name="contact_phone"
                  value={customerForm.values.contact_phone}
                  onChange={customerForm.handleChange}
                  error={Boolean(customerForm.errors.contact_phone)}
                  helperText={customerForm.errors.contact_phone}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  fullWidth
                  label="Contact Email"
                  name="contact_email"
                  value={customerForm.values.contact_email}
                  onChange={customerForm.handleChange}
                  error={Boolean(customerForm.errors.contact_email)}
                  helperText={customerForm.errors.contact_email}
                />
              </Grid>
            </Grid>

            <TextField
              select
              fullWidth
              label="Lead Status"
              name="lead_status"
              value={customerForm.values.lead_status}
              onChange={customerForm.handleChange}
              error={Boolean(customerForm.errors.lead_status)}
              helperText={customerForm.errors.lead_status}
            >
              <MenuItem value="lead">Lead</MenuItem>
              <MenuItem value="contacted">Contacted</MenuItem>
              <MenuItem value="proposal">Proposal</MenuItem>
              <MenuItem value="active">Active Client</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Billing Address"
              name="billing_address"
              value={customerForm.values.billing_address}
              onChange={(e) => {
                customerForm.handleChange(e);
                if (sameAsBilling) {
                  customerForm.setValues(prev => ({ ...prev, site_address: e.target.value }));
                }
              }}
              error={Boolean(customerForm.errors.billing_address)}
              helperText={customerForm.errors.billing_address}
            />

            <Box sx={{ mt: -1, mb: -1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={sameAsBilling}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSameAsBilling(checked);
                      if (checked) {
                        customerForm.setValues(prev => ({ ...prev, site_address: customerForm.values.billing_address }));
                      }
                    }}
                    color="primary"
                  />
                }
                label="Site Delivery Address is same as Billing Address"
              />
            </Box>

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Site Delivery Address"
              name="site_address"
              value={customerForm.values.site_address}
              onChange={(e) => {
                customerForm.handleChange(e);
                if (sameAsBilling) {
                  setSameAsBilling(false);
                }
              }}
              disabled={sameAsBilling}
              error={Boolean(customerForm.errors.site_address)}
              helperText={customerForm.errors.site_address}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Customer Notes"
              name="notes"
              value={customerForm.values.notes}
              onChange={customerForm.handleChange}
            />

          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
            <Button onClick={() => setModalOpen(false)} disabled={submitLoading} variant="outlined">
              Cancel
            </Button>
            <Button type="submit" disabled={submitLoading} variant="contained" color="primary">
              {submitLoading ? <CircularProgress size={20} color="inherit" /> : editingCustomer ? 'Update Customer' : 'Add Customer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

    </Box>
  );
};
