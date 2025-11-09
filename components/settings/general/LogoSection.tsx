'use client';

import { FormSection } from '@/components/shared';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface LogoSectionProps {
  t: (key: string) => string;
  logoUrl?: string;
  uploading: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function LogoSection({ t, logoUrl, uploading, onFileSelect }: LogoSectionProps) {
  return (
    <FormSection title={t('restaurantLogo')}>
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="relative group">
          {logoUrl ? (
            <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm">
              <img
                src={logoUrl}
                alt="Restaurant logo"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-32 h-32 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={onFileSelect}
              className="hidden"
              disabled={uploading}
            />
            <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm font-medium text-gray-700">
              <Upload className="w-4 h-4" />
              <span>{uploading ? t('uploading') : logoUrl ? t('changeLogo') : t('uploadLogo')}</span>
            </div>
          </label>
          <div className="text-sm text-gray-600 space-y-1">
            <p>{t('logoRecommendation')}</p>
            <p className="text-xs text-gray-500">{t('logoLimits')}</p>
          </div>
        </div>
      </div>
    </FormSection>
  );
}
