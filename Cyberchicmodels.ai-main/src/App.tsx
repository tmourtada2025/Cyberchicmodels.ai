import React from 'react';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Star, ChevronRight, ArrowRight, Video, Image, Monitor, Palette, LayoutGrid, FileCheck, Paintbrush } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { ModelsPage } from './components/ModelsPage';
import { ModelProfilePage } from './components/ModelProfilePage';
import { StylesPage } from './components/StylesPage';
import { StyleDetailsPage } from './components/StyleDetailsPage';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { CartPage } from './components/CartPage';
import { FavoritesPage } from './components/FavoritesPage';
import { HeroCarousel } from './components/HeroCarousel';
import AdminPage from './pages/Admin';
import StudioPage from './pages/StudioPage';
import { Footer } from './components/Footer';
import { ModelCard } from './components/ModelCard';
import { ModelDetailModal } from './components/ModelDetailModal';
import { StylesCarousel } from './components/StylesCarousel';
import { apiService } from './lib/api';
import type { Model, Style } from './lib/api';
import { useImageProtection } from './hooks/useImageProtection';

function App() {
  useImageProtection();

  const [featuredModels, setFeaturedModels] = useState<Model[]>([]);
  const [featuredStyles, setFeaturedStyles] = useState<Style[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedContent = async () => {
      try {
        setLoading(true);
        setError(null);
        const [modelsData, stylesData] = await Promise.all([
          apiService.getModels({ limit: 100 }).catch(() => []),
          apiService.getStyles({ limit: 6 }).catch(() => [])
        ]);
        const taggedModels = modelsData.filter(model =>
          model.isNew || model.isPopular || model.isComingSoon
        );
        setFeaturedModels(taggedModels);
        setFeaturedStyles(stylesData);
      } catch (err) {
        console.error('Error fetching featured content:', err);
        setError('Failed to load content');
        setFeaturedModels([]);
        setFeaturedStyles([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedContent();
  }, []);

  const handleModelClick = (model: Model) => setSelectedModel(model);
  const handleCloseModal = () => setSelectedModel(null);

  return (
    <Router>
      <div className="min-h-screen bg-white">
        <Navbar />
        <Routes>
          <Route path="/" element={
            <div>
              <HeroCarousel />
              <div id="main-content" className="py-12 px-4 bg-gradient-to-b from-rose-50 to-white">
                <div className="max-w-4xl mx-auto text-center">
                  <h2 className="text-3xl font-serif mb-4">About CyberChicModels.ai</h2>
                  <p className="text-lg text-gray-600">
                    A curated digital platform offering AI-generated fashion models for editorial, branding, and creative content. Our stylish influencers bring editorial, branding, and social campaigns to life with premium AI-generated imagery.
                  </p>
                </div>
              </div>
              <div className="py-12 px-4">
                <div className="max-w-7xl mx-auto">
                  <h2 className="text-3xl font-serif mb-8 text-center">Featured Models</h2>
                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
                    </div>
                  ) : error ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600 mb-4">Unable to load models at the moment</p>
                      <p className="text-sm text-gray-500">Please check back later</p>
                    </div>
                  ) : featuredModels.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {featuredModels.map(model => (
                          <button
                            key={model.id}
                            onClick={() => handleModelClick(model)}
                            className="text-left hover:opacity-90 transition"
                            style={{ pointerEvents: 'auto' }}
                          >
                            <ModelCard model={model} onModelClick={handleModelClick} />
                          </button>
                        ))}
                      </div>
                      <div className="mt-6 text-center">
                        <Link to="/models" className="inline-flex items-center text-black hover:text-rose-500 transition">
                          View All Models <ChevronRight className="ml-2 h-5 w-5" />
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-600 mb-4">No featured models available</p>
                      <p className="text-sm text-gray-500">New models coming soon!</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="py-12 bg-black">
                <div className="max-w-7xl mx-auto px-4">
                  <div className="flex flex-col items-center mb-8">
                    <h2 className="text-3xl font-serif text-white text-center mb-4">Featured Styles & Digital Couture</h2>
                  </div>
                  {featuredStyles.length > 0 ? (
                    <>
                      <StylesCarousel styles={featuredStyles} />
                      <div className="mt-8 text-center">
                        <Link to="/styles" className="inline-flex items-center justify-center px-8 py-3 bg-white text-black rounded-full hover:bg-opacity-90 transition-colors">
                          Explore All Styles <ChevronRight className="ml-2 h-5 w-5" />
                        </Link>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-white mb-4">No styles available</p>
                      <p className="text-sm text-gray-300">New styles coming soon!</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="py-12 px-4">
                <div className="max-w-4xl mx-auto text-center">
                  <h2 className="text-3xl font-serif mb-4">New Models Weekly</h2>
                  <p className="text-lg text-gray-600 mb-8">
                    We're adding new digital influencers weekly. Come back often to explore fresh faces.
                  </p>
                  <Link to="/models" className="inline-flex items-center text-black hover:text-rose-500 transition">
                    Browse All Models <ChevronRight className="ml-2 h-5 w-5" />
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
          <Route path="/admin/studio" element={<StudioPage />} />
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
