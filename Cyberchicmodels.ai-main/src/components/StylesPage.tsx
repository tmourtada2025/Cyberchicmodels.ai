import React, { useState } from 'react';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import { ArrowLeft, X, Search, RefreshCw } from 'lucide-react';
import { Footer } from './Footer';
import { supabase } from '../lib/supabase';
import { getStorageUrl } from '../lib/storage';
import type { Style } from '../lib/supabase';

interface FilterState {
  clothingType: string[];
  styleTheme: string[];
  colorTags: string[];
  search: string;
}

interface ColorTag {
  value: string;
  description: string;
}

export function StylesPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [styles, setStyles] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState({
    clothingType: [] as string[],
    styleTheme: [] as string[],
    colorTags: [] as ColorTag[]
  });
  const [filters, setFilters] = useState<FilterState>({
    clothingType: [],
    styleTheme: [],
    colorTags: [],
    search: ""
  });
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  // Fetch styles from Supabase
  useEffect(() => {
    const fetchStyles = async () => {
      try {
        const { data, error } = await supabase
          .from('styles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching styles:', error);
          setStyles([]);
        } else {
          const stylesData = data || [];
          setStyles(stylesData);
          
          // Extract unique filter options from the data
          const clothingTypes = [...new Set(stylesData.map(s => s.clothing_type).filter(Boolean))];
          const styleThemes = [...new Set(stylesData.map(s => s.style_theme).filter(Boolean))];
          const allColors = [...new Set(stylesData.flatMap(s => s.colors || []))];
          
          // Create color tags with descriptions
          const colorTags = allColors.map(color => ({
            value: color,
            description: getColorDescription(color)
          }));

          setFilterOptions({
            clothingType: clothingTypes,
            styleTheme: styleThemes,
            colorTags: colorTags
          });
        }
      } catch (error) {
        console.error('Error fetching styles:', error);
        setStyles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStyles();
  }, []);

  // Helper function to generate color descriptions
  const getColorDescription = (color: string): string => {
    const descriptions: Record<string, string> = {
      'Black': 'timeless, bold, dramatic',
      'White': 'pure, light, minimal',
      'Pink': 'romantic and feminine',
      'Coral': 'warm, beachy vibes',
      'Navy': 'classic, sophisticated',
      'Emerald': 'rich, luxurious green',
      'Cream': 'soft, neutral elegance',
      'Burnt': 'warm, earthy orange tones',
      'Orange': 'vibrant, energetic',
      'Blue': 'calm, trustworthy',
      'Red': 'passionate, bold',
      'Green': 'natural, fresh',
      'Yellow': 'bright, cheerful',
      'Purple': 'royal, mysterious',
      'Gray': 'sophisticated, neutral',
      'Brown': 'earthy, warm',
      'Beige': 'neutral, versatile',
      'Metallic': 'luxurious, modern'
    };
    return descriptions[color] || 'stylish and versatile';
  };

  const resetFilters = () => {
    setFilters({
      clothingType: [],
      styleTheme: [],
      colorTags: [],
      search: ""
    });
  };

  const toggleFilter = (category: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(item => item !== value)
        : [...prev[category], value]
    }));
  };

  const groupedStyles = styles.reduce((acc, style) => {
    const existingGroup = acc.find(group => group[0].id === style.id);
    if (existingGroup) {
      existingGroup.push(style);
    } else {
      acc.push([style]);
    }
    return acc;
  }, [] as Style[][]);

  const filteredStyles = groupedStyles.filter(group => {
    const style = group[0];
    const matchesSearch = style.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      (style.description || '').toLowerCase().includes(filters.search.toLowerCase());

    const matchesClothing = filters.clothingType.length === 0 ||
      filters.clothingType.includes(style.clothing_type || '');

    const matchesStyle = filters.styleTheme.length === 0 ||
      filters.styleTheme.includes(style.style_theme || '');

    const matchesColor = filters.colorTags.length === 0 ||
      (style.colors || []).some(color => filters.colorTags.includes(color));

    return matchesSearch && matchesClothing && matchesStyle && matchesColor;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading styles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-8">
            <Link to="/" className="flex items-center text-gray-600 hover:text-black">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
          </div>

          <div className="text-center mb-12">
            <h1 className="text-4xl font-serif mb-4">Style Concepts & Digital Couture</h1>
            <p className="text-xl text-gray-600">
              Discover curated fashion looks you can download, train on, or shop from.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 bg-gray-50 p-6 rounded-lg h-fit">
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search styles..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  {filters.search && (
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, search: "" }))}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {filterOptions.clothingType.length > 0 && (
                  <div>
                    <h3 className="font-serif text-lg mb-3">Clothing Type</h3>
                    <div className="flex flex-wrap gap-2">
                      {filterOptions.clothingType.map(type => (
                        <button
                          key={type}
                          onClick={() => toggleFilter('clothingType', type)}
                          className={`px-3 py-1 rounded-full text-sm ${
                            filters.clothingType.includes(type)
                              ? 'bg-black text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {filterOptions.styleTheme.length > 0 && (
                  <div>
                    <h3 className="font-serif text-lg mb-3">Style / Theme</h3>
                    <div className="flex flex-wrap gap-2">
                      {filterOptions.styleTheme.map(theme => (
                        <button
                          key={theme}
                          onClick={() => toggleFilter('styleTheme', theme)}
                          className={`px-3 py-1 rounded-full text-sm ${
                            filters.styleTheme.includes(theme)
                              ? 'bg-black text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {filterOptions.colorTags.length > 0 && (
                  <div>
                    <h3 className="font-serif text-lg mb-3">Colors</h3>
                    <div className="flex flex-wrap gap-2">
                      {filterOptions.colorTags.map(color => (
                        <div key={color.value} className="relative">
                          <button
                            onMouseEnter={() => setHoveredColor(color.value)}
                            onMouseLeave={() => setHoveredColor(null)}
                            onClick={() => toggleFilter('colorTags', color.value)}
                            className={`px-3 py-1 rounded-full text-sm transition-all duration-200 ${
                              filters.colorTags.includes(color.value)
                                ? 'bg-black text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {color.value}
                          </button>
                          {hoveredColor === color.value && (
                            <div className="absolute z-10 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-white text-gray-800 text-xs py-2 px-3 rounded-lg shadow-md border border-gray-200 animate-fade-in">
                              <div className="relative">
                                {color.description}
                                <div className="absolute -bottom-2.5 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-gray-200 rotate-45"></div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={resetFilters}
                  className="w-full flex items-center justify-center space-x-2 mt-6 px-4 py-2 bg-gray-200 rounded-full hover:bg-gray-300 transition"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Clear Filters</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStyles.map(group => {
                  const mainStyle = group[0];
                  const imageUrl = mainStyle.image_path 
                    ? (mainStyle.image_path.startsWith('http') 
                        ? mainStyle.image_path 
                        : getStorageUrl('styles', mainStyle.image_path))
                    : '';
                  
                  return (
                    <Link
                      key={mainStyle.id}
                      to={`/style/${mainStyle.id}`}
                      className="block group"
                    >
                      <div className="relative aspect-[3/4] bg-gray-50 rounded-lg overflow-hidden">
                        {imageUrl ? (
                          <div className="absolute inset-0 flex items-center justify-center py-[1px]">
                            <img
                              src={imageUrl}
                              alt={mainStyle.name}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <span className="text-gray-400">No Image</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                        <div className="absolute inset-x-0 bottom-0 p-4 text-white transform translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                          <h3 className="text-lg font-medium truncate">{mainStyle.name}</h3>
                          <p className="text-sm text-white/80">${(mainStyle.price_usd || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {filteredStyles.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No styles match your filters</p>
                  <button
                    onClick={resetFilters}
                    className="mt-4 text-black hover:text-gray-600"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}