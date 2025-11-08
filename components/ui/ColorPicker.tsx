'use client';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function ColorPicker({ value, onChange, className = '' }: ColorPickerProps) {
  return (
    <input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-11 w-16 rounded-lg border-2 border-gray-300 cursor-pointer ${className}`}
    />
  );
}
