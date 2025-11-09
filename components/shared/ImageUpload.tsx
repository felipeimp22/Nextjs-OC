'use client';

import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui';

interface ImageUploadProps {
  imageUrl?: string;
  uploading: boolean;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove?: () => void;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showRemoveButton?: boolean;
}

export default function ImageUpload({
  imageUrl,
  uploading,
  onFileSelect,
  onRemove,
  label = 'Upload Image',
  size = 'md',
  showRemoveButton = true,
}: ImageUploadProps) {
  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative group">
        {imageUrl ? (
          <div className={`${sizeClasses[size]} rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm`}>
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className={`${sizeClasses[size]} rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center`}>
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={onFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all text-sm font-medium text-gray-700">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Uploading...' : imageUrl ? 'Change' : label}</span>
          </div>
        </label>

        {imageUrl && showRemoveButton && onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={uploading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-1" />
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
