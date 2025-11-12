'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsMobile } from '@/hooks/use-mobile';

export interface FilterOption {
  value: string;
  label: string;
}

export interface CustomFilter {
  id: string;
  label: string;
  placeholder: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

interface SearchFilterProps {
  searchPlaceholder: string;
  onSearchChange: (search: string) => void;
  filters?: CustomFilter[];
  debounceDelay?: number;
  className?: string;
}

export default function SearchFilter({
  searchPlaceholder,
  onSearchChange,
  filters = [],
  debounceDelay = 300,
  className = '',
}: SearchFilterProps) {
  const [localSearch, setLocalSearch] = useState('');
  const debouncedSearch = useDebounce(localSearch, debounceDelay);
  const isMobile = useIsMobile();

  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      <div className={`flex flex-col ${filters.length > 0 ? 'md:flex-row' : ''} gap-4`}>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          <Input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-10"
          />
        </div>

        {filters.length > 0 && (
          <div className={`flex flex-col ${isMobile ? 'gap-3' : 'md:flex-row gap-4'}`}>
            {filters.map((filter) => (
              <Select
                key={filter.id}
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className="w-full md:w-64"
                aria-label={filter.label}
              >
                <option value="">{filter.placeholder}</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
