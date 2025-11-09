'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Select  from '@/components/ui/Select';
import Toggle  from '@/components/ui/Toggle';
import FormField from '@/components/shared/FormField';
import { useToast } from '@/components/ui/ToastContainer';
import { createMenuItem, updateMenuItem } from '@/lib/serverActions/menu.actions';

interface MenuItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  restaurantId: string;
  categories: Array<{ id: string; name: string }>;
  item?: any | null;
}

export default function MenuItemFormModal({
  isOpen,
  onClose,
  onSuccess,
  restaurantId,
  categories,
  item,
}: MenuItemFormModalProps) {
  const t = useTranslations('menu.items');
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    image: '',
    price: 0,
    cost: 0,
    isAvailable: true,
    isVisible: true,
    allowSpecialNotes: false,
    disableWhenFinishInventory: false,
    inventoryCount: 0,
    tags: '',
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        description: item.description || '',
        categoryId: item.category.id,
        image: item.image || '',
        price: item.price,
        cost: item.cost || 0,
        isAvailable: item.isAvailable,
        isVisible: item.isVisible,
        allowSpecialNotes: item.allowSpecialNotes || false,
        disableWhenFinishInventory: item.disableWhenFinishInventory || false,
        inventoryCount: item.inventoryCount || 0,
        tags: item.tags?.join(', ') || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        categoryId: categories[0]?.id || '',
        image: '',
        price: 0,
        cost: 0,
        isAvailable: true,
        isVisible: true,
        allowSpecialNotes: false,
        disableWhenFinishInventory: false,
        inventoryCount: 0,
        tags: '',
      });
    }
  }, [item, isOpen, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const tags = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const result = item
        ? await updateMenuItem(item.id, {
            restaurantId,
            name: formData.name,
            description: formData.description,
            categoryId: formData.categoryId,
            image: formData.image,
            price: formData.price,
            cost: formData.cost || undefined,
            isAvailable: formData.isAvailable,
            isVisible: formData.isVisible,
            allowSpecialNotes: formData.allowSpecialNotes,
            disableWhenFinishInventory: formData.disableWhenFinishInventory,
            inventoryCount: formData.inventoryCount,
            tags,
          })
        : await createMenuItem({
            restaurantId,
            categoryId: formData.categoryId,
            name: formData.name,
            description: formData.description,
            image: formData.image,
            price: formData.price,
            cost: formData.cost || undefined,
            isAvailable: formData.isAvailable,
            isVisible: formData.isVisible,
            allowSpecialNotes: formData.allowSpecialNotes,
            disableWhenFinishInventory: formData.disableWhenFinishInventory,
            inventoryCount: formData.inventoryCount,
            tags,
          });

      if (result.success) {
        showToast('success', item ? 'Item updated successfully' : 'Item created successfully');
        onSuccess();
      } else {
        showToast('error', result.error || 'Failed to save item');
      }
    } catch (error) {
      showToast('error', 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? t('editItem') : t('addItem')}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? t('saving') : t('saveItem')}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField label={t('name')} required>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('namePlaceholder')}
              required
            />
          </FormField>

          <FormField label={t('category')} required>
            <Select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField label={t('description')}>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t('descriptionPlaceholder')}
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-sm focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy outline-none transition-all"
          />
        </FormField>

        <FormField label={t('image')}>
          <Input
            value={formData.image}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            placeholder="https://example.com/image.jpg"
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label={t('price')} required>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              placeholder={t('pricePlaceholder')}
              required
            />
          </FormField>

          <FormField label={t('cost')}>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
              placeholder={t('costPlaceholder')}
            />
          </FormField>
        </div>

        <FormField label={t('tags')}>
          <Input
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder={t('tagsPlaceholder')}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label={t('isAvailable')}>
            <Toggle
              checked={formData.isAvailable}
              onChange={(checked) => setFormData({ ...formData, isAvailable: checked })}
            />
          </FormField>

          <FormField label={t('isVisible')}>
            <Toggle
              checked={formData.isVisible}
              onChange={(checked) => setFormData({ ...formData, isVisible: checked })}
            />
          </FormField>

          <FormField label={t('allowSpecialNotes')}>
            <Toggle
              checked={formData.allowSpecialNotes}
              onChange={(checked) => setFormData({ ...formData, allowSpecialNotes: checked })}
            />
          </FormField>

          <FormField label={t('disableWhenFinishInventory')}>
            <Toggle
              checked={formData.disableWhenFinishInventory}
              onChange={(checked) => setFormData({ ...formData, disableWhenFinishInventory: checked })}
            />
          </FormField>
        </div>

        {formData.disableWhenFinishInventory && (
          <FormField label={t('inventoryCount')}>
            <Input
              type="number"
              min="0"
              value={formData.inventoryCount}
              onChange={(e) => setFormData({ ...formData, inventoryCount: parseInt(e.target.value) || 0 })}
            />
          </FormField>
        )}
      </form>
    </Modal>
  );
}
