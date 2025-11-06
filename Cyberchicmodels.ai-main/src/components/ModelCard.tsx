import React, { useState } from 'react';
import { Heart, Star } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addLike } from '../store/likesSlice';
import { toggleFavorite } from '../store/favoritesSlice';
import { RootState } from '../store/store';

interface ModelCardProps {
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
    video: string;
    isPopular?: boolean;
    isNew?: boolean;
    isComingSoon?: boolean;
    tagline?: string;
  };
  onModelClick: (model: any) => void;
}

export function ModelCard({ model, onModelClick }: ModelCardProps) {
  const dispatch = useDispatch();
  const [hasLiked, setHasLiked] = useState(false);
  const likes = useSelector((state: RootState) => state.likes.likes[model.id] || 0);
  const favorites = useSelector((state: RootState) => state.favorites.items);
  const isFavorite = favorites.some(fav => fav.id === model.id);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasLiked) {
      dispatch(addLike(model.id));
      setHasLiked(true);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleFavorite({
      id: model.id,
      name: model.name,
      image: model.image,
      specialty: model.specialty
    }));
  };

  const handleCardClick = () => {
    onModelClick(model);
  };

  return (
    <div
      className="relative w-full h-[700px] group cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="absolute top-0 left-0 z-10 flex flex-col gap-2 transform -translate-x-2 -translate-y-2">
        {model.isPopular && (
          <div className="bg-rose-300 text-white py-2 px-3 rounded-tl-lg rounded-br-lg font-medium shadow-lg text-sm">
            Most Popular
          </div>
        )}
        {(model.isNew || model.is_new) && (
          <div className="bg-black text-white py-2 px-3 rounded-tl-lg rounded-br-lg font-medium shadow-lg text-sm">
            New Addition
          </div>
        )}
        {(model.isComingSoon || model.is_coming_soon) && (
          <div className="bg-red-500 text-white py-2 px-3 rounded-tl-lg rounded-br-lg font-medium shadow-lg text-sm">
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
        
        {/* Model Info - Always Visible */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white text-xl font-serif mb-2 leading-tight">{model.name}</h3>
          <p className="text-white/90 text-sm mb-1 leading-tight">
            {model.tagline || 
             (model.specialties && model.specialties.length > 0 
               ? model.specialties.slice(0, 2).join(', ') + (model.specialties.length > 2 ? '...' : '')
               : model.specialty)
            }
          </p>
          <p className="text-white/70 text-sm leading-tight">{model.nationality} • {model.age} years</p>
        </div>

        {/* Action Buttons */}
        <div className="absolute top-3 right-3 flex space-x-2">
          <button
            onClick={handleLike}
            className={`bg-white/20 backdrop-blur-sm p-2 rounded-full transition flex items-center ${
              hasLiked ? 'cursor-default' : 'hover:bg-white/30'
            }`}
            disabled={hasLiked}
          >
            <Heart className={`h-5 w-5 ${hasLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
            <span className="ml-1 text-white text-sm">{likes}</span>
          </button>
          <button
            onClick={handleToggleFavorite}
            className="bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition"
          >
            <Star className={`h-5 w-5 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-white'}`} />
          </button>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
      </div>
    </div>
  );
}