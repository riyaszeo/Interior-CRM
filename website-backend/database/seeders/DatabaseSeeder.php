<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed Projects
        \App\Models\Project::create([
            'title' => 'Modern Minimalist Villa',
            'category' => 'Villa',
            'slug' => 'modern-minimalist-villa',
            'description' => 'A gorgeous minimalist villa with double-height ceiling, glass facade, and premium teak wood finishes. The design maximizes natural ventilation while offering a luxury private swimming pool deck.',
            'area_sqft' => 4500,
            'location' => 'Noida, UP',
            'budget' => '₹1.5 Crores',
            'completion_date' => '2025-10-15',
            'materials_used' => ['Italian Marble', 'Teak Wood Planks', 'Toughened Glass Panels', 'Lutron Smart Automation'],
            'testimonial' => [
                'name' => 'Riya Sudheen',
                'rating' => 5,
                'comment' => 'Antigravity designed our dream home with perfect aesthetics. Every detail is a work of art! Highly recommended.',
            ],
            'images' => [
                'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
            ],
            'before_after' => [
                'before' => 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
                'after' => 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
            ],
        ]);

        \App\Models\Project::create([
            'title' => 'Luxury Penthouse Living',
            'category' => 'Residential',
            'slug' => 'luxury-penthouse-living',
            'description' => 'A high-end contemporary penthouse with premium gold accents, custom velvet upholstery, and state-of-the-art modular kitchen solutions.',
            'area_sqft' => 2800,
            'location' => 'Mumbai, MH',
            'budget' => '₹85 Lakhs',
            'completion_date' => '2025-12-01',
            'materials_used' => ['Charcoal Louver Panels', 'Hafele Modular Fitting', 'Asian Paints Royale Silk', 'Custom Brass Profiles'],
            'testimonial' => [
                'name' => 'Aarav Sharma',
                'rating' => 5,
                'comment' => 'The design is outstanding! It feels like living in a luxury boutique resort every single day.',
            ],
            'images' => [
                'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
            ],
        ]);

        \App\Models\Project::create([
            'title' => 'Corporate Office Hub',
            'category' => 'Office',
            'slug' => 'corporate-office-hub',
            'description' => 'An ergonomic, open-concept corporate headquarters featuring soundproof glass cabins, custom workstation desks, biophilic green walls, and recreational break zones.',
            'area_sqft' => 6200,
            'location' => 'Bangalore, KA',
            'budget' => '₹1.2 Crores',
            'completion_date' => '2026-02-18',
            'materials_used' => ['Acoustic Soft Panels', 'LED Linear Lights', 'Premium Nylon Carpet Tiles', 'Vertical Garden Frame'],
            'testimonial' => [
                'name' => 'Vikram Malhotra',
                'rating' => 5,
                'comment' => 'Antigravity optimized our workspace beautifully. Productivity and team morale are at an all-time high.',
            ],
            'images' => [
                'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
            ],
        ]);

        \App\Models\Project::create([
            'title' => 'Neo-Classical Facade',
            'category' => 'Exterior',
            'slug' => 'neo-classical-facade',
            'description' => 'A neoclassical front elevation exterior facade featuring monumental concrete columns, architectural moulding trims, UPVC French windows, and warm ambient outdoor lighting.',
            'area_sqft' => 3200,
            'location' => 'Coimbatore, TN',
            'budget' => '₹45 Lakhs',
            'completion_date' => '2026-04-10',
            'materials_used' => ['Shera Fiber Cement Cladding', 'Stone Texture Coating', 'Warm LED Facade Uplights', 'UPVC Toughened Glass Windows'],
            'testimonial' => [
                'name' => 'Anjali Krishnan',
                'rating' => 5,
                'comment' => 'Our house exterior looks majestic. The neoclassical elevation detail is extremely beautiful!',
            ],
            'images' => [
                'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
                'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
            ],
        ]);

        // Seed Gallery Items
        \App\Models\GalleryItem::create(['title' => 'Luxury Bedroom Design', 'type' => 'photo', 'category' => 'Residential', 'media_url' => 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80']);
        \App\Models\GalleryItem::create(['title' => 'Sophisticated Living Area', 'type' => 'photo', 'category' => 'Residential', 'media_url' => 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80']);
        \App\Models\GalleryItem::create(['title' => 'Modern Kitchen Lounge', 'type' => 'photo', 'category' => 'Residential', 'media_url' => 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80']);
        \App\Models\GalleryItem::create(['title' => 'Executive Office Desk', 'type' => 'photo', 'category' => 'Office', 'media_url' => 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80']);
        \App\Models\GalleryItem::create(['title' => 'Cozy False Ceiling Grid', 'type' => 'photo', 'category' => 'Residential', 'media_url' => 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80']);
        \App\Models\GalleryItem::create(['title' => 'Stunning Swimming Pool Villa', 'type' => 'photo', 'category' => 'Villa', 'media_url' => 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80']);
        \App\Models\GalleryItem::create(['title' => 'Modern Front Elevation View', 'type' => 'photo', 'category' => 'Exterior', 'media_url' => 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80']);
        \App\Models\GalleryItem::create(['title' => 'Zen Rooftop Deck garden', 'type' => 'photo', 'category' => 'Landscape', 'media_url' => 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80']);
        
        \App\Models\GalleryItem::create([
            'title' => 'Luxury Villa Interior Walkthrough',
            'type' => 'video',
            'category' => 'Villa',
            'media_url' => 'https://assets.mixkit.co/videos/preview/mixkit-interior-of-a-modern-living-room-4835-large.mp4',
            'thumbnail_url' => 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80'
        ]);

        // Seed Blogs
        \App\Models\Blog::create([
            'title' => 'Top 10 Interior Design Trends for 2026',
            'slug' => 'interior-design-trends-2026',
            'excerpt' => 'Explore the latest luxury design shifts from warm biophilic colors to custom smart-home integrated lighting structures.',
            'content' => '<p>In 2026, the lines between nature and automated smart engineering are blurring like never before. Design houses are embracing warm tones, natural textures, and organic architectural silhouettes.</p><h3>1. Biophilic Architecture</h3><p>Integrating rich indoor greenery, miniature waterfalls, and skylights is now standard practice in luxury villas.</p><h3>2. Invisible Smart Automation</h3><p>Automation switches are giving way to sleek touch-active veneer panels, voice presets, and intelligent lighting profiles that match circadian rhythms.</p>',
            'author' => 'Design Board Team',
            'image_url' => 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',
            'published_at' => now(),
        ]);

        \App\Models\Blog::create([
            'title' => 'Space-Saving Hacks for Compact Modern Living',
            'slug' => 'space-saving-hacks-compact-living',
            'excerpt' => 'Transform your compact apartment using multipurpose modular furniture, statement wall beds, and space-multiplying color theories.',
            'content' => '<p>Living in high-density urban zones doesn\'t mean compromising on luxury and room space. Smart space architecture lets you double your operational space with smart, flexible design pieces.</p><h3>1. Height Optimization</h3><p>Take storage all the way up to the ceiling with minimalist flush cabinets that match wall paints to reduce visual noise.</p><h3>2. Transformer Furniture</h3><p>Incorporate multi-functional desks that fold away flat or premium sofa-beds that transform seamlessly without manual heavy lifting.</p>',
            'author' => 'Space Planning Expert',
            'image_url' => 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
            'published_at' => now(),
        ]);

        \App\Models\Blog::create([
            'title' => 'The Complete Plywood and Laminate Buying Guide',
            'slug' => 'plywood-laminate-buying-guide',
            'excerpt' => 'A comprehensive review comparing commercial, BWR, and Marine Grade plywood along with glossy, matte, and acrylic laminates.',
            'content' => '<p>Material specifications dictate the durability of your modular kitchen and wardrobes. Making the right selection upfront saves costly moisture and structural failures later.</p><h3>1. Plywood Classes</h3><p>For wet areas (kitchens, bathrooms), always specify Boiling Water Resistant (BWR) or IS:710 Marine Grade plywood. For dry rooms, commercial MR grade is cost-effective.</p><h3>2. Acrylic vs. Laminates</h3><p>Acrylic finishes offer a seamless glass-like shine but show fingerprints easily. High-pressure laminates (HPL) offer maximum impact resistance and come in texturized matte finishes.</p>',
            'author' => 'Materials Engineer',
            'image_url' => 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80',
            'published_at' => now(),
        ]);
    }
}
