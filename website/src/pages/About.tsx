import React from 'react';
import { Box, Typography, Card, CardContent, Avatar } from '@mui/material';
import { WorkspacePremium } from '@mui/icons-material';

export const About: React.FC = () => {
  return (
    <Box sx={{ pb: 12 }}>
      
      {/* Banner */}
      <Box 
        className="relative h-[300px] md:h-[400px] flex items-center justify-center bg-cover bg-center text-white"
        style={{ 
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.7)), url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80')`,
          marginTop: '-72px'
        }}
      >
        <div className="text-center mt-12">
          <Typography variant="h2" className="text-white text-4xl md:text-6xl font-bold mb-3" sx={{ fontFamily: '"Playfair Display", serif' }}>
            About Our Company
          </Typography>
          <Typography variant="body1" className="text-gray-300 max-w-xl mx-auto font-light text-base md:text-lg px-4">
            A premium interior and exterior architecture design firm delivering turnkey dream properties.
          </Typography>
        </div>
      </Box>

      {/* Story */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="text-left flex flex-col gap-6">
              <Typography variant="caption" className="text-[#6D28D9] font-bold text-sm tracking-wider uppercase">Our Legacy</Typography>
              <Typography variant="h3" className="text-slate-900 text-3xl md:text-4xl font-bold" sx={{ fontFamily: '"Playfair Display", serif', lineHeight: 1.2 }}>
                Turnkey Premium Designs Since 2012
              </Typography>
              <Typography variant="body1" className="text-gray-600 leading-relaxed">
                VKS Design started as a small spatial consultancy team in Coimbatore and has grown into a leading luxury architecture firm spanning across South India. With over 14 years of turnkey delivery experience, our core focus has always remained consistent: providing high-end aesthetics backed by uncompromising material durability.
              </Typography>
              <Typography variant="body1" className="text-gray-600 leading-relaxed">
                We manage everything end-to-end, including interior decor, modular kitchen construction, customized false ceilings, neoclassical elevations, compound wall landscape gates, and ambient terrace lighting designs.
              </Typography>
            </div>
            <div>
              <img 
                src="https://images.unsplash.com/photo-1618219944342-824e40a13285?auto=format&fit=crop&w=800&q=80" 
                alt="Our Studio Office" 
                className="w-full h-[400px] object-cover rounded-2xl shadow-premium"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="py-20 bg-slate-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card sx={{ p: 4 }}>
              <CardContent sx={{ p: 0, textAlign: 'left' }} className="flex flex-col gap-4">
                <Typography variant="h5" className="text-slate-900 font-bold" sx={{ fontFamily: '"Playfair Display", serif' }}>
                  Our Vision
                </Typography>
                <Typography variant="body2" className="text-gray-600 leading-relaxed">
                  To establish VKS Design as the gold standard of premium architecture and turnkey interior design by continuously innovating spatial optimization techniques and structural materials.
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ p: 4 }}>
              <CardContent sx={{ p: 0, textAlign: 'left' }} className="flex flex-col gap-4">
                <Typography variant="h5" className="text-slate-900 font-bold" sx={{ fontFamily: '"Playfair Display", serif' }}>
                  Our Mission
                </Typography>
                <Typography variant="body2" className="text-gray-600 leading-relaxed">
                  To deliver luxurious, custom, move-in-ready living properties that seamlessly combine neoclassical styling elegance, premium grade certifications, and absolute 45-day project handover timelines.
                </Typography>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="py-16 bg-[#6D28D9] text-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '14+', label: 'Years Experience' },
            { value: '500+', label: 'Luxury Projects Done' },
            { value: '98%', label: 'Happy Clients' },
            { value: '10 Yrs', label: 'Material Warranty' }
          ].map((stat, idx) => (
            <div key={idx} className="text-center">
              <Typography variant="h2" sx={{ fontWeight: 900, color: '#fff', mb: 1, fontSize: '3rem' }}>{stat.value}</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>{stat.label}</Typography>
            </div>
          ))}
        </div>
      </section>

      {/* Awards & Certifications */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16 flex flex-col gap-3">
            <Typography variant="caption" className="text-[#6D28D9] font-bold text-sm tracking-wider uppercase">Our Achievements</Typography>
            <Typography variant="h3" className="text-slate-900 text-3xl font-bold" sx={{ fontFamily: '"Playfair Display", serif' }}>
              Awards & Certifications
            </Typography>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Best Turnkey Designer 2024', issuer: 'National Design Awards', desc: 'Awarded for delivering 100+ fully-finished residential villas on strict timelines.' },
              { title: 'ISO 9001:2015 Certified', issuer: 'Quality Standards Org', desc: 'Certified factory manufacturing and assembly processes for modular wardrobes.' },
              { title: 'Luxury Elevation Specialist', issuer: 'South India Build Conclave', desc: 'Recognized for neoclassical elevation and outdoor gate landscape styling designs.' }
            ].map((award, idx) => (
              <Box className="p-6 rounded-2xl border border-gray-100 bg-slate-50/50 text-left h-full flex flex-col gap-3" key={idx}>
                <WorkspacePremium className="text-[#6D28D9]" sx={{ fontSize: 40 }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{award.title}</Typography>
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }}>{award.issuer}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{award.desc}</Typography>
              </Box>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-slate-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16 flex flex-col gap-3">
            <Typography variant="caption" className="text-[#6D28D9] font-bold text-sm tracking-wider uppercase">Creative Minds</Typography>
            <Typography variant="h3" className="text-slate-900 text-3xl font-bold" sx={{ fontFamily: '"Playfair Display", serif' }}>
              Our Expert Design Board
            </Typography>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Karthik Raja', role: 'Principal Architect & Founder', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80' },
              { name: 'Priya Sundar', role: 'Head of Interior Decor', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80' },
              { name: 'Naveen Kumar', role: 'Chief Structural Engineer', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80' }
            ].map((member, idx) => (
              <Box className="flex flex-col items-center gap-3 text-center" key={idx}>
                <Avatar 
                  src={member.img} 
                  alt={member.name}
                  sx={{ width: 140, height: 140, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                />
                <Box className="mt-2">
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{member.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{member.role}</Typography>
                </Box>
              </Box>
            ))}
          </div>
        </div>
      </section>

    </Box>
  );
};
export default About;
