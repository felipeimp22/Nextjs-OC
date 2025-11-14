'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { getInvitationDetails, acceptInvitation } from '@/lib/serverActions/invitation.actions';
import { Check, X, Loader2, Mail } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useAuth';

export default function InvitationAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { data: user, isLoading: userLoading } = useCurrentUser();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [invitationData, setInvitationData] = useState<{
    restaurantName: string;
    role: string;
    invitedEmail: string;
  } | null>(null);

  useEffect(() => {
    loadInvitationDetails();
  }, [token]);

  useEffect(() => {
    if (!userLoading && user && invitationData) {
      handleAcceptInvitation();
    }
  }, [userLoading, user, invitationData]);

  const loadInvitationDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getInvitationDetails(token);

      if (result.success && result.data) {
        setInvitationData(result.data);
      } else {
        setError(result.error || 'Failed to load invitation');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await acceptInvitation(token);

      if (result.success && result.data) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/setup');
        }, 2000);
      } else {
        setError(result.error || 'Failed to accept invitation');
        setLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const handleGoToAuth = () => {
    localStorage.setItem('pendingInvitation', token);
    router.push('/auth');
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-brand-lightGray flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <Loader2 className="w-16 h-16 text-brand-navy animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Invitation</h2>
              <p className="text-gray-600">Please wait...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-lightGray flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Error</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button
                onClick={() => router.push('/')}
                className="bg-brand-navy hover:bg-brand-navy/90 text-white"
              >
                Go to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-brand-lightGray flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invitation Accepted!</h2>
              <p className="text-gray-600 mb-6">
                You have successfully joined <strong>{invitationData?.restaurantName}</strong>
              </p>
              <p className="text-sm text-gray-500">
                Redirecting you to your dashboard...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user && invitationData) {
    return (
      <div className="min-h-screen bg-brand-lightGray flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-brand-navy/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-10 h-10 text-brand-navy" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">You're Invited!</h2>
              <p className="text-gray-600">
                <strong>{invitationData.restaurantName}</strong> has invited you to join their team as a <strong>{invitationData.role}</strong>.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 mb-2">
                <strong>Important:</strong> You need to sign in or create an account to accept this invitation.
              </p>
              <p className="text-sm text-blue-700">
                Please use the email address: <strong>{invitationData.invitedEmail}</strong>
              </p>
            </div>

            <Button
              onClick={handleGoToAuth}
              className="w-full bg-brand-navy hover:bg-brand-navy/90 text-white"
            >
              Sign In / Sign Up
            </Button>

            <p className="text-xs text-gray-500 text-center mt-4">
              After signing in, you'll automatically join the team.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
