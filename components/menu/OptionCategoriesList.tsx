'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContainer';
import OptionCategoryFormModal from './OptionCategoryFormModal';
import { getOptionCategories, deleteOptionCategory } from '@/lib/serverActions/menu.actions';

interface OptionCategory {
  id: string;
  name: string;
  description: string | null;
  order: number;
  optionCount: number;
}

interface OptionCategoriesListProps {
  restaurantId: string;
}

export default function OptionCategoriesList({ restaurantId }: OptionCategoriesListProps) {
  const t = useTranslations('menu.modifierCategories');
  const tc = useTranslations('menu.common');
  const { showToast } = useToast();
  const [categories, setCategories] = useState<OptionCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<OptionCategory | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    const result = await getOptionCategories(restaurantId);
    if (result.success) {
      setCategories(result.data || []);
    } else {
      showToast('error', result.error || 'Failed to load categories');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCategories();
  }, [restaurantId]);

  const handleEdit = (category: OptionCategory) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = async (category: OptionCategory) => {
    if (!confirm(tc('deleteConfirm'))) return;

    const result = await deleteOptionCategory(category.id, restaurantId);
    if (result.success) {
      showToast('success', 'Category deleted successfully');
      loadCategories();
    } else {
      showToast('error', result.error || 'Failed to delete category');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSaveSuccess = () => {
    loadCategories();
    handleCloseModal();
  };

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
          {t('addCategory')}
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-sm border-2 border-dashed border-gray-300">
          <Tag className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noCategories')}</h3>
          <div className="mt-6">
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              {t('addCategory')}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white border border-gray-200 rounded-sm shadow-sm hover:shadow-md transition-shadow p-6"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                </div>
              </div>
              {category.description && (
                <p className="text-sm text-gray-600 mb-4">{category.description}</p>
              )}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-500">
                  {t('optionCount', { count: category.optionCount })}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 text-gray-600 hover:text-brand-navy hover:bg-gray-100 rounded-sm transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <OptionCategoryFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSaveSuccess}
        restaurantId={restaurantId}
        category={editingCategory}
      />
    </div>
  );
}
