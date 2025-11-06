import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Palette, 
  BarChart3, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Save, 
  X, 
  AlertTriangle,
  CheckCircle,
  LogOut,
  Image as ImageIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getStorageUrl } from '../lib/storage';
import type { Models, Styles } from '../lib/supabase';

interface AdminDashboardProps {
  onLogout: () => void;
}

interface Tab {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
}

const tabs: Tab[] = [
  { id: 'models', name: 'Models', icon: Users },
  { id: 'styles', name: 'Styles', icon: Palette },
  { id: 'hero', name: 'Hero Slides', icon: ImageIcon },
  { id: 'analytics', name: 'Analytics', icon: BarChart3 },
  { id: 'settings', name: 'Settings', icon: Settings },
];

const DEFAULT_COLLECTIONS = [
  'Editorial','Commercial','Beauty','Runway','Casual','Formal',
  'Glamour','Streetwear','Resort','Swimwear','Lingerie','Sportswear'
];

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('models');
  const [models, setModels] = useState<Model[]>([]);
  const [newModel, setNewModel] = useState({
    name: '',
    slug: '',
    tagline: '',
    specialty: '',
    nationality: '',
    ethnicity: '',
    gender: '',
    age: '',
    age_group: '',
    height: '',
    weight: '',
    bio: '',
    hobbies: '',
    experience_years: '',
    price_usd: '99.00',
    is_featured: false,
    is_new: false,
    is_popular: false,
    is_coming_soon: false,
    collections: []
  });
  const [styles, setStyles] = useState<Style[]>([]);
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModelForm, setShowModelForm] = useState(false);
  const [showStyleForm, setShowStyleForm] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [editingStyle, setEditingStyle] = useState<Style | null>(null);

  // Form states
  const [modelForm, setModelForm] = useState({
    name: '',
    tagline: '',
    specialties: [] as string[],
    nationality: '',
    ethnicity: '',
    gender: '',
    age: '',
    age_group: '',
    height: '',
    weight: '',
    bio: '',
    hobbies: '',
    price_usd: '99.00',
    is_featured: false,
    is_new: false,
    is_popular: false,
    is_coming_soon: false
  });

  const [newSpecialty, setNewSpecialty] = useState('');

  const [styleForm, setStyleForm] = useState({
    name: '',
    clothing_type: '',
    style_theme: '',
    colors: [] as string[],
    angle: 'front',
    price_usd: '1.99',
    description: ''
  });

  const [newStyle, setNewStyle] = useState({
    name: '',
    clothing_type: '',
    style_theme: '',
    colors: [] as string[],
    angle: 'front',
    price_usd: 1.99,
    description: '',
    image_path: '',
    back_image_path: ''
  });
  const [newHeroSlide, setNewHeroSlide] = useState({
    title: '',
    subtitle: '',
    description: '',
    background_image_path: '',
    button_text: 'Browse Models',
    button_link: '/models',
    sort_order: 0,
    is_active: true
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [modelPhotos, setModelPhotos] = useState<File[]>([]);
  const [photosCaptions, setPhotosCaptions] = useState<string[]>([]);
  const [photosCollections, setPhotosCollections] = useState<string[]>([]);
  const [modelCollections, setModelCollections] = useState<{id: string, name: string}[]>([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [styleImageFile, setStyleImageFile] = useState<File | null>(null);
  const [styleBackImageFile, setStyleBackImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const MAX_PHOTOS_PER_MODEL = 15;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Check if Supabase is properly configured
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey || supabaseKey.includes('REPLACE_WITH_YOUR_ACTUAL')) {
        console.warn('Supabase not configured properly. Cannot fetch admin data.');
        setModels([]);
        setStyles([]);
        setLoading(false);
        return;
      }

      const [modelsResponse, stylesResponse] = await Promise.all([
        supabase.from('models').select('*').order('created_at', { ascending: false }),
        supabase.from('styles').select('*').order('created_at', { ascending: false })
      ]);

      if (modelsResponse.error) {
        console.error('Error fetching models:', modelsResponse.error);
      } else {
        setModels(modelsResponse.data || []);
      }

      if (stylesResponse.error) {
        console.error('Error fetching styles:', stylesResponse.error);
      } else {
        setStyles(stylesResponse.data || []);
      }

      // Fetch hero slides
      const { data: heroData, error: heroError } = await supabase
        .from('hero_slides')
        .select('*')
        .order('sort_order', { ascending: true });

      if (heroError) {
        console.error('Error fetching hero slides:', heroError);
      } else {
        setHeroSlides(heroData || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (file: File, bucket: string, path: string): Promise<string> => {
    try {
      // First attempt with standard upload
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.warn('First upload attempt failed, trying with different settings:', error);
        
        // Second attempt with different settings
        const { data: retryData, error: retryError } = await supabase.storage
          .from(bucket)
          .upload(path, file, {
            cacheControl: '3600',
            upsert: true,
            duplex: 'half'
          });

        if (retryError) {
          throw new Error(`Upload failed: ${retryError.message}`);
        }
        
        return retryData.path;
      }

      return data.path;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleModelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let thumbnailPath = editingModel?.thumbnail_path || null;

      // Upload thumbnail if provided
      if (thumbnailFile) {
        const fileName = `${Date.now()}-${thumbnailFile.name}`;
        thumbnailPath = await uploadFile(thumbnailFile, 'models', fileName);
      }

      // Upload additional photos
      const uploadedPhotos = [];
      for (let i = 0; i < modelPhotos.length; i++) {
        const file = modelPhotos[i];
        const fileName = `${Date.now()}-${i}-${file.name}`;
        const path = await uploadFile(file, 'models', fileName);
        uploadedPhotos.push({
          image_path: path,
          caption: photosCaptions[i] || '',
          sort_order: i,
          is_thumbnail: false,
          is_featured: i < 3 // First 3 photos are featured
        });
      }

      const modelData = {
        ...modelForm,
        age: modelForm.age ? parseInt(modelForm.age) : null,
        price_usd: parseFloat(modelForm.price_usd),
        thumbnail_path: thumbnailPath,
        slug: modelForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        is_published: true,
        updated_at: new Date().toISOString()
      };

      if (editingModel) {
        const { error } = await supabase
          .from('models')
          .update(modelData)
          .eq('id', editingModel.id);

        if (error) throw error;

        // If editing, get the model ID, otherwise get it from the insert
        const modelId = editingModel ? editingModel.id : null;
        
        // Insert photos if we have any
        if (uploadedPhotos.length > 0 && modelId) {
          // Delete existing photos if editing
          if (editingModel) {
            await supabase
              .from('model_photos')
              .delete()
              .eq('model_id', modelId);
            
            // Also delete existing collections if editing
            await supabase
              .from('model_collections')
              .delete()
              .eq('model_id', modelId);
          }
          
          // Create collections first
          const uniqueCollections = [...new Set(photosCollections.filter(Boolean))];
          const collectionMap: Record<string, string> = {};
          
          for (const collectionName of uniqueCollections) {
            const { data: collection, error: collectionError } = await supabase
              .from('model_collections')
              .insert({
                model_id: modelId,
                name: collectionName,
                description: `${collectionName} collection`,
                sort_order: uniqueCollections.indexOf(collectionName)
              })
              .select()
              .single();
              
            if (!collectionError && collection) {
              collectionMap[collectionName] = collection.id;
            }
          }
          
          // Insert photos with collection assignments
          const photosToInsert = uploadedPhotos.map((photo, index) => ({
            ...photo,
            model_id: modelId,
            collection_id: photosCollections[index] ? collectionMap[photosCollections[index]] : null
          }));
          
          if (photosToInsert.length > 0) {
            const { error: photosError } = await supabase
              .from('model_photos')
              .insert(photosToInsert);
            
            if (photosError) {
              console.error('Error uploading photos:', photosError);
            }
          }
        }
      } else {
        const { data: newModel, error } = await supabase
          .from('models')
          .insert([{ ...modelData, created_at: new Date().toISOString() }])
          .select()
          .single();

        if (error) throw error;
        
        // Insert photos for new model
        if (uploadedPhotos.length > 0 && newModel) {
          // Create collections first
          const uniqueCollections = [...new Set(photosCollections.filter(Boolean))];
          const collectionMap: Record<string, string> = {};
          
          for (const collectionName of uniqueCollections) {
            const { data: collection, error: collectionError } = await supabase
              .from('model_collections')
              .insert({
                model_id: newModel.id,
                name: collectionName,
                description: `${collectionName} collection`,
                sort_order: uniqueCollections.indexOf(collectionName)
              })
              .select()
              .single();
              
            if (!collectionError && collection) {
              collectionMap[collectionName] = collection.id;
            }
          }
          
          const photosToInsert = uploadedPhotos.map((photo, index) => ({
            ...photo,
            model_id: newModel.id,
            collection_id: photosCollections[index] ? collectionMap[photosCollections[index]] : null
          }));
          
          if (photosToInsert.length > 0) {
            const { error: photosError } = await supabase
              .from('model_photos')
              .insert(photosToInsert);
              
            if (photosError) {
              console.error('Error uploading photos:', photosError);
            }
          }
        }
      }

      // Reset form
      setModelForm({
        name: '',
        tagline: '',
        specialties: [],
        nationality: '',
        ethnicity: '',
        gender: '',
        age: '',
        age_group: '',
        height: '',
        weight: '',
        bio: '',
        hobbies: '',
        price_usd: '99.00',
        is_featured: false,
        is_new: false,
        is_popular: false,
        is_coming_soon: false
      });
      setThumbnailFile(null);
      setNewSpecialty('');
      setPhotosCollections([]);
      setModelCollections([]);
      setNewCollectionName('');
      setPhotosCollections([]);
      setModelCollections([]);
      setNewCollectionName('');
      setEditingModel(null);
      setShowModelForm(false);
      fetchData();
    } catch (error) {
      console.error('Error saving model:', error);
      alert('Error saving model. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleStyleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imagePath = editingStyle?.image_path || null;
      let backImagePath = editingStyle?.back_image_path || null;

      // Upload main image if provided
      if (styleImageFile) {
        const fileName = `${Date.now()}-${styleImageFile.name}`;
        imagePath = await uploadFile(styleImageFile, 'styles', fileName);
      }

      // Upload back image if provided
      if (styleBackImageFile) {
        const fileName = `${Date.now()}-back-${styleBackImageFile.name}`;
        backImagePath = await uploadFile(styleBackImageFile, 'styles', fileName);
      }

      const styleData = {
        ...styleForm,
        price_usd: parseFloat(styleForm.price_usd),
        image_path: imagePath,
        back_image_path: backImagePath,
        slug: styleForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        updated_at: new Date().toISOString()
      };

      if (editingStyle) {
        const { error } = await supabase
          .from('styles')
          .update(styleData)
          .eq('id', editingStyle.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('styles')
          .insert([{ ...styleData, created_at: new Date().toISOString() }]);

        if (error) throw error;
      }

      // Reset form
      setStyleForm({
        name: '',
        clothing_type: '',
        style_theme: '',
        colors: [],
        angle: 'front',
        price_usd: '1.99',
        description: ''
      });
      setStyleImageFile(null);
      setStyleBackImageFile(null);
      setEditingStyle(null);
      setShowStyleForm(false);
      fetchData();
    } catch (error) {
      console.error('Error saving style:', error);
      alert('Error saving style. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddStyle = async () => {
    try {
      const { data, error } = await supabase
        .from('styles')
        .insert([newStyle])
        .select()
        .single();

      if (error) throw error;

      setStyles([data, ...styles]);
      setNewStyle({
        name: '',
        clothing_type: '',
        style_theme: '',
        colors: [],
        angle: 'front',
        price_usd: 1.99,
        description: '',
        image_path: '',
        back_image_path: ''
      });
      alert('Style added successfully!');
    } catch (error) {
      console.error('Error adding style:', error);
      alert('Error adding style');
    }
  };

  const handleAddHeroSlide = async () => {
    try {
      const { data, error } = await supabase
        .from('hero_slides')
        .insert([newHeroSlide])
        .select()
        .single();

      if (error) throw error;

      setHeroSlides([...heroSlides, data]);
      setNewHeroSlide({
        title: '',
        subtitle: '',
        description: '',
        background_image_path: '',
        button_text: 'Browse Models',
        button_link: '/models',
        sort_order: 0,
        is_active: true
      });
      alert('Hero slide added successfully!');
    } catch (error) {
      console.error('Error adding hero slide:', error);
      alert('Error adding hero slide');
    }
  };

  const handleEditModel = (model: Model) => {
    setEditingModel(model);
    setModelForm({
      name: model.name || '',
      tagline: model.tagline || '',
      specialties: model.specialties || (model.specialty ? [model.specialty] : []),
      nationality: model.nationality || '',
      ethnicity: model.ethnicity || '',
      gender: model.gender || '',
      age: model.age?.toString() || '',
      age_group: model.age_group || '',
      height: model.height || '',
      weight: model.weight || '',
      bio: model.bio || '',
      hobbies: model.hobbies || '',
      price_usd: model.price_usd?.toString() || '99.00',
      is_featured: model.is_featured || false,
      is_new: model.is_new || false,
      is_popular: model.is_popular || false,
      is_coming_soon: model.is_coming_soon || false
    });
    setShowModelForm(true);
  };

  const handleAddPhoto = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files);
    const totalPhotos = modelPhotos.length + newFiles.length;
    
    if (totalPhotos > MAX_PHOTOS_PER_MODEL) {
      alert(`Maximum ${MAX_PHOTOS_PER_MODEL} photos allowed per model`);
      return;
    }
    
    setModelPhotos(prev => [...prev, ...newFiles]);
    setPhotosCaptions(prev => [...prev, ...new Array(newFiles.length).fill('')]);
    setPhotosCollections(prev => [...prev, ...new Array(newFiles.length).fill('')]);
  };

  const handleRemovePhoto = (index: number) => {
    setModelPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotosCaptions(prev => prev.filter((_, i) => i !== index));
    setPhotosCollections(prev => prev.filter((_, i) => i !== index));
  };

  const handleCaptionChange = (index: number, caption: string) => {
    setPhotosCaptions(prev => {
      const newCaptions = [...prev];
      newCaptions[index] = caption;
      return newCaptions;
    });
  };

  const handleCollectionChange = (index: number, collection: string) => {
    setPhotosCollections(prev => {
      const newCollections = [...prev];
      newCollections[index] = collection;
      return newCollections;
    });
  };

  const addNewCollection = () => {
    if (newCollectionName.trim() && !modelCollections.find(c => c.name === newCollectionName.trim())) {
      const newCollection = {
        id: `temp-${Date.now()}`,
        name: newCollectionName.trim()
      };
      setModelCollections(prev => [...prev, newCollection]);
      setNewCollectionName('');
    }
  };

  const removeCollection = (collectionName: string) => {
    setModelCollections(prev => prev.filter(c => c.name !== collectionName));
    // Clear any photo assignments to this collection
    setPhotosCollections(prev => prev.map(c => c === collectionName ? '' : c));
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !modelForm.specialties.includes(newSpecialty.trim())) {
      setModelForm({
        ...modelForm,
        specialties: [...modelForm.specialties, newSpecialty.trim()]
      });
      setNewSpecialty('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setModelForm({
      ...modelForm,
      specialties: modelForm.specialties.filter(s => s !== specialty)
    });
  };

  const handleEditStyle = (style: Style) => {
    setEditingStyle(style);
    setStyleForm({
      name: style.name || '',
      clothing_type: style.clothing_type || '',
      style_theme: style.style_theme || '',
      colors: style.colors || [],
      angle: style.angle || 'front',
      price_usd: style.price_usd?.toString() || '1.99',
      description: style.description || ''
    });
    setShowStyleForm(true);
  };

  const handleDeleteModel = async (id: string | number) => {
    if (confirm('Are you sure you want to delete this model?')) {
      try {
        const { error } = await supabase
          .from('models')
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchData();
      } catch (error) {
        console.error('Error deleting model:', error);
        alert('Error deleting model. Please try again.');
      }
    }
  };

  const handleDeleteStyle = async (id: string) => {
    if (confirm('Are you sure you want to delete this style?')) {
      try {
        const { error } = await supabase
          .from('styles')
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchData();
      } catch (error) {
        console.error('Error deleting style:', error);
        alert('Error deleting style. Please try again.');
      }
    }
  };

  const renderModelsTab = () => {
    const allCollections = Array.from(new Set([
      ...DEFAULT_COLLECTIONS,
      ...modelCollections.map(c => c.name)
    ]));

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Models Management</h3>
          <button
            onClick={() => setShowModelForm(true)}
            className="bg-black text-white px-4 py-2 rounded-lg flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Model
          </button>
        </div>

        {showModelForm && (
          <div className="bg-white p-6 rounded-lg border">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium">
                {editingModel ? 'Edit Model' : 'Add New Model'}
              </h4>
              <button
                onClick={() => {
                  setShowModelForm(false);
                  setEditingModel(null);
                  setThumbnailFile(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleModelSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={modelForm.name}
                    onChange={(e) => setModelForm({...modelForm, name: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tagline
                  </label>
                  <input
                    type="text"
                    value={modelForm.tagline}
                    onChange={(e) => setModelForm({...modelForm, tagline: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialties
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <select
                        value={newSpecialty}
                        onChange={(e) => setNewSpecialty(e.target.value)}
                        className="flex-1 border rounded-lg px-3 py-2"
                      >
                        <option value="">Select Specialty</option>
                        <option value="Editorial">Editorial</option>
                        <option value="Commercial">Commercial</option>
                        <option value="High Fashion">High Fashion</option>
                        <option value="Avant Garde">Avant Garde</option>
                        <option value="Runway">Runway</option>
                        <option value="Films/TV">Films/TV</option>
                        <option value="Social Media">Social Media</option>
                        <option value="Athletic">Athletic</option>
                        <option value="Beauty">Beauty</option>
                        <option value="Lifestyle">Lifestyle</option>
                      </select>
                      <button
                        type="button"
                        onClick={addSpecialty}
                        className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {modelForm.specialties.map((specialty, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                        >
                          {specialty}
                          <button
                            type="button"
                            onClick={() => removeSpecialty(specialty)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nationality
                  </label>
                  <input
                    type="text"
                    value={modelForm.nationality}
                    onChange={(e) => setModelForm({...modelForm, nationality: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ethnicity
                  </label>
                  <select
                    value={modelForm.ethnicity}
                    onChange={(e) => setModelForm({...modelForm, ethnicity: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Select Ethnicity</option>
                    <option value="Arab">Arab</option>
                    <option value="Caucasian">Caucasian</option>
                    <option value="Asian">Asian</option>
                    <option value="African">African</option>
                    <option value="Latinos">Latinos</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={modelForm.gender}
                    onChange={(e) => setModelForm({...modelForm, gender: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    value={modelForm.age}
                    onChange={(e) => setModelForm({...modelForm, age: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age Group
                  </label>
                  <select
                    value={modelForm.age_group}
                    onChange={(e) => setModelForm({...modelForm, age_group: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">Select Age Group</option>
                    <option value="Teen">Teen</option>
                    <option value="Adult">Adult</option>
                    <option value="Elderly">Elderly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height
                  </label>
                  <input
                    type="text"
                    value={modelForm.height}
                    onChange={(e) => setModelForm({...modelForm, height: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="e.g., 5'8&quot;"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight
                  </label>
                  <input
                    type="text"
                    value={modelForm.weight}
                    onChange={(e) => setModelForm({...modelForm, weight: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="e.g., 120 lbs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={modelForm.price_usd}
                    onChange={(e) => setModelForm({...modelForm, price_usd: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={modelForm.bio}
                  onChange={(e) => setModelForm({...modelForm, bio: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hobbies
                </label>
                <textarea
                  value={modelForm.hobbies}
                  onChange={(e) => setModelForm({...modelForm, hobbies: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thumbnail Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model Photos (Max {MAX_PHOTOS_PER_MODEL})
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleAddPhoto(e.target.files)}
                  className="w-full border rounded-lg px-3 py-2 mb-3"
                />
                <p className="text-xs text-gray-500 mb-3">
                  Upload up to {MAX_PHOTOS_PER_MODEL} photos. First photo will be featured.
                </p>
                
                {modelPhotos.length > 0 && (
                  <div className="space-y-4">
                    {/* Collection Management */}
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-3">Photo Collections</h4>
                      <div className="flex gap-2 mb-3">
                        <select
                          value={newCollectionName}
                          onChange={(e) => setNewCollectionName(e.target.value)}
                          className="flex-1 text-sm border rounded px-2 py-1"
                        >
                          <option value="">Select a collection</option>
                          {allCollections.map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={addNewCollection}
                          disabled={!newCollectionName}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                        >
                          Add Collection
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {modelCollections.map((collection) => (
                          <span
                            key={collection.id}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                          >
                            {collection.name}
                            <button
                              type="button"
                              onClick={() => removeCollection(collection.name)}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Photo List */}
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                    {modelPhotos.map((file, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Photo ${index + 1}`}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{file.name}</p>
                          <input
                            type="text"
                            placeholder="Photo caption (optional)"
                            value={photosCaptions[index] || ''}
                            onChange={(e) => handleCaptionChange(index, e.target.value)}
                            className="mt-1 w-full text-xs border rounded px-2 py-1"
                          />
                            <select
                              value={photosCollections[index] || ''}
                              onChange={(e) => handleCollectionChange(index, e.target.value)}
                              className="mt-1 w-full text-xs border rounded px-2 py-1"
                            >
                              <option value="">No Collection</option>
                              {modelCollections.map((collection) => (
                                <option key={collection.id} value={collection.name}>
                                  {collection.name}
                                </option>
                              ))}
                            </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-2 text-xs text-gray-500">
                  Photos uploaded: {modelPhotos.length} / {MAX_PHOTOS_PER_MODEL}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={modelForm.is_featured}
                      onChange={(e) => setModelForm({...modelForm, is_featured: e.target.checked})}
                      className="mr-2"
                    />
                    Featured
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={modelForm.is_new}
                      onChange={(e) => setModelForm({...modelForm, is_new: e.target.checked})}
                      className="mr-2"
                    />
                    New
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={modelForm.is_popular}
                      onChange={(e) => setModelForm({...modelForm, is_popular: e.target.checked})}
                      className="mr-2"
                    />
                    Popular
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={modelForm.is_coming_soon}
                      onChange={(e) => setModelForm({...modelForm, is_coming_soon: e.target.checked})}
                      className="mr-2"
                    />
                    Coming Soon
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModelForm(false);
                    setEditingModel(null);
                    setThumbnailFile(null);
                    setModelPhotos([]);
                    setPhotosCaptions([]);
                    setPhotosCollections([]);
                    setModelCollections([]);
                    setNewCollectionName('');
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-black text-white px-4 py-2 rounded-lg flex items-center disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingModel ? 'Update' : 'Save'} Model
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Published
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {models.map((model) => (
                  <tr key={model.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {model.thumbnail_path ? (
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={getStorageUrl('models', model.thumbnail_path)}
                              alt={model.name}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <Users className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{model.name}</div>
                          <div className="text-sm text-gray-500">{model.tagline}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {model.specialties && model.specialties.length > 0 
                          ? model.specialties.join(', ')
                          : model.specialty || 'No specialties'
                        }
                      </div>
                      <div className="text-sm text-gray-500">{model.nationality} • {model.age} years</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {model.is_featured && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Featured
                          </span>
                        )}
                        {model.is_new && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            New
                          </span>
                        )}
                        {model.is_popular && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Popular
                          </span>
                        )}
                        {model.is_coming_soon && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Coming Soon
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {model.is_published !== false ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          <span className="text-sm">Published</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-red-600">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          <span className="text-sm">Not Published</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditModel(model)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteModel(model.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderStylesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Styles Management</h3>
        <button
          onClick={() => setShowStyleForm(true)}
          className="bg-black text-white px-4 py-2 rounded-lg flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Style
        </button>
      </div>

      {showStyleForm && (
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium">
              {editingStyle ? 'Edit Style' : 'Add New Style'}
            </h4>
            <button
              onClick={() => {
                setShowStyleForm(false);
                setEditingStyle(null);
                setStyleImageFile(null);
                setStyleBackImageFile(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleStyleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={styleForm.name}
                  onChange={(e) => setStyleForm({...styleForm, name: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clothing Type
                </label>
                <input
                  type="text"
                  value={styleForm.clothing_type}
                  onChange={(e) => setStyleForm({...styleForm, clothing_type: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Style Theme
                </label>
                <input
                  type="text"
                  value={styleForm.style_theme}
                  onChange={(e) => setStyleForm({...styleForm, style_theme: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={styleForm.price_usd}
                  onChange={(e) => setStyleForm({...styleForm, price_usd: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={styleForm.description}
                onChange={(e) => setStyleForm({...styleForm, description: e.target.value})}
                className="w-full border rounded-lg px-3 py-2"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Main Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setStyleImageFile(e.target.files?.[0] || null)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Back Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setStyleBackImageFile(e.target.files?.[0] || null)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowStyleForm(false);
                  setEditingStyle(null);
                  setStyleImageFile(null);
                  setStyleBackImageFile(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="bg-black text-white px-4 py-2 rounded-lg flex items-center disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingStyle ? 'Update' : 'Save'} Style
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Style
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {styles.map((style) => (
                <tr key={style.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {style.image_path ? (
                          <img
                            className="h-10 w-10 rounded object-cover"
                            src={getStorageUrl('styles', style.image_path)}
                            alt={style.name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                            <Palette className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{style.name}</div>
                        <div className="text-sm text-gray-500">{style.clothing_type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{style.style_theme}</div>
                    <div className="text-sm text-gray-500">{style.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${style.price_usd?.toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditStyle(style)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteStyle(style.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Add New Style</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Style Name</label>
            <input
              type="text"
              value={newStyle.name}
              onChange={(e) => setNewStyle({...newStyle, name: e.target.value})}
              className="w-full border rounded-lg p-2"
              placeholder="e.g., Emerald Green Satin Dress"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clothing Type</label>
            <select
              value={newStyle.clothing_type}
              onChange={(e) => setNewStyle({...newStyle, clothing_type: e.target.value})}
              className="w-full border rounded-lg p-2"
            >
              <option value="">Select Type</option>
              <option value="Dress">Dress</option>
              <option value="Set">Set</option>
              <option value="Jumpsuit">Jumpsuit</option>
              <option value="Robe">Robe</option>
              <option value="Evening Gown">Evening Gown</option>
              <option value="Casual Wear">Casual Wear</option>
              <option value="Formal Wear">Formal Wear</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Style Theme</label>
            <select
              value={newStyle.style_theme}
              onChange={(e) => setNewStyle({...newStyle, style_theme: e.target.value})}
              className="w-full border rounded-lg p-2"
            >
              <option value="">Select Theme</option>
              <option value="Elegant">Elegant</option>
              <option value="Casual">Casual</option>
              <option value="Bohemian">Bohemian</option>
              <option value="Modern">Modern</option>
              <option value="Vintage">Vintage</option>
              <option value="Minimalist">Minimalist</option>
              <option value="Glamorous">Glamorous</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD)</label>
            <input
              type="number"
              step="0.01"
              value={newStyle.price_usd}
              onChange={(e) => setNewStyle({...newStyle, price_usd: parseFloat(e.target.value)})}
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Angle</label>
            <select
              value={newStyle.angle}
              onChange={(e) => setNewStyle({...newStyle, angle: e.target.value})}
              className="w-full border rounded-lg p-2"
            >
              <option value="front">Front</option>
              <option value="back">Back</option>
              <option value="side">Side</option>
              <option value="full">Full View</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Colors</label>
            <input
              type="text"
              value={newStyle.colors.join(', ')}
              onChange={(e) => setNewStyle({...newStyle, colors: e.target.value.split(',').map(c => c.trim()).filter(c => c)})}
              className="w-full border rounded-lg p-2"
              placeholder="e.g., Black, White, Red"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={newStyle.description}
              onChange={(e) => setNewStyle({...newStyle, description: e.target.value})}
              className="w-full border rounded-lg p-2"
              rows={3}
              placeholder="Style description..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Front Image Path</label>
            <input
              type="text"
              value={newStyle.image_path}
              onChange={(e) => setNewStyle({...newStyle, image_path: e.target.value})}
              className="w-full border rounded-lg p-2"
              placeholder="styles/front-image.jpg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Back Image Path (Optional)</label>
            <input
              type="text"
              value={newStyle.back_image_path}
              onChange={(e) => setNewStyle({...newStyle, back_image_path: e.target.value})}
              className="w-full border rounded-lg p-2"
              placeholder="styles/back-image.jpg"
            />
          </div>
        </div>
        <button
          onClick={handleAddStyle}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Style
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Existing Styles ({styles.length})</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Theme</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colors</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {styles.map((style) => (
                <tr key={style.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{style.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{style.clothing_type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{style.style_theme}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${style.price_usd}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {style.colors?.slice(0, 2).join(', ')}{style.colors?.length > 2 ? '...' : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(style.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderHeroSlidesTab = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Add New Hero Slide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={newHeroSlide.title}
              onChange={(e) => setNewHeroSlide({ ...newHeroSlide, title: e.target.value })}
              className="w-full border rounded-lg p-2"
              placeholder="e.g., AI Fashion Models for a Digital World"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
            <input
              type="text"
              value={newHeroSlide.subtitle}
              onChange={(e) => setNewHeroSlide({ ...newHeroSlide, subtitle: e.target.value })}
              className="w-full border rounded-lg p-2"
              placeholder="e.g., Digital Innovation"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={newHeroSlide.description}
              onChange={(e) => setNewHeroSlide({ ...newHeroSlide, description: e.target.value })}
              className="w-full border rounded-lg p-2"
              rows={3}
              placeholder="Slide description..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Background Image Path</label>
            <input
              type="text"
              value={newHeroSlide.background_image_path}
              onChange={(e) => setNewHeroSlide({ ...newHeroSlide, background_image_path: e.target.value })}
              className="w-full border rounded-lg p-2"
              placeholder="hero/slide-bg.jpg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
            <input
              type="text"
              value={newHeroSlide.button_text}
              onChange={(e) => setNewHeroSlide({ ...newHeroSlide, button_text: e.target.value })}
              className="w-full border rounded-lg p-2"
              placeholder="Browse Models"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Button Link</label>
            <input
              type="text"
              value={newHeroSlide.button_link}
              onChange={(e) => setNewHeroSlide({ ...newHeroSlide, button_link: e.target.value })}
              className="w-full border rounded-lg p-2"
              placeholder="/models"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
            <input
              type="number"
              value={newHeroSlide.sort_order}
              onChange={(e) => setNewHeroSlide({ ...newHeroSlide, sort_order: parseInt(e.target.value) })}
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={newHeroSlide.is_active}
              onChange={(e) => setNewHeroSlide({ ...newHeroSlide, is_active: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
          </div>
        </div>
        <button
          onClick={handleAddHeroSlide}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add Hero Slide
        </button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">Existing Hero Slides ({heroSlides.length})</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtitle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Button</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {heroSlides.map((slide) => (
                <tr key={slide.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{slide.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{slide.subtitle}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{slide.button_text}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{slide.sort_order}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      slide.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {slide.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(slide.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Analytics</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Models</p>
              <p className="text-2xl font-bold text-gray-900">{models.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <Palette className="h-8 w-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Styles</p>
              <p className="text-2xl font-bold text-gray-900">{styles.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Published Models</p>
              <p className="text-2xl font-bold text-gray-900">
                {models.filter(m => m.is_published !== false).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Settings</h3>
      <div className="bg-white p-6 rounded-lg border">
        <p className="text-gray-600">Settings panel coming soon...</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === tab.id
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Logout Button - Positioned separately */}
        <button
          onClick={onLogout}
          className="absolute top-2 right-4 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium transition-colors"
        >
          logout
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-medium text-gray-900">
            {tabs.find(tab => tab.id === activeTab)?.name}
          </h2>
        </div>

        {activeTab === 'models' && renderModelsTab()}
        {activeTab === 'styles' && renderStylesTab()}
        {activeTab === 'hero' && renderHeroSlidesTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>
    </div>
  );
}