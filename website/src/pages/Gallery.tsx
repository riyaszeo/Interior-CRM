import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, IconButton, CircularProgress, Dialog } from '@mui/material';
import { Close as CloseIcon, PlayCircle as PlayIcon } from '@mui/icons-material';
import { fetchAPI } from '../services/api';

const CATEGORIES = ['All', 'Residential', 'Commercial', 'Villa', 'Office', 'Landscape', 'Exterior'];

export const Gallery: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Lightbox States
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  useEffect(() => {
    setLoading(true);
    const path = activeCategory === 'All' ? '/gallery' : `/gallery?category=${activeCategory}`;
    fetchAPI<any>(path)
      .then(res => {
        if (res.success) {
          setItems(res.data);
        }
      })
      .catch(() => {
        // Fallback static gallery items
        const staticItems = [
          { title: 'Luxury Bedroom Design', type: 'photo', category: 'Residential', media_url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80' },
          { title: 'Sophisticated Living Area', type: 'photo', category: 'Residential', media_url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80' },
          { title: 'Modern Kitchen Lounge', type: 'photo', category: 'Residential', media_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80' },
          { title: 'Executive Office Desk', type: 'photo', category: 'Office', media_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80' },
          { title: 'Cozy False Ceiling Grid', type: 'photo', category: 'Residential', media_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80' },
          { title: 'Stunning Swimming Pool Villa', type: 'photo', category: 'Villa', media_url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80' },
          { title: 'Modern Front Elevation View', type: 'photo', category: 'Exterior', media_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80' },
          { title: 'Zen Rooftop Deck garden', type: 'photo', category: 'Landscape', media_url: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80' },
          { 
            title: 'Luxury Villa Walkthrough', 
            type: 'video', 
            category: 'Villa', 
            media_url: 'https://assets.mixkit.co/videos/preview/mixkit-interior-of-a-modern-living-room-4835-large.mp4',
            thumbnail_url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80'
          }
        ];
        
        if (activeCategory === 'All') {
          setItems(staticItems);
        } else {
          setItems(staticItems.filter(i => i.category.toLowerCase() === activeCategory.toLowerCase()));
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [activeCategory]);

  const handleOpenLightbox = (item: any) => {
    setSelectedItem(item);
    setLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setLightboxOpen(false);
    setSelectedItem(null);
  };

  return (
    <Box sx={{ pb: 12 }}>
      
      {/* Banner */}
      <Box 
        className="relative h-[300px] md:h-[400px] flex items-center justify-center bg-cover bg-center text-white"
        style={{ 
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.75)), url('https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80')`,
          marginTop: '-72px'
        }}
      >
        <div className="text-center mt-12">
          <Typography variant="h2" className="text-white text-4xl md:text-6xl font-bold mb-3" sx={{ fontFamily: '"Playfair Display", serif' }}>
            Inspiration Gallery
          </Typography>
          <Typography variant="body1" className="text-gray-300 max-w-xl mx-auto font-light text-base md:text-lg px-4">
            A masonry lookbook of high-resolution residential & exterior facade walkthroughs.
          </Typography>
        </div>
      </Box>

      {/* Categories Filter Menu */}
      <section className="py-12 bg-white border-b border-gray-100">
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

      {/* Masonry Layout */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <Box className="flex justify-center py-20">
              <CircularProgress />
            </Box>
          ) : items.length === 0 ? (
            <Box className="text-center py-20">
              <Typography variant="h6" color="text.secondary">No items found.</Typography>
            </Box>
          ) : (
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {items.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleOpenLightbox(item)}
                  className="break-inside-avoid relative rounded-2xl overflow-hidden shadow-premium group cursor-pointer border border-gray-100 hover:shadow-premium-lg transition-all duration-300"
                >
                  <img 
                    src={item.type === 'photo' ? item.media_url : (item.thumbnail_url || 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=600&q=80')} 
                    alt={item.title} 
                    className="w-full h-auto object-cover group-hover:scale-[1.05] transition-transform duration-500 block"
                    loading="lazy"
                  />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
                    <div className="text-center text-white">
                      {item.type === 'video' ? (
                        <PlayIcon sx={{ fontSize: 48, mb: 1, color: '#fff' }} />
                      ) : null}
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{item.title}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}>{item.category}</Typography>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* LIGHTBOX MODAL */}
      <Dialog
        open={lightboxOpen}
        onClose={handleCloseLightbox}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: { 
            sx: { 
              bgcolor: 'transparent', 
              boxShadow: 'none', 
              backgroundImage: 'none',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            } 
          },
          backdrop: { sx: { bgcolor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(8px)' } }
        }}
      >
        {selectedItem && (
          <Box className="relative w-full max-w-4xl mx-auto flex flex-col items-center">
            {/* Close Button */}
            <IconButton 
              onClick={handleCloseLightbox}
              sx={{ 
                position: 'absolute', 
                top: -48, 
                right: 0, 
                color: '#fff',
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
              }}
            >
              <CloseIcon />
            </IconButton>

            {/* Media Rendering */}
            {selectedItem.type === 'photo' ? (
              <img 
                src={selectedItem.media_url} 
                alt={selectedItem.title} 
                className="max-w-full max-h-[75vh] object-contain rounded-xl"
              />
            ) : (
              <video 
                src={selectedItem.media_url} 
                controls 
                autoPlay
                className="w-full max-h-[70vh] rounded-xl object-contain bg-black"
              />
            )}

            {/* Title info */}
            <Box className="text-center text-white mt-4 max-w-md">
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{selectedItem.title}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.5 }}>Category: {selectedItem.category}</Typography>
            </Box>
          </Box>
        )}
      </Dialog>

    </Box>
  );
};
export default Gallery;
