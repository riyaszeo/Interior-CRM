import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Box, Typography, Button, Card, CardContent, Avatar, Divider 
} from '@mui/material';
import { 
  Kitchen, CheckCircle, ChevronLeft, ChevronRight, 
  ArrowForward, History, WorkspacePremium 
} from '@mui/icons-material';
import { 
  Home as HomeIcon, Sofa, Compass, ShieldCheck, HeartHandshake, Eye, Sparkles, Quote 
} from 'lucide-react';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { fetchAPI } from '../services/api';

const HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1920&q=80',
    title: 'Bespoke Luxury Interiors',
    subtitle: 'Crafting spaces that elevate your everyday lifestyle through premium materials and timeless aesthetics.',
  },
  {
    image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1920&q=80',
    title: 'Majestic Exterior Architectures',
    subtitle: 'Fusing neoclassical symmetry with cutting-edge structural facade cladding and outdoor lights.',
  },
  {
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1920&q=80',
    title: 'Intelligent Modern Living',
    subtitle: 'From automated lighting profiles to modular utility spaces designed to optimize clean luxury living.',
  }
];

export const Home: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [featuredProjects, setFeaturedProjects] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchAPI<any>('/projects')
      .then(res => {
        if (res.success) setFeaturedProjects(res.data.slice(0, 3));
      })
      .catch(() => {
        setFeaturedProjects([
          {
            title: 'Modern Minimalist Villa',
            category: 'Villa',
            slug: 'modern-minimalist-villa',
            location: 'Noida, UP',
            images: ['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80']
          },
          {
            title: 'Luxury Penthouse Living',
            category: 'Residential',
            slug: 'luxury-penthouse-living',
            location: 'Mumbai, MH',
            images: ['https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80']
          },
          {
            title: 'Corporate Office Hub',
            category: 'Office',
            slug: 'corporate-office-hub',
            location: 'Bangalore, KA',
            images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80']
          }
        ]);
      });

    fetchAPI<any>('/blogs')
      .then(res => {
        if (res.success) setBlogs(res.data.slice(0, 3));
      })
      .catch(() => {
        setBlogs([
          {
            title: 'Top 10 Interior Design Trends for 2026',
            slug: 'interior-design-trends-2026',
            excerpt: 'Explore the latest luxury design shifts from warm biophilic colors to custom smart-home integrated lighting structures.',
            image_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80',
            published_at: '2026-07-01'
          },
          {
            title: 'Space-Saving Hacks for Compact Modern Living',
            slug: 'space-saving-hacks-compact-living',
            excerpt: 'Transform your compact apartment using multipurpose modular furniture, statement wall beds, and space-multiplying color theories.',
            image_url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80',
            published_at: '2026-07-03'
          }
        ]);
      });
  }, []);

  const nextSlide = () => setActiveSlide(prev => (prev + 1) % HERO_SLIDES.length);
  const prevSlide = () => setActiveSlide(prev => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);

  return (
    <Box sx={{ minHeight: '100vh', mt: '-72px' }}>
      
      {/* 1. HERO AUTOPLAY IMAGE CAROUSEL */}
      <Box className="relative w-full h-screen overflow-hidden bg-slate-950">
        {HERO_SLIDES.map((slide, idx) => (
          <div 
            key={idx}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === activeSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/20 z-10" />
            <img 
              src={slide.image} 
              alt={slide.title} 
              className="absolute inset-0 w-full h-full object-cover" 
            />
            <div className="absolute inset-y-0 left-0 max-w-7xl mx-auto w-full flex items-center px-6 z-20">
              <div className="max-w-2xl text-left text-white mt-16">
                <Typography variant="caption" className="text-[#8B5CF6] font-bold text-sm tracking-widest uppercase block mb-3">
                  Interior & Exterior Design Firm
                </Typography>
                <Typography variant="h1" className="text-white text-5xl md:text-7xl font-bold leading-tight mb-5" sx={{ fontFamily: '"Playfair Display", serif' }}>
                  {slide.title}
                </Typography>
                <Typography variant="body1" className="text-gray-300 text-lg md:text-xl font-light mb-8 leading-relaxed">
                  {slide.subtitle}
                </Typography>
                <Box className="flex items-center gap-4 flex-wrap">
                  <Link to="/book" className="no-underline">
                    <Button variant="contained" size="large" sx={{ py: 1.8, px: 4.5, borderRadius: '999px', fontSize: '1rem' }}>
                      Book Free Consultation
                    </Button>
                  </Link>
                  <Link to="/projects" className="no-underline">
                    <Button variant="outlined" size="large" sx={{ py: 1.8, px: 4.5, color: '#fff', borderColor: '#fff', borderRadius: '999px', fontSize: '1rem', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: '#fff' } }}>
                      Explore Projects
                    </Button>
                  </Link>
                </Box>
              </div>
            </div>
          </div>
        ))}

        <button onClick={prevSlide} className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/20 bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition-all duration-300 z-30">
          <ChevronLeft />
        </button>
        <button onClick={nextSlide} className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full border border-white/20 bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition-all duration-300 z-30">
          <ChevronRight />
        </button>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-30">
          {HERO_SLIDES.map((_, idx) => (
            <button 
              key={idx} 
              onClick={() => setActiveSlide(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-500 bg-white/40 ${
                idx === activeSlide ? 'slider-dot-active' : ''
              }`}
            />
          ))}
        </div>
      </Box>

      {/* 2. COMPANY INTRODUCTION */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1618219944342-824e40a13285?auto=format&fit=crop&w=800&q=80" 
                alt="Interior Design Studio" 
                className="w-full h-[500px] object-cover rounded-3xl shadow-premium-lg"
              />
              <Box 
                sx={{
                  position: 'absolute',
                  bottom: -30,
                  right: 30,
                  bgcolor: '#6D28D9',
                  color: '#fff',
                  borderRadius: 4,
                  p: 4,
                  boxShadow: '0 10px 30px rgba(109,40,217,0.3)',
                  maxWidth: 240,
                  textAlign: 'left'
                }}
              >
                <Typography variant="h3" sx={{ fontWeight: 900, mb: 0.5, color: '#fff', fontSize: '2.5rem' }}>14+</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.75rem' }}>
                  Years of Luxury Architecture Experience
                </Typography>
              </Box>
            </div>
            
            <div className="text-left flex flex-col gap-6">
              <Typography variant="caption" className="text-[#6D28D9] font-bold text-sm tracking-wider uppercase">
                Welcome to VKS Design
              </Typography>
              <Typography variant="h2" className="text-[#111827] text-4xl md:text-5xl font-bold" sx={{ fontFamily: '"Playfair Display", serif', lineHeight: 1.2 }}>
                We Craft Interiors & Exteriors That Tell Your Story
              </Typography>
              <Typography variant="body1" className="text-gray-600 leading-relaxed text-base">
                At VKS Design, we believe a home or corporate office is not just a building; it is a canvas of dreams, lifestyle, and ergonomic functionality. Our expert team of interior decorators, landscape designers, and structural facade consultants bring you tailored turnkey projects that reflect your personality.
              </Typography>
              <Typography variant="body1" className="text-gray-600 leading-relaxed text-base">
                We handle everything from initial consultation, spatial layout planning, color palettes, modular fitting selections, lighting structures, execution, and project handover.
              </Typography>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-[#6D28D9]" fontSize="small" />
                  <Typography variant="body2" className="text-gray-800 font-bold">100% Custom Designs</Typography>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-[#6D28D9]" fontSize="small" />
                  <Typography variant="body2" className="text-gray-800 font-bold">45-Day Delivery Promise</Typography>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-[#6D28D9]" fontSize="small" />
                  <Typography variant="body2" className="text-gray-800 font-bold">10-Year Warranty</Typography>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-[#6D28D9]" fontSize="small" />
                  <Typography variant="body2" className="text-gray-800 font-bold">Top-Grade Materials Only</Typography>
                </div>
              </div>
              <Link to="/about" className="no-underline mt-4">
                <Button variant="outlined" sx={{ py: 1.5, px: 4 }}>
                  Read Our Story
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SERVICES GRID */}
      <section className="py-24 bg-slate-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16 flex flex-col gap-3">
            <Typography variant="caption" className="text-[#6D28D9] font-bold text-sm tracking-wider uppercase">
              Our Expertise
            </Typography>
            <Typography variant="h2" className="text-[#111827] text-4xl" sx={{ fontFamily: '"Playfair Display", serif' }}>
              Bespoke Services We Offer
            </Typography>
            <Typography variant="body2" className="text-gray-500">
              Luxury solutions curated for your personal houses, modular kitchens, corporate office workspaces, and landscape facades.
            </Typography>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { Icon: HomeIcon, title: 'Residential Interior', desc: 'Custom structural solutions for bedrooms, living lounges, false ceilings, and bespoke modular wardrobes.' },
              { Icon: Kitchen, title: 'Modular Kitchens', desc: 'Bespoke modular kitchens with boiling water resistant ply, Hettich/Hafele hardware, and quartz countertops.' },
              { Icon: Sofa, title: 'Commercial Design', desc: 'Retail showrooms, boutique restaurants, and corporate office layouts designed to optimize productivity.' },
              { Icon: Compass, title: 'Exterior elevation', desc: 'Contemporary neoclassical compound wall elevations, facade cladding, UPVC windows, and architectural spot lighting.' },
              { Icon: Sparkles, title: 'Landscape Architecture', desc: 'Zen terrace gardens, pergola designs, swimming pool lounge decks, and sophisticated outdoor lighting setups.' },
              { Icon: Eye, title: '3D Consultation', desc: 'Photorealistic 3D rendering views and walkthrough video simulations before starting spatial work.' }
            ].map((srv, idx) => (
              <Card 
                key={idx}
                className="h-full hover:translate-y-[-8px] transition-all duration-300"
                sx={{ 
                  borderRadius: 4, 
                  border: '1px solid rgba(226, 232, 240, 0.8)',
                  boxShadow: '0 4px 20px -2px rgba(109, 40, 217, 0.03)',
                }}
              >
                <CardContent sx={{ p: 4, textAlign: 'left' }} className="flex flex-col gap-4">
                  <Box sx={{ 
                    width: 50, 
                    height: 50, 
                    borderRadius: 3, 
                    bgcolor: '#F3E8FF', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: '#6D28D9',
                  }}>
                    <srv.Icon />
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>{srv.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{srv.desc}</Typography>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/services" className="no-underline">
              <Button variant="contained" sx={{ px: 4 }}>
                View All Design Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. WHY CHOOSE US */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16 flex flex-col gap-3">
            <Typography variant="caption" className="text-[#6D28D9] font-bold text-sm tracking-wider uppercase">
              Core Strengths
            </Typography>
            <Typography variant="h2" className="text-[#111827] text-4xl" sx={{ fontFamily: '"Playfair Display", serif' }}>
              Why Choose VKS Design
            </Typography>
            <Typography variant="body2" className="text-gray-500">
              Delivering premium design structures backed by strict timelines, premium materials, and absolute warranty parameters.
            </Typography>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { Icon: ShieldCheck, title: '10-Year warranty assurance', desc: 'All cabinets, plywood shutters, and modular hardware fittings come backed with a written warranty cert.' },
              { Icon: History, title: 'Strict 45-day delivery', desc: 'Get moved in on time. We guarantee a 45-day project handover or we pay you penalties per day delayed.' },
              { Icon: HeartHandshake, title: 'No hidden cost layers', desc: 'Once the design model is locked, we sign the quotation. Absolutely zero surprises or extra project bills.' },
              { Icon: WorkspacePremium, title: 'Design execution control', desc: 'Turnkey designers and skilled in-house carpenters supervise your project from layout to handover.' }
            ].map((item, idx) => (
              <div className="text-center flex flex-col items-center gap-3 p-4" key={idx}>
                <Box sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  bgcolor: 'rgba(109, 40, 217, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6D28D9',
                  mb: 1
                }}>
                  <item.Icon size={24} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{item.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{item.desc}</Typography>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PROJECTS */}
      <section className="py-24 bg-slate-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16 flex flex-col gap-3">
            <Typography variant="caption" className="text-[#6D28D9] font-bold text-sm tracking-wider uppercase">
              Our Portfolios
            </Typography>
            <Typography variant="h2" className="text-[#111827] text-4xl" sx={{ fontFamily: '"Playfair Display", serif' }}>
              Featured Design Projects
            </Typography>
            <Typography variant="body2" className="text-gray-500">
              Take a look at some of our award-winning turnkey project handovers.
            </Typography>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredProjects.map((proj, idx) => (
              <Card className="h-full group hover:shadow-premium-lg transition-all duration-300 flex flex-col justify-between" key={idx}>
                <div>
                  <div className="img-zoom-hover h-[240px] relative">
                    <img 
                      src={proj.images?.[0] || 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80'} 
                      alt={proj.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1 rounded text-slate-800 text-xs font-bold uppercase tracking-wider shadow">
                      {proj.category}
                    </div>
                  </div>
                  <CardContent sx={{ p: 3, textAlign: 'left' }} className="flex flex-col gap-2">
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>{proj.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{proj.location || 'Coimbatore'}</Typography>
                  </CardContent>
                </div>
                <Box sx={{ px: 3, pb: 3, pt: 0, textAlign: 'left' }}>
                  <Link to={`/projects/${proj.slug}`} className="no-underline">
                    <Button variant="outlined" endIcon={<ArrowForward />} fullWidth sx={{ borderRadius: '999px', py: 1.2 }}>
                      View Details
                    </Button>
                  </Link>
                </Box>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 5. BEFORE & AFTER */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-5 text-left flex flex-col gap-5">
              <Typography variant="caption" className="text-[#6D28D9] font-bold text-sm tracking-wider uppercase">
                Stunning Transformations
              </Typography>
              <Typography variant="h2" className="text-[#111827] text-4xl" sx={{ fontFamily: '"Playfair Display", serif', lineHeight: 1.2 }}>
                See Before & After Design Magic
              </Typography>
              <Typography variant="body1" className="text-gray-600 leading-relaxed">
                Drag the white handle bar right and left to reveal the dramatic spatial transformation from an empty structural brick shell to a luxury, fully finished custom kitchen.
              </Typography>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-[#6D28D9]" fontSize="small" />
                  <Typography variant="body2" className="text-gray-700 font-bold">Space optimization design</Typography>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-[#6D28D9]" fontSize="small" />
                  <Typography variant="body2" className="text-gray-700 font-bold">Bespoke lighting adjustments</Typography>
                </div>
              </div>
              <Link to="/gallery" className="no-underline mt-2">
                <Button variant="contained">
                  Browse Transformation Gallery
                </Button>
              </Link>
            </div>
            
            <div className="lg:col-span-7">
              <BeforeAfterSlider 
                beforeImage="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80"
                afterImage="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. DESIGN PROCESS */}
      <section className="py-24 bg-slate-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16 flex flex-col gap-3">
            <Typography variant="caption" className="text-[#6D28D9] font-bold text-sm tracking-wider uppercase">
              Our Method
            </Typography>
            <Typography variant="h2" className="text-[#111827] text-4xl" sx={{ fontFamily: '"Playfair Display", serif' }}>
              6-Step Seamless Design Journey
            </Typography>
            <Typography variant="body2" className="text-gray-500">
              How we take your home concept from empty shell sketches to complete luxury turnkey reality.
            </Typography>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Free Consultation', desc: 'Align on design theme, requirements, layouts, and draft budgets.' },
              { step: '02', title: 'Site Measurement', desc: 'Laser measurements taken at the property to ensure millimetre modular fit.' },
              { step: '03', title: '3D Design & Plan', desc: 'Create 3D design models, colors, materials, and modular layouts.' },
              { step: '04', title: 'Material Selection', desc: 'Visit experience centers to select physical laminates, paints, and hardware.' },
              { step: '05', title: 'Supervised Assembly', desc: 'Precision manufacturing in factories and expert installation at site.' },
              { step: '06', title: 'Handover & Warranty', desc: 'Thorough cleaning, final inspection, and handing over key with a 10-year warranty.' }
            ].map((proc, idx) => (
              <Box 
                key={idx}
                className="text-left p-6 h-full rounded-2xl border border-gray-100 hover:border-[#6D28D9] transition-all duration-300 relative bg-white shadow-premium"
              >
                <Typography variant="h2" className="absolute top-4 right-6 text-gray-100 font-black text-5xl" sx={{ fontFamily: '"Playfair Display", serif' }}>
                  {proc.step}
                </Typography>
                <Typography variant="h5" className="text-gray-900 font-bold mb-3 mt-4" sx={{ fontWeight: 800 }}>
                  {proc.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" className="leading-relaxed">
                  {proc.desc}
                </Typography>
              </Box>
            ))}
          </div>
        </div>
      </section>

      {/* STATISTICS */}
      <section className="py-16 bg-[#6D28D9] text-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '14+', label: 'Years Experience' },
            { value: '500+', label: 'Luxury Projects Completed' },
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

      {/* 7. CUSTOMER TESTIMONIALS */}
      <section className="py-24 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16 flex flex-col gap-3">
            <Typography variant="caption" className="text-[#6D28D9] font-bold text-sm tracking-wider uppercase">
              Testimonials
            </Typography>
            <Typography variant="h2" className="text-[#111827] text-4xl" sx={{ fontFamily: '"Playfair Display", serif' }}>
              What Our Clients Say
            </Typography>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Riya Sudheen', comment: 'Every guest who visits our villa is stunned by the living room layout and TV cladding work. The finish is premium luxury!', rating: 5, role: 'Villa Owner' },
              { name: 'Aarav Sharma', comment: 'Hafele kitchen accessories run incredibly smooth. The 45-day delivery promise was kept exactly on time.', rating: 5, role: 'Penthouse Owner' },
              { name: 'Vikram Malhotra', comment: 'Highly structured design firm. The open workstation office layout looks stunning and optimizes floor space.', rating: 5, role: 'CEO, TechCorp' }
            ].map((t, idx) => (
              <Card sx={{ p: 4, borderRadius: 4, height: '100%' }} key={idx}>
                <CardContent sx={{ p: 0, textAlign: 'left' }} className="flex flex-col gap-4">
                  <Quote className="text-[#6D28D9] opacity-30" size={32} />
                  <Typography variant="body2" className="italic text-gray-700 leading-relaxed">
                    "{t.comment}"
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box className="flex items-center gap-3">
                    <Avatar sx={{ bgcolor: '#6D28D9', color: '#fff', fontWeight: 800 }}>{t.name[0]}</Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{t.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{t.role}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* LATEST BLOG POSTS */}
      <section className="py-24 bg-slate-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-16 flex flex-col gap-3">
            <Typography variant="caption" className="text-[#6D28D9] font-bold text-sm tracking-wider uppercase">
              Design Insights
            </Typography>
            <Typography variant="h2" className="text-[#111827] text-4xl" sx={{ fontFamily: '"Playfair Display", serif' }}>
              Latest Articles & Trends
            </Typography>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogs.map((post, idx) => (
              <Card className="h-full hover:shadow-premium-lg transition-all duration-300 flex flex-col justify-between" key={idx}>
                <div>
                  <div className="h-[200px] overflow-hidden">
                    <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                  </div>
                  <CardContent sx={{ p: 4, textAlign: 'left' }} className="flex flex-col gap-3">
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>{post.title}</Typography>
                    <Typography variant="body2" color="text.secondary">{post.excerpt}</Typography>
                  </CardContent>
                </div>
                <Box sx={{ px: 4, pb: 4, pt: 0, textAlign: 'left' }}>
                  <Link to={`/blog/${post.slug}`} className="no-underline">
                    <Button variant="outlined" endIcon={<ArrowForward />} sx={{ borderRadius: '999px' }}>
                      Read Article
                    </Button>
                  </Link>
                </Box>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 8. TRUSTED BRANDS */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <Typography variant="caption" className="text-[#6D28D9] font-bold text-xs tracking-widest uppercase block mb-8">
            Premium Partner Brands We Specify
          </Typography>
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {['CenturyPly', 'Hafele', 'Greenply', 'Merino', 'Asian Paints', 'Jaquar'].map((brand, idx) => (
              <Typography 
                key={idx} 
                variant="h5" 
                className="font-black text-gray-400 select-none"
                sx={{ fontFamily: '"Playfair Display", serif' }}
              >
                {brand}
              </Typography>
            ))}
          </div>
        </div>
      </section>

      {/* 9. CONTACT CTA SECTION */}
      <section className="py-20 bg-slate-900 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80')` }} />
        <div className="max-w-4xl mx-auto px-6 relative z-10 flex flex-col items-center gap-6">
          <Typography variant="h2" className="text-white text-4xl md:text-5xl font-bold" sx={{ fontFamily: '"Playfair Display", serif' }}>
            Ready to design your luxury space?
          </Typography>
          <Typography variant="body1" className="text-gray-300 max-w-xl text-lg leading-relaxed">
            Get in touch with our design experts today. Schedule a free design consultation layout at your property or visit our studio center.
          </Typography>
          <Box className="flex gap-4 flex-wrap mt-2">
            <Link to="/book" className="no-underline">
              <Button variant="contained" size="large" sx={{ px: 4, py: 1.8, borderRadius: '999px' }}>
                Book Free Consultation
              </Button>
            </Link>
            <Link to="/contact" className="no-underline">
              <Button variant="outlined" size="large" sx={{ px: 4, py: 1.8, color: '#fff', borderColor: '#fff', borderRadius: '999px', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', borderColor: '#fff' } }}>
                Contact Our Studio
              </Button>
            </Link>
          </Box>
        </div>
      </section>

    </Box>
  );
};
export default Home;
