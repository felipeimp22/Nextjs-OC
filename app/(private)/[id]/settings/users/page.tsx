'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button, useToast, Toggle } from '@/components/ui';
import { FormSection, InfoCard } from '@/components/shared';
import { getRestaurantUsers, updateRolePermissions } from '@/lib/serverActions/settings.actions';
import { Shield } from 'lucide-react';

const PAGES = [
  { id: 'dashboard', label: 'Dashboard', description: 'View main dashboard and overview' },
  { id: 'menu', label: 'Menu Management', description: 'Create and edit menu items' },
  { id: 'orders', label: 'Orders', description: 'View and manage orders' },
  { id: 'kitchen', label: 'Kitchen Display', description: 'Access kitchen order display' },
  { id: 'customers', label: 'Customers', description: 'View and manage customer data' },
  { id: 'marketing', label: 'Marketing', description: 'Manage promotions and campaigns' },
  { id: 'analytics', label: 'Analytics', description: 'View reports and insights' },
  { id: 'settings', label: 'Settings', description: 'Modify restaurant settings' },
];

const ROLES = [
  { id: 'manager', label: 'Manager', color: 'blue' },
  { id: 'kitchen', label: 'Kitchen', color: 'green' },
  { id: 'staff', label: 'Staff', color: 'purple' },
];

interface RolePermissions {
  role: string;
  permissions: Record<string, boolean>;
}

export default function UsersSettingsPage() {
  const params = useParams();
  const { showToast } = useToast();
  const restaurantId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>([]);

  useEffect(() => {
    fetchData();
  }, [restaurantId]);

  const fetchData = async () => {
    try {
      const result = await getRestaurantUsers(restaurantId);

      if (result.success && result.data) {
        const perms = result.data.rolePermissions || [];

        // Initialize with defaults if empty
        if (perms.length === 0) {
          setRolePermissions(
            ROLES.map((role) => ({
              role: role.id,
              permissions: {
                dashboard: true,
                menu: role.id === 'manager',
                orders: true,
                kitchen: role.id !== 'staff',
                customers: role.id !== 'kitchen',
                marketing: role.id === 'manager',
                analytics: role.id === 'manager',
                settings: role.id === 'manager',
              },
            }))
          );
        } else {
          setRolePermissions(perms);
        }
      }
    } catch (error) {
      showToast('error', 'Failed to load settings');
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (role: string, page: string) => {
    setRolePermissions((prev) =>
      prev.map((rp) =>
        rp.role === role
          ? {
              ...rp,
              permissions: {
                ...rp.permissions,
                [page]: !rp.permissions[page],
              },
            }
          : rp
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateRolePermissions(restaurantId, rolePermissions);

      if (!result.success) {
        showToast('error', result.error || 'Failed to save permissions');
        return;
      }

      showToast('success', 'Permissions saved successfully!');
      await fetchData();
    } catch (error) {
      showToast('error', 'Failed to save permissions');
      console.error('Error saving permissions:', error);
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
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <FormSection
        title="Role-Based Permissions"
        description="Control which pages each role can access in your restaurant"
      >
        <InfoCard type="info" title="About Permissions" className="mb-6">
          <p className="mb-2">Configure access permissions for different user roles:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>Manager:</strong> Can access most features except owner-specific settings</li>
            <li><strong>Kitchen:</strong> Focused on order management and kitchen display</li>
            <li><strong>Staff:</strong> Limited access for front-of-house operations</li>
            <li><strong>Owner:</strong> Has full access to everything (cannot be modified)</li>
          </ul>
        </InfoCard>

        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden border border-gray-200 rounded-lg shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/3"
                    >
                      Feature / Page
                    </th>
                    {ROLES.map((role) => (
                      <th
                        key={role.id}
                        scope="col"
                        className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Shield className="w-4 h-4" />
                          {role.label}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {PAGES.map((page, pageIndex) => (
                    <tr
                      key={page.id}
                      className={pageIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-semibold text-gray-900">
                            {page.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {page.description}
                          </div>
                        </div>
                      </td>
                      {ROLES.map((role) => {
                        const roleData = rolePermissions.find(
                          (rp) => rp.role === role.id
                        );
                        const hasAccess = roleData?.permissions?.[page.id] || false;

                        return (
                          <td key={role.id} className="px-6 py-4 whitespace-nowrap">
                            <div className="flex justify-center">
                              <Toggle
                                id={`${role.id}-${page.id}`}
                                checked={hasAccess}
                                onChange={() => handleToggle(role.id, page.id)}
                                size="sm"
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {ROLES.map((role) => {
            const roleData = rolePermissions.find((rp) => rp.role === role.id);
            const enabledCount = roleData
              ? Object.values(roleData.permissions).filter((v) => v).length
              : 0;
            const totalCount = PAGES.length;

            return (
              <div
                key={role.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-gray-600" />
                  <h4 className="font-semibold text-gray-900">{role.label}</h4>
                </div>
                <p className="text-sm text-gray-600">
                  {enabledCount} of {totalCount} features enabled
                </p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-brand-red h-2 rounded-full transition-all"
                    style={{
                      width: `${(enabledCount / totalCount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </FormSection>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-red hover:bg-brand-red/90 text-white px-8"
        >
          {saving ? 'Saving...' : 'Save Permissions'}
        </Button>
      </div>
    </div>
  );
}
