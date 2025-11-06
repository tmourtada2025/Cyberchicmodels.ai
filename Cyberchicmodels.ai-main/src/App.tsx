import React from 'react';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Star, ChevronRight, ArrowRight, Video, Image, Monitor, Download, Palette, LayoutGrid, FileCheck, Paintbrush } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { ModelsPage } from './components/ModelsPage';
import { ModelProfilePage } from './components/ModelProfilePage';
import { StylesPage } from './components/StylesPage';
import { StyleDetailsPage } from './components/StyleDetailsPage';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { CartPage } from './components/CartPage';
import { FavoritesPage } from './components/FavoritesPage';
import { AdminPage } from './components/AdminPage';
import { SimpleModelsCheck } from './components/SimpleModelsCheck';
import { HeroCarousel } from './components/HeroCarousel';
import { Footer } from './components/Footer';
import { ModelCard } from './components/ModelCard';
import { ModelDetailModal } from './components/ModelDetailModal';
import { StylesCarousel } from './components/StylesCarousel';
import { supabase } from './lib/supabase';
import { getStorageUrl } from './lib/storage';
import type { Model, Style } from './lib/supabase';

const fallbackStyles = [
  {
    id: "ST126",
    slug: 'emerald-green-satin-dress',
    name: "Emerald Green Satin Dress",
    price_usd: 1.99,
    image_path: null,
    description: "A glamorous emerald green satin dress with a sleek silhouette",
    created_at: new Date().toISOString()
  },
  {
    id: "ST119",
    name: "White Tank & Short Jeans",
    price_usd: 1.99,
    image_path: null,
    description: "A casual white tank top paired with denim shorts"
  },
  {
    id: "ST120",
    name: "White Wide-Leg Jumpsuit",
    price_usd: 1.99,
    image_path: null,
    description: "A white wide-leg jumpsuit with modern cut"
  },
  {
    id: "ST118",
    name: "White Pleated Café Dress",
    price_usd: 1.99,
    image_path: null,
    description: "A casual white pleated dress perfect for café outings"
  },
  {
    id: "ST111",
    name: "Black Faux-Leather Mini Dress",
    price_usd: 1.99,
    image_path: null,
    description: "A stylish black faux-leather mini dress"
  },
  {
    id: "ST122",
    name: "Burnt Orange Boho Maxi Dress",
    price_usd: 1.99,
    image_path: null,
    description: "A burnt orange maxi dress with boho vibes"
  }
];

