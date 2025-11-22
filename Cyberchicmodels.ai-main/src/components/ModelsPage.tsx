import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { ModelCard } from './ModelCard';
import { ModelDetailModal } from './ModelDetailModal';
import { Footer } from './Footer';
import { apiService } from '../lib/api';
import type { Model } from '../lib/api';

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
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    specialty: '',
    gender: '',
    ageGroup: '',
    ethnicity: '',
    sort: 'newest'
  });

  // Fetch models from API
  useEffect(() => {
    const fetchModels = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiService.getModels({ limit: 100 });
        setModels(data);
        setFilteredModels(data);
      } catch (err) {
        console.error('Error fetching models:', err);
        setError('Failed to load models');
        setModels([]);
        setFilteredModels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...models];

    // Apply filters
    if (filters.specialty) {
      filtered = filtered.filter(model => 
        model.specialties?.includes(filters.specialty) || 
        model.specialty === filters.specialty
      );
    }

    if (filters.gender) {
      filtered = filtered.filter(model => model.gender === filters.gender);
    }

    if (filters.ageGroup) {
      filtered = filtered.filter(model => {
        if (!model.age) return false;
        switch (filters.ageGroup) {
          case '18-25': return model.age >= 18 && model.age <= 25;
          case '26-35': return model.age >= 26 && model.age <= 35;
          case '36-45': return model.age >= 36 && model.age <= 45;
          case '46+': return model.age >= 46;
          default: return true;
        }
      });
    }

    if (filters.ethnicity) {
      filtered = filtered.filter(model => model.ethnicity === filters.ethnicity);
    }

    // Apply sorting
    switch (filters.sort) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'popular':
        filtered.sort((a, b) => (b.is_popular ? 1 : 0) - (a.is_popular ? 1 : 0));
        break;
      default:
        break;
    }

    setFilteredModels(filtered);
    setDisplayedModels(modelsPerPage);
  }, [models, filters, modelsPerPage]);

  const handleFilterChange = (filterType: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleLoadMore = () => {
    setDisplayedModels(prev => Math.min(prev + modelsPerPage, filteredModels.length));
  };

  const handleModelClick = (model: Model) => {
    setSelectedModel(model);
  };

  const handleCloseModal = () => {
    setSelectedModel(null);
  };

  const clearFilters = () => {
    setFilters({
      specialty: '',
      gender: '',
      ageGroup: '',
      ethnicity: '',
      sort: 'newest'
    });
  };

  // Get unique values for filter options
  const getUniqueValues = (key: keyof Model) => {
    const values = models
      .map(model => model[key])
      .filter((value, index, self) => value && self.indexOf(value) === index)
      .sort();
    return values as string[];
  };

  const getUniqueSpecialties = () => {
    const specialties = new Set<string>();
    models.forEach(model => {
      if (model.specialties && Array.isArray(model.specialties)) {
        model.specialties.forEach(specialty => specialties.add(specialty));
      }
      if (model.specialty) {
        specialties.add(model.specialty);
      }
    });
    return Array.from(specialties).sort();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-20">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="py-12 px-4 bg-gradient-to-b from-rose-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center mb-6">
            <Link 
              to="/" 
              className="inline-flex items-center text-gray-600 hover:text-rose-500 transition-colors mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
          <h1 className="text-4xl font-serif mb-4">Our Models</h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Discover our collection of AI-generated fashion models. Each model comes with a complete pack of high-resolution images perfect for your creative projects.
          </p>
        </div>
      </div>

      {/* Filters and Content */}
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <div className="lg:w-64 flex-shrink-0">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Filters</h3>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-rose-500 hover:text-rose-600 transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Specialty Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specialty
                    </label>
                    <select
                      value={filters.specialty}
                      onChange={(e) => handleFilterChange('specialty', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    >
                      <option value="">All Specialties</option>
                      {getUniqueSpecialties().map(specialty => (
                        <option key={specialty} value={specialty}>{specialty}</option>
                      ))}
                    </select>
                  </div>

                  {/* Gender Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      value={filters.gender}
                      onChange={(e) => handleFilterChange('gender', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    >
                      <option value="">All Genders</option>
                      {getUniqueValues('gender').map(gender => (
                        <option key={gender} value={gender}>{gender}</option>
                      ))}
                    </select>
                  </div>

                  {/* Age Group Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age Group
                    </label>
                    <select
                      value={filters.ageGroup}
                      onChange={(e) => handleFilterChange('ageGroup', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    >
                      <option value="">All Ages</option>
                      <option value="18-25">18-25</option>
                      <option value="26-35">26-35</option>
                      <option value="36-45">36-45</option>
                      <option value="46+">46+</option>
                    </select>
                  </div>

                  {/* Ethnicity Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ethnicity
                    </label>
                    <select
                      value={filters.ethnicity}
                      onChange={(e) => handleFilterChange('ethnicity', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    >
                      <option value="">All Ethnicities</option>
                      {getUniqueValues('ethnicity').map(ethnicity => (
                        <option key={ethnicity} value={ethnicity}>{ethnicity}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sort Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sort By
                    </label>
                    <select
                      value={filters.sort}
                      onChange={(e) => handleFilterChange('sort', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="name">Name A-Z</option>
                      <option value="popular">Most Popular</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Models Grid */}
            <div className="flex-1">
              <div className="mb-6">
                <p className="text-gray-600">
                  Showing {Math.min(displayedModels, filteredModels.length)} of {filteredModels.length} models
                </p>
              </div>

              {filteredModels.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 mb-4">No models found matching your criteria</p>
                  <button
                    onClick={clearFilters}
                    className="text-rose-500 hover:text-rose-600 transition-colors"
                  >
                    Clear filters to see all models
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredModels.slice(0, displayedModels).map(model => (
                      <ModelCard 
                        key={model.id} 
                        model={model} 
                        onModelClick={handleModelClick}
                      />
                    ))}
                  </div>

                  {displayedModels < filteredModels.length && (
                    <div className="text-center mt-12">
                      <button
                        onClick={handleLoadMore}
                        className="bg-rose-500 text-white px-8 py-3 rounded-full hover:bg-rose-600 transition-colors"
                      >
                        Load More Models
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
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
