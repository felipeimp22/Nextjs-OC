'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import  Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/ToastContainer';
import Pagination from '@/components/shared/Pagination';
import MenuItemFormModal from './MenuItemFormModal';
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
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
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
      showToast('error', itemsResult.error || 'Failed to load items');
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

  const handleDelete = async (item: MenuItem) => {
    if (!confirm(tc('deleteConfirm'))) return;

    const result = await deleteMenuItem(item.id, restaurantId);
    if (result.success) {
      showToast('success', 'Item deleted successfully');
      loadData();
    } else {
      showToast('error', result.error || 'Failed to delete item');
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{t('title')}</h2>
          <p className="text-sm text-gray-600 mt-1">{t('description')}</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          {t('addItem')}
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
          <p className="text-sm text-gray-600 mt-1">Please create a category first before adding items.</p>
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
      ) : (
        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
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
                        onClick={() => handleEdit(item)}
                        className="p-2 text-gray-600 hover:text-brand-navy hover:bg-gray-100 rounded-sm transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
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
    </div>
  );
}
