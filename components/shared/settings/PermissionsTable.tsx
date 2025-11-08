'use client';

import { Toggle } from '@/components/ui';
import { Shield } from 'lucide-react';

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

interface PermissionsTableProps {
  pages: Page[];
  roles: Role[];
  rolePermissions: RolePermissions[];
  onToggle: (role: string, page: string) => void;
}

export default function PermissionsTable({
  pages,
  roles,
  rolePermissions,
  onToggle,
}: PermissionsTableProps) {
  return (
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
  );
}
