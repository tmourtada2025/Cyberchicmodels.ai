import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, Heart, Star, ArrowLeft } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addToCart } from '../store/cartSlice';
import { addLike } from '../store/likesSlice';
import { toggleFavorite } from '../store/favoritesSlice';
import { RootState } from '../store/store';
import { publicUrl } from "../lib/supabase"
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
  const [currentCollection, setCurrentCollection] = useState(0);
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
      // Start with thumbnail view (no collection selected)
      setCurrentCollection(-1);
      setCurrentPhoto(0);
      
      try {
        // Fetch all photos for this model
        const { data: photosData, error: photosError } = await supabase
          .from('model_photos')
          .select('*')
          .eq('model_id', model.id)
          .order('sort_order');

        // Fetch collections (if any)
        const { data: collectionsData, error: collectionsError } = await supabase
          .from('model_collections')
          .select('id, name, description, cover_image_path')
          .eq('model_id', model.id)
          .order('sort_order');

        if (photosError) {
          console.error('Error fetching photos:', photosError);
        } else {
          const processedPhotos = (photosData || []).map(photo => ({
            ...photo,
            image_path: photo.image_path.startsWith('http') 
              ? photo.image_path 
              : getStorageUrl('models', photo.image_path)
          }));
          setModelPhotos(processedPhotos);
        }

        if (collectionsError) {
          console.error('Error fetching collections:', collectionsError);
        }

        // If we have photos from the database, use them
        if (photosData && photosData.length > 0) {
          setCollections([{
            id: 'photos',
            name: 'Photo Pack',
            description: `${photosData.length} professional photos`,
            photos: (photosData || []).map(photo => ({
              ...photo,
              image_path: photo.image_path.startsWith('http') 
                ? photo.image_path 
                : getStorageUrl('models', photo.image_path)
            }))
          }]);
        } else if (collectionsData && collectionsData.length > 0) {
          // Fallback to collections if no direct photos
          const { data: allPhotos, error: allPhotosError } = await supabase
            .from('model_photos')
          .select('*')
          .eq('model_id', model.id)
          .order('sort_order');

          if (!allPhotosError && allPhotos && allPhotos.length > 0) {
            // Process collections with photos
            const collectionsWithPhotos = collectionsData.map((collection, index) => {
              const photosPerCollection = Math.floor(allPhotos.length / collectionsData.length);
              const extraPhotos = allPhotos.length % collectionsData.length;
              const startIndex = index * photosPerCollection + Math.min(index, extraPhotos);
              const endIndex = startIndex + photosPerCollection + (index < extraPhotos ? 1 : 0);
              
              return {
                id: collection.id,
                name: collection.name,
                description: collection.description || `${collection.name} collection`,
                photos: allPhotos.slice(startIndex, endIndex).map(photo => ({
                  ...photo,
                  image_path: photo.image_path.startsWith('http') 
                    ? photo.image_path 
                    : getStorageUrl('models', photo.image_path)
                }))
              };
            });
            setCollections(collectionsWithPhotos);
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
                image_path: model.image,
                caption: model.name,
                is_thumbnail: true,
                is_featured: false,
                sort_order: 0,
                created_at: new Date().toISOString()
              }]
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
      // Can't go back from collection thumbnail
      return;
    } else if (currentPhoto === 0) {
      // Go back to collection thumbnail
      setCurrentPhoto(-1);
    } else {
      // Go to previous photo in same collection
      setCurrentPhoto(currentPhoto - 1);
    }
  };

  const handleNextPhoto = () => {
    if (currentCollection === -1) return; // Can't navigate from main photo
    
    const currentCollectionPhotos = collections[currentCollection]?.photos || [];
    
    if (currentPhoto === -1) {
      // Go from collection thumbnail to first photo
      setCurrentPhoto(0);
    } else if (currentPhoto < currentCollectionPhotos.length - 1) {
      // Go to next photo in same collection
      setCurrentPhoto(currentPhoto + 1);
    }
    // Stop at last photo of collection - don't go to next collection
  };

  const handleCollectionChange = (index: number) => {
    setCurrentCollection(index);
    setCurrentPhoto(-1); // Start with collection thumbnail view
  };

  const handleAddToCart = () => {
    dispatch(addToCart({
      id: model.id,
      name: model.name,
      price: 99.00,
      image: model.image,
      specialty: model.specialty
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
      specialty: model.specialty
    }));
  };

  const handleBackToModels = () => {
    onClose();
    navigate('/models');
  };

  const handleNavigateModel = (direction: 'previous' | 'next') => {
    if (allModels.length === 0) return;
    
    const currentIndex = allModels.findIndex(m => m.id === model.id);
    if (currentIndex === -1) return;
    
    let nextIndex;
    if (direction === 'previous') {
      nextIndex = currentIndex === 0 ? allModels.length - 1 : currentIndex - 1;
    } else {
      nextIndex = currentIndex === allModels.length - 1 ? 0 : currentIndex + 1;
    }
    
    const nextModel = allModels[nextIndex];
    if (nextModel && onModelChange) {
      onModelChange(nextModel);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading model details...</p>
        </div>
      </div>
    );
  }

  const currentCollectionData = collections[currentCollection];
  const currentPhotoData = currentCollectionData?.photos[currentPhoto];
  
  // Determine which image to display
  const currentImage = currentCollection === -1 
    ? model.image // Main model thumbnail
    : currentPhoto === -1 
    ? (currentCollectionData?.photos[0]?.image_path || model.image) // Collection thumbnail (first photo)
    : (currentPhotoData?.image_path || model.image); // Specific photo in collection
  
  // Show thumbnail first, then collection photos

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-[95vw] h-[95vh] bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 bg-black/80 backdrop-blur-sm p-3 rounded-full hover:bg-black transition-all duration-200 group"
        >
          <X className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
        </button>

        {/* Navigation Pills - Top center of image area */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex space-x-4">
          <button
            onClick={() => handleNavigateModel('previous')}
            className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full hover:bg-white transition-all duration-200 flex items-center text-gray-800 shadow-lg hover:shadow-xl text-sm"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous Model
          </button>
          <button
            onClick={() => handleNavigateModel('next')}
            className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full hover:bg-white transition-all duration-200 flex items-center text-gray-800 shadow-lg hover:shadow-xl text-sm"
          >
            Next Model
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
          {/* Image Section */}
          <div className="lg:col-span-2 relative bg-gray-50 flex items-center justify-center p-6">
            <div className="w-full h-full flex items-center justify-center max-h-[85vh]">
              <img
                src={currentImage}
                alt={currentCollectionData ? `${model.name} - ${currentCollectionData.name}` : model.name}
                className="max-w-[90%] max-h-[75vh] object-contain rounded-lg shadow-lg"
              />
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={handlePrevPhoto}
              className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110"
              disabled={currentCollection === -1 || currentPhoto <= -1}
            >
              <ChevronLeft className="h-4 w-4 text-gray-800" />
            </button>
            <button
              onClick={handleNextPhoto}
              className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110"
              disabled={currentCollection === -1 || currentPhoto === (currentCollectionData?.photos.length || 1) - 1}
            >
              <ChevronRight className="h-4 w-4 text-gray-800" />
            </button>

            {/* Photo Counter */}
            {currentCollection >= 0 && currentPhoto >= 0 && currentCollectionData && (currentCollectionData?.photos.length || 0) > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-5 py-3 rounded-full text-gray-800 text-sm shadow-lg font-medium">
                {currentPhoto + 1} / {currentCollectionData?.photos.length || 1}
              </div>
            )}

            {/* Action Buttons */}
            <div className="absolute top-20 right-6 flex space-x-3">
              <button
                onClick={handleLike}
                className={`bg-white/95 backdrop-blur-sm p-3 rounded-full transition-all duration-200 flex items-center shadow-lg hover:shadow-xl hover:scale-110 ${
                  hasLiked ? 'cursor-default' : 'hover:bg-white'
                }`}
                disabled={hasLiked}
              >
                <Heart className={`h-5 w-5 ${hasLiked ? 'text-red-500 fill-red-500' : 'text-gray-800'}`} />
                <span className="ml-1 text-gray-800">{likes}</span>
              </button>
              <button
                onClick={handleToggleFavorite}
                className="bg-white/95 backdrop-blur-sm p-3 rounded-full hover:bg-white transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110"
              >
                <Star className={`h-5 w-5 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-800'}`} />
              </button>
            </div>
          </div>

          {/* Details Section */}
          <div className="p-8 overflow-y-auto">
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-serif mb-2">{model.name}</h1>
                <p className="text-lg text-gray-600 mb-4">{model.tagline || model.specialty}</p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-medium">Age:</span> {model.age}</p>
                  <p><span className="font-medium">Nationality:</span> {model.nationality}</p>
                  <p><span className="font-medium">Height:</span> {model.height}</p>
                  <p><span className="font-medium">Weight:</span> {model.weight}</p>
                </div>
              </div>

              {/* Collections Tabs */}
              {collections.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3">
                    Photo Collections 
                    {modelPhotos.length > 0 && (
                      <span className="text-sm text-gray-500 ml-2">
                        ({modelPhotos.length} photos total)
                      </span>
                    )}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setCurrentCollection(-1)}
                      className={`px-4 py-2 rounded-full text-sm transition ${
                        currentCollection === -1
                          ? 'bg-black text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      Main Photo
                    </button>
                    {collections.map((collection, index) => (
                      <button
                        key={collection.id}
                        onClick={() => handleCollectionChange(index)}
                        className={`px-4 py-2 rounded-full text-sm transition ${
                          currentCollection === index
                            ? 'bg-black text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        {collection.name} ({collection.photos.length})
                      </button>
                    ))}
                  </div>
                  {currentCollection === -1 ? (
                    <p className="text-sm text-gray-600 mt-2">Main profile photo</p>
                  ) : currentPhoto === -1 ? (
                    <p className="text-sm text-gray-600 mt-2">{currentCollectionData?.name} collection overview</p>
                  ) : currentCollectionData?.description && (
                    <p className="text-sm text-gray-600 mt-2">{currentCollectionData.description}</p>
                  )}
                  {currentCollection >= 0 && currentPhoto >= 0 && currentPhotoData?.caption && (
                    <p className="text-sm text-gray-500 mt-2 italic">{currentPhotoData.caption}</p>
                  )}
                </div>
              )}

              {/* Bio */}
              {model.bio && (
                <div>
                  <h3 className="font-medium mb-2">About</h3>
                  <p className="text-gray-600 text-sm">{model.bio}</p>
                </div>
              )}

              {/* Hobbies */}
              <div>
                <h3 className="font-medium mb-2">Interests</h3>
                <p className="text-gray-600 text-sm">{model.hobbies}</p>
              </div>

              {/* Hire Button */}
              <div className="space-y-3 pt-4 border-t">
                {!isAdded ? (
                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-rose-300 text-white py-3 rounded-full hover:bg-rose-400 transition flex items-center justify-center"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Hire Me – $99.00
                  </button>
                ) : (
                  <div className="text-center">
                    <p className="text-green-600 mb-2">Added to cart!</p>
                    <button
                      onClick={onClose}
                      className="w-full bg-gray-200 text-gray-800 py-3 rounded-full hover:bg-gray-300 transition"
                    >
                      Continue Browsing
                    </button>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-xs text-gray-500">
                    Includes {modelPhotos.length > 0 ? `${modelPhotos.length}` : '30+'} HD images & commercial license
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}