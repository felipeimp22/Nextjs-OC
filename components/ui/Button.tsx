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
          'inline-flex items-center justify-center gap-2 rounded-sm font-light tracking-wider transition-all disabled:opacity-50 disabled:pointer-events-none',
          
          // Size variants
          {
            'px-4 py-2 text-sm': size === 'sm',
            'px-6 py-3 text-base': size === 'md',
            'px-8 py-4 text-lg': size === 'lg',
          },
          
          // Style variants
          {
            // Primary - Gold/Burgundy gradient
            'bg-gradient-to-r from-traces-burgundy-700 to-traces-gold-700 hover:from-traces-burgundy-600 hover:to-traces-gold-600 text-traces-gold-50 border border-traces-gold-600/30':
              variant === 'primary',
            
            // Secondary - Outlined
            'border border-traces-gold-600/50 hover:bg-traces-gold-900/20 text-traces-gold-100':
              variant === 'secondary',
            
            // Ghost - Minimal
            'hover:bg-traces-gold-900/10 text-traces-gold-100':
              variant === 'ghost',
            
            // Danger - Red accent
            'bg-traces-burgundy-700 hover:bg-traces-burgundy-600 text-traces-gold-50 border border-traces-burgundy-600/30':
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