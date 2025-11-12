'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContainer';
import Pagination from '@/components/shared/Pagination';
import SearchFilter, { CustomFilter } from '@/components/shared/SearchFilter';
import { useIsMobile } from '@/hooks/use-mobile';
import MenuItemFormModal from './MenuItemFormModal';
import MenuItemModifiersModal from './MenuItemModifiersModal';
import { getMenuItems, deleteMenuItem, getMenuCategories } from '@/lib/serverActions/menu.actions';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  price: number;
  cost: number | null;
  isAvailable: boolean;
  isVisible: boolean;
  category: {
    id: string;
    name: string;
  };
}

interface MenuItemsListProps {
  restaurantId: string;
}

export default function MenuItemsList({ restaurantId }: MenuItemsListProps) {
  const t = useTranslations('menu.items');
  const tc = useTranslations('menu.common');
  const { showToast } = useToast();
  const isMobile = useIsMobile();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isModifiersModalOpen, setIsModifiersModalOpen] = useState(false);
  const [modifiersItem, setModifiersItem] = useState<MenuItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const loadData = async () => {
    setLoading(true);
    const [itemsResult, categoriesResult] = await Promise.all([
      getMenuItems(restaurantId),
      getMenuCategories(restaurantId),
    ]);

    if (itemsResult.success) {
      setItems(itemsResult.data || []);
    } else {
      showToast('error', itemsResult.error || t('failedToLoadItems'));
    }

    if (categoriesResult.success) {
      setCategories(categoriesResult.data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [restaurantId]);

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleManageModifiers = (item: MenuItem) => {
    setModifiersItem(item);
    setIsModifiersModalOpen(true);
  };

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(tc('deleteConfirm'))) return;

    const result = await deleteMenuItem(item.id, restaurantId);
    if (result.success) {
      showToast('success', t('itemDeletedSuccessfully'));
      loadData();
    } else {
      showToast('error', result.error || t('failedToDeleteItem'));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSaveSuccess = () => {
    loadData();
    handleCloseModal();
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || item.category.id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
          {t('addItem')}
        </Button>
      </div>

      <div className="mb-6">
        <SearchFilter
          searchPlaceholder={tc('search')}
          onSearchChange={setSearchQuery}
          filters={[
            {
              id: 'category',
              label: t('category'),
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noCategoriesFound')}</h3>
          <p className="text-sm text-gray-600 mt-1">{t('createCategoryFirst')}</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-sm border-2 border-dashed border-gray-300">
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('noItems')}</h3>
          <div className="mt-6">
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              {t('addItem')}
            </Button>
          </div>
        </div>
      ) : isMobile ? (
        <div className="space-y-4">
          {paginatedItems.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-sm shadow-sm p-4">
              <div className="flex items-start gap-4 mb-3">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-sm object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('category')}</span>
                  <span className="text-sm font-medium text-gray-900">{item.category.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('price')}</span>
                  <span className="text-sm font-medium text-gray-900">${item.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('status')}</span>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-sm ${
                      item.isAvailable
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {item.isAvailable ? t('available') : t('unavailable')}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-3 border-t border-gray-200">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-brand-navy bg-brand-navy/10 hover:bg-brand-navy/20 rounded-sm transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-sm transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('delete')}
                  </button>
                </div>
                <button
                  onClick={() => handleManageModifiers(item)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-sm transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  {t('manageModifiers')}
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
                  {t('item')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('category')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('price')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-sm object-cover mr-4"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-gray-500 line-clamp-1">{item.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{item.category.name}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">${item.price.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-sm ${
                        item.isAvailable
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.isAvailable ? t('available') : t('unavailable')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleManageModifiers(item)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-sm transition-colors"
                        title={t('manageModifiers')}
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-2 text-gray-600 hover:text-brand-navy hover:bg-gray-100 rounded-sm transition-colors"
                        title={t('edit')}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors"
                        title={t('delete')}
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

      {filteredItems.length > 0 && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className="mt-6"
        />
      )}

      <MenuItemFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSaveSuccess}
        restaurantId={restaurantId}
        categories={categories}
        item={editingItem}
      />

      {modifiersItem && (
        <MenuItemModifiersModal
          isOpen={isModifiersModalOpen}
          onClose={() => {
            setIsModifiersModalOpen(false);
            setModifiersItem(null);
          }}
          menuItemId={modifiersItem.id}
          menuItemName={modifiersItem.name}
          restaurantId={restaurantId}
        />
      )}
    </div>
  );
}