function App() {
  const [featuredModels, setFeaturedModels] = useState<any[]>([]);
  const [featuredStyles, setFeaturedStyles] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch featured content from Supabase
  useEffect(() => {
    const fetchFeaturedContent = async () => {
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || supabaseKey.includes('REPLACE_WITH_YOUR_ACTUAL')) {
        console.warn('Supabase not configured properly. Using fallback data.');
        setFeaturedModels([]);
        setFeaturedStyles(fallbackStyles.slice(0, 6).map(style => ({
          id: style.id,
          name: style.name,
          price: style.price_usd || 1.99,
          image: style.image_path || '',
          description: style.description || ''
        })));
        setLoading(false);
        return;
      }

      try {
        // Fetch featured models
        const { data: modelsData, error: modelsError } = await supabase
          .from('models')
          .select('*')
          .or('is_new.eq.true,is_popular.eq.true,is_coming_soon.eq.true,is_featured.eq.true')
          .order('created_at', { ascending: false })
          .limit(50);

        // Fetch featured styles
        const { data: stylesData, error: stylesError } = await supabase
          .from('styles')
          .select('*')
          .limit(6);

        if (modelsError) {
          console.error('Error fetching featured models:', modelsError);
          setFeaturedModels([]);
        } else {
          setFeaturedModels((modelsData || []).map(model => ({
            id: model.id,
            slug: model.slug,
            name: model.name,
            tagline: model.tagline,
            age: model.age,
            nationality: model.nationality,
            ethnicity: model.ethnicity,
            gender: model.gender,
            height: model.height,
            weight: model.weight,
            specialty: model.specialty, // Keep for backward compatibility
            specialties: model.specialties, // New array field
            bio: model.bio,
            hobbies: model.hobbies,
            image: model.thumbnail_path ? getStorageUrl('models', model.thumbnail_path) : '',
            video: '',
            isPopular: model.is_popular,
            isNew: model.is_new,
            isComingSoon: model.is_coming_soon,
            isFeatured: model.is_featured
          })));
        }

        if (stylesError) {
          console.error('Error fetching featured styles:', stylesError);
          setFeaturedStyles(fallbackStyles.map(style => ({
            id: style.id,
            name: style.name,
            price: style.price_usd,
            image: style.image_path,
            description: style.description
          })));
        } else {
          setFeaturedStyles((stylesData || []).map(style => ({
            id: style.id,
            name: style.name,
            price: style.price_usd,
            image: style.image_path,
            description: style.description
          })));
        }
      } catch (error) {
        console.error('Error fetching featured content:', error);
        setFeaturedModels([]);
        // Use fallback styles on error
        setFeaturedStyles(fallbackStyles.slice(0, 6).map(style => ({
          id: style.id,
          name: style.name,
          price: style.price_usd || 1.99,
          image: style.image_path || '',
          description: style.description || ''
        })));
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedContent();
  }, []);

  const handleModelClick = (model: any) => {
    setSelectedModel(model);
  };

  const handleCloseModal = () => {
    setSelectedModel(null);
  };

  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Navbar />
        <Routes>
          <Route path="/" element={
            <div>
              <HeroCarousel />

              {/* About Preview Section */}
              <div id="main-content" className="py-12 px-4 bg-gradient-to-b from-rose-50 to-white">
                <div className="max-w-4xl mx-auto text-center">
                  <h2 className="text-3xl font-serif mb-4">About CyberChicModels.ai</h2>
                  <p className="text-lg text-gray-600">
                    A curated digital platform offering AI-generated fashion models for editorial, branding, and creative content. 
                    Our stylish influencers are ready for download, with consistent visual packs tailored for modern creators.
                  </p>
                </div>
              </div>

              {/* Featured Models Section */}
              <div className="py-12 px-4">
                <div className="max-w-7xl mx-auto">
                  <h2 className="text-3xl font-serif mb-8 text-center">Featured Models</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {featuredModels.slice(0, 3).map(model => (
                      <ModelCard 
                        key={model.id} 
                        model={model} 
                        onModelClick={handleModelClick}
                      />
                    ))}
                  </div>
                  <div className="mt-6 text-center">
                    <Link 
                      to="/models"
                      className="inline-flex items-center text-black hover:text-rose-500 transition"
                    >
                      View All Models
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Link>
                  </div>
                  {featuredModels.length === 0 && !loading && (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No featured models found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Featured Styles Section */}
              <div className="py-12 bg-black">
                <div className="max-w-7xl mx-auto px-4">
                  <div className="flex flex-col items-center mb-8">
                    <h2 className="text-3xl font-serif text-white text-center mb-4">Featured Styles & Digital Couture</h2>
                  </div>
                  <StylesCarousel styles={featuredStyles} />
                  <div className="mt-8 text-center">
                    <Link
                      to="/styles"
                      className="inline-flex items-center justify-center px-8 py-3 bg-white text-black rounded-full hover:bg-opacity-90 transition-colors"
                    >
                      Explore All Styles
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* What's Included Section */}
              <div className="py-12 bg-black text-white">
                <div className="max-w-7xl mx-auto px-4">
                  <h2 className="text-3xl font-serif mb-4 text-center">What's Included in a Pack</h2>
                  <p className="text-lg text-center text-gray-300 mb-10 max-w-3xl mx-auto">
                    Explore our premium downloads — each pack is crafted for creators, developers, and digital stylists.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Model Pack */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6">
                      <h3 className="text-xl font-serif mb-4 flex items-center">
                        <Image className="h-6 w-6 mr-3 text-rose-300" />
                        Model Pack Includes:
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <Image className="h-5 w-5 mr-3 mt-1 text-rose-300" />
                          <p className="text-sm">30+ high-resolution fashion portraits</p>
                        </div>
                        <div className="flex items-start">
                          <Video className="h-5 w-5 mr-3 mt-1 text-rose-300" />
                          <p className="text-sm">Short videos for motion training & storytelling</p>
                        </div>
                        <div className="flex items-start">
                          <Monitor className="h-5 w-5 mr-3 mt-1 text-rose-300" />
                          <p className="text-sm">Clean, studio-style backgrounds</p>
                        </div>
                        <div className="flex items-start">
                          <FileCheck className="h-5 w-5 mr-3 mt-1 text-rose-300" />
                          <p className="text-sm">Ready for AI training and commercial use</p>
                        </div>
                      </div>
                    </div>

                    {/* Style Pack */}
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6">
                      <h3 className="text-xl font-serif mb-4 flex items-center">
                        <Paintbrush className="h-6 w-6 mr-3 text-rose-300" />
                        Style Pack Includes:
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <LayoutGrid className="h-5 w-5 mr-3 mt-1 text-rose-300" />
                          <p className="text-sm">Full-body fashion renders across angles</p>
                        </div>
                        <div className="flex items-start">
                          <Palette className="h-5 w-5 mr-3 mt-1 text-rose-300" />
                          <p className="text-sm">Color swatch variants with seamless integration</p>
                        </div>
                        <div className="flex items-start">
                          <Download className="h-5 w-5 mr-3 mt-1 text-rose-300" />
                          <p className="text-sm">Transparent backgrounds for drag-and-drop design</p>
                        </div>
                        <div className="flex items-start">
                          <FileCheck className="h-5 w-5 mr-3 mt-1 text-rose-300" />
                          <p className="text-sm">Royalty-free license for creative & commercial projects</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* New Models Weekly Section */}
              <div className="py-12 px-4">
                <div className="max-w-4xl mx-auto text-center">
                  <h2 className="text-3xl font-serif mb-4">New Models Weekly</h2>
                  <p className="text-lg text-gray-600 mb-8">
                    We're adding new digital influencers weekly. Come back often to explore fresh faces.
                  </p>
                  <Link 
                    to="/models"
                    className="inline-flex items-center text-black hover:text-rose-500 transition"
                  >
                    Browse All Models
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Link>
                </div>
              </div>

              <Footer />
            </div>
          } />
          <Route path="/models" element={<ModelsPage />} />
          <Route path="/model/:id" element={<ModelProfilePage />} />
          <Route path="/styles" element={<StylesPage />} />
          <Route path="/style/:id" element={<StyleDetailsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/check-models" element={<SimpleModelsCheck />} />
        </Routes>
        {selectedModel && (
          <ModelDetailModal
            model={selectedModel}
            allModels={featuredModels}
            onClose={handleCloseModal}
            onModelChange={handleModelClick}
          />
        )}
      </div>
    </Router>
  );
}

export default App;