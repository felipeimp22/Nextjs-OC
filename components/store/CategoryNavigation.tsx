import { cn } from '@/lib/utils';

interface CategoryNavigationProps {
  categories: Array<{ id: string; name: string }>;
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string) => void;
}

export function CategoryNavigation({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryNavigationProps) {
  return (
    <div className="mb-6 sticky top-0 bg-white z-10 rounded-lg shadow p-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors',
              selectedCategory === category.id
                ? 'bg-brand-navy text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
}
