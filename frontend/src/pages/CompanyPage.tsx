import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, TextField, Button,
  Card, CardContent, Avatar, CircularProgress
} from '@mui/material';
import {
  Business as CompanyIcon,
  CloudUpload as UploadIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useCompanyDetails, useUpdateCompany } from '../hooks/useCompany';
import { useToast } from '../context/ToastContext';

export const CompanyPage: React.FC = () => {
  const { data, isLoading, error } = useCompanyDetails();
  const updateMutation = useUpdateCompany();
  const { showToast } = useToast();

  // Local form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNo, setContactNo] = useState('');
  const [website, setWebsite] = useState('');
  const [gstn, setGstn] = useState('');
  const [address, setAddress] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Populate local form states from backend data
  useEffect(() => {
    if (data?.success && data.data) {
      const c = data.data;
      setName(c.name || '');
      setEmail(c.email || '');
      setContactNo(c.contact_no || '');
      setWebsite(c.website || '');
      setGstn(c.gstn || '');
      setAddress(c.address || '');
      if (c.logo_url) {
        setImagePreview(c.logo_url);
      }
    }
  }, [data]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Company name is required', 'warning');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('contact_no', contactNo);
    formData.append('website', website);
    formData.append('gstn', gstn);
    formData.append('address', address);
    if (selectedFile) {
      formData.append('logo', selectedFile);
    }

    updateMutation.mutate(formData, {
      onSuccess: () => {
        showToast('Company profile updated successfully.', 'success');
      },
      onError: (err) => {
        showToast(err.message || 'Failed to save company settings.', 'error');
      }
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
        <CircularProgress color="primary" />
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>Loading company configurations...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" variant="h6" sx={{ fontWeight: 700 }}>Failed to fetch company details</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>Confirm connection to the Laravel backend server.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>Company Configuration</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Manage your enterprise profile, addresses, tax registry (GSTIN), and corporate branding logos.
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={4}>
          {/* Logo upload panel */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, textAlign: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 3, alignSelf: 'flex-start' }}>Company Logo</Typography>
                
                <Avatar
                  src={imagePreview || undefined}
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: 3,
                    bgcolor: 'primary.light',
                    color: 'primary.main',
                    mb: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                  }}
                >
                  <CompanyIcon sx={{ fontSize: 48 }} />
                </Avatar>

                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, px: 2 }}>
                  Upload a high-resolution logo (PNG, JPG) to display on estimates and invoice sheets.
                </Typography>

                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  sx={{ mt: 1 }}
                >
                  Choose Logo
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleFileChange}
                  />
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Form details panel */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 3 }}>Company Profile Details</Typography>

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Company Name *"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="GSTIN / GST Number"
                      placeholder="e.g. 09AAACA1122C1Z8"
                      value={gstn}
                      onChange={(e) => setGstn(e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Contact Phone"
                      placeholder="e.g. +91 98765 43210"
                      value={contactNo}
                      onChange={(e) => setContactNo(e.target.value)}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Corporate Email Address"
                      placeholder="e.g. billing@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Grid>

                  <Grid size={12}>
                    <TextField
                      fullWidth
                      label="Website URL"
                      placeholder="e.g. www.mycompany.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </Grid>

                  <Grid size={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Registered Office Address"
                      placeholder="Enter billing and dispatch office address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={updateMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                    disabled={updateMutation.isPending}
                    sx={{ px: 4 }}
                  >
                    Save Configuration
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};
export default CompanyPage;
