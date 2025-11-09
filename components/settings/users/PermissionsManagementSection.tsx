'use client';

import { FormSection, InfoCard } from '@/components/shared';
import { Toggle } from '@/components/ui';
import { Shield } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Page {
  id: string;
  label: string;
  description: string;
}

interface Role {
  id: string;
  label: string;
  color: string;
}

interface RolePermissions {
  role: string;
  permissions: Record<string, boolean>;
}

interface PermissionsManagementSectionProps {
  pages: Page[];
  roles: Role[];
  rolePermissions: RolePermissions[];
  onToggle: (role: string, page: string) => void;
}

export default function PermissionsManagementSection({
  pages,
  roles,
  rolePermissions,
  onToggle,
}: PermissionsManagementSectionProps) {
  const isMobile = useIsMobile();

  return (
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

      {isMobile ? (
        <div className="space-y-4">
          {pages.map((page) => (
            <div key={page.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="mb-3">
                <h4 className="text-sm font-semibold text-gray-900">{page.label}</h4>
                <p className="text-xs text-gray-500 mt-1">{page.description}</p>
              </div>
              <div className="space-y-3">
                {roles.map((role) => {
                  const roleData = rolePermissions.find((rp) => rp.role === role.id);
                  const hasAccess = roleData?.permissions?.[page.id] || false;

                  return (
                    <div key={role.id} className="flex items-center justify-between bg-white p-3 rounded-md border border-gray-200">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">{role.label}</span>
                      </div>
                      <Toggle
                        id={`${role.id}-${page.id}`}
                        checked={hasAccess}
                        onChange={() => onToggle(role.id, page.id)}
                        size="sm"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
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
                  {roles.map((role) => (
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
                {pages.map((page, pageIndex) => (
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
                    {roles.map((role) => {
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
                              onChange={() => onToggle(role.id, page.id)}
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
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((role) => {
          const roleData = rolePermissions.find((rp) => rp.role === role.id);
          const enabledCount = roleData
            ? Object.values(roleData.permissions).filter((v) => v).length
            : 0;
          const totalCount = pages.length;

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
  );
}
