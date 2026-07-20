import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch as MuiSwitch,
  Chip,
  IconButton,
  Grid,
  Checkbox,
  FormGroup,
  CircularProgress,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  MenuItem,
  Select,
  InputLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import {
  useBranchesList,
  useCreateBranch,
  useUpdateBranch,
  useCentralUsersList,
  useAssignBranches
} from '../hooks/useBranches';
import type { Branch, CentralUser } from '../hooks/useBranches';
import {
  useRolesList,
  useSyncRolePermissions
} from '../hooks/useRoles';
import type { Role } from '../hooks/useRoles';
import { useToast } from '../context/ToastContext';

export const BranchPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const { data: branchesRes, isLoading: loadingBranches, refetch: refetchBranches } = useBranchesList();
  const { data: usersRes, isLoading: loadingUsers, refetch: refetchUsers } = useCentralUsersList();

  const { data: rolesRes, refetch: refetchRoles } = useRolesList();
  const syncRolePermissionsMutation = useSyncRolePermissions();

  const rolesList = rolesRes?.data || [];

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedRolePerms, setSelectedRolePerms] = useState<string[]>([]);

  const handleSelectRole = (role: Role) => {
    setSelectedRoleId(role.id);
    setSelectedRolePerms(role.permissions.map(p => p.name));
  };

  const handleTogglePermission = (name: string) => {
    setSelectedRolePerms(prev =>
      prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
    );
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRoleId) return;
    try {
      await syncRolePermissionsMutation.mutateAsync({
        roleId: selectedRoleId,
        permissions: selectedRolePerms
      });
      showToast('Role permissions and menu access updated successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update role permissions.', 'error');
    }
  };

  const navPermissions = [
    { name: 'projects:view', label: 'Customers, Projects & Reports Navigation' },
    { name: 'inventory:view', label: 'Material Master & Dispatch Navigation' },
    { name: 'quotations:view', label: 'Quotations Navigation' },
    { name: 'invoices:view', label: 'Invoices & Billing Navigation' },
    { name: 'purchase_orders:view', label: 'Purchase Orders Navigation' },
    { name: 'activity_logs:view', label: 'Activity Logs Navigation' },
    { name: 'branches:manage', label: 'Central Branch Control Navigation' }
  ];

  const actionPermissions = [
    { name: 'projects:create', label: 'Create Projects' },
    { name: 'projects:edit', label: 'Edit Projects' },
    { name: 'projects:delete', label: 'Delete Projects' },
    { name: 'inventory:create', label: 'Adjust Inventory Stock' },
    { name: 'inventory:dispatch', label: 'Approve Material Dispatch' },
    { name: 'purchase_orders:create', label: 'Create Purchase Orders' },
    { name: 'purchase_orders:approve', label: 'Approve Purchase Orders' },
    { name: 'purchase_orders:receive', label: 'Receive Goods / GRN' },
    { name: 'quotations:create', label: 'Create Quotations' },
    { name: 'quotations:approve', label: 'Approve Quotations' },
    { name: 'invoices:create', label: 'Generate Invoices' },
    { name: 'invoices:pay', label: 'Record Invoice Payments' },
    { name: 'site_progress:create', label: 'Log Site Progress' }
  ];

  React.useEffect(() => {
    if (activeTab === 2 && rolesList.length > 0 && selectedRoleId === null) {
      handleSelectRole(rolesList[0]);
    }
  }, [activeTab, rolesList, selectedRoleId]);

  const createBranchMutation = useCreateBranch();
  const updateBranchMutation = useUpdateBranch();
  const assignBranchesMutation = useAssignBranches();
  const { showToast } = useToast();

  const branches = branchesRes?.data || [];
  const users = usersRes?.data || [];

  // Dialog states
  const [branchOpen, setBranchOpen] = useState(false);
  const [userMappingOpen, setUserMappingOpen] = useState(false);
  const [currentBranch, setCurrentBranch] = useState<Partial<Branch> | null>(null);
  const [currentUser, setCurrentUser] = useState<CentralUser | null>(null);
  const [selectedBranchIds, setSelectedBranchIds] = useState<number[]>([]);

  // Form fields
  const [branchName, setBranchName] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [branchActive, setBranchActive] = useState(true);

  // SaaS tenant fields
  const [entityType, setEntityType] = useState<'branch' | 'company'>('branch');
  const [companyName, setCompanyName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [licenseType, setLicenseType] = useState('basic');
  const [expiryDate, setExpiryDate] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [address, setAddress] = useState('');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleOpenBranchDialog = (branch: Branch | null = null) => {
    setEntityType('branch');
    setCompanyName('');
    setOwnerEmail('');
    setLicenseType('basic');
    setExpiryDate('');
    setContactNo('');
    setAddress('');

    if (branch) {
      setCurrentBranch(branch);
      setBranchName(branch.name);
      setBranchCode(branch.code);
      setBranchActive(branch.is_active);
    } else {
      setCurrentBranch(null);
      setBranchName('');
      setBranchCode('');
      setBranchActive(true);
    }
    setBranchOpen(true);
  };

  const handleSaveBranch = async () => {
    if (entityType === 'branch') {
      if (!branchName || !branchCode) {
        showToast('Please fill out all required fields.', 'error');
        return;
      }
    } else {
      if (!companyName || !ownerEmail || !branchCode || !expiryDate) {
        showToast('Please fill out all required fields.', 'error');
        return;
      }
    }

    try {
      if (currentBranch && currentBranch.id) {
        await updateBranchMutation.mutateAsync({
          id: currentBranch.id,
          data: { name: branchName, code: branchCode, is_active: branchActive }
        });
        showToast('Branch updated successfully.', 'success');
      } else {
        if (entityType === 'branch') {
          await createBranchMutation.mutateAsync({
            type: 'branch',
            name: branchName,
            code: branchCode,
            is_active: branchActive
          });
          showToast('Branch created and database initialized successfully.', 'success');
        } else {
          await createBranchMutation.mutateAsync({
            type: 'company',
            company_name: companyName,
            email: ownerEmail,
            code: branchCode,
            license_type: licenseType,
            expiry_date: expiryDate,
            contact_no: contactNo,
            address: address
          });
          showToast('SaaS Company created and database initialized successfully. Super Admin login account created.', 'success');
        }
      }
      setBranchOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to save entity.', 'error');
    }
  };

  const handleOpenUserMappingDialog = (user: CentralUser) => {
    setCurrentUser(user);
    setSelectedBranchIds(user.branches.map(b => b.id));
    setUserMappingOpen(true);
  };

  const handleToggleUserBranch = (branchId: number) => {
    setSelectedBranchIds(prev => 
      prev.includes(branchId) 
        ? prev.filter(id => id !== branchId)
        : [...prev, branchId]
    );
  };

  const handleSaveUserMapping = async () => {
    if (!currentUser) return;
    try {
      await assignBranchesMutation.mutateAsync({
        userId: currentUser.id,
        branchIds: selectedBranchIds
      });
      showToast('User branch authorization updated successfully.', 'success');
      setUserMappingOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Failed to update user branch mapping.', 'error');
    }
  };

  return (
    <Box sx={{ py: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: 'primary.light',
              color: 'primary.main',
              display: 'flex'
            }}
          >
            <BusinessIcon />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>Centralized Branch Control</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Create branches with isolated databases and manage centralized user permissions.
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={() => { refetchBranches(); refetchUsers(); refetchRoles(); }} size="medium" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <RefreshIcon />
          </IconButton>
          {activeTab === 0 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenBranchDialog(null)}
              sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}
            >
              Create Branch
            </Button>
          )}
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          mb: 3,
          '& .MuiTab-root': {
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '0.95rem'
          }
        }}
      >
        <Tab icon={<BusinessIcon fontSize="small" />} iconPosition="start" label="Branches & Databases" />
        <Tab icon={<PeopleIcon fontSize="small" />} iconPosition="start" label="User Access Control" />
        <Tab icon={<SecurityIcon fontSize="small" />} iconPosition="start" label="Role & Menu Permissions" />
      </Tabs>

      {/* Tab 0: Branches List */}
      {activeTab === 0 && (
        <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 4 }}>
          {loadingBranches ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 'none', bgcolor: 'transparent' }}>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Branch Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Code</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Database File / Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {branches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>No branches defined yet.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    branches.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{b.name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={b.code} size="small" sx={{ fontWeight: 700, bgcolor: 'primary.light', color: 'primary.main' }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'action.selected', px: 1, py: 0.5, borderRadius: 1 }}>
                            {b.database_name || `database_branch_${b.id}`}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {b.is_active ? (
                            <Chip label="Active" color="success" size="small" sx={{ fontWeight: 700 }} />
                          ) : (
                            <Chip label="Inactive" color="error" size="small" sx={{ fontWeight: 700 }} />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton onClick={() => handleOpenBranchDialog(b)} size="small" color="primary">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

      {/* Tab 1: User Mapping Control */}
      {activeTab === 1 && (
        <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 4 }}>
          {loadingUsers ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: 'none', bgcolor: 'transparent' }}>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>User Name</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Email Address</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Authorized Branches</TableCell>
                    <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{u.name}</Typography>
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {u.branches.length === 0 ? (
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                              No access assigned (Mainly Super Admin bypass)
                            </Typography>
                          ) : (
                            u.branches.map(b => (
                              <Chip key={b.id} label={b.name} size="small" sx={{ fontWeight: 600 }} />
                            ))
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenUserMappingDialog(u)}
                          sx={{ borderRadius: 2, fontWeight: 700 }}
                        >
                          Modify Access
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

      {/* Tab 2: Role Permissions */}
      {activeTab === 2 && renderRolePermissionsTab()}

      {/* Branch Create/Edit Dialog */}
      <Dialog
        open={branchOpen}
        onClose={() => setBranchOpen(false)}
        slotProps={{
          paper: { sx: { borderRadius: 4, width: '100%', maxWidth: 500 } }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {currentBranch ? 'Edit Branch' : 'Create New Entity'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            {!currentBranch && (
              <Grid size={12}>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 0.5 }}>Entity Type</FormLabel>
                  <RadioGroup
                    row
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value as 'branch' | 'company')}
                  >
                    <FormControlLabel value="branch" control={<Radio size="small" />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Branch</Typography>} />
                    <FormControlLabel value="company" control={<Radio size="small" />} label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Separate Company (SaaS Tenant)</Typography>} />
                  </RadioGroup>
                </FormControl>
              </Grid>
            )}

            {entityType === 'branch' ? (
              <>
                <Grid size={12}>
                  <TextField
                    label="Branch Name"
                    fullWidth
                    size="small"
                    required
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g. Noida Sector 62 Office"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    label="Branch Code (Database Identifier)"
                    fullWidth
                    size="small"
                    required
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                    placeholder="e.g. NOIDA"
                    disabled={!!currentBranch}
                  />
                </Grid>
                <Grid size={12}>
                  <FormControlLabel
                    control={
                      <MuiSwitch
                        checked={branchActive}
                        onChange={(e) => setBranchActive(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Active Branch"
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid size={12}>
                  <TextField
                    label="Company Name"
                    fullWidth
                    size="small"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. VKS Interior and Exteriors"
                    sx={{ mt: 1 }}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    label="Owner Admin Email"
                    fullWidth
                    size="small"
                    required
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="owner@company.com"
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    label="Database Code Prefix"
                    fullWidth
                    size="small"
                    required
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                    placeholder="e.g. VKS"
                  />
                </Grid>
                <Grid size={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>License Type</InputLabel>
                    <Select
                      value={licenseType}
                      label="License Type"
                      onChange={(e) => setLicenseType(e.target.value)}
                    >
                      <MenuItem value="basic">Basic</MenuItem>
                      <MenuItem value="premium">Premium</MenuItem>
                      <MenuItem value="enterprise">Enterprise</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={12}>
                  <TextField
                    label="License Expiry/Renewal Date"
                    type="date"
                    fullWidth
                    size="small"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } } as any}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    label="Contact Number"
                    fullWidth
                    size="small"
                    value={contactNo}
                    onChange={(e) => setContactNo(e.target.value)}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    label="Company Address"
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setBranchOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveBranch}
            disabled={createBranchMutation.isPending || updateBranchMutation.isPending}
            startIcon={createBranchMutation.isPending || updateBranchMutation.isPending ? <CircularProgress size={16} /> : <SaveIcon />}
            sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
          >
            {currentBranch ? 'Save Branch' : 'Create Entity'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Mapping Dialog */}
      <Dialog
        open={userMappingOpen}
        onClose={() => setUserMappingOpen(false)}
        slotProps={{
          paper: { sx: { borderRadius: 4, width: '100%', maxWidth: 450 } }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          Manage Branch Authorization
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Select the branches that <strong>{currentUser?.name}</strong> is authorized to view and manage.
          </Typography>
          <FormGroup>
            {branches.map((b) => (
              <FormControlLabel
                key={b.id}
                control={
                  <Checkbox
                    checked={selectedBranchIds.includes(b.id)}
                    onChange={() => handleToggleUserBranch(b.id)}
                    color="primary"
                  />
                }
                label={b.name}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setUserMappingOpen(false)} sx={{ fontWeight: 700 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveUserMapping}
            disabled={assignBranchesMutation.isPending}
            startIcon={assignBranchesMutation.isPending ? <CircularProgress size={16} /> : <SaveIcon />}
            sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
          >
            Save Access
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  function renderRolePermissionsTab() {
    const selectedRole = rolesList.find(r => r.id === selectedRoleId);
    const isSuperAdmin = selectedRole?.name === 'Super Admin';

    return (
      <Grid container spacing={3}>
        {/* Left Side: Roles List */}
        <Grid size={4}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 4, height: '100%' }}>
            <Box sx={{ p: 2, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body1" sx={{ fontWeight: 800 }}>User Roles</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', p: 1, gap: 0.5 }}>
              {rolesList.map((role) => {
                const isSelected = role.id === selectedRoleId;
                return (
                  <Button
                    key={role.id}
                    onClick={() => handleSelectRole(role)}
                    sx={{
                      justifyContent: 'flex-start',
                      px: 2,
                      py: 1.25,
                      borderRadius: 2.5,
                      textTransform: 'none',
                      color: isSelected ? 'primary.main' : 'text.primary',
                      bgcolor: isSelected ? 'primary.light' : 'transparent',
                      fontWeight: isSelected ? 700 : 600,
                      '&:hover': {
                        bgcolor: isSelected ? 'primary.light' : 'action.hover'
                      }
                    }}
                  >
                    {role.name}
                  </Button>
                );
              })}
            </Box>
          </Card>
        </Grid>

        {/* Right Side: Role Permissions Checklist */}
        <Grid size={8}>
          {selectedRole ? (
            <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 4 }}>
              <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{selectedRole.name} Permissions</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Configure sidebar menu access and operational privileges.
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  disabled={isSuperAdmin || syncRolePermissionsMutation.isPending}
                  onClick={handleSaveRolePermissions}
                  sx={{ borderRadius: 2.5, px: 3, fontWeight: 700 }}
                >
                  Save Permissions
                </Button>
              </Box>

              <CardContent sx={{ p: 3 }}>
                {isSuperAdmin && (
                  <Box sx={{ p: 2, mb: 3, borderRadius: 2.5, bgcolor: '#F5F3FF', border: '1px dashed #DDD6FE', color: '#6D28D9' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      [NOTE] Super Admin holds all system privileges and bypasses permission gate checks. Checkbox edits are disabled for this role.
                    </Typography>
                  </Box>
                )}

                <Grid container spacing={4}>
                  {/* Navigation Access Group */}
                  <Grid size={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Sidebar Menu Navigation
                    </Typography>
                    <FormGroup sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {navPermissions.map((perm) => (
                        <FormControlLabel
                          key={perm.name}
                          control={
                            <Checkbox
                              checked={isSuperAdmin || selectedRolePerms.includes(perm.name)}
                              onChange={() => handleTogglePermission(perm.name)}
                              disabled={isSuperAdmin}
                              color="primary"
                              size="small"
                            />
                          }
                          label={<Typography variant="body2" sx={{ fontWeight: 600 }}>{perm.label}</Typography>}
                        />
                      ))}
                    </FormGroup>
                  </Grid>

                  {/* Actions Access Group */}
                  <Grid size={6}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, color: 'secondary.main', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Operational Actions
                    </Typography>
                    <FormGroup sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {actionPermissions.map((perm) => (
                        <FormControlLabel
                          key={perm.name}
                          control={
                            <Checkbox
                              checked={isSuperAdmin || selectedRolePerms.includes(perm.name)}
                              onChange={() => handleTogglePermission(perm.name)}
                              disabled={isSuperAdmin}
                              color="secondary"
                              size="small"
                            />
                          }
                          label={<Typography variant="body2" sx={{ fontWeight: 600 }}>{perm.label}</Typography>}
                        />
                      ))}
                    </FormGroup>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          )}
        </Grid>
      </Grid>
    );
  }
};
