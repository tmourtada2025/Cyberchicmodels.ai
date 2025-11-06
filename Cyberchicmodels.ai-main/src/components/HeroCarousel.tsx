import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Download, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getStorageUrl } from '../lib/storage';
import type { HeroSlide } from '../lib/supabase';

interface HeroCarouselProps {}

export function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showScrollCue, setShowScrollCue] = useState(true);
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch hero slides from Supabase
  useEffect(() => {
    const fetchHeroSlides = async () => {
      try {
        // Check if Supabase is properly configured
        if (!supabase) {
          console.warn('Supabase client not configured, using fallback slides');
          setSlides(getDefaultSlides());
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('hero_slides')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) {
          console.warn('Error fetching hero slides, using fallback:', error.message);
          // Fallback to default slides if fetch fails
          setSlides(getDefaultSlides());
        } else {
          setSlides(data && data.length > 0 ? data : getDefaultSlides());
        }
      } catch (error) {
        console.warn('Network error fetching hero slides, using fallback:', error);
        setSlides(getDefaultSlides());
      } finally {
        setLoading(false);
      }
    };

    fetchHeroSlides();
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % slides.length);
    }, 10000);

    const handleScroll = () => {
      if (window.scrollY > 100) {
        setShowScrollCue(false);
      } else {
        setShowScrollCue(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      clearInterval(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [slides.length]);

  // Fallback slides if Supabase fetch fails
  const getDefaultSlides = (): HeroSlide[] => [
    {
      id: '1',
      title: 'AI Fashion Models for a Digital World',
      subtitle: 'Digital Innovation',
      description: 'Browse and download ready-to-use model packs — for campaigns, content, or training your own AI.',
      background_image_path: null,
      button_text: 'Browse Models',
      button_link: '/models',
      sort_order: 1,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Download-Ready Model Packs',
      subtitle: 'Complete Packages',
      description: 'Each pack includes 30+ images and short videos — perfect for AI training, mockups, or content creation.',
      background_image_path: null,
      button_text: 'Browse Models',
      button_link: '/models',
      sort_order: 2,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      title: 'Built for Creators, Brands & AI Developers',
      subtitle: 'Professional Tools',
      description: 'From designers to marketers, anyone can train or feature their own AI model using our stylish assets.',
      background_image_path: null,
      button_text: 'Browse Models',
      button_link: '/models',
      sort_order: 3,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '4',
      title: 'A Continuously Evolving Model Roster',
      subtitle: 'Always Fresh',
      description: 'We\'re adding new AI-generated models weekly — across categories, ethnicities, and moods.',
      background_image_path: null,
      button_text: 'Browse Models',
      button_link: '/models',
      sort_order: 4,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const handleDownloadDemo = () => {
    alert('Demo pack download will be implemented soon!');
  };

  const scrollToContent = () => {
    const contentSection = document.getElementById('main-content');
    if (contentSection) {
      contentSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getImageUrl = (slide: HeroSlide) => {
    if (!slide.background_image_path) return '';
    
    // If it's already a full URL, use it as is
    if (slide.background_image_path.startsWith('http')) {
      return slide.background_image_path;
    }
    
    // Otherwise, get it from Supabase storage
    return getStorageUrl('hero', slide.background_image_path);
  };

  const renderButtons = () => (
    <div className="flex justify-center space-x-6">
      <button
        onClick={() => navigate('/models')}
        className="bg-white text-black px-8 py-3 rounded-full hover:bg-opacity-90 transition flex items-center"
      >
        Browse Models
        <ChevronRight className="ml-2 h-5 w-5" />
      </button>
      <button
        onClick={handleDownloadDemo}
        className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-full hover:bg-white/10 transition flex items-center"
      >
        <Download className="mr-2 h-5 w-5" />
        Download Demo
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="relative h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="relative h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600">No hero slides available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen">
      <div className="relative h-full overflow-hidden">
        <div
          className="absolute w-full h-full transition-transform duration-500 ease-out"
          style={{
            transform: `translateX(${-currentIndex * 100}%)`,
          }}
        >
          {slides.map((slide, index) => (
            <div 
              key={index} 
              className="absolute w-full h-full"
              style={{ left: `${index * 100}%` }}
            >
              <div className="h-full flex items-center justify-center">
                <div
                  className="absolute inset-0 w-full h-full"
                  style={{
                    backgroundImage: `url("${getImageUrl(slide)}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
                <div className="absolute inset-0 bg-black bg-opacity-40" />
                <div className="relative text-center text-white px-4 max-w-4xl mx-auto">
                  <h2 className="text-6xl font-serif mb-6">{slide.title}</h2>
                  <p className="text-xl mb-12">{slide.description || slide.subtitle}</p>
                  {renderButtons()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 rounded-full p-2 backdrop-blur-sm"
        onClick={() => goToSlide((currentIndex - 1 + slides.length) % slides.length)}
      >
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 rounded-full p-2 backdrop-blur-sm"
        onClick={() => goToSlide((currentIndex + 1) % slides.length)}
      >
        <ChevronRight className="h-6 w-6 text-white" />
      </button>

      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? 'bg-white w-4' : 'bg-white/50'
            }`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>

      {/* Scroll Cue */}
      <div 
        className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-500 ${
          showScrollCue ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <button
          onClick={scrollToContent}
          className="flex flex-col items-center text-white/80 hover:text-white transition-colors"
        >
          <span className="text-sm mb-2">Discover More</span>
          <ChevronDown className="h-6 w-6 animate-bounce" />
        </button>
      </div>
    </div>
  );
}