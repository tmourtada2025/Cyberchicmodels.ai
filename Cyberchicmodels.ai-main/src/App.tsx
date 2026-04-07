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

        // Sort by created_at descending and take the 3 most recently published
        const sorted = [...modelsData].sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        const top3 = sorted.slice(0, 3);

        // Mark a model as "new" if it was published within the last 30 days
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        const taggedModels = top3.map(model => ({
          ...model,
          isNew: new Date(model.createdAt || 0).getTime() > thirtyDaysAgo,
        }));

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
              <div id="main-content" className="py-16 px-4" style={{ background: '#080808' }}>
                <div className="max-w-3xl mx-auto text-center">
                  <p className="mb-3" style={{ fontSize: '11px', color: '#c8a96e', letterSpacing: '0.2em', textTransform: 'uppercase' }}>What we are</p>
                  <h2 className="font-serif mb-6" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', color: '#f5f0e8', fontWeight: 400 }}>License AI model identities for your brand campaigns.</h2>
                  <p style={{ fontSize: '16px', color: 'rgba(245,240,232,0.6)', lineHeight: 1.8 }}>
                    Persistent faces. Infinite creative directions. No agency fees, no contracts, no scheduling. Each model on our roster is a licensable identity — built for editorial, brand campaigns, and creative production.
                  </p>
                </div>
              </div>
              <div className="py-16 px-4" style={{ background: '#f8f5f0' }}>
                <div className="max-w-7xl mx-auto">
                  <div className="text-center mb-10">
                    <p className="mb-3" style={{ fontSize: '11px', color: '#c8a96e', letterSpacing: '0.2em', textTransform: 'uppercase' }}>The roster</p>
                    <h2 className="font-serif" style={{ fontSize: 'clamp(1.5rem, 3vw, 2.25rem)', color: '#1a1a1a', fontWeight: 400 }}>Featured identities</h2>
                  </div>
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
