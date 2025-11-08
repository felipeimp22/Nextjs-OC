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
          'block w-full px-4 py-2.5 rounded-lg',
          'bg-transparent border border-gray-300',
          'text-gray-900 placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent',
          'transition-colors',
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',

          // Border states
          error && 'border-red-500 focus:ring-red-500',

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