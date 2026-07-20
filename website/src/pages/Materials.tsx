import React from 'react';
import { Box, Typography, Card, CardContent, Divider } from '@mui/material';
import { Shield, WorkspacePremium, LocalShipping } from '@mui/icons-material';

const MATERIALS_CATEGORIES = [
  {
    title: 'Engineered Wood & Plywood',
    brand: 'CenturyPly / Greenply',
    desc: 'Boiling Water Resistant (BWR) and IS:710 Marine Grade structural panels, calibrated for uniform thickness and lifetime termite warranty.',
    image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=600&q=80'
  },
  {
    title: 'Premium Decorative Laminates',
    brand: 'Merino / Greenlam',
    desc: '1.0mm high-pressure decorative panels offering anti-fingerprint surfaces, scratch-resistant matte, and high-gloss acrylic profiles.',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80'
  },
  {
    title: 'Hardware & Drawer Organisers',
    brand: 'Hafele / Hettich / Blum',
    desc: 'Bespoke soft-close tandem drawers, corner carousel baskets, pantries, and profile handles backed with a lifetime operating warranty.',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80'
  },
  {
    title: 'Wall Paints & Coatings',
    brand: 'Asian Paints / Berger',
    desc: 'Asian Paints Royale Silk emulsions for zero VOC smell and anti-bacterial surfaces, custom Italian textured coatings, and PU wood gloss.',
    image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=600&q=80'
  },
  {
    title: 'Electrical & Profile Lighting',
    brand: 'Philips / Havells / Panasonic',
    desc: 'Integrated strip LED profile lights under kitchen wall shelves, custom suspended warm spotlight tracks, and automated smart-dimmer presets.',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=600&q=80'
  }
];

export const Materials: React.FC = () => {
  return (
    <Box sx={{ pb: 12 }}>
      
      {/* Banner */}
      <Box 
        className="relative h-[300px] md:h-[400px] flex items-center justify-center bg-cover bg-center text-white"
        style={{ 
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.75)), url('https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=80')`,
          marginTop: '-72px'
        }}
      >
        <div className="text-center mt-12">
          <Typography variant="h2" className="text-white text-4xl md:text-6xl font-bold mb-3" sx={{ fontFamily: '"Playfair Display", serif' }}>
            Materials We Specify
          </Typography>
          <Typography variant="body1" className="text-gray-300 max-w-xl mx-auto font-light text-base md:text-lg px-4">
            We partner only with premium brand manufacturers to guarantee lifetime structural integrity.
          </Typography>
        </div>
      </Box>

      {/* Materials Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {MATERIALS_CATEGORIES.map((mat, idx) => (
              <Card key={idx} className="h-full hover:shadow-premium-lg transition-all duration-300">
                <div className="h-[200px] overflow-hidden">
                  <img src={mat.image} alt={mat.title} className="w-full h-full object-cover" />
                </div>
                <CardContent sx={{ p: 4, textAlign: 'left' }} className="flex flex-col gap-3">
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>{mat.title}</Typography>
                  <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
                    Partner Brand: {mat.brand}
                  </Typography>
                  <Divider />
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {mat.desc}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Brand standards banner */}
      <section className="py-20 bg-slate-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {[
            { Icon: Shield, title: 'Zero compromise quality', desc: 'No cheap local unbranded plywood or sub-standard hardware fittings are allowed on our job sites.' },
            { Icon: WorkspacePremium, title: 'E1 Emission Certified Wood', desc: 'All panels used have low formaldehyde emission, keeping your family safe from indoor VOC gases.' },
            { Icon: LocalShipping, title: 'Direct factory procurement', desc: 'Materials are sourced directly from brand channels to ensure genuine sheets and avoid counter copies.' }
          ].map((std, idx) => (
            <div key={idx} className="flex gap-4">
              <std.Icon className="text-[#6D28D9] shrink-0" sx={{ fontSize: 32 }} />
              <div>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>{std.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>{std.desc}</Typography>
              </div>
            </div>
          ))}
        </div>
      </section>

    </Box>
  );
};
export default Materials;
