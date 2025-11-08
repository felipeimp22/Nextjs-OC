'use client';

import { Shield } from 'lucide-react';

interface Role {
  id: string;
  label: string;
  color: string;
}

interface RolePermissions {
  role: string;
  permissions: Record<string, boolean>;
}

interface RoleSummaryCardsProps {
  roles: Role[];
  rolePermissions: RolePermissions[];
  totalPages: number;
}

export default function RoleSummaryCards({
  roles,
  rolePermissions,
  totalPages,
}: RoleSummaryCardsProps) {
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {roles.map((role) => {
        const roleData = rolePermissions.find((rp) => rp.role === role.id);
        const enabledCount = roleData
          ? Object.values(roleData.permissions).filter((v) => v).length
          : 0;

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
              {enabledCount} of {totalPages} features enabled
            </p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-brand-red h-2 rounded-full transition-all"
                style={{
                  width: `${(enabledCount / totalPages) * 100}%`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
