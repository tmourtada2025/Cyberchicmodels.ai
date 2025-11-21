import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Heart, Star, ArrowLeft } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addToCart } from '../store/cartSlice';
import { addLike } from '../store/likesSlice';
import { toggleFavorite } from '../store/favoritesSlice';
import { RootState } from '../store/store';
import { supabase } from '../lib/supabase';
import { getStorageUrl } from '../lib/storage';
import type { ModelCollection, ModelPhoto } from '../lib/supabase';

interface ModelDetailModalProps {
  model: {
    id: string;
    name: string;
    age: number;
    nationality: string;
    height: string;
    weight: string;
    specialty: string;
    hobbies: string;
    image: string;
    tagline?: string;
    bio?: string;
  };
  allModels?: any[];
  onClose: () => void;
  onModelChange?: (model: any) => void;
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  photos: ModelPhoto[];
}

export function ModelDetailModal({ model, allModels = [], onClose, onModelChange }: ModelDetailModalProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [currentCollection, setCurrentCollection] = useState(-1);
  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [modelPhotos, setModelPhotos] = useState<ModelPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const likes = useSelector((state: RootState) => state.likes.likes[model.id] || 0);
  const favorites = useSelector((state: RootState) => state.favorites.items);
  const isFavorite = favorites.some(fav => fav.id === model.id);

  // Fetch model collections and their associated photos
  useEffect(() => {
    const fetchModelData = async () => {
      // Start with no collection selected
      setCurrentCollection(-1);
      setCurrentPhoto(0);
      
      try {
        // Fetch all images for this model (both collection images and default images)
        const { data: photosData, error: photosError } = await supabase
          .from('model_collection_images')
          .select('*')
          .eq('model_id', model.id)
          .order('display_order');

        // Fetch collections (if any)
        const { data: collectionsData, error: collectionsError } = await supabase
          .from('model_collections')
          .select('id, name, slug, display_order')
          .eq('model_id', model.id)
          .order('display_order');

        if (photosError) {
          console.error('Error fetching photos:', photosError);
        } else {
          const processedPhotos = (photosData || []).map(photo => ({
            ...photo,
            image_path: photo.path && photo.path.startsWith('http') 
              ? photo.path
              : getStorageUrl('model-collections', photo.path)
          }));
          setModelPhotos(processedPhotos);
        }

        if (collectionsError) {
          console.error('Error fetching collections:', collectionsError);
        }

        // If we have photos from the database, use them
        if (photosData && photosData.length > 0) {
          // If there are no collections, group all photos into a single pack
          if (!collectionsData || collectionsData.length === 0) {
            setCollections([{ 
              id: 'photos',
              name: 'Photo Pack',
              description: `${photosData.length} professional photos`,
              photos: (photosData || []).map(photo => ({
                ...photo,
                image_path: photo.path && photo.path.startsWith('http')
                  ? photo.path
                  : getStorageUrl('model-collections', photo.path)
              }))
            }]);
          } else {
            // Group photos by collection_id; if collection_id is null, group under 'default'
            const collectionsMap: Record<string, ModelPhoto[]> = {};
            (photosData || []).forEach(photo => {
              const key = photo.collection_id || 'default';
              if (!collectionsMap[key]) collectionsMap[key] = [];
              collectionsMap[key].push(photo);
            });
            const processedCollections = collectionsData.map(collection => ({
              id: collection.id,
              name: collection.name,
              description: `${collectionsMap[collection.id]?.length || 0} photos`,
              photos: (collectionsMap[collection.id] || []).map(photo => ({
                ...photo,
                image_path: photo.path && photo.path.startsWith('http')
                  ? photo.path
                  : getStorageUrl('model-collections', photo.path)
              }))
            }));
            // Add any default (non-collection) photos as a separate entry
            if (collectionsMap['default']) {
              processedCollections.unshift({
                id: 'default',
                name: 'General',
                description: `${collectionsMap['default'].length} photos`,
                photos: collectionsMap['default'].map(photo => ({
                  ...photo,
                  image_path: photo.path && photo.path.startsWith('http')
                    ? photo.path
                    : getStorageUrl('model-collections', photo.path)
                }))
              });
            }
            setCollections(processedCollections);
          }
        } else {
          // No photos found, use model thumbnail as fallback
          if (model.image) {
            setCollections([{
              id: 'default',
              name: 'Profile Photo',
              description: 'Main profile photo',
              photos: [{
                id: 'default-photo',
                model_id: model.id,
                collection_id: null,
                path: '',
                image_path: model.image,
                caption: model.name,
                display_order: 0
              } as any]
            }]);
          } else {
            setCollections([]);
          }
        }
      } catch (error) {
        console.error('Error fetching model data:', error);
        setCollections([]);
      } finally {
        setLoading(false);
      }
    };

    fetchModelData();
  }, [model.id, model.image]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrevPhoto();
      if (e.key === 'ArrowRight') handleNextPhoto();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentCollection, currentPhoto]);

  const handlePrevPhoto = () => {
    if (currentCollection === -1) return; // Can't navigate from main photo
    const currentCollectionPhotos = collections[currentCollection]?.photos || [];
    if (currentPhoto === -1) {
      return;
    } else if (currentPhoto === 0) {
      setCurrentPhoto(-1);
    } else {
      setCurrentPhoto(currentPhoto - 1);
    }
  };

  const handleNextPhoto = () => {
    if (currentCollection === -1) return;
    const currentCollectionPhotos = collections[currentCollection]?.photos || [];
    if (currentPhoto === -1) {
      if (currentCollectionPhotos.length > 0) setCurrentPhoto(0);
    } else if (currentPhoto < currentCollectionPhotos.length - 1) {
      setCurrentPhoto(currentPhoto + 1);
    } else {
      const nextCollectionIndex = (currentCollection + 1) % collections.length;
      setCurrentCollection(nextCollectionIndex);
      setCurrentPhoto(-1);
    }
  };

  const handleCollectionClick = (index: number) => {
    setCurrentCollection(index);
    setCurrentPhoto(-1);
  };

  const handleAddToCart = () => {
    dispatch(addToCart({
      id: model.id,
      name: model.name,
      price: 1.99,
      image: model.image,
      description: model.tagline || ''
    }));
    setIsAdded(true);
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
      image: model.image,
      description: model.tagline || ''
    }));
  };

  const navigateToModel = (direction: 'prev' | 'next') => {
    if (!allModels || allModels.length === 0) return;
    const currentIndex = allModels.findIndex((m) => m.id === model.id);
    if (currentIndex === -1) return;
    const nextIndex = direction === 'prev' ? (currentIndex - 1 + allModels.length) % allModels.length : (currentIndex + 1) % allModels.length;
    onModelChange && onModelChange(allModels[nextIndex]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white max-w-5xl w-full mx-4 md:mx-8 rounded-lg overflow-hidden shadow-lg">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-black focus:outline-none"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Image and collections - NOW ON LEFT */}
          <div className="p-6 border-r border-gray-200 flex flex-col order-2 md:order-1">
            <h2 className="text-2xl font-serif mb-2">{model.name}</h2>
            <p className="text-sm text-gray-600 mb-4">{model.tagline}</p>
            <div className="flex space-x-4 mb-4">
              <div className="flex-1">
                <p className="text-xs text-gray-500">Height</p>
                <p className="font-medium">{model.height || 'N/A'}</p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Weight</p>
                <p className="font-medium">{model.weight || 'N/A'}</p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Age</p>
                <p className="font-medium">{model.age || 'N/A'}</p>
              </div>
            </div>
            <div className="flex space-x-4 mb-4">
              <div className="flex-1">
                <p className="text-xs text-gray-500">Nationality</p>
                <p className="font-medium">{model.nationality || 'N/A'}</p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Ethnicity</p>
                <p className="font-medium">{model.ethnicity || 'N/A'}</p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Specialty</p>
                <p className="font-medium">{model.specialty || 'N/A'}</p>
              </div>
            </div>
            <div className="space-y-4 mb-4">
              <p className="text-sm text-gray-500">{model.hobbies || ''}</p>
            </div>
            <div className="flex items-center space-x-4 mb-4">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-1 text-gray-600 hover:text-red-500 ${hasLiked ? 'text-red-500' : ''}`}
              >
                <Heart className={`h-5 w-5 ${hasLiked ? 'fill-red-500' : ''}`} />
                <span>{likes}</span>
              </button>
              <button
                onClick={handleToggleFavorite}
                className={`flex items-center space-x-1 ${isFavorite ? 'text-yellow-600' : 'text-gray-600 hover:text-yellow-600'}`}
              >
                <Star className={`h-5 w-5 ${isFavorite ? 'fill-yellow-600' : ''}`} />
                <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
              </button>
            </div>
            <div className="flex space-x-4 mb-6">
              {!isAdded ? (
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-black text-white py-2 rounded-full hover:bg-opacity-90 transition"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Add to Cart – $1.99
                </button>
              ) : (
                <div className="flex-1 flex space-x-3">
                  <button
                    onClick={() => navigate('/models')}
                    className="flex-1 bg-gray-100 text-gray-800 py-2 rounded-full hover:bg-gray-200 transition"
                  >
                    Continue Shopping
                  </button>
                  <button
                    onClick={() => navigate('/cart')}
                    className="flex-1 bg-black text-white py-2 rounded-full hover:bg-opacity-90 transition"
                  >
                    View Cart
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <button onClick={() => navigateToModel('prev')} className="flex items-center space-x-1 hover:text-black">
                <ArrowLeft className="h-4 w-4" />
                <span>Prev</span>
              </button>
              <span>•</span>
              <button onClick={() => navigateToModel('next')} className="flex items-center space-x-1 hover:text-black">
                <span>Next</span>
                <ArrowLeft className="h-4 w-4 rotate-180" />
              </button>
            </div>
          </div>
          {/* Details - NOW ON RIGHT */}
          <div className="p-6 flex flex-col order-1 md:order-2">
            {loading ? (
              <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading images...</p>
                </div>
              </div>
            ) : (
              <div>
                {/* Collections list */}
                {collections.length > 1 && (
                  <div className="flex space-x-2 overflow-x-auto mb-4">
                    {collections.map((collection, index) => (
                      <button
                        key={collection.id}
                        onClick={() => handleCollectionClick(index)}
                        className={`px-4 py-2 rounded-full whitespace-nowrap text-sm transition ${
                          index === currentCollection ? 'bg-black text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {collection.name}
                      </button>
                    ))}
                  </div>
                )}
                {/* Selected collection view */}
                {currentCollection === -1 ? (
                  <div className="relative aspect-[3/4] bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                    <img
                      src={model.image}
                      alt={model.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative aspect-[3/4] bg-gray-50 rounded-lg overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        {(() => {
                          const photos = collections[currentCollection]?.photos || [];
                          if (currentPhoto === -1) {
                            return (
                              <img
                                src={collections[currentCollection]?.photos?.[0]?.image_path || ''}
                                alt={collections[currentCollection]?.name}
                                className="max-w-full max-h-full object-contain" />
                            );
                          }
                          const photo = photos[currentPhoto];
                          return (
                            <img
                              src={photo?.image_path || ''}
                              alt={photo?.caption || ''}
                              className="max-w-full max-h-full object-contain"
                            />
                          );
                        })()}
                      </div>
                    </div>
                    {/* Navigation arrows */}
                    <button
                      onClick={handlePrevPhoto}
                      className="absolute top-1/2 left-2 -translate-y-1/2 p-2 bg-white/50 hover:bg-white rounded-full"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={handleNextPhoto}
                      className="absolute top-1/2 right-2 -translate-y-1/2 p-2 bg-white/50 hover:bg-white rounded-full"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
                {/* Thumbnails within collection */}
                {currentCollection !== -1 && collections[currentCollection]?.photos?.length > 1 && (
                  <div className="flex space-x-2 mt-2 overflow-x-auto p-1 bg-gray-50 rounded-lg">
                    {collections[currentCollection].photos.map((photo, index) => (
                      <div
                        key={photo.id}
                        onClick={() => setCurrentPhoto(index)}
                        className={`w-16 h-16 flex-shrink-0 rounded overflow-hidden border cursor-pointer ${
                          index === currentPhoto ? 'border-black' : 'border-transparent'
                        }`}
                      >
                        <img
                          src={photo.image_path || ''}
                          alt={photo.caption || ''}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
