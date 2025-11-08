'use client';

import { Input } from '@/components/ui';
import { FormField } from '@/components/shared';

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function ColorPicker({ label, value, onChange, placeholder }: ColorPickerProps) {
  return (
    <FormField label={label}>
      <div className="flex gap-3">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-11 w-16 rounded-lg border-2 border-gray-300 cursor-pointer"
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
      </div>
    </FormField>
  );
}
