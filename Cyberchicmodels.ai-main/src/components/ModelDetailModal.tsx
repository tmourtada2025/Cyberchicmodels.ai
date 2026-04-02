import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Star } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addLike } from '../store/likesSlice';
import { toggleFavorite } from '../store/favoritesSlice';
import { RootState } from '../store/store';
import { supabase } from '../lib/supabase';
import { getStorageUrl } from '../lib/storage';

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

interface CollectionImage {
  id: string;
  collection_id: string;
  path: string;
  display_order: number;
}

interface Collection {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  images: CollectionImage[];
}

export function ModelDetailModal({ model, allModels = [], onClose, onModelChange }: ModelDetailModalProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const likesState = useSelector((state: RootState) => state.likes);
  const favoritesState = useSelector((state: RootState) => state.favorites.items);

  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeColIdx, setActiveColIdx] = useState(0);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  const likeCount = likesState.likes?.[model.id] ?? 0;
  const isFavorited = favoritesState.some((f: any) => f.id === model.id);
  const currentModelIdx = allModels.findIndex(m => m.id === model.id);

  useEffect(() => {
    setLoading(true);
    setActiveColIdx(0);
    setActivePhotoIdx(0);
    fetchCollections();
  }, [model.id]);

  async function fetchCollections() {
    const { data: cols } = await supabase
      .from('model_collections')
      .select('id, name, slug, display_order')
      .eq('model_id', model.id)
      .order('display_order');

    if (!cols || cols.length === 0) { setCollections([]); setLoading(false); return; }

    const { data: imgs } = await supabase
      .from('model_collection_images')
      .select('id, collection_id, path, display_order')
      .in('collection_id', cols.map(c => c.id))
      .order('display_order');

    setCollections(cols.map(col => ({
      ...col,
      images: (imgs || []).filter(img => img.collection_id === col.id).sort((a, b) => a.display_order - b.display_order),
    })));
    setLoading(false);
  }

  const activeCollection = collections[activeColIdx];
  const activePhotos = activeCollection?.images ?? [];
  const isFirst = activePhotoIdx === 0;
  const isLast = activePhotoIdx === activePhotos.length - 1;

  const imageUrl = activePhotos[activePhotoIdx]
    ? getStorageUrl('model-collections', activePhotos[activePhotoIdx].path)
    : getStorageUrl('model-thumbnails', model.image);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75" onClick={onClose}>
      <div
        className="relative bg-white rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        style={{ width: '900px', height: '620px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-center px-6 py-3 border-b border-gray-100 shrink-0 relative">
          <div className="flex items-center gap-4">
            <button
              onClick={() => currentModelIdx > 0 && onModelChange && onModelChange(allModels[currentModelIdx - 1])}
              disabled={currentModelIdx <= 0}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 disabled:opacity-30"
            >
              <ChevronLeft size={16} /> Previous Model
            </button>
            <button
              onClick={() => currentModelIdx < allModels.length - 1 && onModelChange && onModelChange(allModels[currentModelIdx + 1])}
              disabled={currentModelIdx >= allModels.length - 1}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 disabled:opacity-30"
            >
              Next Model <ChevronRight size={16} />
            </button>
          </div>
          <button onClick={onClose} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">

          {/* LEFT — image */}
          <div className="relative bg-gray-100 flex items-center justify-center overflow-hidden" style={{ width: '520px', minWidth: '520px' }}>
            {loading ? (
              <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
            ) : (
              <img
                src={imageUrl}
                alt={model.name}
                className="w-full h-full object-contain"
                onError={e => { (e.target as HTMLImageElement).src = model.image; }}
              />
            )}

            {/* Prev arrow or disabled */}
            <button
              onClick={() => !isFirst && setActivePhotoIdx(i => i - 1)}
              className={`absolute left-3 top-1/2 -translate-y-1/2 rounded-full p-2 shadow transition-all ${
                isFirst ? 'bg-white/40 text-gray-300 cursor-default' : 'bg-white/80 hover:bg-white text-gray-700'
              }`}
            >
              <ChevronLeft size={20} />
            </button>

            {/* Next arrow or END label */}
            {isLast ? (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 text-gray-400 text-xs font-semibold px-2 py-1 rounded-full shadow">
                END
              </span>
            ) : (
              <button
                onClick={() => setActivePhotoIdx(i => i + 1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow text-gray-700"
              >
                <ChevronRight size={20} />
              </button>
            )}

            {/* Dot indicators */}
            {activePhotos.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {activePhotos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhotoIdx(i)}
                    className={`rounded-full transition-all ${
                      i === activePhotoIdx
                        ? 'w-4 h-2 bg-white'
                        : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — info */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <div className="p-6 flex flex-col gap-4 flex-1">

              {/* Like / Favorite */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => dispatch(addLike(model.id))}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-rose-500"
                >
                  <Heart size={18} className={likeCount > 0 ? 'fill-rose-500 text-rose-500' : ''} />
                  {likeCount}
                </button>
                <button onClick={() => dispatch(toggleFavorite({ id: model.id, name: model.name, image: model.image, specialty: model.specialty }))} className="text-gray-300 hover:text-yellow-500">
                  <Star size={18} className={isFavorited ? 'fill-yellow-400 text-yellow-400' : ''} />
                </button>
              </div>

              {/* Name + tagline */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{model.name}</h2>
                {model.tagline && <p className="text-sm text-gray-400 mt-0.5">{model.tagline}</p>}
              </div>

              {/* Stats */}
              <div className="space-y-1 text-sm text-gray-600">
                {model.age && <p><span className="font-medium">Age:</span> {model.age}</p>}
                {model.nationality && <p><span className="font-medium">Nationality:</span> {model.nationality}</p>}
                {model.height && <p><span className="font-medium">Height:</span> {model.height}</p>}
                {model.weight && <p><span className="font-medium">Weight:</span> {model.weight}</p>}
              </div>

              {/* Collections */}
              {collections.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Photo Collections</p>
                  <div className="flex flex-wrap gap-2">
                    {collections.map((col, idx) => (
                      <button
                        key={col.id}
                        onClick={() => { setActiveColIdx(idx); setActivePhotoIdx(0); }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          idx === activeColIdx ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {col.name} ({col.images.length})
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{activePhotoIdx + 1} / {activePhotos.length}</p>
                </div>
              )}

              {/* Interests */}
              {model.hobbies && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Interests</p>
                  <p className="text-sm text-gray-600">{model.hobbies}</p>
                </div>
              )}

              <div className="flex-1" />

              {/* Hire Me */}
              <button
                onClick={() => { onClose(); navigate('/contact'); }}
                className="w-full py-3 rounded-xl bg-rose-400 hover:bg-rose-500 text-white font-semibold text-sm transition-colors"
              >
                Hire Me
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
