import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Avatar,
  Divider,
  List,
  ListItem,
  Menu,
  MenuItem,
  ListItemIcon,
  useMediaQuery,
  useTheme,
  FormControl,
  Select
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  Inventory as InventoryIcon,
  ReceiptLong as ReceiptLongIcon,
  Assessment as AssessmentIcon,
  LocalShipping as LocalShippingIcon,
  History as HistoryIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  Business as BusinessIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  PowerSettingsNew as LogoutIcon,
  Person as ProfileIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import { useCompanyDetails } from '../hooks/useCompany';

const DRAWER_WIDTH = 260;

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { user, roles, logout, hasPermission } = useAuth();
  const userBranchesRaw = localStorage.getItem('user_branches');
  const userBranches = userBranchesRaw ? JSON.parse(userBranchesRaw) : [];
  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    localStorage.getItem('selected_branch_id') || (userBranches[0]?.id ? String(userBranches[0].id) : '')
  );

  const handleBranchChange = (event: any) => {
    const val = event.target.value;
    setSelectedBranchId(val);
    localStorage.setItem('selected_branch_id', val);
    window.location.reload();
  };
  const { isDarkMode, toggleTheme } = useThemeMode();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { data: companyData } = useCompanyDetails();
  const company = companyData?.data;

  const activeBranch = userBranches.find((b: any) => String(b.id) === selectedBranchId);
  const activeBranchName = activeBranch ? activeBranch.name : null;
  const sidebarDisplayName = activeBranchName || company?.name || 'Nexus ERP';

  const getAbbr = (name?: string) => {
    if (!name) return 'AG';
    const clean = name.trim().replace(/[^a-zA-Z0-9\s]/g, '');
    const words = clean.split(/\s+/).filter(Boolean);
    if (words.length === 0) return 'AG';
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + (words[1]?.[0] || '')).toUpperCase();
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
  };

  // Define navigation items with Spatie permissions
  const navItems = [
    { text: 'Dashboard', value: 'dashboard', icon: <DashboardIcon />, permission: null },
    { text: 'Customers', value: 'customers', icon: <PeopleIcon />, permission: 'projects:view' },
    { text: 'Projects', value: 'projects', icon: <AssignmentIcon />, permission: 'projects:view' },
    { text: 'Material Master', value: 'inventory', icon: <InventoryIcon />, permission: 'inventory:view' },
    { text: 'Quotations', value: 'quotations', icon: <ReceiptLongIcon />, permission: 'quotations:view' },
    { text: 'Invoices', value: 'invoices', icon: <AssessmentIcon />, permission: 'invoices:view' },
    { text: 'Reports', value: 'reports', icon: <BarChartIcon />, permission: 'projects:view' },
    { text: 'Purchase Orders', value: 'purchase_orders', icon: <LocalShippingIcon />, permission: 'purchase_orders:view' },
    { text: 'Material Dispatch', value: 'dispatches', icon: <LocalShippingIcon />, permission: 'inventory:view' },
    { text: 'Activity Logs', value: 'activity_logs', icon: <HistoryIcon />, permission: 'activity_logs:view' },
    { text: 'Branch Control', value: 'branch_control', icon: <BusinessIcon />, permission: 'branches:manage' },
    { text: 'Company Profile', value: 'company', icon: <BusinessIcon />, permission: null },
    { text: 'SaaS Tenants', value: 'saas_admin', icon: <BusinessIcon />, permission: null },
    { text: 'Settings', value: 'settings', icon: <SettingsIcon />, permission: null },
  ];

  // Filter navigation items by user permissions
  const filteredNavItems = navItems.filter(item => {
    if (item.value === 'branch_control' && (user?.tenant_id !== 1 && user?.tenant_id !== null)) {
      return false;
    }
    if (item.value === 'saas_admin' && (!roles.includes('Super Admin') || (user?.tenant_id !== 1 && user?.tenant_id !== null))) {
      return false;
    }
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  const sidebarContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
      {/* Brand Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, mb: 3 }}>
        <img 
          src={company?.logo_url || '/logo.png'} 
          alt={sidebarDisplayName} 
          style={{ height: '36px', objectFit: 'contain' }} 
        />
      </Box>

      <Divider sx={{ opacity: 0.08, mb: 2 }} />

      {/* Navigation list */}
      <List sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexGrow: 1, p: 0 }}>
        {filteredNavItems.map((item) => {
          const isActive = activeTab === item.value;
          return (
            <ListItem
              key={item.value}
              disablePadding
              onClick={() => {
                setActiveTab(item.value);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                borderRadius: 2.5,
                bgcolor: isActive ? '#F3E8FF' : 'transparent',
                border: '1px solid transparent',
                color: isActive ? '#6D28D9' : '#4B5563',
                mb: 0.5,
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: isActive ? '#F3E8FF' : '#F5F3FF',
                  color: isActive ? '#6D28D9' : '#111827',
                  cursor: 'pointer'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.25, gap: 2, width: '100%' }}>
                <Box sx={{ color: isActive ? '#6D28D9' : '#6B7280', display: 'flex' }}>
                  {item.icon}
                </Box>
                <Typography variant="body2" sx={{ fontWeight: isActive ? 700 : 600 }}>
                  {item.text}
                </Typography>
              </Box>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ opacity: 0.08, mb: 2 }} />

      {/* User Info card */}
      <Box 
        onClick={handleProfileMenuOpen}
        sx={{ 
          bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', 
          p: 1.5, 
          borderRadius: 3, 
          border: '1px solid',
          borderColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          cursor: 'pointer',
          '&:hover': {
            borderColor: isDarkMode ? 'rgba(124, 77, 255, 0.2)' : 'rgba(98, 0, 238, 0.2)'
          }
        }}
      >
        <Avatar sx={{ bgcolor: isDarkMode ? 'primary.main' : 'primary.light', width: 36, height: 36, fontWeight: 700, fontSize: '0.95rem' }}>
          {user ? user.name.charAt(0) : 'U'}
        </Avatar>
        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 700, textOverflow: 'ellipsis' }}>
            {user ? user.name : 'ERP User'}
          </Typography>
          <Typography variant="caption" noWrap sx={{ color: 'text.secondary', display: 'block', textOverflow: 'ellipsis' }}>
            {roles.length > 0 ? roles[0] : 'No Role'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      
      {/* AppBar (Header) */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundImage: 'none',
          boxShadow: 'none',
          zIndex: (theme) => theme.zIndex.drawer + 1
        }}
      >
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 2, md: 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 1, color: 'text.primary' }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" noWrap sx={{ color: 'text.primary', fontWeight: 800 }}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('_', ' ')}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Branch Selector Dropdown */}
            {userBranches.length > 0 && (
              <Box sx={{ minWidth: 160, mr: 0.5 }}>
                <FormControl size="small" fullWidth>
                  <Select
                    value={selectedBranchId}
                    onChange={handleBranchChange}
                    displayEmpty
                    sx={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      borderRadius: 2.5,
                      height: 36,
                      bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      '.MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                    }}
                  >
                    {userBranches.map((b: any) => (
                      <MenuItem key={b.id} value={String(b.id)}>
                        {b.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            {/* Dark/Light Mode toggle */}
            <IconButton onClick={toggleTheme} sx={{ color: 'text.secondary' }}>
              {isDarkMode ? <LightIcon /> : <DarkIcon />}
            </IconButton>

            {/* Notifications icon */}
            <IconButton sx={{ color: 'text.secondary' }}>
              <Badge badgeContent={3} color="primary">
                <NotificationsIcon />
              </Badge>
            </IconButton>

            {/* Quick Profile shortcut */}
            <Avatar 
              onClick={handleProfileMenuOpen}
              sx={{ 
                bgcolor: isDarkMode ? 'primary.main' : 'primary.light', 
                width: 32, 
                height: 32, 
                fontWeight: 700, 
                fontSize: '0.85rem',
                cursor: 'pointer' 
              }}
            >
              {user ? user.name.charAt(0) : 'U'}
            </Avatar>

            {/* Profile Dropdown Menu */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              slotProps={{
                paper: {
                  sx: {
                    mt: 1.5,
                    p: 1,
                    borderRadius: 3,
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    minWidth: 180
                  }
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => { handleProfileMenuClose(); setActiveTab('settings'); }} sx={{ borderRadius: 2 }}>
                <ListItemIcon><ProfileIcon fontSize="small" /></ListItemIcon>
                Profile Settings
              </MenuItem>
              <Divider sx={{ my: 1, opacity: 0.08 }} />
              <MenuItem onClick={handleLogout} sx={{ borderRadius: 2, color: 'error.main' }}>
                <ListItemIcon><LogoutIcon fontSize="small" color="error" /></ListItemIcon>
                Logout
              </MenuItem>
            </Menu>

          </Box>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                boxSizing: 'border-box',
                bgcolor: 'background.paper',
                borderRight: '1px solid',
                borderColor: 'divider'
              },
            }}
          >
            {sidebarContent}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                boxSizing: 'border-box',
                bgcolor: 'background.paper',
                borderRight: '1px solid',
                borderColor: 'divider'
              },
            }}
            open
          >
            {sidebarContent}
          </Drawer>
        )}
      </Box>

      {/* Main Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2.5, md: 4 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px',
          bgcolor: 'background.default'
        }}
      >
        {children}
      </Box>

    </Box>
  );
};
