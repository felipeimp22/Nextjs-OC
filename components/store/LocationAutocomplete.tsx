'use client';

import { useState, useRef, useEffect } from 'react';
import { searchAddresses, retrieveAddress, parseAddress, validateAddressHasHouseNumber, type AddressComponents } from '@/lib/utils/mapbox';
import Input from '@/components/ui/Input';

interface LocationAutocompleteProps {
  onSelect: (address: AddressComponents) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export default function LocationAutocomplete({
  onSelect,
  placeholder = 'Enter delivery address...',
  required = false,
  error,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AddressComponents | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  const debounceRef = useRef<NodeJS.Timeout>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setValidationError('');

    try {
      const results = await searchAddresses(searchQuery);
      setSuggestions(results.features || []);
      setShowSuggestions(true);
    } catch (err: any) {
      console.error('Address search failed:', err);
      setValidationError('Failed to search addresses. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    setSelectedAddress(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  const handleSelectSuggestion = async (suggestion: any) => {
    setIsLoading(true);
    setValidationError('');

    try {
      const fullFeature = await retrieveAddress(suggestion.mapbox_id);
      const addressComponents = parseAddress(fullFeature);

      if (!validateAddressHasHouseNumber(addressComponents)) {
        setValidationError('Please select an address with a house number for delivery.');
        setIsLoading(false);
        return;
      }

      setSelectedAddress(addressComponents);
      setQuery(addressComponents.fullAddress);
      setShowSuggestions(false);
      onSelect(addressComponents);
    } catch (err: any) {
      console.error('Address retrieval failed:', err);
      setValidationError('Failed to retrieve address details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={isLoading}
      />

      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-navy"></div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.mapbox_id}
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">{suggestion.name}</div>
              <div className="text-sm text-gray-500">{suggestion.place_name}</div>
            </button>
          ))}
        </div>
      )}

      {(validationError || error) && (
        <p className="mt-1 text-sm text-red-600">{validationError || error}</p>
      )}

      {selectedAddress && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7"></path>
            </svg>
            <div className="text-sm">
              <p className="font-medium text-green-900">Address confirmed</p>
              <p className="text-green-700">{selectedAddress.fullAddress}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
