import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'sm' | 'md' | 'lg' | 'none';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    return (
      <div
        className={cn(
          // Base styles
          'rounded-sm transition-all',
          
          // Padding variants
          {
            'p-4': padding === 'sm',
            'p-6 sm:p-8': padding === 'md',
            'p-8 sm:p-12': padding === 'lg',
            'p-0': padding === 'none',
          },
          
          // Style variants
          {
            // Default - Subtle background
            'bg-black/40 border border-traces-gold-900/30 hover:border-traces-gold-700/50':
              variant === 'default',
            
            // Bordered - Emphasis on border
            'bg-transparent border-2 border-traces-gold-600/50 hover:border-traces-gold-500':
              variant === 'bordered',
            
            // Elevated - With shadow
            'bg-black/50 border border-traces-gold-900/30 shadow-lg shadow-traces-gold-900/20':
              variant === 'elevated',
          },
          
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export { Card };