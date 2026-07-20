import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Tabs,
  Tab,
  Grid,
  CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useUpdateProfile, useChangePassword } from '../hooks/useProfile';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const updateProfileMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();

  const [activeTab, setActiveTab] = useState(0);

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({ name, email });
      showToast('Profile details updated successfully.', 'success');
      // Trigger a page refresh/reload if necessary to sync with local storage immediately
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile details.', 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill out all password fields.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    if (newPassword.length < 8) {
      showToast('New password must be at least 8 characters long.', 'error');
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword
      });
      showToast('Password updated successfully.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      showToast(err.message || 'Failed to change password.', 'error');
    }
  };

  return (
    <Box sx={{ py: 2, maxWidth: 650 }}>
      {/* Title */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Profile & Settings</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Manage your personal account information and security credentials.
        </Typography>
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
        <Tab icon={<PersonIcon fontSize="small" />} iconPosition="start" label="Personal Profile" />
        <Tab icon={<LockIcon fontSize="small" />} iconPosition="start" label="Security & Password" />
      </Tabs>

      {activeTab === 0 ? (
        <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Box component="form" onSubmit={handleUpdateProfile}>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <TextField
                    label="Full Name"
                    fullWidth
                    size="small"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    label="Email Address"
                    type="email"
                    fullWidth
                    size="small"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Grid>
                <Grid size={12} sx={{ mt: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={updateProfileMutation.isPending ? <CircularProgress size={16} /> : <SaveIcon />}
                    disabled={updateProfileMutation.isPending}
                    sx={{ borderRadius: 2.5, px: 4, fontWeight: 700 }}
                  >
                    Save Profile
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 'none', borderRadius: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Box component="form" onSubmit={handleChangePassword}>
              <Grid container spacing={2}>
                <Grid size={12}>
                  <TextField
                    label="Current Password"
                    type="password"
                    fullWidth
                    size="small"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    label="New Password"
                    type="password"
                    fullWidth
                    size="small"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    helperText="Password must be at least 8 characters long."
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    label="Confirm New Password"
                    type="password"
                    fullWidth
                    size="small"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </Grid>
                <Grid size={12} sx={{ mt: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={changePasswordMutation.isPending ? <CircularProgress size={16} /> : <SaveIcon />}
                    disabled={changePasswordMutation.isPending}
                    sx={{ borderRadius: 2.5, px: 4, fontWeight: 700 }}
                  >
                    Change Password
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
