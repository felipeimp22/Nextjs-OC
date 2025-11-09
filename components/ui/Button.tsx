import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-all disabled:opacity-50 disabled:pointer-events-none',

          // Size variants
          {
            'px-4 py-2 text-sm': size === 'sm',
            'px-6 py-3 text-base': size === 'md',
            'px-8 py-4 text-lg': size === 'lg',
          },

          // Style variants
          {
            // Primary - Brand Navy
            'bg-brand-navy hover:bg-brand-darkNavy text-white':
              variant === 'primary',

            // Secondary - Outlined
            'border-2 border-gray-300 hover:bg-gray-50 text-gray-700':
              variant === 'secondary',

            // Ghost - Minimal with gray (NOT yellow)
            'hover:bg-gray-100 text-gray-600':
              variant === 'ghost',

            // Danger - Red
            'bg-brand-red hover:bg-red-600 text-white':
              variant === 'danger',
          },
          
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };