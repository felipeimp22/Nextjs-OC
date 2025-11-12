"use client"

import { InputHTMLAttributes, forwardRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> {
  error?: boolean;
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
}

const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, error, value, onChange, min = 0, max, step = 1, defaultValue = 0, onBlur, ...props }, ref) => {
    const [displayValue, setDisplayValue] = useState<string>('');

    useEffect(() => {
      if (value !== undefined) {
        setDisplayValue(value === 0 ? '' : String(value));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      if (inputValue === '' || inputValue === '-') {
        setDisplayValue(inputValue);
        return;
      }

      const numericValue = inputValue.replace(/[^0-9.-]/g, '');

      if (numericValue === '' || numericValue === '-') {
        setDisplayValue(numericValue);
        return;
      }

      const parsedValue = parseFloat(numericValue);

      if (!isNaN(parsedValue)) {
        if (max !== undefined && parsedValue > max) {
          setDisplayValue(String(max));
          onChange?.(max);
          return;
        }

        setDisplayValue(numericValue);
        onChange?.(parsedValue);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const inputValue = displayValue.trim();

      if (inputValue === '' || inputValue === '-') {
        const finalValue = defaultValue;
        setDisplayValue(finalValue === 0 ? '' : String(finalValue));
        onChange?.(finalValue);
      } else {
        const parsedValue = parseFloat(inputValue);

        if (!isNaN(parsedValue)) {
          let finalValue = parsedValue;

          if (min !== undefined && finalValue < min) {
            finalValue = min;
          }
          if (max !== undefined && finalValue > max) {
            finalValue = max;
          }

          setDisplayValue(finalValue === 0 ? '' : String(finalValue));
          onChange?.(finalValue);
        } else {
          const finalValue = defaultValue;
          setDisplayValue(finalValue === 0 ? '' : String(finalValue));
          onChange?.(finalValue);
        }
      }

      onBlur?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      if (displayValue === '' || displayValue === '0') {
        setDisplayValue('');
      }
    };

    return (
      <input
        type="text"
        inputMode="decimal"
        className={cn(
          'block w-full px-4 py-2.5 rounded-lg',
          'bg-transparent border border-gray-300',
          'text-gray-900 placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent',
          'transition-colors',
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        {...props}
      />
    );
  }
);

NumberInput.displayName = 'NumberInput';

export { NumberInput };
