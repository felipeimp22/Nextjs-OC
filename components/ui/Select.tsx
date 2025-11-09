'use client';

import { cn } from '@/lib/utils';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
  className?: string;
}

export default function Select({ children, className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        'w-full px-4 py-2.5 rounded-lg bg-transparent border border-gray-300 text-gray-900',
        'focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
