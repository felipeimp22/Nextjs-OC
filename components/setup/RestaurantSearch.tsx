'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchRestaurants, useRequestRestaurantAccess } from '@/hooks/useRestaurants';
import { Button, useToast } from '@/components/ui';
import Modal from '@/components/ui/Modal';

export default function RestaurantSearch() {
  const t = useTranslations('gettingStarted');
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const [selectedRestaurant, setSelectedRestaurantState] = useState<{ id: string; name: string } | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');

  const { data: restaurants = [], isLoading } = useSearchRestaurants(query);
  const requestAccessMutation = useRequestRestaurantAccess();

  const handleRequestClick = (restaurantId: string, restaurantName: string) => {
    setSelectedRestaurantState({ id: restaurantId, name: restaurantName });
    setShowMessageModal(true);
  };

  const handleRequestAccess = async () => {
    if (!selectedRestaurant) return;

    try {
      await requestAccessMutation.mutateAsync({
        restaurantId: selectedRestaurant.id,
        message: requestMessage.trim() || undefined,
      });
      setRequestedIds(prev => new Set(prev).add(selectedRestaurant.id));
      setShowMessageModal(false);
      setRequestMessage('');
      setSelectedRestaurantState(null);
      showToast('success', 'Access request sent successfully. Waiting for approval.');
    } catch (error) {
      console.error('Error requesting access:', error);
      showToast('error', 'Failed to send access request');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent"
        />
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('searching')}</p>
        </div>
      )}

      {!isLoading && query.length > 2 && restaurants.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">{t('noResults')}</p>
        </div>
      )}

      {!isLoading && restaurants.length > 0 && (
        <div className="space-y-4">
          {restaurants.map((restaurant) => {
            const hasRequested = requestedIds.has(restaurant.id);

            return (
              <div
                key={restaurant.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {restaurant.logo && (
                      <img
                        src={restaurant.logo}
                        alt={restaurant.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{restaurant.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {restaurant.street}, {restaurant.city}, {restaurant.state}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleRequestClick(restaurant.id, restaurant.name)}
                    disabled={hasRequested || requestAccessMutation.isPending}
                    className={
                      hasRequested
                        ? 'bg-green-600 hover:bg-green-600 cursor-not-allowed'
                        : 'bg-brand-navy hover:bg-brand-navy/90'
                    }
                  >
                    {hasRequested ? t('requestSent') : t('requestAccess')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={showMessageModal}
        onClose={() => {
          setShowMessageModal(false);
          setRequestMessage('');
          setSelectedRestaurantState(null);
        }}
        title="Request Access to Restaurant"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-700 mb-4">
              You are requesting access to <strong>{selectedRestaurant?.name}</strong>
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message (Optional)
            </label>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Tell the restaurant owner why you'd like to join their team..."
              className="w-full px-4 py-3 border border-gray-300 rounded-sm focus:ring-2 focus:ring-brand-navy focus:border-transparent resize-none"
              rows={4}
              maxLength={500}
            />
            <div className="text-xs text-gray-500 mt-1">
              {requestMessage.length}/500 characters
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-sm p-4">
            <p className="text-sm text-blue-800">
              Your request will be sent to the restaurant owner/manager for approval. You'll receive an email when your request is reviewed.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowMessageModal(false);
                setRequestMessage('');
                setSelectedRestaurantState(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestAccess}
              disabled={requestAccessMutation.isPending}
              className="flex-1 bg-brand-red hover:bg-brand-red/90 text-white"
            >
              {requestAccessMutation.isPending ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
