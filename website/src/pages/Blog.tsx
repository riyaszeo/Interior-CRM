import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Button, Card, CardContent, CircularProgress } from '@mui/material';
import { CalendarMonth, Person, ArrowForward } from '@mui/icons-material';
import { fetchAPI } from '../services/api';

export const Blog: React.FC = () => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAPI<any>('/blogs')
      .then(res => {
        if (res.success) {
          setBlogs(res.data);
        }
      })
      .catch(() => {
        setBlogs([
          {
            title: 'Top 10 Interior Design Trends for 2026',
            slug: 'interior-design-trends-2026',
            excerpt: 'Explore the latest luxury design shifts from warm biophilic colors to custom smart-home integrated lighting structures.',
            author: 'Design Board Team',
            image_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
            published_at: '2026-07-01T12:00:00Z'
          },
          {
            title: 'Space-Saving Hacks for Compact Modern Living',
            slug: 'space-saving-hacks-compact-living',
            excerpt: 'Transform your compact apartment using multipurpose modular furniture, statement wall beds, and space-multiplying color theories.',
            author: 'Space Planning Expert',
            image_url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
            published_at: '2026-07-03T10:00:00Z'
          },
          {
            title: 'The Complete Plywood and Laminate Buying Guide',
            slug: 'plywood-laminate-buying-guide',
            excerpt: 'A comprehensive review comparing commercial, BWR, and Marine Grade plywood along with glossy, matte, and acrylic laminates.',
            author: 'Materials Engineer',
            image_url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80',
            published_at: '2026-07-05T09:00:00Z'
          }
        ]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <Box sx={{ pb: 12 }}>
      
      {/* Banner */}
      <Box 
        className="relative h-[300px] md:h-[400px] flex items-center justify-center bg-cover bg-center text-white"
        style={{ 
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.75)), url('https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80')`,
          marginTop: '-72px'
        }}
      >
        <div className="text-center mt-12">
          <Typography variant="h2" className="text-white text-4xl md:text-6xl font-bold mb-3" sx={{ fontFamily: '"Playfair Display", serif' }}>
            Blogs & Articles
          </Typography>
          <Typography variant="body1" className="text-gray-300 max-w-xl mx-auto font-light text-base md:text-lg px-4">
            Interior design trends, modular storage guides, and material specifications.
          </Typography>
        </div>
      </Box>

      {/* Grid listing */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <Box className="flex justify-center py-20">
              <CircularProgress />
            </Box>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((post, idx) => (
                <Card className="h-full hover:shadow-premium-lg transition-all duration-300 flex flex-col justify-between" key={idx}>
                  <div>
                    <div className="h-[220px] overflow-hidden">
                      <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                    </div>
                    <CardContent sx={{ p: 4, textAlign: 'left' }} className="flex flex-col gap-3">
                      <div className="flex items-center gap-4 text-gray-500 text-xs">
                        <span className="flex items-center gap-1">
                          <CalendarMonth sx={{ fontSize: 14 }} /> 
                          {new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Person sx={{ fontSize: 14 }} /> {post.author}
                        </span>
                      </div>
                      <Typography variant="h5" sx={{ fontWeight: 800, mt: 1 }}>{post.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {post.excerpt}
                      </Typography>
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
          )}
        </div>
      </section>

    </Box>
  );
};
export default Blog;
