'use client';

import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useDebounce } from '@/hooks/useDebounce';

interface Category {
  id: string;
  name: string;
}

interface SearchFilterProps {
  searchPlaceholder: string;
  allCategoriesLabel: string;
  categories: Category[];
  onSearchChange: (search: string) => void;
  onCategoryChange: (categoryId: string) => void;
  debounceDelay?: number;
}

export default function SearchFilter({
  searchPlaceholder,
  allCategoriesLabel,
  categories,
  onSearchChange,
  onCategoryChange,
  debounceDelay = 300,
}: SearchFilterProps) {
  const [localSearch, setLocalSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const debouncedSearch = useDebounce(localSearch, debounceDelay);

  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    onCategoryChange(categoryId);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-10"
        />
      </div>
      <Select
        value={selectedCategory}
        onChange={(e) => handleCategoryChange(e.target.value)}
        className="w-full md:w-64"
      >
        <option value="">{allCategoriesLabel}</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </Select>
    </div>
  );
}
