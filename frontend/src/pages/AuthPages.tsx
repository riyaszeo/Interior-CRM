import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Link,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  ArrowBack as BackIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useForm } from '../hooks/useForm';

export const AuthPages: React.FC = () => {
  const { login, forgotPassword, resetPassword } = useAuth();
  const { showToast } = useToast();
  const [screen, setScreen] = useState<'login' | 'forgot' | 'reset'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetTokenFromForgot, setResetTokenFromForgot] = useState('');

  // 1. Login Form Hooks
  const loginForm = useForm(
    { email: '', password: '' },
    {
      email: (val) => (!val ? 'Email is required' : !/\S+@\S+\.\S+/.test(val) ? 'Invalid email format' : null),
      password: (val) => (!val ? 'Password is required' : val.length < 6 ? 'Password must be at least 6 characters' : null)
    }
  );

  // 2. Forgot Password Form Hooks
  const forgotForm = useForm(
    { email: '' },
    {
      email: (val) => (!val ? 'Email is required' : !/\S+@\S+\.\S+/.test(val) ? 'Invalid email format' : null)
    }
  );

  // 3. Reset Password Form Hooks
  const resetForm = useForm(
    { email: '', token: '', password: '', password_confirmation: '' },
    {
      email: (val) => (!val ? 'Email is required' : !/\S+@\S+\.\S+/.test(val) ? 'Invalid email format' : null),
      token: (val) => (!val ? 'Reset token is required' : null),
      password: (val) => (!val ? 'New password is required' : val.length < 8 ? 'Password must be at least 8 characters' : null),
      password_confirmation: (val, vals) => (!val ? 'Please confirm password' : val !== vals.password ? 'Passwords do not match' : null)
    }
  );

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.validateAll()) return;

    setLoading(true);
    try {
      await login(loginForm.values.email, loginForm.values.password);
      showToast('Welcome back! Logged in successfully.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Login failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotForm.validateAll()) return;

    setLoading(true);
    try {
      const res = await forgotPassword(forgotForm.values.email);
      showToast('Reset code generated successfully (logged in activity logs).', 'info');
      
      // Auto-populate token & email for reset page demo
      if (res.data && res.data.reset_token) {
        setResetTokenFromForgot(res.data.reset_token);
        resetForm.setValues({
          email: forgotForm.values.email,
          token: res.data.reset_token,
          password: '',
          password_confirmation: ''
        });
      }
      setScreen('reset');
    } catch (err: any) {
      showToast(err.message || 'Error requesting reset.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetForm.validateAll()) return;

    setLoading(true);
    try {
      await resetPassword(resetForm.values);
      showToast('Password reset successfully. You can log in now.', 'success');
      loginForm.resetForm();
      setScreen('login');
    } catch (err: any) {
      showToast(err.message || 'Reset password failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F8FAFC', // Main Background
        p: 2
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 440,
          borderRadius: 4, // Cards border radius
          border: '1px solid #E5E7EB', // Borders color
          background: '#FFFFFF', // Cards background
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)' // Cards shadow
        }}
      >
        <CardContent sx={{ p: 4.5 }}>
          {/* Logo Area */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Typography sx={{ 
                color: '#24285B', 
                fontWeight: 900,
                fontFamily: '"Inter", sans-serif',
                fontSize: '2rem',
                letterSpacing: -1,
                lineHeight: 1
              }}>
                Nexus<span style={{ color: '#4F46E5', fontWeight: 300 }}>ERP</span>
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {screen === 'login' && 'Sign in to access your workspace'}
              {screen === 'forgot' && 'Reset your account security access'}
              {screen === 'reset' && 'Create your new credentials password'}
            </Typography>
          </Box>

          {/* SCREEN 1: LOGIN */}
          {screen === 'login' && (
            <form onSubmit={handleLoginSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  value={loginForm.values.email}
                  onChange={loginForm.handleChange}
                  error={Boolean(loginForm.errors.email)}
                  helperText={loginForm.errors.email}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={loginForm.values.password}
                  onChange={loginForm.handleChange}
                  error={Boolean(loginForm.errors.password)}
                  helperText={loginForm.errors.password}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }
                  }}
                />

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Link
                    component="button"
                    type="button"
                    variant="body2"
                    onClick={() => {
                      forgotForm.resetForm();
                      setScreen('forgot');
                    }}
                    sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                  >
                    Forgot Password?
                  </Link>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  size="large"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    background: 'linear-gradient(135deg, #7c4dff 0%, #b47cff 100%)',
                    boxShadow: '0 4px 15px rgba(124, 77, 255, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #6200ee 0%, #7c4dff 100%)',
                    }
                  }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                </Button>

                <Box sx={{ mt: 1, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.02)', p: 1.5, borderRadius: 2, border: '1px solid rgba(255,255,255,0.03)' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5, fontWeight: 700 }}>
                    Demo Credentials:
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'primary.light', display: 'block', fontFamily: 'monospace' }}>
                    superadmin@interior.com / password123
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'primary.light', display: 'block', fontFamily: 'monospace' }}>
                    engineer@interior.com / password123
                  </Typography>
                </Box>
              </Box>
            </form>
          )}

          {/* SCREEN 2: FORGOT PASSWORD */}
          {screen === 'forgot' && (
            <form onSubmit={handleForgotSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  value={forgotForm.values.email}
                  onChange={forgotForm.handleChange}
                  error={Boolean(forgotForm.errors.email)}
                  helperText={forgotForm.errors.email}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }
                  }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  size="large"
                  disabled={loading}
                  sx={{ py: 1.5 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Generate Reset Code'}
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={() => setScreen('login')}
                  startIcon={<BackIcon />}
                >
                  Back to Login
                </Button>
              </Box>
            </form>
          )}

          {/* SCREEN 3: RESET PASSWORD */}
          {screen === 'reset' && (
            <form onSubmit={handleResetSubmit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {resetTokenFromForgot && (
                  <Box sx={{ bgcolor: 'rgba(59, 130, 246, 0.08)', p: 2, borderRadius: 2.5, border: '1px solid rgba(59, 130, 246, 0.15)', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ color: 'info.main', display: 'block', fontWeight: 700, mb: 0.5 }}>
                      SIMULATED RESET CODE RECEIVED:
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', fontWeight: 700 }}>
                      {resetTokenFromForgot}
                    </Typography>
                  </Box>
                )}

                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  value={resetForm.values.email}
                  onChange={resetForm.handleChange}
                  error={Boolean(resetForm.errors.email)}
                  helperText={resetForm.errors.email}
                />

                <TextField
                  fullWidth
                  label="Reset Token"
                  name="token"
                  value={resetForm.values.token}
                  onChange={resetForm.handleChange}
                  error={Boolean(resetForm.errors.token)}
                  helperText={resetForm.errors.token}
                />

                <TextField
                  fullWidth
                  label="New Password"
                  name="password"
                  type="password"
                  value={resetForm.values.password}
                  onChange={resetForm.handleChange}
                  error={Boolean(resetForm.errors.password)}
                  helperText={resetForm.errors.password}
                />

                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="password_confirmation"
                  type="password"
                  value={resetForm.values.password_confirmation}
                  onChange={resetForm.handleChange}
                  error={Boolean(resetForm.errors.password_confirmation)}
                  helperText={resetForm.errors.password_confirmation}
                />

                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  size="large"
                  disabled={loading}
                  sx={{ py: 1.5 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={() => setScreen('login')}
                  startIcon={<BackIcon />}
                >
                  Cancel
                </Button>
              </Box>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
