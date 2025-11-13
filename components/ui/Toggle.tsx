'use client';

import { useState, useEffect } from 'react';

interface ToggleProps {
  id?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function Toggle({
  id,
  checked = false,
  onChange,
  disabled = false,
  size = 'md'
}: ToggleProps) {
  const [internalChecked, setInternalChecked] = useState(checked);

  // Sync internal state when checked prop changes (for controlled component)
  useEffect(() => {
    if (onChange && checked !== undefined) {
      setInternalChecked(checked);
    }
  }, [checked, onChange]);

  const isChecked = onChange ? checked : internalChecked;

  const handleChange = () => {
    if (disabled) return;

    const newValue = !isChecked;

    if (onChange) {
      onChange(newValue);
    } else {
      setInternalChecked(newValue);
    }
  };

  const sizeClasses = {
    sm: 'w-9 h-5',
    md: 'w-12 h-6',
    lg: 'w-14 h-7',
  };

  const thumbSizeClasses = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-7 w-7',
  };

  const translateClasses = {
    sm: 'translate-x-4',
    md: 'translate-x-6',
    lg: 'translate-x-7',
  };

  const toggleId = id || `toggle-${Math.random().toString(36).substring(7)}`;

  return (
    <div className={`relative inline-block ${sizeClasses[size]} align-middle select-none`}>
      <input
        type="checkbox"
        id={toggleId}
        checked={isChecked}
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
      />
      <label
        htmlFor={toggleId}
        className={`block overflow-hidden rounded-full cursor-pointer transition-colors ${
          isChecked ? 'bg-green-500' : 'bg-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${sizeClasses[size]}`}
      >
        <span
          className={`block rounded-full bg-white shadow transform transition-transform ${thumbSizeClasses[size]} ${
            isChecked ? translateClasses[size] : 'translate-x-0'
          }`}
        />
      </label>
    </div>
  );
}