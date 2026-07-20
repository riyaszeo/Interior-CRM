import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Typography, TextField, Button, Box, Divider } from '@mui/material';
import { 
  Instagram, Facebook, LinkedIn, Mail, Phone, Place, Send 
} from '@mui/icons-material';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 4000);
  };

  return (
    <footer className="bg-slate-900 text-gray-400 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        
        {/* About & Branding */}
        <div className="flex flex-col gap-4">
          <Link to="/" className="flex items-center decoration-none text-white w-fit">
            <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#FFFFFF', py: 1, px: 2, borderRadius: 2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <img src="/logo.png" alt="VKS Logo" style={{ height: '36px', objectFit: 'contain' }} />
            </Box>
          </Link>
          <p className="text-sm leading-relaxed text-gray-400 mt-2">
            Luxury interior and exterior design firm specializing in bespoke residential, commercial, villa, and modular design transformations. Delivering premium turnkey design environments since 2012.
          </p>
          <div className="flex items-center gap-3 mt-4">
            {[
              { Icon: Instagram, href: 'https://instagram.com' },
              { Icon: Facebook, href: 'https://facebook.com' },
              { Icon: LinkedIn, href: 'https://linkedin.com' },
            ].map(({ Icon, href }, idx) => (
              <a 
                key={idx} 
                href={href} 
                target="_blank" 
                rel="noreferrer" 
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-gray-400 hover:bg-[#6D28D9] hover:text-white transition-all duration-300"
              >
                <Icon sx={{ fontSize: 18 }} />
              </a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-semibold text-base mb-6 tracking-wide uppercase">Useful Links</h4>
          <ul className="space-y-3 text-sm flex flex-col">
            {[
              { label: 'About Company', path: '/about' },
              { label: 'Our Services', path: '/services' },
              { label: 'Project Portfolio', path: '/projects' },
              { label: 'Photo Gallery', path: '/gallery' },
              { label: 'Pricing Packages', path: '/packages' },
              { label: 'Blogs & Articles', path: '/blog' },
            ].map((link, idx) => (
              <Link 
                key={idx} 
                to={link.path} 
                className="hover:text-white transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
          </ul>
        </div>

        {/* Office Details */}
        <div className="flex flex-col gap-4">
          <h4 className="text-white font-semibold text-base mb-2 tracking-wide uppercase">Get In Touch</h4>
          <div className="flex items-start gap-3 text-sm">
            <Place className="text-[#6D28D9] shrink-0 mt-0.5" sx={{ fontSize: 18 }} />
            <p>SF NO. 637/1, Door No 2/316, VKS Interior Punitha Garden, Coimbatore, TN - 641041</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Phone className="text-[#6D28D9]" sx={{ fontSize: 18 }} />
            <a href="tel:+918056659199" className="hover:text-white transition-all duration-200">+91 8056659199</a>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Mail className="text-[#6D28D9]" sx={{ fontSize: 18 }} />
            <a href="mailto:vksinteriorcoimbatore@gmail.com" className="hover:text-white transition-all duration-200">vksinteriorcoimbatore@gmail.com</a>
          </div>
        </div>

        {/* Newsletter Subscription */}
        <div>
          <h4 className="text-white font-semibold text-base mb-6 tracking-wide uppercase">Newsletter</h4>
          <p className="text-sm text-gray-400 mb-4 leading-relaxed">
            Subscribe to receive premium interior trends, space-saving design guidelines, and package discounts.
          </p>
          <form onSubmit={handleSubscribe} className="flex gap-2">
            <TextField 
              size="small" 
              placeholder="Your email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              slotProps={{
                input: {
                  sx: {
                    bgcolor: 'rgba(255,255,255,0.05)',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  }
                }
              }}
              fullWidth
            />
            <Button 
              type="submit" 
              variant="contained" 
              sx={{ 
                minWidth: 50, 
                width: 50,
                height: 40,
                borderRadius: '8px', 
                p: 0,
                background: 'linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)',
              }}
            >
              <Send sx={{ fontSize: 18 }} />
            </Button>
          </form>
          {subscribed && (
            <Typography variant="caption" sx={{ color: 'accent.main', mt: 1.5, display: 'block', fontWeight: 600 }}>
              ✓ Thank you for subscribing!
            </Typography>
          )}
        </div>

      </div>

      <Divider className="my-10 border-slate-800" sx={{ borderColor: 'rgba(255,255,255,0.05)', mx: 6 }} />

      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm">
        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
          &copy; {new Date().getFullYear()} VKS Design & Interiors. All rights reserved.
        </Typography>
        <div className="flex gap-6 mt-4 md:mt-0 text-gray-500">
          <Link to="/contact" className="hover:text-white transition-all duration-200">Privacy Policy</Link>
          <Link to="/contact" className="hover:text-white transition-all duration-200">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
};
