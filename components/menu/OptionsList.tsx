'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContainer';
import Pagination from '@/components/shared/Pagination';
import SearchFilter from '@/components/shared/SearchFilter';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOptions, useOptionCategories, useDeleteOption } from '@/hooks/useMenu';
import OptionFormModal from './OptionFormModal';

interface Option {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  choices: any[];
  multiSelect: boolean;
  minSelections: number;
  maxSelections: number;
  isAvailable: boolean;
  category: {
    id: string;
    name: string;
  };
}

interface OptionsListProps {
  restaurantId: string;
}

export default function OptionsList({ restaurantId }: OptionsListProps) {
  const t = useTranslations('menu.modifiers');
  const tc = useTranslations('menu.common');
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<Option | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const { data: options = [], isLoading: loadingOptions } = useOptions(restaurantId);
  const { data: categories = [], isLoading: loadingCategories } = useOptionCategories(restaurantId);
  const deleteOptionMutation = useDeleteOption();

  const loading = loadingOptions || loadingCategories;

  const handleEdit = (option: Option) => {
    setEditingOption(option);
    setIsModalOpen(true);
  };

  const handleDelete = async (option: Option) => {
    if (!confirm(tc('deleteConfirm'))) return;

    try {
      await deleteOptionMutation.mutateAsync({ id: option.id, restaurantId });
      showToast('success', 'Modifier deleted successfully');
    } catch (error) {
      showToast('error', error instanceof Error ? error.message : 'Failed to delete modifier');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOption(null);
  };

  const handleSaveSuccess = () => {
    handleCloseModal();
  };

  const filteredOptions = options.filter((option) => {
    const matchesSearch = option.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || option.category.id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredOptions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOptions = filteredOptions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-gray-900">{t('title')}</h2>
          <p className="text-sm text-gray-600 mt-1">{t('description')}</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 w-full md:w-auto">
          <Plus className="w-4 h-4" />
          {t('addModifier')}
        </Button>
      </div>

      <div className="mb-6">
        <SearchFilter
          searchPlaceholder={tc('search')}
          onSearchChange={setSearchQuery}
          filters={[
            {
              id: 'category',
              label: 'Category',
              placeholder: t('allCategories'),
              options: categories.map((cat) => ({
                value: cat.id,
                label: cat.name,
              })),
              value: filterCategory,
              onChange: setFilterCategory,
            },
          ]}
        />
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-sm border-2 border-dashed border-gray-300">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No categories found</h3>
          <p className="text-sm text-gray-600 mt-1">Please create a modifier category first.</p>
        </div>
      ) : filteredOptions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-sm border-2 border-dashed border-gray-300">
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noModifiers')}</h3>
          <div className="mt-6">
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              {t('addModifier')}
            </Button>
          </div>
        </div>
      ) : isMobile ? (
        <div className="space-y-4">
          {paginatedOptions.map((option) => (
            <div key={option.id} className="bg-white border border-gray-200 rounded-sm shadow-sm p-4">
              <div className="flex items-start gap-4 mb-3">
                {option.image && (
                  <img
                    src={option.image}
                    alt={option.name}
                    className="w-16 h-16 rounded-sm object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900">{option.name}</h3>
                  {option.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{option.description}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Category</span>
                  <span className="text-sm font-medium text-gray-900">{option.category.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Choices</span>
                  <span className="text-sm font-medium text-gray-900">{option.choices.length} choices</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Selection</span>
                  <span className="text-sm font-medium text-gray-900">
                    {option.multiSelect
                      ? `${option.minSelections}-${option.maxSelections}`
                      : '1'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status</span>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-sm ${
                      option.isAvailable
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {option.isAvailable ? t('available') : t('unavailable')}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => handleEdit(option)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-brand-navy bg-brand-navy/10 hover:bg-brand-navy/20 rounded-sm transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(option)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modifier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Choices
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Selection
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedOptions.map((option) => (
                <tr key={option.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {option.image && (
                        <img
                          src={option.image}
                          alt={option.name}
                          className="w-12 h-12 rounded-sm object-cover mr-4"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{option.name}</div>
                        {option.description && (
                          <div className="text-sm text-gray-500 line-clamp-1">{option.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{option.category.name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{option.choices.length} choices</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {option.multiSelect
                        ? `${option.minSelections}-${option.maxSelections}`
                        : '1'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-sm ${
                        option.isAvailable
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {option.isAvailable ? t('available') : t('unavailable')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleEdit(option)}
                        className="p-2 text-gray-600 hover:text-brand-navy hover:bg-gray-100 rounded-sm transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(option)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredOptions.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className="mt-6"
        />
      )}

      <OptionFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSaveSuccess}
        restaurantId={restaurantId}
        categories={categories}
        option={editingOption}
      />
    </div>
  );
}
