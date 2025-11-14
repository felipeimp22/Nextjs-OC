'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Users, Mail, Shield, Trash2 } from 'lucide-react';
import { Button, useToast } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import { getRestaurantTeam, updateUserRole, removeTeamMember } from '@/lib/serverActions/team.actions';

interface TeamMember {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string;
    status: string;
    createdAt: Date;
  };
}

interface TeamManagementSectionProps {
  restaurantId: string;
}

export function TeamManagementSection({ restaurantId }: TeamManagementSectionProps) {
  const t = useTranslations('settings.users');
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [processing, setProcessing] = useState(false);

  const ROLES = [
    { value: 'owner', label: 'Owner', color: 'text-purple-600 bg-purple-50' },
    { value: 'manager', label: 'Manager', color: 'text-blue-600 bg-blue-50' },
    { value: 'kitchen', label: 'Kitchen', color: 'text-green-600 bg-green-50' },
    { value: 'staff', label: 'Staff', color: 'text-gray-600 bg-gray-50' },
  ];

  useEffect(() => {
    fetchTeam();
  }, [restaurantId]);

  const fetchTeam = async () => {
    try {
      const result = await getRestaurantTeam(restaurantId);
      if (result.success && result.data) {
        setTeam(result.data);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRole = async () => {
    if (!selectedMember || !newRole) return;

    setProcessing(true);
    try {
      const result = await updateUserRole({
        restaurantId,
        userId: selectedMember.user.id,
        newRole,
      });

      if (result.success) {
        showToast('success', 'Role updated successfully');
        setShowRoleModal(false);
        setSelectedMember(null);
        await fetchTeam();
      } else {
        showToast('error', result.error || 'Failed to update role');
      }
    } catch (error) {
      showToast('error', 'Failed to update role');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember) return;

    setProcessing(true);
    try {
      const result = await removeTeamMember({
        restaurantId,
        userId: selectedMember.user.id,
      });

      if (result.success) {
        showToast('success', 'Team member removed');
        setShowRemoveModal(false);
        setSelectedMember(null);
        await fetchTeam();
      } else {
        showToast('error', result.error || 'Failed to remove member');
      }
    } catch (error) {
      showToast('error', 'Failed to remove member');
    } finally {
      setProcessing(false);
    }
  };

  const getRoleColor = (role: string) => {
    return ROLES.find((r) => r.value === role)?.color || 'text-gray-600 bg-gray-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <Users className="w-6 h-6 text-brand-navy" />
        <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
      </div>

      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {team.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-navy text-white flex items-center justify-center font-semibold">
                        {member.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{member.user.name}</div>
                        <div className="text-sm text-gray-500">{member.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.user.status === 'active' ? 'text-green-600 bg-green-50' : 'text-gray-600 bg-gray-50'
                    }`}>
                      {member.user.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedMember(member);
                          setNewRole(member.role);
                          setShowRoleModal(true);
                        }}
                      >
                        <Shield className="w-4 h-4 mr-1" />
                        Change Role
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedMember(member);
                          setShowRemoveModal(true);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showRoleModal}
        onClose={() => {
          setShowRoleModal(false);
          setSelectedMember(null);
        }}
        title="Change User Role"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select a new role for <strong>{selectedMember?.user.name}</strong>
          </p>
          <div className="space-y-2">
            {ROLES.map((role) => (
              <label key={role.value} className="flex items-center gap-3 p-3 border border-gray-200 rounded-sm cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={newRole === role.value}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="text-brand-red focus:ring-brand-red"
                />
                <div>
                  <div className="font-medium text-gray-900">{role.label}</div>
                </div>
              </label>
            ))}
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowRoleModal(false);
                setSelectedMember(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangeRole}
              disabled={processing || newRole === selectedMember?.role}
              className="flex-1 bg-brand-red hover:bg-brand-red/90 text-white"
            >
              {processing ? 'Updating...' : 'Update Role'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showRemoveModal}
        onClose={() => {
          setShowRemoveModal(false);
          setSelectedMember(null);
        }}
        title="Remove Team Member"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to remove <strong>{selectedMember?.user.name}</strong> from the team?
          </p>
          <p className="text-sm text-red-600">
            This action cannot be undone. The user will lose access to the restaurant.
          </p>
          <div className="flex gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowRemoveModal(false);
                setSelectedMember(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRemoveMember}
              disabled={processing}
              className="flex-1"
            >
              {processing ? 'Removing...' : 'Remove Member'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
