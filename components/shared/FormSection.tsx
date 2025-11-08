'use client';

import { cn } from '@/lib/utils';

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export default function FormSection({
  title,
  description,
  children,
  className,
  actions,
}: FormSectionProps) {
  return (
    <section className={cn('space-y-6', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        {children}
      </div>
    </section>
  );
}
