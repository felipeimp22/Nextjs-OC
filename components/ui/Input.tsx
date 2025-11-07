import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Base styles
          'block w-full px-3 py-2 rounded-sm font-light',
          'bg-black/40 border text-traces-gold-100',
          'focus:outline-none focus:ring-1 transition-colors',
          'placeholder:text-traces-dark-400',
          'disabled:opacity-50 disabled:pointer-events-none',
          
          // Border states
          error
            ? 'border-traces-burgundy-600 focus:border-traces-burgundy-500 focus:ring-traces-burgundy-500'
            : 'border-traces-gold-900/30 focus:border-traces-gold-600 focus:ring-traces-gold-600',
          
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };