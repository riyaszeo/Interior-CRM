import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Button, Card, CardContent, CircularProgress } from '@mui/material';
import { ArrowForward, Place, Straighten } from '@mui/icons-material';
import { fetchAPI } from '../services/api';

const CATEGORIES = ['All', 'Residential', 'Commercial', 'Villa', 'Office', 'Landscape', 'Exterior'];

export const Projects: React.FC = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    setLoading(true);
    const path = activeCategory === 'All' ? '/projects' : `/projects?category=${activeCategory}`;
    fetchAPI<any>(path)
      .then(res => {
        if (res.success) {
          setProjects(res.data);
        }
      })
      .catch(() => {
        const staticProjects = [
          {
            title: 'Modern Minimalist Villa',
            category: 'Villa',
            slug: 'modern-minimalist-villa',
            location: 'Noida, UP',
            area_sqft: 4500,
            images: ['https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80']
          },
          {
            title: 'Luxury Penthouse Living',
            category: 'Residential',
            slug: 'luxury-penthouse-living',
            location: 'Mumbai, MH',
            area_sqft: 2800,
            images: ['https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80']
          },
          {
            title: 'Corporate Office Hub',
            category: 'Office',
            slug: 'corporate-office-hub',
            location: 'Bangalore, KA',
            area_sqft: 6200,
            images: ['https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80']
          },
          {
            title: 'Neo-Classical Facade',
            category: 'Exterior',
            slug: 'neo-classical-facade',
            location: 'Coimbatore, TN',
            area_sqft: 3200,
            images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80']
          }
        ];
        
        if (activeCategory === 'All') {
          setProjects(staticProjects);
        } else {
          setProjects(staticProjects.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase()));
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [activeCategory]);

  return (
    <Box sx={{ pb: 12 }}>
      
      {/* Banner */}
      <Box 
        className="relative h-[300px] md:h-[400px] flex items-center justify-center bg-cover bg-center text-white"
        style={{ 
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.75)), url('https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80')`,
          marginTop: '-72px'
        }}
      >
        <div className="text-center mt-12">
          <Typography variant="h2" className="text-white text-4xl md:text-6xl font-bold mb-3" sx={{ fontFamily: '"Playfair Display", serif' }}>
            Portfolio Projects
          </Typography>
          <Typography variant="body1" className="text-gray-300 max-w-xl mx-auto font-light text-base md:text-lg px-4">
            Browse our catalog of successfully executed turnkey interior & exterior designs.
          </Typography>
        </div>
      </Box>

      {/* Categories Filter Menu */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-3">
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <Button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                variant={isSelected ? 'contained' : 'outlined'}
                sx={{
                  borderRadius: '999px',
                  px: 3.5,
                  py: 1.2,
                  fontSize: '0.85rem',
                  border: isSelected ? 'none' : '1px solid',
                  borderColor: 'rgba(109, 40, 217, 0.2)',
                  color: isSelected ? '#fff' : '#6d28d9',
                  '&:hover': {
                    borderColor: '#6d28d9',
                    bgcolor: isSelected ? '' : 'rgba(109, 40, 217, 0.05)'
                  }
                }}
              >
                {cat}
              </Button>
            );
          })}
        </div>
      </section>

      {/* Grid Portfolio */}
      <section className="py-8 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <Box className="flex justify-center py-20">
              <CircularProgress color="primary" />
            </Box>
          ) : projects.length === 0 ? (
            <Box className="text-center py-20">
              <Typography variant="h6" color="text.secondary">No projects found in this category.</Typography>
            </Box>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((proj, idx) => (
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
                      <div className="flex items-center gap-4 text-gray-500 text-xs mt-1">
                        <span className="flex items-center gap-1">
                          <Place sx={{ fontSize: 14 }} /> {proj.location || 'Coimbatore'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Straighten sx={{ fontSize: 14 }} /> {proj.area_sqft ? `${proj.area_sqft} sqft` : '—'}
                        </span>
                      </div>
                    </CardContent>
                  </div>
                  <Box sx={{ px: 3, pb: 3, pt: 0, textAlign: 'left' }}>
                    <Link to={`/projects/${proj.slug}`} className="no-underline">
                      <Button 
                        variant="outlined" 
                        endIcon={<ArrowForward />}
                        fullWidth
                        sx={{ 
                          borderRadius: '999px',
                          py: 1.2,
                          borderColor: 'rgba(109, 40, 217, 0.2)',
                          color: '#6d28d9',
                          '&:hover': {
                            bgcolor: '#6d28d9',
                            color: '#fff',
                            borderColor: '#6d28d9'
                          }
                        }}
                      >
                        View Details
                      </Button>
                    </Link>
                  </Box>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

    </Box>
  );
};
export default Projects;
