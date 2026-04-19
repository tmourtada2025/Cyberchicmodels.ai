import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { ModelCard } from './ModelCard';
import { ModelDetailModal } from './ModelDetailModal';
import { Footer } from './Footer';
import { apiService } from '../lib/api';
import type { Model } from '../lib/api';

export function PortfolioPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModelsWithCampaigns = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiService.getModelsWithCampaigns();
        setModels(data);
      } catch (err) {
        console.error('Error fetching portfolio models:', err);
        setError('Failed to load portfolio');
        setModels([]);
      } finally {
        setLoading(false);
      }
    };
    fetchModelsWithCampaigns();
  }, []);

  const handleModelClick = (model: Model) => setSelectedModel(model);
  const handleCloseModal = () => setSelectedModel(null);

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
      <div className="pt-24 pb-12 px-4 bg-gradient-to-b from-rose-50 to-white">
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
          <h1 className="text-4xl font-serif mb-4">Campaign Portfolio</h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Ready-to-deploy campaign imagery. Each model has a full set of commercial beauty assets across square, vertical, story, and horizontal formats. Full commercial rights, non-exclusive, clean licensing.
          </p>
        </div>
      </div>

      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <p className="text-gray-600">
              Showing {models.length} model{models.length === 1 ? '' : 's'} with active campaign sets
            </p>
          </div>

          {models.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No campaign portfolios available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {models.map(model => (
                <ModelCard
                  key={model.id}
                  model={model}
                  onModelClick={handleModelClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />

      {selectedModel && (
        <ModelDetailModal
          model={selectedModel}
          allModels={models}
          onClose={handleCloseModal}
          onModelChange={handleModelClick}
        />
      )}
    </div>
  );
}
