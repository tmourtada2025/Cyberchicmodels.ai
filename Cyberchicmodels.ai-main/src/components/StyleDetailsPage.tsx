import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Star, Download, Info, Shield, Truck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import { addLike } from '../store/likesSlice';
import { toggleFavorite } from '../store/favoritesSlice';
import { RootState } from '../store/store';
import { Footer } from './Footer';
import { supabase } from '../lib/supabase';
import { getStorageUrl } from '../lib/storage';
import type { Style } from '../lib/supabase';

interface StyleViews {
  front: string;
  back?: string;
}

interface ProcessedStyle {
  id: string;
  name: string;
  colors: string[];
  angle: string;
  clothingType: string;
  styleTheme: string;
  views: StyleViews;
  price: number;
  description: string;
  fabric: string;
  features: string[];
  specifications: Record<string, string>;
}

const getRelatedStyles = (currentStyle: ProcessedStyle, allStyles: ProcessedStyle[], count: number = 4) => {
  let related = allStyles.filter(s => 
    s.id !== currentStyle.id && 
    (s.clothingType === currentStyle.clothingType || s.styleTheme === currentStyle.styleTheme)
  );
  
  if (related.length < count) {
    const remaining = allStyles.filter(s => 
      s.id !== currentStyle.id && 
      !related.find(r => r.id === s.id)
    );
    related = [...related, ...remaining];
  }
  
  return related
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
};

