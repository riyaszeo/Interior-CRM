import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  AppBar, Toolbar, Typography, Button, IconButton, Drawer, 
  List, ListItem, Divider, Box, useTheme, useMediaQuery 
} from '@mui/material';
import { Menu as MenuIcon, Close as CloseIcon, Phone as PhoneIcon } from '@mui/icons-material';

const NAV_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Services', path: '/services' },
  { label: 'Projects', path: '/projects' },
  { label: 'Gallery', path: '/gallery' },
  { label: 'Packages', path: '/packages' },
  { label: 'Materials', path: '/materials' },
  { label: 'Testimonials', path: '/testimonials' },
  { label: 'Blog', path: '/blog' },
  { label: 'Contact', path: '/contact' },
];

export const Header: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <>
      <AppBar 
        position="sticky" 
        sx={{
          background: scrolled ? 'rgba(255, 255, 255, 0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          boxShadow: scrolled ? '0 10px 30px -10px rgba(0, 0, 0, 0.05)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(226, 232, 240, 0.8)' : '1px solid transparent',
          color: scrolled ? '#111827' : '#FFFFFF',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          top: 0,
          zIndex: 1100,
        }}
        elevation={0}
      >
        <Toolbar className="max-w-7xl mx-auto w-full flex justify-between items-center py-2 px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 decoration-none">
              <img src="/logo.png" alt="VKS Logo" style={{ height: '42px', objectFit: 'contain' }} />
          </Link>

          {/* Desktop Nav */}
          {!isMobile && (
            <Box className="flex items-center gap-6">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link 
                    key={item.path} 
                    to={item.path} 
                    className={`font-semibold text-sm transition-all duration-300 relative py-1 ${
                      isActive 
                        ? scrolled ? 'text-[#6D28D9] border-b-2 border-[#6D28D9]' : 'text-white border-b-2 border-white'
                        : scrolled ? 'text-gray-600 hover:text-[#6D28D9]' : 'text-gray-200 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link to="/book" className="no-underline">
                <Button 
                  variant="contained" 
                  size="small"
                  sx={{ 
                    ml: 2, 
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    px: 3,
                    py: 1,
                    textTransform: 'none',
                    background: scrolled 
                      ? 'linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)' 
                      : '#FFFFFF',
                    color: scrolled ? '#FFFFFF' : '#6D28D9',
                    '&:hover': {
                      background: scrolled 
                        ? 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)' 
                        : 'rgba(255,255,255,0.9)',
                      boxShadow: scrolled ? '0 4px 12px rgba(109, 40, 217, 0.25)' : 'none',
                    }
                  }}
                >
                  Book Free Consultation
                </Button>
              </Link>
            </Box>
          )}

          {/* Mobile Menu Icon */}
          {isMobile && (
            <IconButton 
              edge="start" 
              color="inherit" 
              onClick={handleDrawerToggle} 
              sx={{ color: scrolled ? '#111827' : '#FFFFFF' }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Drawer for Mobile */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        slotProps={{
          paper: { sx: { width: 280, bgcolor: '#FFFFFF', p: 3 } }
        }}
      >
        <Box className="flex justify-between items-center mb-6">
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <img src="/logo.png" alt="VKS Logo" style={{ height: '36px', objectFit: 'contain' }} />
          </Box>
          <IconButton onClick={handleDrawerToggle} sx={{ color: '#111827' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <List className="flex flex-col gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem 
                key={item.path} 
                disablePadding 
                onClick={handleDrawerToggle}
                sx={{
                  borderRadius: 2,
                  bgcolor: isActive ? '#F3E8FF' : 'transparent',
                  color: isActive ? '#6D28D9' : '#4B5563',
                }}
              >
                <Link to={item.path} className="w-full px-4 py-3 font-semibold text-sm">
                  {item.label}
                </Link>
              </ListItem>
            );
          })}
        </List>
        <Box sx={{ mt: 'auto', pt: 3 }}>
          <Link to="/book" className="no-underline" onClick={handleDrawerToggle}>
            <Button variant="contained" fullWidth sx={{ borderRadius: '999px', py: 1.5 }}>
              Book Free Consultation
            </Button>
          </Link>
          <a href="tel:+918056659199" className="no-underline mt-3 block">
            <Button variant="outlined" fullWidth startIcon={<PhoneIcon />} sx={{ borderRadius: '999px', py: 1.5 }}>
              Call Experts
            </Button>
          </a>
        </Box>
      </Drawer>
    </>
  );
};
