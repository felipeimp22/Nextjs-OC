'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, X, UserPlus } from 'lucide-react';
import { Button, useToast } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import {
  sendRestaurantInvitation,
  getRestaurantInvitations,
  cancelInvitation,
} from '@/lib/serverActions/invitation.actions';

interface Invitation {
  id: string;
  invitedEmail: string;
  role: string;
  status: string;
  tokenExpiresAt: Date;
  createdAt: Date;
}

interface InvitationsSectionProps {
  restaurantId: string;
}

export function InvitationsSection({ restaurantId }: InvitationsSectionProps) {
  const t = useTranslations('settings.users');
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [sending, setSending] = useState(false);

  const ROLES = [
    { value: 'staff', label: 'Staff' },
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'manager', label: 'Manager' },
  ];

  useEffect(() => {
    fetchInvitations();
  }, [restaurantId]);

  const fetchInvitations = async () => {
    try {
      const result = await getRestaurantInvitations(restaurantId);
      if (result.success && result.data) {
        setInvitations(result.data);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async () => {
    if (!email.trim()) {
      showToast('error', 'Email is required');
      return;
    }

    setSending(true);
    try {
      const result = await sendRestaurantInvitation({
        restaurantId,
        email: email.trim(),
        role: role as 'staff' | 'manager' | 'kitchen',
      });

      if (result.success) {
        showToast('success', 'Invitation sent successfully');
        setShowInviteModal(false);
        setEmail('');
        setRole('staff');
        await fetchInvitations();
      } else {
        showToast('error', result.error || 'Failed to send invitation');
      }
    } catch (error) {
      showToast('error', 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const result = await cancelInvitation(invitationId);
      if (result.success) {
        showToast('success', 'Invitation cancelled');
        await fetchInvitations();
      } else {
        showToast('error', result.error || 'Failed to cancel invitation');
      }
    } catch (error) {
      showToast('error', 'Failed to cancel invitation');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'accepted':
        return 'text-green-600 bg-green-50';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const isExpired = (expiresAt: Date) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  const pendingInvitations = invitations.filter((inv) => inv.status === 'pending' && !isExpired(inv.tokenExpiresAt));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="w-6 h-6 text-brand-navy" />
          <h3 className="text-lg font-semibold text-gray-900">Invitations</h3>
        </div>
        <Button
          onClick={() => setShowInviteModal(true)}
          className="bg-brand-red hover:bg-brand-red/90 text-white"
          size="sm"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Invite User
        </Button>
      </div>

      {pendingInvitations.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pendingInvitations.map((invitation) => (
                  <tr key={invitation.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">{invitation.invitedEmail}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-blue-600 bg-blue-50">
                        {invitation.role}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                        {invitation.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-500">
                        {new Date(invitation.tokenExpiresAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancelInvitation(invitation.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-sm p-8 text-center">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No pending invitations</p>
          <p className="text-sm text-gray-500 mt-1">Invite team members to collaborate</p>
        </div>
      )}

      <Modal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setEmail('');
          setRole('staff');
        }}
        title="Invite Team Member"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-sm p-4">
            <p className="text-sm text-blue-800">
              An invitation email will be sent to this address with a link to accept and join your restaurant team.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowInviteModal(false);
                setEmail('');
                setRole('staff');
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInvitation}
              disabled={sending || !email.trim()}
              className="flex-1 bg-brand-red hover:bg-brand-red/90 text-white"
            >
              {sending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
