'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Input, useToast } from '@/components/ui';
import { FormSection, FormField } from '@/components/shared';
import { LogoSection, BrandColorsSection } from '@/components/settings/general';
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

interface GeneralSettingsProps {
  restaurantId: string;
}

export function GeneralSettings({ restaurantId }: GeneralSettingsProps) {
  const t = useTranslations('settings.general');
  const { showToast } = useToast();

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
    <div className="w-full md:max-w-4xl mx-auto p-3 md:p-6 space-y-6 md:space-y-8">
      <LogoSection
        logoUrl={data.logo}
        uploading={uploading}
        onFileSelect={handlePhotoUpload}
      />

      <FormSection title="Restaurant Information">
        <div className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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

      <FormSection title="Location">
        <div className="space-y-4 md:space-y-6">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
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

      <BrandColorsSection
        primaryColor={data.primaryColor}
        secondaryColor={data.secondaryColor}
        accentColor={data.accentColor}
        onPrimaryChange={(value) => setData({ ...data, primaryColor: value })}
        onSecondaryChange={(value) => setData({ ...data, secondaryColor: value })}
        onAccentChange={(value) => setData({ ...data, accentColor: value })}
      />

      <div className="flex justify-end pt-4 md:pt-6 border-t border-gray-200">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-red hover:bg-brand-red/90 text-white px-6 md:px-8 w-full md:w-auto"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
