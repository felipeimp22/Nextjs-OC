'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCreateRestaurant } from '@/hooks/useRestaurants';
import { useRestaurantStore } from '@/stores/useRestaurantStore';
import { Button } from '@/components/ui';
import { LocationAutocomplete } from '@/components/shared';
import type { AddressComponents } from '@/lib/utils/mapbox';
import { getFirstAccessiblePage } from '@/lib/serverActions/permissions.actions';
import { toast } from 'sonner';

interface FormData {
  name: string;
  description: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  geoLat: number | null;
  geoLng: number | null;
  phone: string;
  email: string;
  logo: string;
  logoFile?: {
    data: string;
    mimeType: string;
    fileName: string;
  };
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export default function RestaurantForm() {
  const t = useTranslations('restaurantForm');
  const router = useRouter();
  const createRestaurantMutation = useCreateRestaurant();
  const { setSelectedRestaurant } = useRestaurantStore();

  const [step, setStep] = useState(1);
  const [logoPreview, setLogoPreview] = useState('');
  const [addressSelected, setAddressSelected] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    geoLat: null,
    geoLng: null,
    phone: '',
    email: '',
    logo: '',
    primaryColor: '#282e59',
    secondaryColor: '#f03e42',
    accentColor: '#ffffff',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        setFormData(prev => ({
          ...prev,
          logoFile: {
            data: result,
            mimeType: file.type,
            fileName: file.name,
          },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorChange = (colorType: 'primaryColor' | 'secondaryColor' | 'accentColor', value: string) => {
    setFormData(prev => ({ ...prev, [colorType]: value }));
  };

  const handleAddressSelect = (address: AddressComponents) => {
    setFormData(prev => ({
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
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('[DEBUG] Submitting form with data:', {
      ...formData,
      logoFile: formData.logoFile ? {
        mimeType: formData.logoFile.mimeType,
        fileName: formData.logoFile.fileName,
        dataLength: formData.logoFile.data.length,
      } : null,
    });

    try {
      const restaurant = await createRestaurantMutation.mutateAsync(formData);
      if (restaurant) {
        setSelectedRestaurant(restaurant.id, restaurant.name);

        // Get the first accessible page for this user
        const result = await getFirstAccessiblePage(restaurant.id);

        if (result.success && result.data) {
          router.push(result.data);
        } else {
          toast.error('No permissions assigned. Please contact the restaurant owner.');
          router.push('/setup');
        }
      }
    } catch (error) {
      console.error('Error creating restaurant:', error);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between mb-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`text-center flex-1 ${s < 3 ? 'mr-4' : ''}`}>
              <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center ${
                step >= s ? 'bg-brand-navy text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {s}
              </div>
              <div className={`mt-2 text-sm font-medium ${step >= s ? 'text-brand-navy' : 'text-gray-400'}`}>
                {s === 1 && t('stepInfo')}
                {s === 2 && t('stepLocation')}
                {s === 3 && t('stepBranding')}
              </div>
            </div>
          ))}
        </div>

        <div className="h-2 bg-gray-200 rounded-full">
          <div
            className="h-full bg-brand-navy rounded-full transition-all"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('stepInfo')}</h3>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('restaurantName')} {t('required')}
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder={t('restaurantNamePlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                {t('description')}
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                placeholder={t('descriptionPlaceholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('phone')} {t('required')}
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={t('phonePlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('email')} {t('required')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('emailPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={nextStep} className="bg-brand-navy hover:bg-brand-navy/90">
                {t('next')}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('stepLocation')}</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('address')} {t('required')}
              </label>
              <LocationAutocomplete
                onSelect={handleAddressSelect}
                placeholder={t('searchAddress')}
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                {t('addressHint')}
              </p>
            </div>

            {addressSelected && formData.geoLat && formData.geoLng && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">{t('addressConfirmed')}</p>
                    <p className="text-sm text-blue-700 mt-1">
                      {formData.street}, {formData.city}, {formData.state} {formData.zipCode}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {t('coordinates')}: {formData.geoLat.toFixed(6)}, {formData.geoLng.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button type="button" onClick={prevStep} className="bg-gray-200 text-gray-700 hover:bg-gray-300">
                {t('previous')}
              </Button>
              <Button
                type="button"
                onClick={nextStep}
                className="bg-brand-navy hover:bg-brand-navy/90"
                disabled={!addressSelected}
              >
                {t('next')}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('stepBranding')}</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('logo')}</label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 flex items-center justify-center bg-gray-100 border-2 border-gray-200 rounded-lg overflow-hidden">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-gray-400 text-xs text-center">{t('noLogo')}</span>
                  )}
                </div>
                <label className="cursor-pointer px-4 py-2 bg-brand-navy text-white rounded-lg hover:bg-brand-navy/90 transition-colors">
                  {t('uploadLogo')}
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">{t('brandColors')}</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['primaryColor', 'secondaryColor', 'accentColor'] as const).map((colorType) => (
                  <div key={colorType}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-700">
                        {colorType === 'primaryColor' && t('primary')}
                        {colorType === 'secondaryColor' && t('secondary')}
                        {colorType === 'accentColor' && t('accent')}
                      </span>
                      <input
                        type="color"
                        value={formData[colorType]}
                        onChange={(e) => handleColorChange(colorType, e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer"
                      />
                      <span className="text-xs text-gray-500">{formData[colorType]}</span>
                    </div>
                    <div className="h-12 rounded-lg" style={{ backgroundColor: formData[colorType] }} />
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-gray-500">{t('brandingOptional')}</p>

            <div className="flex justify-between">
              <Button type="button" onClick={prevStep} className="bg-gray-200 text-gray-700 hover:bg-gray-300">
                {t('previous')}
              </Button>
              <Button
                type="submit"
                disabled={createRestaurantMutation.isPending}
                className="bg-brand-red hover:bg-brand-red/90"
              >
                {createRestaurantMutation.isPending ? t('creating') : t('createRestaurant')}
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
