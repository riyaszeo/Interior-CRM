import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Typography, CircularProgress, Divider, Avatar, Button } from '@mui/material';
import { CalendarMonth, Person, ChevronLeft } from '@mui/icons-material';
import { fetchAPI } from '../services/api';

export const BlogDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAPI<any>(`/blogs/${slug}`)
      .then(res => {
        if (res.success && res.data) {
          setPost(res.data);
        }
      })
      .catch(() => {
        // Fallback models
        const fallbacks: Record<string, any> = {
          'interior-design-trends-2026': {
            title: 'Top 10 Interior Design Trends for 2026',
            excerpt: 'Explore the latest luxury design shifts from warm biophilic colors to custom smart-home integrated lighting structures.',
            content: '<p>In 2026, the lines between nature and automated smart engineering are blurring like never before. Design houses are embracing warm tones, natural textures, and organic architectural silhouettes.</p><h3 class="text-xl font-bold mt-6 mb-2">1. Biophilic Architecture</h3><p>Integrating rich indoor greenery, miniature waterfalls, and skylights is now standard practice in luxury villas.</p><h3 class="text-xl font-bold mt-6 mb-2">2. Invisible Smart Automation</h3><p>Automation switches are giving way to sleek touch-active veneer panels, voice presets, and intelligent lighting profiles that match circadian rhythms.</p>',
            author: 'Design Board Team',
            image_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80',
            published_at: '2026-07-01T12:00:00Z'
          },
          'space-saving-hacks-compact-living': {
            title: 'Space-Saving Hacks for Compact Modern Living',
            excerpt: 'Transform your compact apartment using multipurpose modular furniture, statement wall beds, and space-multiplying color theories.',
            content: '<p>Living in high-density urban zones doesn\'t mean compromising on luxury and room space. Smart space architecture lets you double your operational space with smart, flexible design pieces.</p><h3 class="text-xl font-bold mt-6 mb-2">1. Height Optimization</h3><p>Take storage all the way up to the ceiling with minimalist flush cabinets that match wall paints to reduce visual noise.</p><h3 class="text-xl font-bold mt-6 mb-2">2. Transformer Furniture</h3><p>Incorporate multi-functional desks that fold away flat or premium sofa-beds that transform seamlessly without manual heavy lifting.</p>',
            author: 'Space Planning Expert',
            image_url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
            published_at: '2026-07-03T10:00:00Z'
          },
          'plywood-laminate-buying-guide': {
            title: 'The Complete Plywood and Laminate Buying Guide',
            excerpt: 'A comprehensive review comparing commercial, BWR, and Marine Grade plywood along with glossy, matte, and acrylic laminates.',
            content: '<p>Material specifications dictate the durability of your modular kitchen and wardrobes. Making the right selection upfront saves costly moisture and structural failures later.</p><h3 class="text-xl font-bold mt-6 mb-2">1. Plywood Classes</h3><p>For wet areas (kitchens, bathrooms), always specify Boiling Water Resistant (BWR) or IS:710 Marine Grade plywood. For dry rooms, commercial MR grade is cost-effective.</p><h3 class="text-xl font-bold mt-6 mb-2">2. Acrylic vs. Laminates</h3><p>Acrylic finishes offer a seamless glass-like shine but show fingerprints easily. High-pressure laminates (HPL) offer maximum impact resistance and come in texturized matte finishes.</p>',
            author: 'Materials Engineer',
            image_url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1200&q=80',
            published_at: '2026-07-05T09:00:00Z'
          }
        };

        const found = fallbacks[slug || ''];
        setPost(found || null);
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

  if (!post) {
    return (
      <Box className="text-center py-20">
        <Typography variant="h5" color="error">Article not found.</Typography>
        <Link to="/blog" className="no-underline mt-4 inline-block">
          <Button variant="outlined">&larr; Back to Blogs</Button>
        </Link>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 12 }}>
      
      {/* Header breadcrumb toolbar */}
      <section className="py-6 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-6 flex items-center">
          <Link to="/blog" className="no-underline flex items-center gap-1.5 text-gray-500 font-semibold hover:text-[#6D28D9] transition-all">
            <ChevronLeft /> Back to Blogs
          </Link>
        </div>
      </section>

      {/* Main Content Body */}
      <section className="py-16 bg-white">
        <article className="max-w-3xl mx-auto px-6 text-left flex flex-col gap-6">
          <Typography variant="h2" className="text-gray-900 leading-tight" sx={{ fontWeight: 800, fontFamily: '"Playfair Display", serif' }}>
            {post.title}
          </Typography>

          <div className="flex items-center gap-4 text-gray-500 text-sm">
            <span className="flex items-center gap-1">
              <CalendarMonth sx={{ fontSize: 16 }} /> 
              {new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="flex items-center gap-1">
              <Person sx={{ fontSize: 16 }} /> {post.author}
            </span>
          </div>

          <Divider />

          {/* Main Image */}
          <Box className="rounded-2xl overflow-hidden h-[400px] shadow border border-gray-100 my-2">
            <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
          </Box>

          <Typography variant="subtitle1" className="text-gray-500 italic leading-relaxed font-light text-lg">
            "{post.excerpt}"
          </Typography>

          {/* HTML dynamic content body */}
          <div 
            className="prose max-w-none text-gray-700 leading-relaxed text-base space-y-4"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <Divider sx={{ my: 4 }} />

          {/* Author Block */}
          <Box className="flex items-center gap-4 p-6 rounded-2xl bg-slate-50 border border-gray-100">
            <Avatar sx={{ bgcolor: '#6D28D9', color: '#fff', width: 56, height: 56, fontSize: '1.25rem', fontWeight: 800 }}>
              {post.author[0]}
            </Avatar>
            <div>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Written by {post.author}</Typography>
              <Typography variant="caption" color="text.secondary">
                VKS Design & Architecture Editorial Board. Expert reviews on space planning, laminates, elevations, and structural modular fitting warranties.
              </Typography>
            </div>
          </Box>

        </article>
      </section>

    </Box>
  );
};
export default BlogDetail;
