import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Card, CardContent } from '@mui/material';
import { Mail, Phone, Place, AccessTime, Send } from '@mui/icons-material';
import { fetchAPI } from '../services/api';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [response, setResponse] = useState<{ success: boolean; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setResponse(null);

    try {
      const res = await fetchAPI<any>('/inquiries', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (res.success) {
        setResponse({ success: true, message: res.message });
        setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      }
    } catch (err: any) {
      setResponse({ success: false, message: err.message || 'Inquiry submission failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ pb: 12 }}>
      
      {/* Banner */}
      <Box 
        className="relative h-[300px] md:h-[400px] flex items-center justify-center bg-cover bg-center text-white"
        style={{ 
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.75)), url('https://images.unsplash.com/photo-1618219944342-824e40a13285?auto=format&fit=crop&w=1200&q=80')`,
          marginTop: '-72px'
        }}
      >
        <div className="text-center mt-12">
          <Typography variant="h2" className="text-white text-4xl md:text-6xl font-bold mb-3" sx={{ fontFamily: '"Playfair Display", serif' }}>
            Contact Our Studio
          </Typography>
          <Typography variant="body1" className="text-gray-300 max-w-xl mx-auto font-light text-base md:text-lg px-4">
            Visit our experience center or get in touch with our design board.
          </Typography>
        </div>
      </Box>

      {/* Main Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            
            {/* Info Cards Column */}
            <div className="lg:col-span-5 text-left flex flex-col gap-6">
              <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: '"Playfair Display", serif', color: '#111827' }}>
                Office Details & Hours
              </Typography>
              <Typography variant="body2" color="text.secondary" className="leading-relaxed">
                Have an empty apartment layout or facade drawing? Visit our Coimbatore studio center for a walk-through and physical sample verification.
              </Typography>

              {/* Info Items */}
              <div className="flex flex-col gap-5 mt-4">
                <div className="flex gap-4">
                  <Place className="text-[#6D28D9] shrink-0" sx={{ fontSize: 24 }} />
                  <div>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Coimbatore Experience Studio</Typography>
                    <Typography variant="body2" color="text.secondary" className="mt-1">
                      SF NO. 637/1, Door No 2/316, VKS Interior Punitha Garden, Coimbatore, TN - 641041
                    </Typography>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Phone className="text-[#6D28D9] shrink-0" sx={{ fontSize: 24 }} />
                  <div>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Call & WhatsApp Lines</Typography>
                    <Typography variant="body2" color="text.secondary" className="mt-1 flex flex-col gap-1">
                      <a href="tel:+918056659199" className="hover:text-[#6D28D9] transition-colors">+91 8056659199</a>
                      <a href="https://wa.me/918056659199" target="_blank" rel="noreferrer" className="hover:text-[#6D28D9] font-bold text-green-600 transition-colors">
                        💬 Open WhatsApp Chat
                      </a>
                    </Typography>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Mail className="text-[#6D28D9] shrink-0" sx={{ fontSize: 24 }} />
                  <div>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Email Inquiries</Typography>
                    <Typography variant="body2" color="text.secondary" className="mt-1">
                      <a href="mailto:vksinteriorcoimbatore@gmail.com" className="hover:text-[#6D28D9] transition-colors">vksinteriorcoimbatore@gmail.com</a>
                    </Typography>
                  </div>
                </div>
                <div className="flex gap-4">
                  <AccessTime className="text-[#6D28D9] shrink-0" sx={{ fontSize: 24 }} />
                  <div>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Business Operations</Typography>
                    <Typography variant="body2" color="text.secondary" className="mt-1">
                      Monday – Saturday: 09:30 AM – 07:00 PM <br />
                      Sunday: Closed (Available by appointment only)
                    </Typography>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Column */}
            <div className="lg:col-span-7">
              <Card sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <CardContent sx={{ p: 0, textAlign: 'left' }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 3 }}>Send Us a Message</Typography>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <TextField
                        label="Full Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        fullWidth
                      />
                      <TextField
                        label="Email Address"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        fullWidth
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <TextField
                        label="Mobile Phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        fullWidth
                      />
                      <TextField
                        label="Subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        fullWidth
                      />
                    </div>
                    <TextField
                      label="Inquiry Message"
                      name="message"
                      multiline
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      fullWidth
                    />

                    {response && (
                      <Typography 
                        variant="body2" 
                        color={response.success ? 'primary.main' : 'error.main'} 
                        sx={{ fontWeight: 700 }}
                      >
                        {response.message}
                      </Typography>
                    )}

                    <Button 
                      type="submit" 
                      variant="contained" 
                      disabled={submitting}
                      endIcon={<Send sx={{ fontSize: 18 }} />}
                      sx={{ py: 1.6, mt: 1, borderRadius: '999px', alignSelf: 'flex-start', px: 4 }}
                    >
                      {submitting ? 'Submitting...' : 'Send Inquiry'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </section>

      {/* Google Maps Iframe */}
      <section className="w-full h-[450px] relative bg-slate-100 border-t border-gray-200">
        <iframe 
          title="VKS Design Coimbatore Office Location Map"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3916.143714247098!2d76.95350357590823!3d11.027878354452148!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1m3!2s!2d76.95607849999999!3d11.0278783!5m2!1sen!2sin"
          width="100%" 
          height="100%" 
          style={{ border: 0 }} 
          allowFullScreen 
          loading="lazy"
        />
      </section>

    </Box>
  );
};
export default Contact;
