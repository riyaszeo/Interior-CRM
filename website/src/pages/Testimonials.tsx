import React from 'react';
import { Box, Typography, Card, CardContent, Avatar } from '@mui/material';
import { Star } from '@mui/icons-material';
// Quote removed

const TESTIMONIALS = [
  { name: 'Riya Sudheen', role: 'Villa Owner, Coimbatore', rating: 5, comment: 'We contracted VKS Design for our neoclassical front elevation and complete interior work. The project was handed over within 42 days, exactly as budgeted. Extremely professional work!', img: '' },
  { name: 'Aarav Sharma', role: 'Penthouse Owner, Mumbai', rating: 5, comment: 'The modular kitchen tandems and tall pantry unit designed by the team are amazing. Storage is optimized perfectly, and the gloss acrylic finish looks premium.', img: '' },
  { name: 'Vikram Malhotra', role: 'CEO, Innovate Offices', rating: 5, comment: 'Exceptional workspace architect supervision. Soundproof cabins and partition layout adjustments were done with zero noise leaks. A top-tier commercial team.', img: '' },
  { name: 'Anjali Krishnan', role: 'Apartment Owner, Bangalore', rating: 5, comment: 'Our 3BHK flat looks incredibly spacious now. The custom modular wardrobes and linear profile cove ceilings created a massive luxury effect.', img: '' }
];

export const Testimonials: React.FC = () => {
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
            Client Reviews & Ratings
          </Typography>
          <Typography variant="body1" className="text-gray-300 max-w-xl mx-auto font-light text-base md:text-lg px-4">
            Hear from our homeowners and business leaders on their space transformations.
          </Typography>
        </div>
      </Box>

      {/* Grid listing */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {TESTIMONIALS.map((t, idx) => (
              <Card sx={{ p: 4, borderRadius: 4, height: '100%', display: 'flex', flexDirection: 'column' }} key={idx}>
                <CardContent sx={{ p: 0, textAlign: 'left', display: 'flex', flexDirection: 'column', height: '100%', gap: 3 }}>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    {[...Array(t.rating)].map((_, sidx) => (
                      <Star key={sidx} fontSize="small" />
                    ))}
                  </div>
                  <Typography variant="body2" className="italic text-gray-700 leading-relaxed font-light flex-grow">
                    "{t.comment}"
                  </Typography>
                  <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100">
                    <Avatar sx={{ bgcolor: '#6D28D9', color: '#fff', fontWeight: 800 }}>{t.name[0]}</Avatar>
                    <div>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{t.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{t.role}</Typography>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

    </Box>
  );
};
export default Testimonials;
