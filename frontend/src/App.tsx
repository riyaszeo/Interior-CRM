import React, { useState } from 'react';
import { AuthContextProvider, useAuth } from './context/AuthContext';
import { ThemeContextProvider } from './context/ThemeContext';
import { ToastContextProvider } from './context/ToastContext';
import { AdminLayout } from './layouts/AdminLayout';
import { AuthPages } from './pages/AuthPages';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { CustomersPage } from './pages/CustomersPage';
import { QuotationsPage } from './pages/QuotationsPage';
import { MaterialsPage } from './pages/MaterialsPage';
import { PurchaseModulePage } from './pages/PurchaseModulePage';
import { DispatchesPage } from './pages/DispatchesPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { ReportsPage } from './pages/ReportsPage';
import { CompanyPage } from './pages/CompanyPage';
import { BranchPage } from './pages/BranchPage';
import { SettingsPage } from './pages/SettingsPage';
import { SuperAdminTenantsPage } from './pages/SuperAdminTenantsPage';
import { Box, Card, Typography } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const MainAppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#F8FAFC' }}>
        <Typography variant="body1" sx={{ color: '#111827', fontWeight: 600 }}>Booting ERP Suite...</Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <AuthPages />;
  }

  // Active page renderer
  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage />;
      case 'customers':
        return <CustomersPage />;
      case 'projects':
        return <ProjectsPage />;
      case 'quotations':
        return <QuotationsPage />;
      case 'inventory':
        return <MaterialsPage />;
      case 'purchase_orders':
        return <PurchaseModulePage />;
      case 'dispatches':
        return <DispatchesPage />;
      case 'invoices':
        return <InvoicesPage />;
      case 'reports':
        return <ReportsPage />;
      case 'company':
        return <CompanyPage />;
      case 'branch_control':
        return <BranchPage />;
      case 'settings':
        return <SettingsPage />;
      case 'saas_admin':
        return <SuperAdminTenantsPage />;
      default:

        // Decoupled placeholder for other modules
        return (
          <Box sx={{ py: 4 }}>
            <Card sx={{ p: 4, display: 'flex', alignItems: 'center', gap: 3, border: '1px dashed rgba(255,255,255,0.1)' }}>
              <InfoIcon color="primary" sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Module Ready for Implementation
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  The "{activeTab.toUpperCase().replace('_', ' ')}" module has role-based permissions and routes registered on the backend API.
                </Typography>
              </Box>
            </Card>
          </Box>
        );
    }
  };

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderPage()}
    </AdminLayout>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeContextProvider>
        <ToastContextProvider>
          <AuthContextProvider>
            <MainAppContent />
          </AuthContextProvider>
        </ToastContextProvider>
      </ThemeContextProvider>
    </QueryClientProvider>
  );
}
