import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { CheckCircle, Kitchen, Business, Landscape } from '@mui/icons-material';

const SERVICE_CATEGORIES = [
  {
    title: 'Luxury Interior Design',
    desc: 'Bespoke custom designs that transform ordinary rooms into beautiful contemporary living environments.',
    items: [
      { name: 'Modular Kitchens', desc: 'Waterproof plywood structure with acrylic louver finishes and integrated appliances.' },
      { name: 'Living Rooms & Lounges', desc: 'Bespoke TV backdrops, wall wood paneling, and curated spatial color schemes.' },
      { name: 'Bespoke Wardrobes', desc: 'Sliding glass floor-to-ceiling shutters and custom drawer partition inserts.' },
      { name: 'False Ceilings & Lighting', desc: 'Gypsum ceiling boards with custom LED linear cove lights and automated dimmers.' },
      { name: 'TV Console Units', desc: 'Suspended custom veneer shelves with back-lit charcoal paneling details.' }
    ],
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
    Icon: Kitchen
  },
  {
    title: 'Bespoke Exterior Architecture',
    desc: 'Neoclassical facade designs, front elevations, and compound wall structures built for maximum street presence.',
    items: [
      { name: 'Front Elevation Design', desc: 'Neoclassical mouldings, columns, UPVC French doors, and exterior uplighting.' },
      { name: 'Landscape & Terrace Gardens', desc: 'Curated vertical plants, lawn turfing, and automated water sprinkler lines.' },
      { name: 'Outdoor Pergolas & Decks', desc: 'Teak wood structural pergolas, glass roofings, and wooden deck seating.' },
      { name: 'Facade Cladding', desc: 'Shera cement boards, stone textures, and texturized external paints.' },
      { name: 'Gates & Fences', desc: 'Custom laser-cut metal gates, automated sensors, and compound wall designs.' }
    ],
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    Icon: Landscape
  },
  {
    title: 'Bespoke Workspaces',
    desc: 'Ergonomic, modern commercial layouts for retail showrooms, restaurants, and headquarters.',
    items: [
      { name: 'Executive Offices & HQ', desc: 'Ergonomic partitions, soundproof glass cabins, linear LEDs, and break areas.' },
      { name: 'Restaurant Interiors', desc: 'Curated ambient layouts, customized booths, lighting profiles, and kitchen zones.' },
      { name: 'Retail Showrooms', desc: 'Product display shelves, focus spotlight focus spotlight arrays, and premium reception setups.' }
    ],
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    Icon: Business
  }
];

export const Services: React.FC = () => {
  return (
    <Box sx={{ pb: 12 }}>
      
      {/* Banner */}
      <Box 
        className="relative h-[300px] md:h-[400px] flex items-center justify-center bg-cover bg-center text-white"
        style={{ 
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.75)), url('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80')`,
          marginTop: '-72px'
        }}
      >
        <div className="text-center mt-12">
          <Typography variant="h2" className="text-white text-4xl md:text-6xl font-bold mb-3" sx={{ fontFamily: '"Playfair Display", serif' }}>
            Our Design Services
          </Typography>
          <Typography variant="body1" className="text-gray-300 max-w-xl mx-auto font-light text-base md:text-lg px-4">
            Bespoke turnkey solutions for interior, exterior, elevation, and commercial workspaces.
          </Typography>
        </div>
      </Box>

      {/* Categories Listing */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col gap-24">
          {SERVICE_CATEGORIES.map((cat, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <div 
                className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center" 
                key={idx}
              >
                {/* Image */}
                <div className={`${isEven ? 'order-1' : 'order-1 lg:order-2'}`}>
                  <img 
                    src={cat.image} 
                    alt={cat.title} 
                    className="w-full h-[450px] object-cover rounded-3xl shadow-premium-lg"
                  />
                </div>
                {/* Content */}
                <div className={`text-left flex flex-col gap-5 ${isEven ? 'order-2' : 'order-2 lg:order-1'}`}>
                  <Box className="flex items-center gap-3">
                    <Box sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: '#F3E8FF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#6D28D9'
                    }}>
                      <cat.Icon />
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: '"Playfair Display", serif', color: '#111827' }}>
                      {cat.title}
                    </Typography>
                  </Box>
                  <Typography variant="body1" color="text.secondary" className="leading-relaxed">
                    {cat.desc}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <div className="flex flex-col gap-4">
                    {cat.items.map((item, itemIdx) => (
                      <div className="flex items-start gap-3" key={itemIdx}>
                        <CheckCircle className="text-[#6D28D9] shrink-0 mt-0.5" fontSize="small" />
                        <div>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.primary' }}>{item.name}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2, lineHeight: 1.4 }}>
                            {item.desc}
                          </Typography>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </Box>
  );
};
export default Services;
