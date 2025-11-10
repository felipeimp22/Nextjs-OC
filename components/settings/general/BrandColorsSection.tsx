'use client';

import { FormSection, FormField } from '@/components/shared';
import { Input, ColorPicker } from '@/components/ui';

interface BrandColorsSectionProps {
  t: (key: string) => string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  onPrimaryChange: (value: string) => void;
  onSecondaryChange: (value: string) => void;
  onAccentChange: (value: string) => void;
}

export default function BrandColorsSection({
  t,
  primaryColor,
  secondaryColor,
  accentColor,
  onPrimaryChange,
  onSecondaryChange,
  onAccentChange,
}: BrandColorsSectionProps) {
  return (
    <FormSection title={t('brandColors')} description={t('brandColorsDescription')}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FormField label={t('primaryColor')}>
          <div className="flex gap-3">
            <ColorPicker value={primaryColor} onChange={onPrimaryChange} />
            <Input
              value={primaryColor}
              onChange={(e) => onPrimaryChange(e.target.value)}
              placeholder="#282e59"
              className="flex-1"
            />
          </div>
        </FormField>

        <FormField label={t('secondaryColor')}>
          <div className="flex gap-3">
            <ColorPicker value={secondaryColor} onChange={onSecondaryChange} />
            <Input
              value={secondaryColor}
              onChange={(e) => onSecondaryChange(e.target.value)}
              placeholder="#f03e42"
              className="flex-1"
            />
          </div>
        </FormField>

        <FormField label={t('accentColor')}>
          <div className="flex gap-3">
            <ColorPicker value={accentColor} onChange={onAccentChange} />
            <Input
              value={accentColor}
              onChange={(e) => onAccentChange(e.target.value)}
              placeholder="#ffffff"
              className="flex-1"
            />
          </div>
        </FormField>
      </div>

      <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-700 mb-4">{t('colorPreview')}</p>
        <div className="flex gap-4">
          <div className="flex-1 text-center">
            <div
              className="h-16 rounded-lg shadow-sm border border-gray-200"
              style={{ backgroundColor: primaryColor }}
            />
            <p className="text-xs text-gray-600 mt-2">{t('primary')}</p>
          </div>
          <div className="flex-1 text-center">
            <div
              className="h-16 rounded-lg shadow-sm border border-gray-200"
              style={{ backgroundColor: secondaryColor }}
            />
            <p className="text-xs text-gray-600 mt-2">{t('secondary')}</p>
          </div>
          <div className="flex-1 text-center">
            <div
              className="h-16 rounded-lg shadow-sm border border-gray-200"
              style={{ backgroundColor: accentColor }}
            />
            <p className="text-xs text-gray-600 mt-2">{t('accent')}</p>
          </div>
        </div>
      </div>
    </FormSection>
  );
}
