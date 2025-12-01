'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  highlight?: boolean;
}

interface StoreCategoryNavProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string) => void;
  onSearch?: (query: string) => void;
  primaryColor: string;
  secondaryColor: string;
  isSticky?: boolean;
}

export default function StoreCategoryNav({
  categories,
  selectedCategory,
  onSelectCategory,
  onSearch,
  primaryColor,
  secondaryColor,
  isSticky = false,
}: StoreCategoryNavProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  // Find highlighted category (like "More requests" in the screenshot)
  const highlightedCategories = categories.filter(c => c.highlight);
  const regularCategories = categories.filter(c => !c.highlight);

  return (
    <div 
      className={cn(
        "bg-white border-b border-gray-200 transition-shadow",
        isSticky && "shadow-md"
      )}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-4 py-3">
          {/* Menu icon */}
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Category pills - scrollable */}
          <div 
            ref={scrollRef}
            className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-hide"
          >
            {/* Highlighted categories first */}
            {highlightedCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={cn(
                  "px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all text-sm",
                  selectedCategory === category.id
                    ? "text-white shadow-md"
                    : "text-white/90 hover:opacity-90"
                )}
                style={{
                  backgroundColor: secondaryColor,
                }}
              >
                {category.name}
              </button>
            ))}

            {/* Regular categories */}
            {regularCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={cn(
                  "px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all text-sm",
                  selectedCategory === category.id
                    ? "text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                )}
                style={{
                  backgroundColor: selectedCategory === category.id ? primaryColor : 'transparent',
                }}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Search input */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search"
              className="pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm w-48 focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all"
              style={{ 
                '--tw-ring-color': primaryColor 
              } as React.CSSProperties}
            />
          </div>
        </div>
      </div>
    </div>
  );
}