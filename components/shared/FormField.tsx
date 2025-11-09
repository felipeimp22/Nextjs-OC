'use client';

import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export default function FormField({
  label,
  children,
  description,
  error,
  required,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2 w-full', className)}>
      <label className="block text-sm font-medium text-gray-900">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="w-full">
        {children}
      </div>
      {description && !error && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
