import React, { useState } from 'react';
import { Box, Typography, TextField, MenuItem, Button, Card, CardContent } from '@mui/material';
import { CalendarMonth, CheckCircle } from '@mui/icons-material';
import { fetchAPI } from '../services/api';

const PROPERTY_TYPES = ['Apartment', 'Villa', 'Individual House', 'Office Space', 'Restaurant/Cafe', 'Retail Store', 'Landscape/Garden'];
const BUDGET_RANGES = ['Under ₹5 Lakhs', '₹5 - ₹10 Lakhs', '₹10 - ₹25 Lakhs', '₹25 - ₹50 Lakhs', 'Above ₹50 Lakhs'];

export const BookConsultation: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    city: 'Coimbatore',
    property_type: 'Villa',
    budget: '₹10 - ₹25 Lakhs',
    area_sqft: '',
    service_type: 'Interior',
    preferred_date: '',
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
      const res = await fetchAPI<any>('/consultations', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (res.success) {
        setResponse({ success: true, message: res.message });
        setFormData({
          name: '',
          mobile: '',
          email: '',
          city: 'Coimbatore',
          property_type: 'Villa',
          budget: '₹10 - ₹25 Lakhs',
          area_sqft: '',
          service_type: 'Interior',
          preferred_date: '',
          message: ''
        });
      }
    } catch (err: any) {
      setResponse({ success: false, message: err.message || 'Consultation booking failed. Please check inputs and try again.' });
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
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.75)), url('https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80')`,
          marginTop: '-72px'
        }}
      >
        <div className="text-center mt-12">
          <Typography variant="h2" className="text-white text-4xl md:text-6xl font-bold mb-3" sx={{ fontFamily: '"Playfair Display", serif' }}>
            Book Consultation
          </Typography>
          <Typography variant="body1" className="text-gray-300 max-w-xl mx-auto font-light text-base md:text-lg px-4">
            Schedule a free structural site measurement and design session.
          </Typography>
        </div>
      </Box>

      {/* Main Container */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            
            {/* Introduction info */}
            <div className="md:col-span-4 text-left flex flex-col gap-5">
              <Typography variant="h5" sx={{ fontWeight: 800 }}>Free Consultation Includes:</Typography>
              <div className="flex flex-col gap-4 mt-2">
                {[
                  '1-on-1 session with lead architect',
                  'Interactive 3D model concepts draft',
                  'Accurate structural area measurement',
                  'Detailed brand materials estimates'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <CheckCircle className="text-[#6D28D9] shrink-0 mt-0.5" fontSize="small" />
                    <Typography variant="body2" className="text-gray-700 font-semibold">{item}</Typography>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking Form Card */}
            <div className="md:col-span-8">
              <Card sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                <CardContent sx={{ p: 0, textAlign: 'left' }}>
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
                        label="Mobile Phone"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleChange}
                        required
                        fullWidth
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <TextField
                        label="Email (Optional)"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        fullWidth
                      />
                      <TextField
                        label="City Location"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        fullWidth
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <TextField
                        select
                        label="Property Type"
                        name="property_type"
                        value={formData.property_type}
                        onChange={handleChange}
                        required
                        fullWidth
                      >
                        {PROPERTY_TYPES.map((type) => (
                          <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        select
                        label="Budget Range"
                        name="budget"
                        value={formData.budget}
                        onChange={handleChange}
                        required
                        fullWidth
                      >
                        {BUDGET_RANGES.map((range) => (
                          <MenuItem key={range} value={range}>{range}</MenuItem>
                        ))}
                      </TextField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <TextField
                        label="Area Size (sq.ft)"
                        name="area_sqft"
                        type="number"
                        value={formData.area_sqft}
                        onChange={handleChange}
                        required
                        fullWidth
                      />
                      <TextField
                        select
                        label="Service Category"
                        name="service_type"
                        value={formData.service_type}
                        onChange={handleChange}
                        required
                        fullWidth
                      >
                        <MenuItem value="Interior">Interior Design</MenuItem>
                        <MenuItem value="Exterior">Exterior Design</MenuItem>
                      </TextField>
                    </div>

                    <div>
                      <TextField
                        label="Preferred Date"
                        name="preferred_date"
                        type="date"
                        value={formData.preferred_date}
                        onChange={handleChange}
                        required
                        fullWidth
                        slotProps={{
                          inputLabel: { shrink: true }
                        }}
                      />
                    </div>

                    <TextField
                      label="Additional Requirements / Message"
                      name="message"
                      multiline
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
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
                      endIcon={<CalendarMonth />}
                      sx={{ py: 1.6, mt: 1, borderRadius: '999px', alignSelf: 'flex-start', px: 4 }}
                    >
                      {submitting ? 'Booking...' : 'Book Design Consultation'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

          </div>
        </div>
      </section>

    </Box>
  );
};
export default BookConsultation;
