'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { UserCheck, Check, X } from 'lucide-react';
import { Button, useToast } from '@/components/ui';
import {
  getRestaurantAccessRequests,
  approveAccessRequest,
  rejectAccessRequest,
} from '@/lib/serverActions/access.actions';

interface AccessRequest {
  id: string;
  requestedRole: string;
  message?: string;
  status: string;
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
}

interface AccessRequestsSectionProps {
  restaurantId: string;
}

export function AccessRequestsSection({ restaurantId }: AccessRequestsSectionProps) {
  const t = useTranslations('settings.users');
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [restaurantId]);

  const fetchRequests = async () => {
    try {
      const result = await getRestaurantAccessRequests(restaurantId);
      if (result.success && result.data) {
        setRequests(result.data);
      }
    } catch (error) {
      console.error('Error fetching access requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    setProcessing(requestId);
    try {
      const result = await approveAccessRequest(requestId);
      if (result.success) {
        showToast('success', 'Access request approved');
        await fetchRequests();
      } else {
        showToast('error', result.error || 'Failed to approve request');
      }
    } catch (error) {
      showToast('error', 'Failed to approve request');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessing(requestId);
    try {
      const result = await rejectAccessRequest(requestId);
      if (result.success) {
        showToast('success', 'Access request rejected');
        await fetchRequests();
      } else {
        showToast('error', result.error || 'Failed to reject request');
      }
    } catch (error) {
      showToast('error', 'Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  const pendingRequests = requests.filter((req) => req.status === 'pending');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <UserCheck className="w-6 h-6 text-brand-navy" />
        <h3 className="text-lg font-semibold text-gray-900">Access Requests</h3>
      </div>

      {pendingRequests.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-navy text-white flex items-center justify-center font-semibold">
                          {request.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{request.user.name}</div>
                          <div className="text-sm text-gray-500">{request.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-blue-600 bg-blue-50">
                        {request.requestedRole}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {request.message || 'No message provided'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleApprove(request.id)}
                          disabled={processing === request.id}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleReject(request.id)}
                          disabled={processing === request.id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-sm p-8 text-center">
          <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No pending access requests</p>
          <p className="text-sm text-gray-500 mt-1">Users can request access from the restaurant setup page</p>
        </div>
      )}
    </div>
  );
}
