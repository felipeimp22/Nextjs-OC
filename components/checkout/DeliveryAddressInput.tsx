'use client';

import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';

interface DeliveryAddressInputProps {
  value: string;
  onChange: (address: string, coordinates?: { latitude: number; longitude: number }) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  className?: string;
}

export function DeliveryAddressInput({
  value,
  onChange,
  onError,
  placeholder = 'Enter delivery address',
  className = '',
}: DeliveryAddressInputProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced address search using Mapbox Geocoding API
  useEffect(() => {
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsLoading(true);
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

        if (!mapboxToken) {
          console.error('Mapbox token not configured');
          return;
        }

        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${mapboxToken}&limit=5&types=address`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch address suggestions');
        }

        const data = await response.json();
        setSuggestions(data.features || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Address autocomplete error:', error);
        onError?.('Failed to load address suggestions');
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [value, onError]);

  const handleSelectSuggestion = (suggestion: any) => {
    const [longitude, latitude] = suggestion.center;
    onChange(suggestion.place_name, { latitude, longitude });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy focus:border-transparent"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-5 w-5 border-2 border-brand-navy border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {suggestion.text}
                  </p>
                  <p className="text-xs text-gray-500">
                    {suggestion.place_name}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
