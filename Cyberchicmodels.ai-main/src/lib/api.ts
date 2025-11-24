import { supabase } from './supabase';
import { getStorageUrl } from './storage';

export interface Model {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  age: number;
  nationality: string;
  ethnicity: string;
  gender: string;
  height: string;
  weight: string;
  specialty: string;
  specialties: string[];
  bio: string;
  hobbies: string[];
  image: string;
  video: string;
  isNew?: boolean;
  isPopular?: boolean;
  isComingSoon?: boolean;
  isFeatured?: boolean;
}

export interface Style {
  id: string;
  slug: string;
  name: string;
  price_usd: number;
  image_path: string | null;
  description: string;
}

class APIService {
  async getModels(options?: { featured?: boolean; limit?: number }): Promise<Model[]> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey || supabaseKey.includes('REPLACE_WITH_YOUR_ACTUAL')) {
        console.warn('Supabase not configured. Using fallback data.');
        return [];
      }

      let query = supabase
        .from('models')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching models:', error);
        return [];
      }

      return (data || []).map(model => ({
        id: model.id,
        slug: model.slug,
        name: model.name,
        tagline: model.tagline || '',
        age: model.age || 0,
        nationality: model.nationality || '',
        ethnicity: model.ethnicity || '',
        gender: model.gender || '',
        height: model.height || '',
        weight: model.weight || '',
        specialty: model.specialty || '',
        specialties: model.specialties || [],
        bio: model.bio || '',
        hobbies: model.hobbies || [],
        image: model.thumbnail_path ? getStorageUrl('model-thumbnails', model.thumbnail_path) : '',
        video: '',
        isNew: model.is_new || false,
        isPopular: model.is_popular || false,
        isComingSoon: model.is_coming_soon || false,
        isFeatured: model.is_featured || false
      }));
    } catch (error) {
      console.error('Error in getModels:', error);
      return [];
    }
  }

  async getStyles(options?: { limit?: number }): Promise<Style[]> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey || supabaseKey.includes('REPLACE_WITH_YOUR_ACTUAL')) {
        console.warn('Supabase not configured. Using fallback data.');
        return [];
      }

      let query = supabase
        .from('styles')
        .select('*')
        .order('created_at', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching styles:', error);
        return [];
      }

      return (data || []).map(style => ({
        id: style.id,
        slug: style.slug,
        name: style.name,
        price_usd: style.price_usd || 0,
        image_path: style.image_path,
        description: style.description || ''
      }));
    } catch (error) {
      console.error('Error in getStyles:', error);
      return [];
    }
  }
}

export const apiService = new APIService();