export function StyleDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [style, setStyle] = useState<ProcessedStyle | null>(null);
  const [allStyles, setAllStyles] = useState<ProcessedStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'front' | 'back'>('front');
  const [hasLiked, setHasLiked] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  const likes = useSelector((state: RootState) => state.likes.likes[id || ''] || 0);
  const favorites = useSelector((state: RootState) => state.favorites.items);
  const isFavorite = favorites.some(fav => fav.id === id);

  // Fetch style data from Supabase
  useEffect(() => {
    const fetchStyleData = async () => {
      if (!id) return;

      try {
        // Fetch current style
        const { data: styleData, error: styleError } = await supabase
          .from('styles')
          .select('*')
          .eq('id', id)
          .single();

        // Fetch all styles for related items
        const { data: allStylesData, error: allStylesError } = await supabase
          .from('styles')
          .select('*')
          .order('created_at', { ascending: false });

        if (styleError) {
          console.error('Error fetching style:', styleError);
          navigate('/styles');
          return;
        }

        if (allStylesError) {
          console.error('Error fetching all styles:', allStylesError);
        }

        // Process the style data
        const processedStyle = processStyleData(styleData);
        const processedAllStyles = (allStylesData || []).map(processStyleData);

        setStyle(processedStyle);
        setAllStyles(processedAllStyles);
      } catch (error) {
        console.error('Error fetching style data:', error);
        navigate('/styles');
      } finally {
        setLoading(false);
      }
    };

    fetchStyleData();
  }, [id, navigate]);

  // Process raw style data into component format
  const processStyleData = (rawStyle: Style): ProcessedStyle => {
    const frontImage = rawStyle.image_path 
      ? (rawStyle.image_path.startsWith('http') 
          ? rawStyle.image_path 
          : getStorageUrl('styles', rawStyle.image_path))
      : '';
    
    const backImage = rawStyle.back_image_path 
      ? (rawStyle.back_image_path.startsWith('http') 
          ? rawStyle.back_image_path 
          : getStorageUrl('styles', rawStyle.back_image_path))
      : undefined;

    return {
      id: rawStyle.id,
      name: rawStyle.name,
      colors: rawStyle.colors || [],
      angle: rawStyle.angle || 'front',
      clothingType: rawStyle.clothing_type || 'Unknown',
      styleTheme: rawStyle.style_theme || 'Unknown',
      views: {
        front: frontImage,
        back: backImage
      },
      price: rawStyle.price_usd || 1.99,
      description: rawStyle.description || 'No description available',
      fabric: getFabricDescription(rawStyle.clothing_type, rawStyle.name),
      features: getDefaultFeatures(),
      specifications: getDefaultSpecifications()
    };
  };

  // Generate fabric description based on style
  const getFabricDescription = (clothingType?: string, name?: string): string => {
    const fabricMap: Record<string, string> = {
      'Dress': 'Premium dress fabric',
      'Set': 'Mixed fabric blend',
      'Jumpsuit': 'Stretch fabric blend',
      'Robe': 'Luxurious fabric',
      'Evening Gown': 'High-end evening fabric'
    };

    if (name?.toLowerCase().includes('satin')) return 'Luxurious satin';
    if (name?.toLowerCase().includes('leather')) return 'Premium faux leather';
    if (name?.toLowerCase().includes('linen')) return 'Premium linen blend';
    if (name?.toLowerCase().includes('cotton')) return 'Cotton blend';
    if (name?.toLowerCase().includes('metallic')) return 'Metallic fabric';

    return fabricMap[clothingType || ''] || 'Premium fabric';
  };

  // Default features for all styles
  const getDefaultFeatures = (): string[] => [
    'High-resolution 4K renders',
    'Multiple angles included',
    'Transparent background',
    'Commercial license included'
  ];

  // Default specifications for all styles
  const getDefaultSpecifications = (): Record<string, string> => ({
    'File Format': 'PNG, PSD',
    'Resolution': '4096x4096px',
    'Color Profile': 'sRGB',
    'File Size': '~50MB per file',
    'Includes Source Files': 'Yes'
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading style...</p>
        </div>
      </div>
    );
  }

  if (!style || !id) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Style not found</p>
          <Link to="/styles" className="text-black hover:text-gray-600 mt-4 inline-block">
            Back to Styles
          </Link>
        </div>
      </div>
    );
  }

  const currentIndex = allStyles.findIndex(s => s.id === id);
  const relatedStyles = getRelatedStyles(style, allStyles);

  const handleAddToCart = () => {
    dispatch(addToCart({
      id,
      name: style.name,
      price: style.price,
      image: style.views.front,
      description: style.description
    }));
    setIsAdded(true);
  };

  const handleLike = () => {
    if (!hasLiked) {
      dispatch(addLike(id));
      setHasLiked(true);
    }
  };

  const handleToggleFavorite = () => {
    dispatch(toggleFavorite({
      id,
      name: style.name,
      image: style.views.front,
      description: style.description
    }));
  };

  const handleViewChange = (view: 'front' | 'back') => {
    if (view === 'back' && !style.views.back) return;
    setCurrentView(view);
  };

  const navigateToStyle = (direction: 'prev' | 'next') => {
    if (currentIndex === -1) return;
    
    let nextIndex;
    if (direction === 'prev') {
      nextIndex = (currentIndex - 1 + allStyles.length) % allStyles.length;
    } else {
      nextIndex = (currentIndex + 1) % allStyles.length;
    }
    
    navigate(`/style/${allStyles[nextIndex].id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-8">
            <Link to="/styles" className="flex items-center text-gray-600 hover:text-black">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Styles
            </Link>
          </div>

          <div className="fixed top-1/2 left-4 right-4 -translate-y-1/2 flex justify-between pointer-events-none z-10">
            <button
              onClick={() => navigateToStyle('prev')}
              className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white transition pointer-events-auto"
              disabled={isNavigating}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={() => navigateToStyle('next')}
              className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white transition pointer-events-auto"
              disabled={isNavigating}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <div className="sticky top-24">
                <div className="relative aspect-[3/4] bg-gray-50 rounded-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    {style.views[currentView] ? (
                      <img
                        src={style.views[currentView]}
                        alt={`${style.name} - ${currentView} view`}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <div className="text-gray-400">No image available</div>
                    )}
                  </div>
                </div>

                <div className="flex justify-center space-x-4 mt-4">
                  <button
                    onClick={() => handleViewChange('front')}
                    className={`px-6 py-2 rounded-full text-sm transition ${
                      currentView === 'front'
                        ? 'bg-black text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Front View
                  </button>
                  <button
                    onClick={() => handleViewChange('back')}
                    className={`px-6 py-2 rounded-full text-sm transition ${
                      !style.views.back 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : currentView === 'back'
                        ? 'bg-black text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                    disabled={!style.views.back}
                  >
                    Back View
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-serif mb-2">{style.name}</h1>
                  <div className="flex items-center mt-2 space-x-4">
                    <div className="flex items-center">
                      <button
                        onClick={handleLike}
                        className={`flex items-center space-x-1 text-gray-600 hover:text-red-500 ${
                          hasLiked ? 'text-red-500' : ''
                        }`}
                      >
                        <Heart className={`h-5 w-5 ${hasLiked ? 'fill-red-500' : ''}`} />
                        <span>{likes}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-b py-4">
                  <div className="text-3xl font-serif">${style.price.toFixed(2)}</div>
                  <div className="mt-1 text-sm text-gray-600">Digital Download • Instant Delivery</div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Shield className="h-4 w-4 mr-2" />
                    Commercial License Included
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Truck className="h-4 w-4 mr-2" />
                    Instant Digital Download
                  </div>
                </div>

                <div className="space-y-3">
                  {!isAdded ? (
                    <button
                      onClick={handleAddToCart}
                      className="w-full bg-black text-white py-4 rounded-full hover:bg-opacity-90 transition flex items-center justify-center"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Add to Cart – ${style.price.toFixed(2)}
                    </button>
                  ) : (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => navigate('/styles')}
                        className="flex-1 bg-gray-100 text-gray-800 py-4 rounded-full hover:bg-gray-200 transition"
                      >
                        Continue Shopping
                      </button>
                      <button
                        onClick={() => navigate('/cart')}
                        className="flex-1 bg-black text-white py-4 rounded-full hover:bg-opacity-90 transition"
                      >
                        View Cart
                      </button>
                    </div>
                  )}
                  
                  <button
                    onClick={handleToggleFavorite}
                    className={`w-full py-4 rounded-full border transition ${
                      isFavorite 
                        ? 'border-yellow-400 text-yellow-600' 
                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <Star className={`inline-block h-5 w-5 mr-2 ${
                      isFavorite ? 'text-yellow-400 fill-yellow-400' : ''
                    }`} />
                    {isFavorite ? 'Saved to Favorites' : 'Add to Favorites'}
                  </button>
                </div>

                <div className="border-t pt-6">
                  <div className="prose prose-sm">
                    <h2 className="font-serif text-lg mb-3">About this style</h2>
                    <p className={`text-gray-600 ${!showFullDescription && 'line-clamp-3'}`}>
                      {style.description}
                    </p>
                    {style.description.length > 150 && (
                      <button
                        onClick={() => setShowFullDescription(!showFullDescription)}
                        className="text-sm text-gray-500 hover:text-black mt-2"
                      >
                        {showFullDescription ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h2 className="font-serif text-lg mb-3">What's Included</h2>
                  <ul className="space-y-2">
                    {style.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-600">
                        <Info className="h-4 w-4 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t pt-6">
                  <h2 className="font-serif text-lg mb-3">Technical Specifications</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(style.specifications).map(([key, value]) => (
                      <div key={key}>
                        <div className="text-sm text-gray-500">{key}</div>
                        <div className="font-medium">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h2 className="font-serif text-lg mb-3">Perfect For</h2>
                  <div className="flex flex-wrap gap-2">
                    {['AI Training', 'Digital Campaigns', 'Virtual Try-on'].map((useCase) => (
                      <span
                        key={useCase}
                        className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
                      >
                        {useCase}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {relatedStyles.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-serif mb-8">You May Also Like</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {relatedStyles.map((relatedStyle) => (
                  <Link
                    key={relatedStyle.id}
                    to={`/style/${relatedStyle.id}`}
                    className="group"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    <div className="relative aspect-[3/4] bg-gray-50 rounded-lg overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        {relatedStyle.views.front ? (
                          <img
                            src={relatedStyle.views.front}
                            alt={relatedStyle.name}
                            className="max-w-full max-h-full object-contain transform group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="text-gray-400">No Image</div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <p className="text-sm font-medium line-clamp-2">{relatedStyle.name}</p>
                        <p className="text-sm opacity-80">${relatedStyle.price.toFixed(2)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}