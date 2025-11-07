import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'page' | 'section' | 'narrow' | 'wide';
}

const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, variant = 'page', children, ...props }, ref) => {
    return (
      <div
        className={cn(
          // Base styles
          'w-full',
          
          // Variant styles
          {
            // Full page container with gradient background
            'min-h-screen bg-gradient-to-b from-zinc-950 via-stone-950 to-black text-white pt-24 px-6':
              variant === 'page',
            
            // Section container (for content sections)
            'container mx-auto px-6':
              variant === 'section',
            
            // Narrow container (for forms, profiles, etc)
            'container mx-auto px-6 max-w-2xl':
              variant === 'narrow',
            
            // Wide container (for dashboards, grids)
            'container mx-auto px-6 max-w-7xl':
              variant === 'wide',
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

Container.displayName = 'Container';

export { Container };