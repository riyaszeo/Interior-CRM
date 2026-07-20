import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Button, TextField, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Card, CardContent, Divider } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

const PACKAGES = [
  {
    name: 'Essential Package',
    price: 1299,
    tagline: 'Ideal for rental properties and budget homes seeking clean modular aesthetics.',
    features: [
      'Commercial MR Grade Plywood',
      '0.8mm Matte Laminate Finishes',
      'Premium Soft-Close Hinges',
      'Basic Gypsum False Ceiling',
      'Standard Asian Paints Tractor Emulsion',
      'Turnkey Delivery in 45 Days'
    ]
  },
  {
    name: 'Premium Package',
    price: 1699,
    tagline: 'Perfect balance of longevity, quality, and premium customized styling.',
    features: [
      'BWR Waterproof Plywood structure',
      '1.0mm High Gloss / Suede Laminates',
      'Hafele / Hettich Soft-Close Hardware',
      'Designer linear LED False Ceiling',
      'Asian Paints Royale Luxury Emulsion',
      '10-Year Warranty Certificate'
    ]
  },
  {
    name: 'Luxury Package',
    price: 2499,
    tagline: 'The ultimate bespoke experience with high-end acrylic surfaces and stone tiles.',
    features: [
      'IS:710 Marine Grade Plywood structure',
      'Premium Acrylic or Veneer finishes',
      'Blum Aventos / Hafele top-tier fittings',
      'Double-height linear profile ceilings',
      'Custom texture coatings & PU Polishes',
      'Lifetime Hardware Service Assurance'
    ]
  }
];

export const Packages: React.FC = () => {
  const [area, setArea] = useState<number | string>(1200);
  const [selectedPkg, setSelectedPkg] = useState<number>(1); // default Premium

  const estimatedTotal = Number(area) * PACKAGES[selectedPkg].price;

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
            Design Pricing Packages
          </Typography>
          <Typography variant="body1" className="text-gray-300 max-w-xl mx-auto font-light text-base md:text-lg px-4">
            Transparent pricing per square foot without any hidden parameters.
          </Typography>
        </div>
      </Box>

      {/* Packages Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PACKAGES.map((pkg, idx) => {
              const isBest = idx === 1; // Premium is popular
              return (
                <Card 
                  key={idx}
                  className={`relative flex flex-col justify-between hover:translate-y-[-8px] transition-all duration-300 ${
                    isBest ? 'border-2 border-[#6D28D9] shadow-premium-lg' : ''
                  }`}
                >
                  {isBest && (
                    <span className="absolute top-4 right-4 bg-[#6D28D9] text-white text-xs font-black uppercase px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  )}
                  <CardContent sx={{ p: 4, textAlign: 'left' }} className="flex flex-col gap-5">
                    <div>
                      <Typography variant="h5" sx={{ fontWeight: 800 }}>{pkg.name}</Typography>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{pkg.tagline}</p>
                    </div>
                    <div className="flex items-baseline gap-1 my-2">
                      <Typography variant="h3" color="primary.main" sx={{ fontWeight: 900 }}>₹{pkg.price}</Typography>
                      <Typography variant="caption" color="text.secondary">/ sq.ft</Typography>
                    </div>
                    <Divider />
                    <div className="flex flex-col gap-3">
                      {pkg.features.map((feat, fidx) => (
                        <div key={fidx} className="flex items-center gap-2.5">
                          <CheckCircle className="text-[#6D28D9]" fontSize="small" />
                          <Typography variant="body2" className="text-gray-700">{feat}</Typography>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <Box sx={{ px: 4, pb: 4 }}>
                    <Link to="/book" className="no-underline">
                      <Button 
                        variant={isBest ? 'contained' : 'outlined'} 
                        fullWidth 
                        sx={{ borderRadius: '999px', py: 1.5 }}
                      >
                        Book Consultation
                      </Button>
                    </Link>
                  </Box>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE PRICE ESTIMATOR */}
      <section className="py-20 bg-slate-50 border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-6 text-left">
          <Card className="p-8 shadow-premium-lg rounded-3xl bg-white border border-gray-200/80">
            <Typography variant="h4" className="mb-4 text-[#111827]" sx={{ fontWeight: 800, fontFamily: '"Playfair Display", serif' }}>
              Bespoke Cost Estimator
            </Typography>
            <Typography variant="body2" color="text.secondary" className="mb-8">
              Enter your carpet area size to estimate your budget based on standard structural parameters.
            </Typography>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-5 flex flex-col gap-4">
                <TextField
                  label="Area Size (sq.ft)"
                  type="number"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  fullWidth
                  slotProps={{
                    input: { sx: { borderRadius: '12px' } }
                  }}
                />
                <TextField
                  select
                  label="Select Package Tier"
                  value={selectedPkg}
                  onChange={(e) => setSelectedPkg(Number(e.target.value))}
                  fullWidth
                  slotProps={{
                    input: { sx: { borderRadius: '12px' } }
                  }}
                >
                  {PACKAGES.map((pkg, idx) => (
                    <MenuItem key={idx} value={idx}>
                      {pkg.name} (₹{pkg.price}/sq.ft)
                    </MenuItem>
                  ))}
                </TextField>
              </div>
              <div className="md:col-span-7 text-center md:text-right">
                <Box className="p-6 rounded-2xl bg-[#6D28D9]/5 border border-[#6D28D9]/10 inline-block w-full">
                  <Typography variant="caption" color="text.secondary" className="uppercase font-bold tracking-wider">
                    Estimated Turnkey Quote
                  </Typography>
                  <Typography variant="h2" color="primary.main" sx={{ fontWeight: 900, my: 1 }}>
                    ₹{estimatedTotal.toLocaleString('en-IN')}*
                  </Typography>
                  <Typography variant="caption" color="text.secondary" className="block mt-1">
                    *Excludes GST. Final quotation depends on finalized layout selections.
                  </Typography>
                </Box>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* 3. COMPARISON TABLE */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-left">
          <Typography variant="h4" className="mb-8 text-center" sx={{ fontWeight: 800, fontFamily: '"Playfair Display", serif' }}>
            Detailed Material Specifications
          </Typography>
          <TableContainer component={Paper} sx={{ borderRadius: 4, boxShadow: 'none', border: '1px solid #e2e8f0' }}>
            <Table>
              <TableHead className="bg-slate-50">
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Feature</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Essential</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Premium</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Luxury</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {[
                  { feature: 'Core Plywood', essential: 'MR Grade Ply', premium: 'BWR Waterproof Ply', luxury: 'IS:710 Marine Grade Ply' },
                  { feature: 'External Surfaces', essential: '0.8mm Matte Laminates', premium: '1.0mm High Gloss / Suede', luxury: 'Premium Acrylic / PU Veneers' },
                  { feature: 'Drawer Hardware', essential: 'Telescopic Rails', premium: 'Soft-Close Tandem Boxes', luxury: 'Blum Legrabox / Touch-to-open' },
                  { feature: 'Paints & Finishes', essential: 'Tractor Emulsion', premium: 'Royale Luxury Emulsion', luxury: 'Premium PU / Texture Coatings' },
                  { feature: 'Site Supervision', essential: 'Standard Supervisor', premium: 'Dedicated Project Manager', luxury: 'Principal Design Board Lead' }
                ].map((row, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{row.feature}</TableCell>
                    <TableCell>{row.essential}</TableCell>
                    <TableCell>{row.premium}</TableCell>
                    <TableCell>{row.luxury}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </section>

    </Box>
  );
};
export default Packages;
