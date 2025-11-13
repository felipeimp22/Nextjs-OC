'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { isValidEmailFormat, isValidPhoneFormat } from '@/lib/utils/validation';

interface ValidationInputProps {
  type: 'email' | 'phone';
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  placeholder?: string;
  required?: boolean;
  countryCode?: string;
  disabled?: boolean;
  className?: string;
}

export function ValidationInput({
  type,
  value,
  onChange,
  placeholder,
  required = false,
  countryCode = 'US',
  disabled = false,
  className,
}: ValidationInputProps) {
  const t = useTranslations('validation');
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [validationMessage, setValidationMessage] = useState<string>('');
  const debounceRef = useRef<NodeJS.Timeout>();

  const handleValidation = (inputValue: string) => {
    if (!inputValue) {
      setValidationStatus('idle');
      setValidationMessage('');
      onChange(inputValue, false);
      return;
    }

    const isValidFormat = type === 'email'
      ? isValidEmailFormat(inputValue)
      : isValidPhoneFormat(inputValue);

    if (isValidFormat) {
      setValidationStatus('valid');
      setValidationMessage(type === 'email' ? t('emailValid') : t('phoneValid'));
      onChange(inputValue, true);
    } else {
      setValidationStatus('invalid');
      setValidationMessage(type === 'email' ? t('emailInvalid') : t('phoneInvalid'));
      onChange(inputValue, false);
    }
  };

  const handleInputChange = (inputValue: string) => {
    onChange(inputValue, false);
    setValidationStatus('idle');
    setValidationMessage('');

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      handleValidation(inputValue);
    }, 500);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          type={type === 'email' ? 'email' : 'tel'}
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={className}
        />

        {validationStatus === 'valid' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        )}

        {validationStatus === 'invalid' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              className="w-5 h-5 text-red-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
        )}
      </div>

      {validationMessage && (
        <p className={`mt-1 text-sm ${validationStatus === 'valid' ? 'text-green-600' : 'text-red-600'}`}>
          {validationMessage}
        </p>
      )}
    </div>
  );
}
