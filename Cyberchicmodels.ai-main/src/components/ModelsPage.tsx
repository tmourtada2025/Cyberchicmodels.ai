import React, { useState } from 'react';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { ModelCard } from './ModelCard';
import { ModelDetailModal } from './ModelDetailModal';
import { Footer } from './Footer';
import { supabase } from '../lib/supabase';
import { getStorageUrl } from '../lib/storage';
import type { Model } from '../lib/supabase';

interface FilterState {
  specialty: string;
  gender: string;
  ageGroup: string;
  ethnicity: string;
  sort: string;
}

export function ModelsPage() {
  const [modelsPerPage, setModelsPerPage] = useState(12);
  const [displayedModels, setDisplayedModels] = useState(12);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [filters, setFilters] = useState<FilterState>({
    specialty: '',
    gender: '',
    ageGroup: '',
    ethnicity: '',
    sort: 'newest'
  });

  // Fetch models from Supabase
  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('models')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching models:', error);
          setModels([]);
        } else {
          setModels(data || []);
        }
      } catch (error) {
        console.error('Error fetching models:', error);
        setModels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  const resetFilters = () => {
    setFilters({
      specialty: '',
      gender: '',
      ageGroup: '',
      ethnicity: '',
      sort: 'newest'
    });
  };


  // Transform Supabase data to component format
  const allModels = models.length > 0 ? models.map(model => ({
    id: model.id,
    name: model.name,
    age: model.age,
    nationality: model.nationality,
    ethnicity: model.ethnicity,
    gender: model.gender,
    ageGroup: model.age_group,
    height: model.height,
    weight: model.weight,
    specialty: model.specialty,
    hobbies: model.hobbies,
    image: model.thumbnail_path ? getStorageUrl('models', model.thumbnail_path) : '',
    tagline: model.tagline,
    isPopular: model.is_popular,
    isNew: model.is_new,
    isComingSoon: model.is_coming_soon
  })) : [];

  const filteredModels = allModels.filter(model => {
    return (!filters.specialty || 
            (model.specialties && model.specialties.some(s => s.includes(filters.specialty))) ||
            (model.specialty && model.specialty.includes(filters.specialty))) &&
           (!filters.gender || model.gender === filters.gender) &&
           (!filters.ageGroup || model.ageGroup === filters.ageGroup) &&
           (!filters.ethnicity || model.ethnicity === filters.ethnicity);
  }).sort((a, b) => {
    switch (filters.sort) {
      case 'a-z':
        return a.name.localeCompare(b.name);
      case 'popular':
        return (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0);
      default:
        return Number(b.id) - Number(a.id);
    }
  });

  const handleModelClick = (model: any) => {
    setSelectedModel(model);
  };

  const handleCloseModal = () => {
    setSelectedModel(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-8">
            <Link to="/" className="flex items-center text-gray-600 hover:text-black">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-serif mb-4">Models & Digital Personas</h1>
            <p className="text-xl text-gray-600">Browse our curated AI model collection – designed to inspire, train, or be styled.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Filters */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 p-6 rounded-lg sticky top-24">
                <h3 className="text-lg font-serif mb-4">Filters</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specialty</label>
                    <select
                      value={filters.specialty}
                      onChange={(e) => setFilters({...filters, specialty: e.target.value})}
                      className="w-full border rounded-lg p-2 text-sm"
                    >
                      <option value="">All Specialties</option>
                      <option value="Editorial">Editorial</option>
                      <option value="Commercial">Commercial</option>
                      <option value="High Fashion">High Fashion</option>
                      <option value="Avant Graden">Avant-grade</option>
                      <option value="Runway">Runway</option>
                      <option value="Films/TV">Films/TV</option>
                      <option value="Social Media">Social Media</option>
                      <option value="Athletic">Athletic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                    <select
                      value={filters.gender}
                      onChange={(e) => setFilters({...filters, gender: e.target.value})}
                      className="w-full border rounded-lg p-2 text-sm"
                    >
                      <option value="">All Genders</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age Group</label>
                    <select
                      value={filters.ageGroup}
                      onChange={(e) => setFilters({...filters, ageGroup: e.target.value})}
                      className="w-full border rounded-lg p-2 text-sm"
                    >
                      <option value="">All Age Groups</option>
                      <option value="Teen">Teens</option>
                      <option value="Adult">Adults</option>
                      <option value="Elderly">Elderly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ethnicity</label>
                    <select
                      value={filters.ethnicity}
                      onChange={(e) => setFilters({...filters, ethnicity: e.target.value})}
                      className="w-full border rounded-lg p-2 text-sm"
                    >
                      <option value="">All Ethnicities</option>
                      <option value="Arab">Arab</option>
                      <option value="Caucasian">Caucasian</option>
                      <option value="Asian">Asian</option>
                      <option value="African">African</option>
                      <option value="Latinos">Latinos</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                    <select
                      value={filters.sort}
                      onChange={(e) => setFilters({...filters, sort: e.target.value})}
                      className="w-full border rounded-lg p-2 text-sm"
                    >
                      <option value="newest">Newest</option>
                      <option value="popular">Popular</option>
                      <option value="a-z">A-Z</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Show Per Page</label>
                    <select
                      value={modelsPerPage}
                      onChange={(e) => setModelsPerPage(Number(e.target.value))}
                      className="w-full border rounded-lg p-2 text-sm"
                    >
                      <option value={12}>Show 12 per page</option>
                      <option value={24}>Show 24 per page</option>
                      <option value={48}>Show 48 per page</option>
                      <option value={999999}>Show all</option>
                    </select>
                  </div>

                  <button
                    onClick={resetFilters}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition text-sm"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Reset Filters</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Models Grid */}
            <div className="lg:col-span-3">
            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
                <p className="text-gray-600">Loading models...</p>
              </div>
            )}
            
            {!loading && allModels.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No models found</p>
                <p className="text-sm text-gray-500">Please check your database connection</p>
              </div>
            )}
            
            {!loading && allModels.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredModels.slice(0, displayedModels).map((model) => (
                  <div key={model.id} className="relative w-full h-[300px] group cursor-pointer" onClick={() => handleModelClick(model)}>
                    <div className="absolute top-0 right-0 z-10 flex gap-1 transform translate-x-1 -translate-y-1">
                      {model.isPopular && (
                        <div className="bg-rose-300 text-white py-0.5 px-1.5 rounded-tr-lg rounded-bl-lg font-medium shadow-lg text-xs">
                          Most Popular
                        </div>
                      )}
                      {model.isNew && (
                        <div className="bg-black text-white py-0.5 px-1.5 rounded-tr-lg rounded-bl-lg font-medium shadow-lg text-xs">
                          New Addition
                        </div>
                      )}
                      {model.isComingSoon && (
                        <div className="bg-red-500 text-white py-0.5 px-1.5 rounded-tr-lg rounded-bl-lg font-medium shadow-lg text-xs">
                          Coming Soon
                        </div>
                      )}
                    </div>
                    
                    <div className="relative w-full h-full">
                      <img 
                        src={model.image}
                        alt={model.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                      
                      <div className="absolute bottom-0 left-0 right-0 p-2">
                        <h3 className="text-white text-base font-serif mb-0.5 leading-tight">{model.name}</h3>
                        <p className="text-white/90 text-xs mb-0.5 leading-tight">{model.specialty}</p>
                        <p className="text-white/70 text-xs leading-tight">{model.nationality} • {model.age} years</p>
                      </div>

                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>

          {filteredModels.length > displayedModels && (
            <div className="text-center mt-8">
              <button
                onClick={() => setDisplayedModels(prev => prev + 12)}
                className="bg-black text-white px-8 py-3 rounded-full hover:bg-opacity-90 transition"
              >
                Load More Models
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
      {selectedModel && (
        <ModelDetailModal
          model={selectedModel}
          allModels={filteredModels}
          onClose={handleCloseModal}
          onModelChange={handleModelClick}
        />
      )}
    </div>
  );
}