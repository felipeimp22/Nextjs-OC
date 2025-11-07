'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button, useToast, Toggle } from '@/components/ui';
import { getRestaurantUsers, updateRolePermissions } from '@/lib/serverActions/settings.actions';

const PAGES = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'menu', label: 'Menu Management' },
  { id: 'orders', label: 'Orders' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'customers', label: 'Customers' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Settings' },
];

const ROLES = ['manager', 'kitchen', 'staff'];

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
          setRolePermissions(ROLES.map(role => ({
            role,
            permissions: {
              dashboard: true,
              menu: role === 'manager',
              orders: true,
              kitchen: role !== 'staff',
              customers: role !== 'kitchen',
              marketing: role === 'manager',
              analytics: role === 'manager',
              settings: role === 'manager',
            },
          })));
        } else {
          setRolePermissions(perms);
        }
      }
    } catch (error) {
      showToast('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (role: string, page: string) => {
    setRolePermissions(prev => 
      prev.map(rp => 
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
      <section>
        <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
          Role Permissions
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Control which pages each role can access. If a role has access to a page, they have full access to that page.
        </p>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Page
                </th>
                {ROLES.map(role => (
                  <th key={role} className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {PAGES.map(page => (
                <tr key={page.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {page.label}
                  </td>
                  {ROLES.map(role => {
                    const roleData = rolePermissions.find(rp => rp.role === role);
                    const hasAccess = roleData?.permissions?.[page.id] || false;

                    return (
                      <td key={role} className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center">
                          <Toggle
                            id={`${role}-${page.id}`}
                            checked={hasAccess}
                            onChange={() => handleToggle(role, page.id)}
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

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="text-sm font-medium text-blue-900 mb-1">Note:</div>
          <div className="text-sm text-blue-700">
            Owner role has full access to everything by default and cannot be modified.
          </div>
        </div>
      </section>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-red hover:bg-brand-red/90 text-white px-6"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
