'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, Input, useToast } from '@/components/ui';
import { FormSection, FormField } from '@/components/shared';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { getRestaurant, updateRestaurant } from '@/lib/serverActions/restaurant.actions';
import { uploadRestaurantPhoto } from '@/lib/serverActions/settings.actions';

interface RestaurantData {
  name: string;
  description: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export default function GeneralSettingsPage() {
  const params = useParams();
  const t = useTranslations('settings.general');
  const { showToast } = useToast();
  const restaurantId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [data, setData] = useState<RestaurantData>({
    name: '',
    description: '',
    phone: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    logo: '',
    primaryColor: '#282e59',
    secondaryColor: '#f03e42',
    accentColor: '#ffffff',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RestaurantData, string>>>({});

  useEffect(() => {
    fetchSettings();
  }, [restaurantId]);

  const fetchSettings = async () => {
    try {
      const result = await getRestaurant(restaurantId);

      if (!result.success || !result.data) {
        showToast('error', result.error || 'Failed to load settings');
        return;
      }

      const restaurant = result.data;
      setData({
        name: restaurant.name || '',
        description: restaurant.description || '',
        phone: restaurant.phone || '',
        email: restaurant.email || '',
        street: restaurant.street || '',
        city: restaurant.city || '',
        state: restaurant.state || '',
        zipCode: restaurant.zipCode || '',
        country: restaurant.country || 'US',
        logo: restaurant.logo || '',
        primaryColor: restaurant.primaryColor || '#282e59',
        secondaryColor: restaurant.secondaryColor || '#f03e42',
        accentColor: restaurant.accentColor || '#ffffff',
      });
    } catch (error) {
      showToast('error', 'Failed to load settings');
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RestaurantData, string>> = {};

    if (!data.name.trim()) newErrors.name = 'Restaurant name is required';
    if (!data.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!data.email.trim()) newErrors.email = 'Email is required';
    if (!data.street.trim()) newErrors.street = 'Street address is required';
    if (!data.city.trim()) newErrors.city = 'City is required';
    if (!data.state.trim()) newErrors.state = 'State is required';
    if (!data.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', 'Image must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select an image file');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;

        const result = await uploadRestaurantPhoto(restaurantId, {
          data: base64Data,
          mimeType: file.type,
          fileName: file.name,
        });

        if (!result.success || !result.data) {
          showToast('error', result.error || 'Failed to upload photo');
          return;
        }

        setData({ ...data, logo: result.data.url });
        showToast('success', 'Logo uploaded successfully');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      showToast('error', 'Failed to upload photo');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showToast('error', 'Please fix the errors before saving');
      return;
    }

    setSaving(true);
    try {
      const result = await updateRestaurant(restaurantId, data);

      if (!result.success) {
        showToast('error', result.error || 'Failed to save settings');
        return;
      }

      showToast('success', 'Settings saved successfully!');
      await fetchSettings();
    } catch (error) {
      showToast('error', 'Failed to save settings');
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Restaurant Logo */}
      <FormSection title="Restaurant Logo">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="relative group">
            {data.logo ? (
              <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
                <img
                  src={data.logo}
                  alt="Restaurant logo"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploading}
              />
              <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm font-medium text-gray-700">
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'Uploading...' : data.logo ? 'Change Logo' : 'Upload Logo'}</span>
              </div>
            </label>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Recommended: Square image, at least 400x400px</p>
              <p className="text-xs text-gray-500">Max file size: 5MB • Formats: JPG, PNG</p>
            </div>
          </div>
        </div>
      </FormSection>

      {/* Restaurant Information */}
      <FormSection title="Restaurant Information">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Restaurant Name" required error={errors.name}>
              <Input
                value={data.name}
                onChange={(e) => {
                  setData({ ...data, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                placeholder="Enter restaurant name"
              />
            </FormField>

            <FormField label="Phone Number" required error={errors.phone}>
              <Input
                value={data.phone}
                onChange={(e) => {
                  setData({ ...data, phone: e.target.value });
                  if (errors.phone) setErrors({ ...errors, phone: undefined });
                }}
                placeholder="+1 (555) 123-4567"
              />
            </FormField>
          </div>

          <FormField label="Email Address" required error={errors.email}>
            <Input
              type="email"
              value={data.email}
              onChange={(e) => {
                setData({ ...data, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              placeholder="info@restaurant.com"
            />
          </FormField>

          <FormField label="Description" description="Brief description of your restaurant">
            <textarea
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              placeholder="Tell customers about your restaurant..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg bg-transparent border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors resize-none"
            />
          </FormField>
        </div>
      </FormSection>

      {/* Location */}
      <FormSection title="Location">
        <div className="space-y-6">
          <FormField label="Street Address" required error={errors.street}>
            <Input
              value={data.street}
              onChange={(e) => {
                setData({ ...data, street: e.target.value });
                if (errors.street) setErrors({ ...errors, street: undefined });
              }}
              placeholder="123 Main Street"
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField label="City" required error={errors.city}>
              <Input
                value={data.city}
                onChange={(e) => {
                  setData({ ...data, city: e.target.value });
                  if (errors.city) setErrors({ ...errors, city: undefined });
                }}
                placeholder="New York"
              />
            </FormField>

            <FormField label="State" required error={errors.state}>
              <Input
                value={data.state}
                onChange={(e) => {
                  setData({ ...data, state: e.target.value });
                  if (errors.state) setErrors({ ...errors, state: undefined });
                }}
                placeholder="NY"
                maxLength={2}
              />
            </FormField>

            <FormField label="ZIP Code" required error={errors.zipCode}>
              <Input
                value={data.zipCode}
                onChange={(e) => {
                  setData({ ...data, zipCode: e.target.value });
                  if (errors.zipCode) setErrors({ ...errors, zipCode: undefined });
                }}
                placeholder="10001"
              />
            </FormField>
          </div>

          <FormField label="Country">
            <Input
              value={data.country}
              onChange={(e) => setData({ ...data, country: e.target.value })}
              placeholder="US"
              maxLength={2}
            />
          </FormField>
        </div>
      </FormSection>

      {/* Branding Colors */}
      <FormSection title="Brand Colors" description="Customize your restaurant's brand colors">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField label="Primary Color">
            <div className="flex gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={data.primaryColor}
                  onChange={(e) => setData({ ...data, primaryColor: e.target.value })}
                  className="h-11 w-16 rounded-lg border-2 border-gray-300 cursor-pointer"
                />
              </div>
              <Input
                value={data.primaryColor}
                onChange={(e) => setData({ ...data, primaryColor: e.target.value })}
                placeholder="#282e59"
                className="flex-1"
              />
            </div>
          </FormField>

          <FormField label="Secondary Color">
            <div className="flex gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={data.secondaryColor}
                  onChange={(e) => setData({ ...data, secondaryColor: e.target.value })}
                  className="h-11 w-16 rounded-lg border-2 border-gray-300 cursor-pointer"
                />
              </div>
              <Input
                value={data.secondaryColor}
                onChange={(e) => setData({ ...data, secondaryColor: e.target.value })}
                placeholder="#f03e42"
                className="flex-1"
              />
            </div>
          </FormField>

          <FormField label="Accent Color">
            <div className="flex gap-3">
              <div className="relative">
                <input
                  type="color"
                  value={data.accentColor}
                  onChange={(e) => setData({ ...data, accentColor: e.target.value })}
                  className="h-11 w-16 rounded-lg border-2 border-gray-300 cursor-pointer"
                />
              </div>
              <Input
                value={data.accentColor}
                onChange={(e) => setData({ ...data, accentColor: e.target.value })}
                placeholder="#ffffff"
                className="flex-1"
              />
            </div>
          </FormField>
        </div>

        {/* Color Preview */}
        <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-4">Color Preview</p>
          <div className="flex gap-4">
            <div className="flex-1 text-center">
              <div
                className="h-16 rounded-lg shadow-sm border border-gray-200"
                style={{ backgroundColor: data.primaryColor }}
              />
              <p className="text-xs text-gray-600 mt-2">Primary</p>
            </div>
            <div className="flex-1 text-center">
              <div
                className="h-16 rounded-lg shadow-sm border border-gray-200"
                style={{ backgroundColor: data.secondaryColor }}
              />
              <p className="text-xs text-gray-600 mt-2">Secondary</p>
            </div>
            <div className="flex-1 text-center">
              <div
                className="h-16 rounded-lg shadow-sm border border-gray-200"
                style={{ backgroundColor: data.accentColor }}
              />
              <p className="text-xs text-gray-600 mt-2">Accent</p>
            </div>
          </div>
        </div>
      </FormSection>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-red hover:bg-brand-red/90 text-white px-8"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
