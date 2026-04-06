import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getStorageUrl } from '../lib/storage';
import type { HeroImage } from '../lib/supabase';

export function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showScrollCue, setShowScrollCue] = useState(true);
  const [slides, setSlides] = useState<HeroImage[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHeroImages = async () => {
      try {
        if (!supabase) {
          setSlides(getDefaultImages());
          setLoading(false);
          return;
        }
        const { data, error } = await supabase
          .from('hero_images')
          .select('*')
          .order('display_order', { ascending: true });
        if (error) {
          setSlides(getDefaultImages());
        } else {
          setSlides((data && data.length > 0) ? data : getDefaultImages());
        }
      } catch (err) {
        setSlides(getDefaultImages());
      } finally {
        setLoading(false);
      }
    };
    fetchHeroImages();
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex(current => (current + 1) % slides.length);
    }, 10000);
    const handleScroll = () => {
      if (window.scrollY > 100) setShowScrollCue(false);
      else setShowScrollCue(true);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      clearInterval(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [slides.length]);

  const getDefaultImages = (): HeroImage[] => [
    { id: '1', path: null, alt_text: 'AI Fashion Models for a Digital World', display_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '2', path: null, alt_text: 'Download-Ready Model Packs', display_order: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '3', path: null, alt_text: 'Built for Creators, Brands & AI Developers', display_order: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: '4', path: null, alt_text: 'A Continuously Evolving Model Roster', display_order: 4, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ];

  const goToSlide = (index: number) => setCurrentIndex(index);

  const scrollToContent = () => {
    const contentSection = document.getElementById('main-content');
    if (contentSection) contentSection.scrollIntoView({ behavior: 'smooth' });
  };

  const getImageUrl = (slide: HeroImage) => {
    if (!slide.path) return '';
    if (typeof slide.path === 'string' && slide.path.startsWith('http')) return slide.path;
    return getStorageUrl('hero', slide.path);
  };

  const blockContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

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
        <div className="text-center"><p className="text-gray-600">No hero images available</p></div>
      </div>
    );
  }

  return (
    <div className="relative h-screen">
      <div className="relative h-full overflow-hidden">
        <div
          className="absolute w-full h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(${-currentIndex * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div key={slide.id} className="absolute w-full h-full" style={{ left: `${index * 100}%` }}>
              <div className="h-full flex items-center justify-center">
                {/* Background image - protected against right-click */}
                <div
                  className="absolute inset-0 w-full h-full"
                  style={{
                    backgroundImage: `url("${getImageUrl(slide)}")`,
      3             backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                  onContextMenu={blockContextMenu}
                  onDragStart={blockContextMenu}
                />
                {/* Shield: pointer-events none so nav buttons still work */}
                <div
                  className="absolute inset-0 z-10"
                  style={{ pointerEvents: 'none' }}
                  onContextMenu={blockContextMenu}
                />
                <div className="absolute inset-0 bg-black bg-opacity-40" />
                <div className="relative text-center text-white px-4 max-w-4xl mx-auto z-20">
                  <h2 className="text-6xl font-serif mb-6">{slide.alt_text || 'CyberChic Models'}</h2>
                  <p className="text-xl mb-12">{slide.alt_text || 'Discover our latest AI fashion models'}</p>
                  <div className="flex justify-center">
                    <button
                      onClick={() => navigate('/models')}
                      className="bg-white text-black px-8 py-3 rounded-full hover:bg-opacity-90 transition flex items-center"
                    >
                      Browse Models <ChevronRightIcon className="ml-2 h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 rounded-full p-2 backdrop-blur-sm z-30"
        onClick={() => goToSlide((currentIndex - 1 + slides.length) % slides.length)}
      >
        <ChevronLeft className="h-6 w-6 text-white" />
      </button>
      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 rounded-full p-2 backdrop-blur-sm z-30"
        onClick={() => goToSlide((currentIndex + 1) % slides.length)}
      >
        <ChevronRight className="h-6 w-6 text-white" />
      </button>

      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex space-x-2 z-30">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'bg-white w-4' : 'bg-white/50'}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>

      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-500 z-30 ${showScrollCue ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={scrollToContent} className="flex flex-col items-center text-white/80 hover:text-white transition-colors">
          <span className="text-sm mb-2">Discover More</span>
          <ChevronDown className="h-6 w-6 animate-bounce" />
        </button>
      </div>
    </div>
  );
}
