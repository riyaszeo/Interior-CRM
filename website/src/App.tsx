import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { theme } from './theme';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { Services } from './pages/Services';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { Gallery } from './pages/Gallery';
import { Packages } from './pages/Packages';
import { Materials } from './pages/Materials';
import { Testimonials } from './pages/Testimonials';
import { Blog } from './pages/Blog';
import { BlogDetail } from './pages/BlogDetail';
import { Contact } from './pages/Contact';
import { BookConsultation } from './pages/BookConsultation';
import { WhatsApp as WhatsAppIcon } from '@mui/icons-material';

// Scroll to top on every navigation change
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const AppContent: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Header />
      <Box sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:slug" element={<ProjectDetail />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/book" element={<BookConsultation />} />
        </Routes>
      </Box>
      <Footer />

      {/* Floating WhatsApp Widget */}
      <a 
        href="https://wa.me/918056659199?text=Hi%20VKS%20Design%2C%20I%20would%20like%20to%20book%20a%20free%20consultation%20for%20my%20property."
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-all duration-300 animate-bounce"
        style={{ animationDuration: '3s' }}
        title="Chat with design board on WhatsApp"
      >
        <WhatsAppIcon sx={{ fontSize: 32, color: '#fff' }} />
      </a>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <ScrollToTop />
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
