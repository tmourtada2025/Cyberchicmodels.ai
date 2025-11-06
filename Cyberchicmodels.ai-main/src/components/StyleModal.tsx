import React, { useState, useEffect } from 'react';
import { X, Download, Heart, Star } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addToCart } from '../store/cartSlice';
import { addLike } from '../store/likesSlice';
import { toggleFavorite } from '../store/favoritesSlice';
import { RootState } from '../store/store';

interface StyleModalProps {
  style: {
    id: string;
    name: string;
    price: number;
    description: string;
    image: string;
    backImage?: string;
  };
  onClose: () => void;
}

interface ColorVariant {
  name: string;
  color: string;
  tooltip: string;
  image: string;
}

const colorVariants: Record<string, ColorVariant[]> = {
  ST100: [
    { name: 'crimson', color: '#B22222', tooltip: 'Crimson Red', image: null },
    { name: 'champagne', color: '#D4AF37', tooltip: 'Champagne Gold', image: null },
    { name: 'emerald', color: '#50C878', tooltip: 'Emerald Green', image: null },
    { name: 'navy', color: '#0F0520', tooltip: 'Midnight Navy', image: null },
    { name: 'rose', color: '#E8ADAA', tooltip: 'Rose Dust', image: null }
  ],
  ST106: [
    { name: 'black', color: '#000000', tooltip: 'Classic Black', image: null },
    { name: 'crimson', color: '#B22222', tooltip: 'Crimson Red', image: null },
    { name: 'ivory', color: '#FFFFF0', tooltip: 'Ivory White', image: null },
    { name: 'emerald', color: '#50C878', tooltip: 'Emerald Green', image: null },
    { name: 'copper', color: '#B87333', tooltip: 'Copper Rust', image: null }
  ]
};

export function StyleModal({ style, onClose }: StyleModalProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const availableColors = colorVariants[style.id] || [];
  const [selectedColor, setSelectedColor] = useState<ColorVariant | null>(availableColors.length > 0 ? availableColors[0] : null);
  const [selectedView, setSelectedView] = useState<'front' | 'back'>('front');
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);
  const [isAdded, setIsAdded] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);

  const likes = useSelector((state: RootState) => state.likes.likes[style.id] || 0);
  const favorites = useSelector((state: RootState) => state.favorites.items);
  const isFavorite = favorites.some(fav => fav.id === style.id);

  const currentImage = selectedView === 'back' && style.backImage ? style.backImage : selectedColor?.image || style.image;

  useEffect(() => {
    document.addEventListener('keydown', (e) => e.key === 'Escape' && onClose());
    return () => document.removeEventListener('keydown', (e) => e.key === 'Escape' && onClose());
  }, [onClose]);

  useEffect(() => {
    availableColors.forEach((variant) => new Image().src = variant.image);
  }, [availableColors]);

  const handleAddToCart = () => {
    dispatch(addToCart({ ...style, image: currentImage, price: style.price }));
    setIsAdded(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Swatches */}
        {availableColors.length > 0 && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col space-y-3 z-10">
            {availableColors.map((variant) => (
              <div key={variant.name} className="relative">
                <button
                  onMouseEnter={() => setHoveredColor(variant.name)}
                  onMouseLeave={() => setHoveredColor(null)}
                  onClick={() => setSelectedColor(variant)}
                  className={`w-8 h-8 rounded-full transition-transform duration-200 ${
                    selectedColor?.name === variant.name ? 'ring-2 ring-offset-2 ring-black scale-110' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: variant.color }}
                />
                {hoveredColor === variant.name && (
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-white text-gray-800 text-sm py-1 px-2 rounded shadow-md border border-gray-200">
                    {variant.tooltip}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Image */}
        <div className="relative flex flex-col h-full">
          <img src={currentImage} className="w-full h-full object-contain" alt={style.name} />
          <div className="flex justify-center space-x-4 p-4 bg-white border-t">
            {(['front', 'back'] as const).map((view) => (
              <button
                key={view}
                onClick={() => setSelectedView(view)}
                className={`px-4 py-2 rounded-full text-sm ${selectedView === view ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)} View
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="p-8 flex flex-col h-full overflow-y-auto">
          <h2 className="text-3xl font-serif mb-2">{style.name}</h2>
          <p className="text-2xl font-serif mb-6">${style.price}</p>
          <p className="text-gray-600 mb-8">{style.description}</p>
          <div className="flex space-x-3">
            {!isAdded ? (
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-black text-white py-4 rounded-full hover:bg-opacity-90 transition"
              >
                <Download className="h-5 w-5 mr-2" /> Add to Cart
              </button>
            ) : (
              <button
                onClick={() => navigate('/cart')}
                className="flex-1 bg-black text-white py-4 rounded-full hover:bg-opacity-90 transition"
              >
                View Cart
              </button>
            )}
          </div>
        </div>

        {/* Top Right Buttons */}
        <div className="absolute top-4 right-4 z-10 flex space-x-2">
          <button onClick={() => dispatch(addLike(style.id))} className="p-2 rounded-full bg-white/20 hover:bg-white/30">
            <Heart className="h-5 w-5 text-gray-800" />
          </button>
          <button onClick={() => dispatch(toggleFavorite({ id: style.id, name: style.name, image: style.image, description: style.description }))} className="p-2 rounded-full bg-white/20 hover:bg-white/30">
            <Star className="h-5 w-5 text-gray-800" />
          </button>
          <button onClick={onClose} className="p-2 rounded-full bg-white/20 hover:bg-white/30">
            <X className="h-6 w-6 text-gray-800" />
          </button>
        </div>
      </div>
    </div>
  );
}
