import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Typography, CircularProgress, Divider, Avatar, Button } from '@mui/material';
import { Place, Straighten, CalendarMonth, AttachMoney, ChevronLeft, FormatQuote } from '@mui/icons-material';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { fetchAPI } from '../services/api';

export const ProjectDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    fetchAPI<any>(`/projects/${slug}`)
      .then(res => {
        if (res.success && res.data) {
          setProject(res.data);
          setActiveImage(res.data.images?.[0] || '');
        }
      })
      .catch(() => {
        const fallbacks: Record<string, any> = {
          'modern-minimalist-villa': {
            title: 'Modern Minimalist Villa',
            category: 'Villa',
            description: 'A gorgeous minimalist villa with double-height ceiling, glass facade, and premium teak wood finishes. The design maximizes natural ventilation while offering a luxury private swimming pool deck.',
            area_sqft: 4500,
            location: 'Noida, UP',
            budget: '₹1.5 Crores',
            completion_date: '2025-10-15',
            materials_used: ['Italian Marble', 'Teak Wood Planks', 'Toughened Glass Panels', 'Lutron Smart Automation'],
            testimonial: {
              name: 'Riya Sudheen',
              rating: 5,
              comment: 'Antigravity designed our dream home with perfect aesthetics. Every detail is a work of art! Highly recommended.',
            },
            images: [
              'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
              'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
              'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
            ],
            before_after: {
              before: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
              after: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
            }
          },
          'luxury-penthouse-living': {
            title: 'Luxury Penthouse Living',
            category: 'Residential',
            description: 'A high-end contemporary penthouse with premium gold accents, custom velvet upholstery, and state-of-the-art modular kitchen solutions.',
            area_sqft: 2800,
            location: 'Mumbai, MH',
            budget: '₹85 Lakhs',
            completion_date: '2025-12-01',
            materials_used: ['Charcoal Louver Panels', 'Hafele Modular Fitting', 'Asian Paints Royale Silk', 'Custom Brass Profiles'],
            testimonial: {
              name: 'Aarav Sharma',
              rating: 5,
              comment: 'The design is outstanding! It feels like living in a luxury boutique resort every single day.',
            },
            images: [
              'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=80',
              'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
            ]
          },
          'corporate-office-hub': {
            title: 'Corporate Office Hub',
            category: 'Office',
            description: 'An ergonomic, open-concept corporate headquarters featuring soundproof glass cabins, custom workstation desks, biophilic green walls, and recreational break zones.',
            area_sqft: 6200,
            location: 'Bangalore, KA',
            budget: '₹1.2 Crores',
            completion_date: '2026-02-18',
            materials_used: ['Acoustic Soft Panels', 'LED Linear Lights', 'Premium Nylon Carpet Tiles', 'Vertical Garden Frame'],
            testimonial: {
              name: 'Vikram Malhotra',
              rating: 5,
              comment: 'Antigravity optimized our workspace beautifully. Productivity and team morale are at an all-time high.',
            },
            images: [
              'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
              'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
            ]
          },
          'neo-classical-facade': {
            title: 'Neo-Classical Facade',
            category: 'Exterior',
            description: 'A neoclassical front elevation exterior facade featuring monumental concrete columns, architectural moulding trims, UPVC French windows, and warm ambient outdoor lighting.',
            area_sqft: 3200,
            location: 'Coimbatore, TN',
            budget: '₹45 Lakhs',
            completion_date: '2026-04-10',
            materials_used: ['Shera Fiber Cement Cladding', 'Stone Texture Coating', 'Warm LED Facade Uplights', 'UPVC Toughened Glass Windows'],
            testimonial: {
              name: 'Anjali Krishnan',
              rating: 5,
              comment: 'Our house exterior looks majestic. The neoclassical elevation detail is extremely beautiful!',
            },
            images: [
              'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
              'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
            ]
          }
        };

        const found = fallbacks[slug || ''];
        setProject(found || null);
        setActiveImage(found?.images?.[0] || '');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <Box className="flex justify-center items-center min-h-[60vh]">
        <CircularProgress />
      </Box>
    );
  }

  if (!project) {
    return (
      <Box className="text-center py-20">
        <Typography variant="h5" color="error">Project not found.</Typography>
        <Link to="/projects" className="no-underline mt-4 inline-block">
          <Button variant="outlined">&larr; Back to Portfolio</Button>
        </Link>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 12 }}>
      
      {/* Header breadcrumb toolbar */}
      <section className="py-6 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 flex items-center">
          <Link to="/projects" className="no-underline flex items-center gap-1.5 text-gray-500 font-semibold hover:text-[#6D28D9] transition-all">
            <ChevronLeft /> Back to Portfolio
          </Link>
        </div>
      </section>

      {/* Main Info */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            
            {/* Gallery Images Column */}
            <div className="lg:col-span-7">
              <Box className="flex flex-col gap-4">
                {/* Main Photo */}
                <Box className="rounded-2xl overflow-hidden h-[450px] shadow border border-gray-100">
                  <img 
                    src={activeImage} 
                    alt={project.title} 
                    className="w-full h-full object-cover transition-all duration-500" 
                  />
                </Box>
                {/* Thumbs list */}
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {project.images?.map((img: string, idx: number) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImage(img)}
                      className={`w-24 h-16 rounded-lg overflow-hidden border-2 shrink-0 ${
                        activeImage === img ? 'borderColor: #6D28D9 border-[#6D28D9]' : 'border-transparent'
                      }`}
                    >
                      <img src={img} alt="project thumbnail" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </Box>
            </div>

            {/* Spec details column */}
            <div className="lg:col-span-5 text-left flex flex-col gap-6">
              <span className="bg-[#F3E8FF] text-[#6D28D9] font-bold text-xs px-3 py-1 rounded-full w-max uppercase tracking-wider">
                {project.category}
              </span>
              <Typography variant="h3" sx={{ fontWeight: 800, fontFamily: '"Playfair Display", serif', color: '#111827' }}>
                {project.title}
              </Typography>
              <Typography variant="body1" className="text-gray-600 leading-relaxed">
                {project.description}
              </Typography>

              <Divider />

              {/* Stats parameters */}
              <div className="grid grid-cols-2 gap-6">
                {[
                  { Icon: Place, label: 'Location', val: project.location },
                  { Icon: Straighten, label: 'Area Size', val: `${project.area_sqft} sqft` },
                  { Icon: CalendarMonth, label: 'Completion', val: project.completion_date ? new Date(project.completion_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : 'Pending' },
                  { Icon: AttachMoney, label: 'Budget Investment', val: project.budget || 'Confidential' }
                ].map((spec, idx) => (
                  <div className="flex items-center gap-2" key={idx}>
                    <spec.Icon className="text-[#6D28D9]" fontSize="small" />
                    <div>
                      <Typography variant="caption" color="text.secondary" className="block uppercase font-bold text-[0.65rem] tracking-wide">{spec.label}</Typography>
                      <Typography variant="body2" className="text-slate-800 font-bold">{spec.val}</Typography>
                    </div>
                  </div>
                ))}
              </div>

              <Divider />

              {/* Materials used list */}
              {project.materials_used && (
                <div>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5 }}>Materials Specified:</Typography>
                  <div className="flex flex-wrap gap-2">
                    {project.materials_used.map((mat: string, idx: number) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-slate-200">
                        {mat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* Before & After slider section */}
      {project.before_after && (
        <section className="py-20 bg-slate-50 border-y border-gray-100">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: '"Playfair Display", serif', mb: 1.5 }}>
              Project Transformation View
            </Typography>
            <Typography variant="body2" color="text.secondary" className="max-w-lg mx-auto mb-10 leading-relaxed">
              Drag the divider line to observe the complete before/after space makeovers.
            </Typography>
            <BeforeAfterSlider 
              beforeImage={project.before_after.before}
              afterImage={project.before_after.after}
            />
          </div>
        </section>
      )}

      {/* Client Testimonial */}
      {project.testimonial && (
        <section className="py-20 bg-white">
          <div className="max-w-3xl mx-auto px-6 text-center flex flex-col items-center gap-6">
            <Typography variant="caption" className="text-[#6D28D9] font-bold text-xs tracking-widest uppercase block">
              Client Testimonial
            </Typography>
            <FormatQuote className="text-[#6D28D9] opacity-25 rotate-180" sx={{ fontSize: 50 }} />
            <Typography variant="h5" className="text-gray-700 italic leading-relaxed font-light">
              "{project.testimonial.comment}"
            </Typography>
            <Box className="flex items-center gap-3 mt-2">
              <Avatar sx={{ bgcolor: '#6D28D9', color: '#fff', fontWeight: 800 }}>{project.testimonial.name?.[0]}</Avatar>
              <div className="text-left">
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{project.testimonial.name}</Typography>
                <Typography variant="caption" color="text.secondary">Verified Client Review</Typography>
              </div>
            </Box>
          </div>
        </section>
      )}

    </Box>
  );
};
export default ProjectDetail;
