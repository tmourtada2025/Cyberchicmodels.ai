import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Heart, Star } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import { addLike } from '../store/likesSlice';
import { toggleFavorite } from '../store/favoritesSlice';
import { RootState } from '../store/store';
import { Footer } from './Footer';
import { supabase } from '../lib/supabase';
import { getStorageUrl } from '../lib/storage';
import type { Model, ModelPhoto } from '../lib/supabase';

export function ModelProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [model, setModel] = useState<Model | null>(null);
  const [modelPhotos, setModelPhotos] = useState<ModelPhoto[]>([]);
  const [allModels, setAllModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const dispatch = useDispatch();
  const likes = useSelector((state: RootState) => state.likes.likes[id || ''] || 0);
  const favorites = useSelector((state: RootState) => state.favorites.items);
  const isFavorite = favorites.some(fav => fav.id === id);

  // Fetch model and photos from Supabase
  useEffect(() => {
    const fetchModelData = async () => {
      if (!id) return;

      try {
        // Fetch model data
        const { data: modelData, error: modelError } = await supabase
          .from('models')
          .select('*')
          .eq('id', id)
          .single();

        if (modelError) {
          console.error('Error fetching model:', modelError);
          return;
        }

        // Fetch all models for navigation
        const { data: allModelsData, error: allModelsError } = await supabase
          .from('models')
          .select('id, slug, name, thumbnail_path, created_at')
          .order('created_at', { ascending: false });

        if (allModelsError) {
          console.error('Error fetching all models:', allModelsError);
        } else {
          setAllModels(allModelsData || []);
        }
        setModel(modelData);

        // Fetch model photos
        const { data: photosData, error: photosError } = await supabase
          .from('model_photos')
          .select('*')
          .eq('model_id', id)
          .order('sort_order', { ascending: true });

        if (photosError) {
          console.error('Error fetching photos:', photosError);
        } else {
          setModelPhotos(photosData || []);
        }
      } catch (error) {
        console.error('Error fetching model data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchModelData();
  }, [id]);


  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading model...</p>
        </div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Model not found</p>
          <Link to="/models" className="text-black hover:text-gray-600 mt-4 inline-block">
            Back to Models
          </Link>
        </div>
      </div>
    );
  }

  // Use photos from database or fallback to thumbnail
  const displayPhotos = modelPhotos.length > 0 
    ? modelPhotos.map(photo => getStorageUrl('models', photo.image_path))
    : model.thumbnail_path ? [getStorageUrl('models', model.thumbnail_path)] : [];

  const goToNextModel = () => {
    const currentIndex = allModels.findIndex(m => m.id === model.id);
    if (currentIndex !== -1 && currentIndex < allModels.length - 1) {
      const nextModel = allModels[currentIndex + 1];
      navigate(`/model/${nextModel.id}`);
    }
  };

  const goToPreviousModel = () => {
    const currentIndex = allModels.findIndex(m => m.id === model.id);
    if (currentIndex > 0) {
      const prevModel = allModels[currentIndex - 1];
      navigate(`/model/${prevModel.id}`);
    }
  };

  const handleAddToCart = () => {
    dispatch(addToCart({ 
      id: model.id,
      name: model.name,
      price: model.price_usd || 99.00,
      image: model.thumbnail_path ? getStorageUrl('models', model.thumbnail_path) : '',
      specialty: model.specialty || ''
    }));
    setShowActions(true);
  };

  const handleLike = () => {
    if (!hasLiked) {
      dispatch(addLike(model.id));
      setHasLiked(true);
    }
  };

  const handleToggleFavorite = () => {
    dispatch(toggleFavorite({
      id: model.id,
      name: model.name,
      image: model.thumbnail_path ? getStorageUrl('models', model.thumbnail_path) : '',
      specialty: model.specialty || ''
    }));
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-8">
            <Link to="/" className="flex items-center text-gray-600 hover:text-black">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
          </div>

          <div className="flex justify-between items-center mb-8">
            <button onClick={goToPreviousModel} className="bg-black text-white p-2 rounded-full hover:bg-gray-800">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-4xl font-serif text-center">
              {model.name}
              <span className="block text-sm font-sans text-gray-500 mt-2">
                Model ID: {model.slug}
              </span>
            </h1>
            <button onClick={goToNextModel} className="bg-black text-white p-2 rounded-full hover:bg-gray-800">
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          {/* Photo Display Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            <div>
              <div className="relative bg-gray-50 rounded-lg overflow-hidden" style={{ height: '600px' }}>
                <img
                  src={displayPhotos[selectedPhoto]}
                  alt={model.name}
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button
                    onClick={handleLike}
                    className={`bg-black/20 backdrop-blur-sm p-2 rounded-full transition flex items-center ${
                      hasLiked ? 'cursor-default' : 'hover:bg-black/30'
                    }`}
                    disabled={hasLiked}
                  >
                    <Heart className={`h-5 w-5 ${hasLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
                    <span className="ml-1 text-white">{likes}</span>
                  </button>
                  <button
                    onClick={handleToggleFavorite}
                    className="bg-black/20 backdrop-blur-sm p-2 rounded-full hover:bg-black/30 transition"
                  >
                    <Star className={`h-5 w-5 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-white'}`} />
                  </button>
                </div>
              </div>

              {/* Thumbnails */}
              <div className="grid grid-cols-5 gap-2 mt-4">
                {displayPhotos.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedPhoto(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden bg-gray-50 ${
                      selectedPhoto === index ? 'ring-2 ring-black' : ''
                    }`}
                  >
                    <img
                      src={photo}
                      alt={`${model.name} photo ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Details + Hire */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-serif mb-4">Profile Details</h2>
                <div className="space-y-4">
                  <p><span className="font-medium">Age:</span> {model.age}</p>
                  <p><span className="font-medium">Nationality:</span> {model.nationality}</p>
                  <p><span className="font-medium">Height:</span> {model.height}</p>
                  <p><span className="font-medium">Weight:</span> {model.weight}</p>
                  <p><span className="font-medium">Specialty:</span> {model.specialty}</p>
                  <div>
                    <span className="font-medium">Hobbies:</span>
                    <p className="mt-2">{model.hobbies}</p>
                  </div>
                </div>
              </div>

              {/* Hire Button */}
              <div className="space-y-4">
                <div className="relative">
                  <button
                    onClick={handleAddToCart}
                    className={`w-full bg-rose-300 text-white py-3 rounded-full hover:bg-rose-400 transition-all duration-300 flex items-center justify-center ${
                      showActions ? 'opacity-0' : 'opacity-100'
                    }`}
                    title="Includes 30+ HD images and 3 videos. Ready for AI training and content use."
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Hire Me – ${(model.price_usd || 99.00).toFixed(2)}
                  </button>

                  {showActions && (
                    <div className="absolute inset-0 flex space-x-2 animate-fade-in">
                      <button
                        onClick={() => navigate('/cart')}
                        className="flex-1 bg-rose-300 text-white py-3 rounded-full hover:bg-rose-400 transition-all duration-300 transform hover:scale-105"
                      >
                        Proceed to Cart
                      </button>
                      <button
                        onClick={() => {
                          setShowActions(false);
                          navigate('/models');
                        }}
                        className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-full hover:bg-gray-300 transition-all duration-300 transform hover:scale-105"
                      >
                        Continue Browsing
                      </button>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => navigate(`/models?model=${model.name}`)}
                  className="w-full text-sm text-black hover:text-rose-500 transition text-center"
                >
                  View More From {model.name}
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}

export default ModelProfilePage;
