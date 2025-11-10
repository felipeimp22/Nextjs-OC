'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Input, useToast } from '@/components/ui';
import { FormSection, FormField, LocationAutocomplete } from '@/components/shared';
import { LogoSection, BrandColorsSection } from '@/components/settings/general';
import { getRestaurant, updateRestaurant } from '@/lib/serverActions/restaurant.actions';
import { uploadRestaurantPhoto } from '@/lib/serverActions/settings.actions';
import type { AddressComponents } from '@/lib/utils/mapbox';

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
  geoLat: number | null;
  geoLng: number | null;
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
  const [addressSelected, setAddressSelected] = useState(false);
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
    geoLat: null,
    geoLng: null,
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
        geoLat: restaurant.geoLat || null,
        geoLng: restaurant.geoLng || null,
        logo: restaurant.logo || '',
        primaryColor: restaurant.primaryColor || '#282e59',
        secondaryColor: restaurant.secondaryColor || '#f03e42',
        accentColor: restaurant.accentColor || '#ffffff',
      });

      if (restaurant.geoLat && restaurant.geoLng) {
        setAddressSelected(true);
      }
    } catch (error) {
      showToast('error', 'Failed to load settings');
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSelect = (address: AddressComponents) => {
    setData(prev => ({
      ...prev,
      street: `${address.houseNumber} ${address.street}`.trim(),
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      geoLat: address.coordinates.lat,
      geoLng: address.coordinates.lng,
    }));
    setAddressSelected(true);
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RestaurantData, string>> = {};

    if (!data.name.trim()) newErrors.name = t('name') + ' is required';
    if (!data.phone.trim()) newErrors.phone = t('phone') + ' is required';
    if (!data.email.trim()) newErrors.email = t('email') + ' is required';
    if (!data.street.trim()) newErrors.street = t('street') + ' is required';
    if (!data.city.trim()) newErrors.city = t('city') + ' is required';
    if (!data.state.trim()) newErrors.state = t('state') + ' is required';
    if (!data.zipCode.trim()) newErrors.zipCode = t('zipCode') + ' is required';

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
    <div className="w-full md:max-w-4xl md:mx-auto p-3 md:p-6 space-y-6 md:space-y-8">
      <LogoSection
        logoUrl={data.logo}
        uploading={uploading}
        onFileSelect={handlePhotoUpload}
        t={t}
      />

      <FormSection title={t('restaurantInfo')}>
        <div className="space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <FormField label={t('name')} required error={errors.name}>
              <Input
                value={data.name}
                onChange={(e) => {
                  setData({ ...data, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: undefined });
                }}
                placeholder={t('namePlaceholder')}
              />
            </FormField>

            <FormField label={t('phone')} required error={errors.phone}>
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

          <FormField label={t('email')} required error={errors.email}>
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

          <FormField label={t('description')} description={t('descriptionPlaceholder')}>
            <textarea
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              placeholder={t('descriptionPlaceholder')}
              rows={4}
              className="w-full px-4 py-2.5 rounded-lg bg-transparent border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors resize-none"
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection title={t('location')}>
        <div className="space-y-4 md:space-y-6">
          <FormField label={t('address')} required description={t('addressHint')}>
            <LocationAutocomplete
              onSelect={handleAddressSelect}
              placeholder={t('searchAddress')}
              required
            />
          </FormField>

          {addressSelected && data.geoLat && data.geoLng && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">{t('addressConfirmed')}</p>
                  <p className="text-sm text-green-700 mt-1">
                    {data.street}, {data.city}, {data.state} {data.zipCode}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {t('coordinates')}: {data.geoLat.toFixed(6)}, {data.geoLng.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </FormSection>

      <BrandColorsSection
        primaryColor={data.primaryColor}
        secondaryColor={data.secondaryColor}
        accentColor={data.accentColor}
        onPrimaryChange={(value) => setData({ ...data, primaryColor: value })}
        onSecondaryChange={(value) => setData({ ...data, secondaryColor: value })}
        onAccentChange={(value) => setData({ ...data, accentColor: value })}
        t={t}
      />

      <div className="flex justify-end pt-4 md:pt-6 border-t border-gray-200">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-red hover:bg-brand-red/90 text-white px-6 md:px-8 w-full md:w-auto"
        >
          {saving ? t('saving') : t('saveChanges')}
        </Button>
      </div>
    </div>
  );
}
