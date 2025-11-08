'use client';

import { cn } from '@/lib/utils';
import { Info, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface InfoCardProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const typeConfig = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-900',
    iconColor: 'text-blue-600',
    Icon: Info,
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-900',
    iconColor: 'text-green-600',
    Icon: CheckCircle,
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-900',
    iconColor: 'text-amber-600',
    Icon: AlertTriangle,
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-900',
    iconColor: 'text-red-600',
    Icon: AlertCircle,
  },
};

export default function InfoCard({
  type = 'info',
  title,
  children,
  className,
}: InfoCardProps) {
  const config = typeConfig[type];
  const Icon = config.Icon;

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        config.bg,
        config.border,
        className
      )}
    >
      <div className="flex gap-3">
        <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', config.iconColor)} />
        <div className="flex-1 space-y-1">
          {title && (
            <div className={cn('text-sm font-semibold', config.text)}>
              {title}
            </div>
          )}
          <div className={cn('text-sm', config.text)}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
