import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

// Heading Component
export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  variant?: 'page' | 'section' | 'card' | 'subtitle';
}

const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, as: Component = 'h1', variant = 'page', ...props }, ref) => {
    return (
      <Component
        className={cn(
          // Base styles
          'font-thin tracking-widest text-traces-gold-100',
          
          // Variant styles
          {
            // Page title (H1)
            'text-4xl sm:text-5xl lg:text-6xl mb-8':
              variant === 'page',
            
            // Section title (H2)
            'text-3xl sm:text-4xl lg:text-5xl mb-6':
              variant === 'section',
            
            // Card title (H3)
            'text-xl sm:text-2xl mb-4 text-traces-gold-300':
              variant === 'card',
            
            // Subtitle
            'text-lg sm:text-xl mb-4 text-traces-gold-200 font-light':
              variant === 'subtitle',
          },
          
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Heading.displayName = 'Heading';

// Text Component
export interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  variant?: 'default' | 'muted' | 'small' | 'large';
}

const Text = forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <p
        className={cn(
          // Base styles
          'font-light leading-relaxed',
          
          // Variant styles
          {
            // Default text
            'text-base text-stone-200':
              variant === 'default',
            
            // Muted text
            'text-sm text-stone-400':
              variant === 'muted',
            
            // Small text
            'text-xs text-stone-300':
              variant === 'small',
            
            // Large text
            'text-lg sm:text-xl text-stone-200':
              variant === 'large',
          },
          
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Text.displayName = 'Text';

export { Heading, Text };