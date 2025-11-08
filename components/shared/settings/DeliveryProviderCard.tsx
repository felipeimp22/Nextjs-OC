'use client';

import { LucideIcon } from 'lucide-react';

interface DeliveryProviderCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  isSelected: boolean;
  onSelect: () => void;
}

export default function DeliveryProviderCard({
  icon: Icon,
  title,
  description,
  isSelected,
  onSelect,
}: DeliveryProviderCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative p-6 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-brand-red bg-red-50 shadow-md'
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
    >
      <div className="flex flex-col items-center text-center space-y-3">
        <div className={`p-3 rounded-full ${isSelected ? 'bg-brand-red text-white' : 'bg-gray-100 text-gray-600'}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
      </div>
      {isSelected && (
        <div className="absolute top-3 right-3">
          <div className="bg-brand-red text-white rounded-full w-6 h-6 flex items-center justify-center">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </button>
  );
}
