'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button, useToast } from '@/components/ui';
import { FormSection, InfoCard } from '@/components/shared';
import { PermissionsManagementSection } from '@/components/settings/users';
import { getRestaurantUsers, updateRolePermissions } from '@/lib/serverActions/settings.actions';

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
      <PermissionsManagementSection
        pages={PAGES}
        roles={ROLES}
        rolePermissions={rolePermissions}
        onToggle={handleToggle}
      />

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
