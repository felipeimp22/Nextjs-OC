'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button, useToast } from '@/components/ui';
import { PermissionsManagementSection } from '@/components/settings/users';
import { getRestaurantUsers, updateRolePermissions } from '@/lib/serverActions/settings.actions';

interface RolePermissions {
  role: string;
  permissions: Record<string, boolean>;
}

interface UsersSettingsProps {
  restaurantId: string;
}

export function UsersSettings({ restaurantId }: UsersSettingsProps) {
  const t = useTranslations('settings.users');
  const tSidebar = useTranslations('sidebar');
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions[]>([]);

  const PAGES = [
    { id: 'dashboard', label: tSidebar('dashboard'), description: 'View main dashboard and overview' },
    { id: 'menuManagement', label: tSidebar('menuManagement'), description: 'Create and edit menu items' },
    { id: 'orders', label: tSidebar('orders'), description: 'View and manage orders' },
    { id: 'kitchen', label: tSidebar('kitchen'), description: 'Access kitchen order display' },
    { id: 'customers', label: tSidebar('customers'), description: 'View and manage customer data' },
    { id: 'marketing', label: tSidebar('marketing'), description: 'Manage promotions and campaigns' },
    { id: 'analytics', label: tSidebar('analytics'), description: 'View reports and insights' },
    { id: 'settings', label: tSidebar('settings'), description: 'Modify restaurant settings' },
  ];

  const ROLES = [
    { id: 'manager', label: t('manager'), color: 'blue' },
    { id: 'kitchen', label: t('kitchen'), color: 'green' },
    { id: 'staff', label: t('staff'), color: 'purple' },
  ];

  useEffect(() => {
    fetchData();
  }, [restaurantId]);

  const fetchData = async () => {
    try {
      const result = await getRestaurantUsers(restaurantId);

      if (result.success && result.data) {
        const perms = result.data.rolePermissions || [];

        if (perms.length === 0) {
          setRolePermissions(
            ROLES.map((role) => ({
              role: role.id,
              permissions: {
                dashboard: true,
                menuManagement: role.id === 'manager',
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
      showToast('error', t('saving'));
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
        showToast('error', result.error || t('saving'));
        return;
      }

      showToast('success', t('savePermissions'));
      await fetchData();
    } catch (error) {
      showToast('error', t('saving'));
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
    <div className="w-full md:max-w-6xl md:mx-auto p-3 md:p-6 space-y-6 md:space-y-8">
      <PermissionsManagementSection
        t={t}
        pages={PAGES}
        roles={ROLES}
        rolePermissions={rolePermissions}
        onToggle={handleToggle}
      />

      <div className="flex justify-end pt-4 md:pt-6 border-t border-gray-200">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-red hover:bg-brand-red/90 text-white px-6 md:px-8 w-full md:w-auto"
        >
          {saving ? t('saving') : t('savePermissions')}
        </Button>
      </div>
    </div>
  );
}
