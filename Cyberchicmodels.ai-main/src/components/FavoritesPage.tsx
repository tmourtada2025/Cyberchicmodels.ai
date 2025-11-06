import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { toggleFavorite, clearFavorites } from '../store/favoritesSlice';
import { Link, useNavigate } from 'react-router-dom';
import { Star, ArrowLeft } from 'lucide-react';
import { Footer } from './Footer';
import { ModelDetailModal } from './ModelDetailModal';
import { StyleModal } from './StyleModal';

interface StyleItem {
  id: string;
  name: string;
  image: string;
  specialty?: string;
  description?: string;
  price?: number;
}

interface FavoriteItem {
  id: string;
  name: string;
  image: string;
  specialty?: string;
  description?: string;
  price?: number;
}

export function FavoritesPage() {
  const favorites = useSelector((state: RootState) => state.favorites.items);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selectedModel, setSelectedModel] = React.useState<any>(null);
  const [selectedStyle, setSelectedStyle] = React.useState<StyleItem | null>(null);

  // Filter favorites to get only models (not styles)
  const favoriteModels = favorites.filter(item => !item.id.startsWith('STY-'));

  const handleItemClick = (item: FavoriteItem) => {
    if (typeof item.id === 'string' && item.id.startsWith('STY-')) {
      // It's a style item
      setSelectedStyle({
        id: item.id,
        name: item.name,
        image: item.image,
        description: item.description || '',
        price: item.price || 0
      });
    } else {
      // It's a model
      setSelectedModel({
        id: item.id,
        name: item.name,
        age: 25, // Default values since we don't store these in favorites
        nationality: 'Unknown',
        height: 'Unknown',
        weight: 'Unknown',
        specialty: item.specialty || 'Unknown',
        hobbies: 'Unknown',
        image: item.image,
        tagline: item.specialty
      });
    }
  };

  const handleModelChange = (model: any) => {
    setSelectedModel(model);
  };

  const handleCloseModal = () => {
    setSelectedModel(null);
  };
  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-8">
            <Link to="/" className="flex items-center text-gray-600 hover:text-black">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
          </div>

          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-serif">Favorite Models & Styles</h1>
            <div className="flex space-x-4">
              <Link
                to="/models"
                className="bg-black text-white px-6 py-2 rounded-full hover:bg-opacity-90 transition"
              >
                Browse Models
              </Link>
              <Link
                to="/styles"
                className="bg-rose-300 text-white px-6 py-2 rounded-full hover:bg-rose-400 transition"
              >
                Browse Styles
              </Link>
            </div>
          </div>

          {favorites.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-6">You haven't added any favorites yet</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {favorites.map((item) => (
                  <div key={item.id} className="relative group">
                    <div 
                      className="cursor-pointer"
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="relative overflow-hidden rounded-lg">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-64 object-cover transform transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-white text-xl font-serif">{item.name}</h3>
                          <p className="text-white/80">{item.specialty || item.description}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => dispatch(toggleFavorite(item))}
                      className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm p-2 rounded-full hover:bg-white/30 transition"
                    >
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-8 border-t pt-8">
                <button
                  onClick={() => dispatch(clearFavorites())}
                  className="text-gray-600 hover:text-red-500"
                >
                  Clear Favorites
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <Footer />
      {selectedModel && (
        <ModelDetailModal
          model={selectedModel}
          allModels={favoriteModels.map(fav => ({
            id: fav.id,
            name: fav.name,
            age: 25,
            nationality: 'Unknown',
            height: 'Unknown',
            weight: 'Unknown',
            specialty: fav.specialty || 'Unknown',
            hobbies: 'Unknown',
            image: fav.image,
            tagline: fav.specialty
          }))}
          onClose={handleCloseModal}
          onModelChange={handleModelChange}
        />
      )}
      {selectedStyle && (
        <StyleModal
          style={selectedStyle}
          onClose={() => setSelectedStyle(null)}
        />
      )}
    </div>
  );
}