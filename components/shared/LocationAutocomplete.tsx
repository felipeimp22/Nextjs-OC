'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { searchAddressesAction, retrieveAddressAction } from '@/lib/serverActions/address.actions';
import type { AddressComponents } from '@/lib/utils/mapbox';
import {Input} from '@/components/ui/Input';

interface LocationAutocompleteProps {
  onSelect: (address: AddressComponents) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
}

export default function LocationAutocomplete({
  onSelect,
  placeholder = 'Enter delivery address...',
  required = false,
  error,
  disabled = false,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
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

  const handleSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    setValidationError('');

    try {
      const response = await searchAddressesAction(searchQuery);

      if (response.success && response.data) {
        setSuggestions(response.data);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setValidationError(response.error || 'Failed to search addresses. Please try again.');
      }
    } catch (err: any) {
      console.error('Address search failed:', err);
      setSuggestions([]);
      setValidationError('Failed to search addresses. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedAddress(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      handleSearch(value);
    }, 500);
  };

  const handleSelectSuggestion = async (suggestion: any) => {
    setIsSearching(true);
    setValidationError('');
    setShowSuggestions(false);

    try {
      const response = await retrieveAddressAction(suggestion.mapbox_id);

      if (response.success && response.data) {
        setSelectedAddress(response.data);
        setQuery(response.data.fullAddress);
        onSelect(response.data);
      } else {
        setValidationError(response.error || 'Failed to retrieve address details. Please try again.');
      }
    } catch (err: any) {
      console.error('Address retrieval failed:', err);
      setValidationError('Failed to retrieve address details. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        value={query}
        onChange={handleInputChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
      />

      {isSearching && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-navy"></div>
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.mapbox_id}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">{suggestion.name}</div>
              <div className="text-sm text-gray-500">{suggestion.full_address || suggestion.place_formatted}</div>
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
