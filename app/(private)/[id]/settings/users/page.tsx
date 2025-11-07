'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button, Input, Toggle } from '@/components/ui';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface RolePermissions {
  role: string;
  permissions: {
    viewOrders: boolean;
    createOrders: boolean;
    editOrders: boolean;
    cancelOrders: boolean;
    viewMenu: boolean;
    editMenu: boolean;
    viewCustomers: boolean;
    editCustomers: boolean;
    viewAnalytics: boolean;
    editSettings: boolean;
  };
}

export default function UsersSettingsPage() {
  const params = useParams();
  const t = useTranslations('settings.users');
  const restaurantId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [restaurantId]);

  const fetchData = async () => {
    try {
      // Fetch users
      const usersResponse = await fetch(`/api/settings/users?restaurantId=${restaurantId}`);
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData.users || []);
        setRolePermissions(usersData.rolePermissions || getDefaultRolePermissions());
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setRolePermissions(getDefaultRolePermissions());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultRolePermissions = (): RolePermissions[] => [
    {
      role: 'owner',
      permissions: {
        viewOrders: true,
        createOrders: true,
        editOrders: true,
        cancelOrders: true,
        viewMenu: true,
        editMenu: true,
        viewCustomers: true,
        editCustomers: true,
        viewAnalytics: true,
        editSettings: true,
      },
    },
    {
      role: 'manager',
      permissions: {
        viewOrders: true,
        createOrders: true,
        editOrders: true,
        cancelOrders: true,
        viewMenu: true,
        editMenu: true,
        viewCustomers: true,
        editCustomers: true,
        viewAnalytics: true,
        editSettings: false,
      },
    },
    {
      role: 'kitchen',
      permissions: {
        viewOrders: true,
        createOrders: false,
        editOrders: true,
        cancelOrders: false,
        viewMenu: true,
        editMenu: false,
        viewCustomers: false,
        editCustomers: false,
        viewAnalytics: false,
        editSettings: false,
      },
    },
    {
      role: 'staff',
      permissions: {
        viewOrders: true,
        createOrders: true,
        editOrders: false,
        cancelOrders: false,
        viewMenu: true,
        editMenu: false,
        viewCustomers: true,
        editCustomers: false,
        viewAnalytics: false,
        editSettings: false,
      },
    },
  ];

  const handleInviteUser = async () => {
    if (!inviteEmail) return;

    try {
      const response = await fetch(`/api/settings/users/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      if (response.ok) {
        alert('User invited successfully!');
        setShowInviteForm(false);
        setInviteEmail('');
        setInviteRole('staff');
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to invite user:', error);
      alert('Failed to invite user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return;

    try {
      const response = await fetch(`/api/settings/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId }),
      });

      if (response.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    }
  };

  const handleSavePermissions = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/settings/users/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          rolePermissions,
        }),
      });

      if (response.ok) {
        alert('Permissions saved successfully!');
        setSelectedRole(null);
      }
    } catch (error) {
      console.error('Failed to save permissions:', error);
      alert('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePermission = (role: string, permission: string) => {
    setRolePermissions((prev) =>
      prev.map((rp) =>
        rp.role === role
          ? {
              ...rp,
              permissions: {
                ...rp.permissions,
                [permission]: !rp.permissions[permission as keyof typeof rp.permissions],
              },
            }
          : rp
      )
    );
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-traces-gold-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Team Members */}
      <section>
        <div className="flex items-center justify-between mb-4 border-b border-traces-gold-900/30 pb-2">
          <h2 className="text-xl font-light tracking-wider text-traces-gold-100">
            {t('teamMembers')}
          </h2>
          <Button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="bg-traces-gold-600 hover:bg-traces-gold-700 text-black text-sm px-4 py-2"
          >
            + {t('addUser')}
          </Button>
        </div>

        {/* Invite Form */}
        {showInviteForm && (
          <div className="bg-black/40 border border-traces-gold-600 rounded-sm p-4 mb-4 space-y-4">
            <div>
              <label className="block text-sm font-light text-traces-dark-300 mb-2">
                {t('inviteEmail')}
              </label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-light text-traces-dark-300 mb-2">
                {t('inviteRole')}
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full bg-black/20 border border-traces-gold-900/30 rounded-sm px-4 py-2.5 text-traces-gold-100 focus:outline-none focus:border-traces-gold-600"
              >
                <option value="manager">{t('manager')}</option>
                <option value="kitchen">{t('kitchen')}</option>
                <option value="staff">{t('staff')}</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                onClick={() => setShowInviteForm(false)}
                className="bg-traces-dark-700 hover:bg-traces-dark-600 text-traces-gold-100"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleInviteUser}
                className="bg-traces-gold-600 hover:bg-traces-gold-700 text-black"
              >
                {t('sendInvite')}
              </Button>
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-traces-gold-900/30">
                <th className="text-left py-3 px-4 text-sm font-light text-traces-dark-300">
                  {t('name')}
                </th>
                <th className="text-left py-3 px-4 text-sm font-light text-traces-dark-300">
                  {t('email')}
                </th>
                <th className="text-left py-3 px-4 text-sm font-light text-traces-dark-300">
                  {t('role')}
                </th>
                <th className="text-left py-3 px-4 text-sm font-light text-traces-dark-300">
                  {t('status')}
                </th>
                <th className="text-right py-3 px-4 text-sm font-light text-traces-dark-300">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-traces-gold-900/10 hover:bg-black/20"
                >
                  <td className="py-3 px-4 text-traces-gold-100">{user.name}</td>
                  <td className="py-3 px-4 text-traces-dark-300">{user.email}</td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-1 bg-traces-gold-900/20 text-traces-gold-100 text-xs rounded-sm capitalize">
                      {t(user.role)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded-sm ${
                        user.status === 'active'
                          ? 'bg-green-900/20 text-green-400'
                          : user.status === 'pending'
                          ? 'bg-yellow-900/20 text-yellow-400'
                          : 'bg-red-900/20 text-red-400'
                      }`}
                    >
                      {t(user.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {user.role !== 'owner' && (
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-traces-burgundy-600 hover:text-traces-burgundy-500 text-sm"
                      >
                        {t('delete')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-traces-dark-300">
                    No team members yet. Invite users to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Role Permissions */}
      <section>
        <h2 className="text-xl font-light tracking-wider text-traces-gold-100 mb-4 border-b border-traces-gold-900/30 pb-2">
          {t('permissions')}
        </h2>

        <div className="space-y-3">
          {rolePermissions.map((rp) => (
            <div key={rp.role}>
              <button
                onClick={() => setSelectedRole(selectedRole === rp.role ? null : rp.role)}
                className="w-full bg-black/20 border border-traces-gold-900/30 rounded-sm p-4 flex items-center justify-between hover:bg-black/30 transition-colors"
              >
                <span className="text-traces-gold-100 font-light capitalize">
                  {t(rp.role)}
                </span>
                <svg
                  className={`w-5 h-5 text-traces-gold-600 transition-transform ${
                    selectedRole === rp.role ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {selectedRole === rp.role && (
                <div className="bg-black/40 border border-traces-gold-900/30 border-t-0 rounded-b-sm p-4 space-y-3">
                  {Object.entries(rp.permissions).map(([permission, enabled]) => (
                    <div
                      key={permission}
                      className="flex items-center justify-between py-2 px-3 bg-black/20 rounded-sm"
                    >
                      <span className="text-traces-gold-100 text-sm">
                        {t(permission)}
                      </span>
                      <Toggle
                        checked={enabled}
                        onChange={() => handleTogglePermission(rp.role, permission)}
                        disabled={rp.role === 'owner'}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-traces-gold-900/30">
        <Button
          onClick={handleSavePermissions}
          disabled={saving}
          className="bg-traces-burgundy-600 hover:bg-traces-burgundy-700 text-white px-6"
        >
          {saving ? t('saving') : t('saveChanges')}
        </Button>
      </div>
    </div>
  );
}
