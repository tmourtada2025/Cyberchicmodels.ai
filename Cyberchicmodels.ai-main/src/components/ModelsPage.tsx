import React, { useState, useEffect } from 'react';
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
    // Use the new model-thumbnails bucket when constructing the image URL
    image: model.thumbnail_path ? getStorageUrl('model-thumbnails', model.thumbnail_path) : '',
    tagline: model.tagline,
    isPopular: model.is_popular,
    isNew: model.is_new,
    isComingSoon: model.is_coming_soon,
    specialties: (model as any).specialties || undefined
  })) : [];

  const filteredModels = allModels.filter(model => {
    return (!filters.specialty || 
            (model.specialties && (model.specialties as any).some((s: string) => s.includes(filters.specialty))) ||
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
                  
                  <button
                    onClick={resetFilters}
                    className="w-full flex items-center justify-center space-x-2 mt-6 px-4 py-2 bg-gray-200 rounded-full hover:bg-gray-300 transition"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Clear Filters</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredModels.slice(0, displayedModels).map((model) => (
                  <button key={model.id} onClick={() => handleModelClick(model)} className="text-left">
                    <ModelCard model={model} />
                  </button>
                ))}
              </div>
              
              {displayedModels < filteredModels.length && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => setDisplayedModels(prev => prev + modelsPerPage)}
                    className="px-6 py-3 bg-black text-white rounded-full hover:bg-opacity-90 transition"
                  >
                    Show More
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {selectedModel && (
        <ModelDetailModal
          model={selectedModel}
          allModels={filteredModels}
          onClose={handleCloseModal}
          onModelChange={(model: any) => handleModelClick(model)}
        />
      )}
      <Footer />
    </div>
  );
}
