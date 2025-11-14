'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { acceptInvitation } from '@/lib/serverActions/invitation.actions';
import { Check, X, Loader2 } from 'lucide-react';

export default function InvitationAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [restaurantName, setRestaurantName] = useState('');

  useEffect(() => {
    handleAcceptInvitation();
  }, [token]);

  const handleAcceptInvitation = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await acceptInvitation(token);

      if (result.success && result.data) {
        setSuccess(true);
        setRestaurantName(result.data.name);
        setTimeout(() => {
          router.push('/setup');
        }, 2000);
      } else {
        setError(result.error || 'Failed to accept invitation');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-lightGray flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {loading && (
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-brand-navy animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Processing Invitation</h2>
              <p className="text-gray-600">Please wait while we accept your invitation...</p>
            </div>
          )}

          {!loading && success && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Accepted!</h2>
              <p className="text-gray-600 mb-6">
                You have successfully joined <strong>{restaurantName}</strong>
              </p>
              <p className="text-sm text-gray-500">
                Redirecting you to your dashboard...
              </p>
            </div>
          )}

          {!loading && error && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button
                onClick={() => router.push('/setup')}
                className="bg-brand-navy hover:bg-brand-navy/90 text-white"
              >
                Go to Setup
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
