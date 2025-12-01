'use client';

import { MapPin, Clock } from 'lucide-react';

interface StoreInfoBarProps {
  restaurant: {
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    phone: string;
  };
  isOpen?: boolean;
  estimatedTime?: string;
}

export default function StoreInfoBar({ 
  restaurant, 
  isOpen = true, 
  estimatedTime = '15-20 min' 
}: StoreInfoBarProps) {
  const fullAddress = `${restaurant.address.street}, ${restaurant.address.city}`;

  return (
    <div className="flex flex-col items-center justify-center py-4 px-4 text-center">
      <div className="flex items-center gap-2 text-gray-700">
        <MapPin className="w-4 h-4" />
        <span className="text-sm font-medium">{restaurant.name}</span>
        <span className="text-sm text-gray-500">· {fullAddress}</span>
        <a href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`} target="_blank" rel="noopener noreferrer">
          <svg className="w-4 h-4 text-blue-500 hover:text-blue-600 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
      <div className="flex items-center gap-2 mt-2 text-sm">
        <span className={`flex items-center gap-1 ${isOpen ? 'text-green-600' : 'text-red-600'}`}>
          <Clock className="w-4 h-4" />
          {isOpen ? 'Open' : 'Closed'}
        </span>
        <span className="text-gray-400">•</span>
        <span className="text-gray-600">Ready by {estimatedTime}</span>
        <span className="text-gray-400">•</span>
        <span className="text-gray-500 text-xs">schedule at checkout</span>
      </div>
    </div>
  );
}