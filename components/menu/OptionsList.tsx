'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/ToastContainer';
import OptionFormModal from './OptionFormModal';
import { getOptions, deleteOption, getOptionCategories } from '@/lib/serverActions/menu.actions';

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
  const [options, setOptions] = useState<Option[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<Option | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    const [optionsResult, categoriesResult] = await Promise.all([
      getOptions(restaurantId),
      getOptionCategories(restaurantId),
    ]);

    if (optionsResult.success) {
      setOptions(optionsResult.data || []);
    } else {
      showToast('error', optionsResult.error || 'Failed to load options');
    }

    if (categoriesResult.success) {
      setCategories(categoriesResult.data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [restaurantId]);

  const handleEdit = (option: Option) => {
    setEditingOption(option);
    setIsModalOpen(true);
  };

  const handleDelete = async (option: Option) => {
    if (!confirm(tc('deleteConfirm'))) return;

    const result = await deleteOption(option.id, restaurantId);
    if (result.success) {
      showToast('success', 'Modifier deleted successfully');
      loadData();
    } else {
      showToast('error', result.error || 'Failed to delete modifier');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOption(null);
  };

  const handleSaveSuccess = () => {
    loadData();
    handleCloseModal();
  };

  const filteredOptions = options.filter((option) => {
    const matchesSearch = option.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || option.category.id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{t('title')}</h2>
          <p className="text-sm text-gray-600 mt-1">{t('description')}</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('addModifier')}
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={tc('search')}
            className="pl-10"
          />
        </div>
        <Select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-64"
        >
          <option value="">{t('allCategories')}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </Select>
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
              {filteredOptions.map((option) => (
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
