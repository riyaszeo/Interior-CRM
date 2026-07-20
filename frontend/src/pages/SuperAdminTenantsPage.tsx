import React, { useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, Chip, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, MenuItem, IconButton
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/apiClient';
import { useToast } from '../context/ToastContext';
import AddIcon from '@mui/icons-material/Add';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MoreTimeIcon from '@mui/icons-material/MoreTime';

export const SuperAdminTenantsPage = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [openDemoDialog, setOpenDemoDialog] = useState(false);
  const [demoForm, setDemoForm] = useState({ name: '', admin_email: '', admin_password: '' });

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const res = await apiClient.get('/super-admin/tenants');
      return res.data.data;
    }
  });

  const createTenantMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post('/super-admin/tenants', {
        ...data,
        subscription_plan: 'trial'
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      showToast('Demo Account Generated Successfully', 'success');
      setOpenDemoDialog(false);
    },
    onError: (err: any) => {
      showToast(err.response?.data?.message || 'Failed to generate demo', 'error');
    }
  });

  const updateTenantMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const res = await apiClient.put(`/super-admin/tenants/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      showToast('Tenant updated', 'success');
    }
  });

  const handleGenerateDemo = (e: React.FormEvent) => {
    e.preventDefault();
    createTenantMutation.mutate(demoForm);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#1E293B' }}>
          SaaS Tenants (Companies)
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setOpenDemoDialog(true)}
          sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}
        >
          Generate Demo Account
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F8FAFC' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Company Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Domain</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Plan</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Expiry</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tenants.map((tenant: any) => (
              <TableRow key={tenant.id}>
                <TableCell>{tenant.id}</TableCell>
                <TableCell sx={{ fontWeight: 500 }}>{tenant.name}</TableCell>
                <TableCell>{tenant.domain}</TableCell>
                <TableCell>
                  <Chip 
                    label={tenant.subscription_plan.toUpperCase()} 
                    size="small" 
                    color={tenant.subscription_plan === 'premium' ? 'secondary' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={tenant.status.toUpperCase()} 
                    size="small" 
                    color={tenant.status === 'active' ? 'success' : (tenant.status === 'expired' ? 'warning' : 'error')}
                  />
                </TableCell>
                <TableCell>
                  {new Date(tenant.subscription_ends_at).toLocaleDateString()}
                </TableCell>
                <TableCell sx={{ textAlign: 'right' }}>
                  <IconButton 
                    title="Extend Expiry by 30 Days"
                    onClick={() => updateTenantMutation.mutate({ id: tenant.id, data: { extend_days: 30 } })}
                    color="primary"
                  >
                    <MoreTimeIcon />
                  </IconButton>
                  
                  {tenant.status === 'active' ? (
                    <IconButton 
                      title="Suspend"
                      onClick={() => updateTenantMutation.mutate({ id: tenant.id, data: { status: 'suspended' } })}
                      color="error"
                    >
                      <BlockIcon />
                    </IconButton>
                  ) : (
                    <IconButton 
                      title="Activate"
                      onClick={() => updateTenantMutation.mutate({ id: tenant.id, data: { status: 'active' } })}
                      color="success"
                    >
                      <CheckCircleIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Demo Dialog */}
      <Dialog open={openDemoDialog} onClose={() => setOpenDemoDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleGenerateDemo}>
          <DialogTitle sx={{ fontWeight: 700 }}>Generate 14-Day Demo</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField 
                label="Company Name" 
                required
                value={demoForm.name}
                onChange={e => setDemoForm({...demoForm, name: e.target.value})}
              />
              <TextField 
                label="Admin Email" 
                type="email"
                required
                value={demoForm.admin_email}
                onChange={e => setDemoForm({...demoForm, admin_email: e.target.value})}
              />
              <TextField 
                label="Admin Password" 
                type="password"
                required
                value={demoForm.admin_password}
                onChange={e => setDemoForm({...demoForm, admin_password: e.target.value})}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDemoDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createTenantMutation.isPending}>
              Generate Demo
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
