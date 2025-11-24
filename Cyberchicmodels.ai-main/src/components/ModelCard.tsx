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
    height?: string;
    weight?: string;
    specialty?: string;
    hobbies?: string;
    image: string;
    video?: string;
    isPopular?: boolean;
    isNew?: boolean;
    isComingSoon?: boolean;
    is_popular?: boolean;
    is_new?: boolean;
    is_coming_soon?: boolean;
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

  // Check both camelCase and snake_case properties
  const isPopular = model.isPopular || model.is_popular;
  const isNew = model.isNew || model.is_new;
  const isComingSoon = model.isComingSoon || model.is_coming_soon;

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
      specialty: model.specialty || ''
    }));
  };

  const handleCardClick = () => {
    onModelClick(model);
  };

  return (
    <div
      className="relative w-full aspect-[3/4] group cursor-pointer overflow-hidden rounded-lg"
      onClick={handleCardClick}
    >
      {/* Image */}
      <img 
        src={model.image}
        alt={model.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={(e) => {
          e.currentTarget.src = 'https://via.placeholder.com/300x400?text=Model+Image';
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

      {/* Status Tags - Top Left Corner (Inside Image) */}
      <div className="absolute top-2 left-2 flex flex-col gap-2 z-20">
        {isNew && (
          <span className="bg-black text-white text-xs font-bold px-2.5 py-1.5 rounded">
            New Additions
          </span>
        )}
        {isPopular && (
          <span className="bg-rose-500 text-white text-xs font-bold px-2.5 py-1.5 rounded">
            Popular
          </span>
        )}
        {isComingSoon && (
          <span className="bg-gray-600 text-white text-xs font-bold px-2.5 py-1.5 rounded">
            Coming Soon
          </span>
        )}
      </div>

      {/* Action Icons - Top Right */}
      <div className="absolute top-3 right-3 flex gap-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleLike}
          className="bg-white/80 hover:bg-white p-2 rounded-full transition flex items-center gap-1"
          title="Like"
        >
          <Heart className={`h-4 w-4 ${hasLiked ? 'text-red-500 fill-red-500' : 'text-gray-700'}`} />
          {likes > 0 && <span className="text-xs text-gray-700 font-medium">{likes}</span>}
        </button>
        <button
          onClick={handleToggleFavorite}
          className="bg-white/80 hover:bg-white p-2 rounded-full transition"
          title="Favorite"
        >
          <Star className={`h-4 w-4 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`} />
        </button>
      </div>

      {/* Model Info - Bottom (Name, Age, Nationality) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
        <h3 className="text-white font-serif text-lg font-bold mb-2">{model.name}</h3>
        <div className="text-white/90 text-sm space-y-0.5">
          {model.age && <p>Age: {model.age}</p>}
          {model.nationality && <p>{model.nationality}</p>}
        </div>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
    </div>
  );
}
