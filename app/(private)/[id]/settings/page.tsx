'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, Input } from '@/components/ui';

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
  const restaurantId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    fetchSettings();
  }, [restaurantId]);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`);
      if (response.ok) {
        const restaurant = await response.json();
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
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert('Settings saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Restaurant Information */}
      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
          {t('restaurantInfo')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('name')}
            </label>
            <Input
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              placeholder={t('namePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('phone')}
            </label>
            <Input
              value={data.phone}
              onChange={(e) => setData({ ...data, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('description')}
            </label>
            <textarea
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              placeholder={t('descriptionPlaceholder')}
              rows={3}
              className="w-full bg-white border border-gray-300 rounded-md px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('email')}
            </label>
            <Input
              type="email"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              placeholder="info@restaurant.com"
            />
          </div>
        </div>
      </section>

      {/* Location */}
      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
          {t('location')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('street')}
            </label>
            <Input
              value={data.street}
              onChange={(e) => setData({ ...data, street: e.target.value })}
              placeholder="123 Main Street"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('city')}
            </label>
            <Input
              value={data.city}
              onChange={(e) => setData({ ...data, city: e.target.value })}
              placeholder="New York"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('state')}
            </label>
            <Input
              value={data.state}
              onChange={(e) => setData({ ...data, state: e.target.value })}
              placeholder="NY"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('zipCode')}
            </label>
            <Input
              value={data.zipCode}
              onChange={(e) => setData({ ...data, zipCode: e.target.value })}
              placeholder="10001"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('country')}
            </label>
            <Input
              value={data.country}
              onChange={(e) => setData({ ...data, country: e.target.value })}
              placeholder="US"
            />
          </div>
        </div>
      </section>

      {/* Branding */}
      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
          {t('branding')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('primaryColor')}
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={data.primaryColor}
                onChange={(e) => setData({ ...data, primaryColor: e.target.value })}
                className="h-10 w-20 rounded-md border border-gray-300 cursor-pointer"
              />
              <Input
                value={data.primaryColor}
                onChange={(e) => setData({ ...data, primaryColor: e.target.value })}
                placeholder="#282e59"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('secondaryColor')}
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={data.secondaryColor}
                onChange={(e) => setData({ ...data, secondaryColor: e.target.value })}
                className="h-10 w-20 rounded-md border border-gray-300 cursor-pointer"
              />
              <Input
                value={data.secondaryColor}
                onChange={(e) => setData({ ...data, secondaryColor: e.target.value })}
                placeholder="#f03e42"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('accentColor')}
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={data.accentColor}
                onChange={(e) => setData({ ...data, accentColor: e.target.value })}
                className="h-10 w-20 rounded-md border border-gray-300 cursor-pointer"
              />
              <Input
                value={data.accentColor}
                onChange={(e) => setData({ ...data, accentColor: e.target.value })}
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-red hover:bg-brand-red/90 text-white px-6"
        >
          {saving ? t('saving') : t('saveChanges')}
        </Button>
      </div>
    </div>
  );
}
