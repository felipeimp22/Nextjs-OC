'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContainer';
import CategoryFormModal from './CategoryFormModal';
import { getMenuCategories, deleteMenuCategory } from '@/lib/serverActions/menu.actions';

interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  order: number;
  highlight: boolean;
  itemCount: number;
}

interface MenuCategoriesListProps {
  restaurantId: string;
}

export default function MenuCategoriesList({ restaurantId }: MenuCategoriesListProps) {
  const t = useTranslations('menu.categories');
  const tc = useTranslations('menu.common');
  const { showToast } = useToast();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    const result = await getMenuCategories(restaurantId);
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

  const handleEdit = (category: MenuCategory) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = async (category: MenuCategory) => {
    if (!confirm(tc('deleteConfirm'))) return;

    const result = await deleteMenuCategory(category.id, restaurantId);
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
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
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
              className="bg-white border border-gray-200 rounded-sm shadow-sm hover:shadow-md transition-shadow"
            >
              {category.image && (
                <div className="h-48 bg-gray-100 rounded-t-sm overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                    {category.highlight && (
                      <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-sm">
                        {t('highlight')}
                      </span>
                    )}
                  </div>
                </div>
                {category.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{category.description}</p>
                )}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-500">
                    {t('itemCount', { count: category.itemCount })}
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
            </div>
          ))}
        </div>
      )}

      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSaveSuccess}
        restaurantId={restaurantId}
        category={editingCategory}
      />
    </div>
  );
}
