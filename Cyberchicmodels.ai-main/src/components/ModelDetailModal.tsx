import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Star, ArrowLeft } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addLike } from '../store/likesSlice';
import { toggleFavorite } from '../store/favoritesSlice';
import { RootState } from '../store/store';
import { publicUrl } from '../lib/supabase';
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
  const likes = useSelector((state: RootState) => state.likes);
  const favorites = useSelector((state: RootState) => state.favorites.items);

  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeCollectionIdx, setActiveCollectionIdx] = useState(0);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  const isLiked = likes[model.id] > 0;
  const isFavorited = favorites.some((f: any) => f.id === model.id);
  const currentModelIdx = allModels.findIndex(m => m.id === model.id);

  useEffect(() => {
    setLoading(true);
    setActiveCollectionIdx(0);
    setActivePhotoIdx(0);
    fetchCollections();
  }, [model.id]);

  async function fetchCollections() {
    const { data: cols, error } = await supabase
      .from('model_collections')
      .select('id, name, slug, display_order')
      .eq('model_id', model.id)
      .order('display_order');

    if (error || !cols || cols.length === 0) {
      setCollections([]);
      setLoading(false);
      return;
    }

    const colIds = cols.map(c => c.id);
    const { data: imgs } = await supabase
      .from('model_collection_images')
      .select('id, collection_id, path, display_order')
      .in('collection_id', colIds)
      .order('display_order');

    const enriched: Collection[] = cols.map(col => ({
      ...col,
      images: (imgs || [])
        .filter(img => img.collection_id === col.id)
        .sort((a, b) => a.display_order - b.display_order),
    }));

    setCollections(enriched);
    setLoading(false);
  }

  const activeCollection = collections[activeCollectionIdx];
  const activePhotos = activeCollection?.images ?? [];
  const currentPhoto = activePhotos[activePhotoIdx];

  function prevPhoto() {
    setActivePhotoIdx(i => (i === 0 ? activePhotos.length - 1 : i - 1));
  }

  function nextPhoto() {
    setActivePhotoIdx(i => (i === activePhotos.length - 1 ? 0 : i + 1));
  }

  function handleCollectionChange(idx: number) {
    setActiveCollectionIdx(idx);
    setActivePhotoIdx(0);
  }

  function handlePrevModel() {
    if (currentModelIdx > 0 && onModelChange) {
      onModelChange(allModels[currentModelIdx - 1]);
    }
  }

  function handleNextModel() {
    if (currentModelIdx < allModels.length - 1 && onModelChange) {
      onModelChange(allModels[currentModelIdx + 1]);
    }
  }

  // Current image URL — falls back to model thumbnail
  const imageUrl = currentPhoto
    ? getStorageUrl('model-collections', currentPhoto.path)
    : getStorageUrl('model-thumbnails', model.image);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="relative bg-white rounded-2xl overflow-hidden w-full max-w-5xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Top nav */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 shrink-0">
          <div className="flex gap-3">
            <button
              onClick={handlePrevModel}
              disabled={currentModelIdx <= 0}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 disabled:opacity-30"
            >
              <ChevronLeft size={16} /> Previous Model
            </button>
            <button
              onClick={handleNextModel}
              disabled={currentModelIdx >= allModels.length - 1}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 disabled:opacity-30"
            >
              Next Model <ChevronRight size={16} />
            </button>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT — image viewer */}
          <div className="relative flex-1 bg-gray-50 flex items-center justify-center overflow-hidden">
            {loading ? (
              <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
            ) : (
              <img
                src={imageUrl}
                alt={model.name}
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = model.image; }}
              />
            )}

            {/* Prev / Next arrows — scoped to active collection */}
            {activePhotos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            {/* Dot indicators */}
            {activePhotos.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {activePhotos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhotoIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === activePhotoIdx ? 'bg-white scale-125' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT — info panel */}
          <div className="w-80 flex flex-col overflow-y-auto border-l border-gray-100">
            <div className="p-6 flex flex-col gap-4 flex-1">
              {/* Like / Favorite */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => dispatch(addLike(model.id))}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-rose-500"
                >
                  <Heart size={18} className={isLiked ? 'fill-rose-500 text-rose-500' : ''} />
                  {likes[model.id] ?? 0}
                </button>
                <button
                  onClick={() => dispatch(toggleFavorite({ id: model.id, name: model.name, image: model.image, specialty: model.specialty }))}
                  className="text-gray-400 hover:text-yellow-500"
                >
                  <Star size={18} className={isFavorited ? 'fill-yellow-400 text-yellow-400' : ''} />
                </button>
              </div>

              {/* Name + tagline */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">{model.name}</h2>
                {model.tagline && <p className="text-sm text-gray-500 mt-0.5">{model.tagline}</p>}
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
                        onClick={() => handleCollectionChange(idx)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          idx === activeCollectionIdx
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {col.name} ({col.images.length})
                      </button>
                    ))}
                  </div>
                  {activeCollection && (
                    <p className="text-xs text-gray-400 mt-2">
                      {activePhotoIdx + 1} / {activePhotos.length}
                    </p>
                  )}
                </div>
              )}

              {/* Interests */}
              {model.hobbies && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Interests</p>
                  <p className="text-sm text-gray-600">{model.hobbies}</p>
                </div>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Hire Me CTA */}
              <button
                onClick={() => { onClose(); navigate('/contact'); }}
                className="w-full py-3 rounded-xl bg-rose-400 hover:bg-rose-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                Hire Me
              </button>
              <p className="text-center text-xs text-gray-400">Includes 30+ HD images &amp; commercial license</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
