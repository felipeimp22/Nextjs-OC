'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Input, Toggle, useToast, ColorPicker } from '@/components/ui';
import { FormSection, FormField } from '@/components/shared';
import { useStoreConfig, useUpdateStoreConfig } from '@/hooks/useStoreConfig';
import { useMenuCategories, useMenuItems } from '@/hooks/useMenu';
import { getRestaurant, updateRestaurant } from '@/lib/serverActions/restaurant.actions';
import {
  Monitor,
  Smartphone,
  Plus,
  Trash2,
  Search,
  GripVertical,
  ChevronDown,
  ChevronUp,
  X,
  Image as ImageIcon
} from 'lucide-react';

interface WebsiteConfigSettingsProps {
  restaurantId: string;
}

interface FeaturedItem {
  type: 'item' | 'category';
  itemId?: string;
  categoryId?: string;
}

interface SpecialItem {
  id: string;
  type: 'item' | 'category' | 'custom';
  itemId?: string;
  categoryId?: string;
  title: string;
  description?: string;
  image?: string;
  ctaText?: string;
  order: number;
}

export function WebsiteConfigSettings({ restaurantId }: WebsiteConfigSettingsProps) {
  const t = useTranslations('settings.website');
  const { showToast } = useToast();

  const { data: storeConfig, isLoading: isLoadingConfig } = useStoreConfig(restaurantId);
  const { data: categories, isLoading: isLoadingCategories } = useMenuCategories(restaurantId);
  const { data: menuItems, isLoading: isLoadingItems } = useMenuItems(restaurantId);
  const updateStoreConfig = useUpdateStoreConfig();

  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [saving, setSaving] = useState(false);
  const [loadingRestaurant, setLoadingRestaurant] = useState(true);

  // Restaurant colors (synced with General Settings)
  const [colors, setColors] = useState({
    primaryColor: '#282e59',
    secondaryColor: '#f03e42',
    accentColor: '#ffffff',
  });
  const [restaurantData, setRestaurantData] = useState<any>(null);

  // SEO Settings
  const [seoSettings, setSeoSettings] = useState({
    metaTitle: '',
    metaDescription: '',
    metaKeywords: [] as string[],
    ogImage: '',
  });
  const [keywordsInput, setKeywordsInput] = useState('');

  // Featured Items
  const [featuredEnabled, setFeaturedEnabled] = useState(true);
  const [featuredTitle, setFeaturedTitle] = useState('');
  const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([]);

  // Special Items (Carousel)
  const [specialsEnabled, setSpecialsEnabled] = useState(true);
  const [specialsTitle, setSpecialsTitle] = useState('');
  const [specialItems, setSpecialItems] = useState<SpecialItem[]>([]);
  const [editingSpecial, setEditingSpecial] = useState<SpecialItem | null>(null);

  // Search states
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Load restaurant data
  useEffect(() => {
    loadRestaurantData();
  }, [restaurantId]);

  // Load store config data
  useEffect(() => {
    if (storeConfig) {
      setSeoSettings({
        metaTitle: storeConfig.metaTitle || '',
        metaDescription: storeConfig.metaDescription || '',
        metaKeywords: storeConfig.metaKeywords || [],
        ogImage: storeConfig.ogImage || '',
      });
      setKeywordsInput((storeConfig.metaKeywords || []).join(', '));
      setFeaturedEnabled(storeConfig.featuredItemsEnabled ?? true);
      setFeaturedTitle(storeConfig.featuredItemsTitle || '');
      setFeaturedItems(storeConfig.featuredItems || []);
      setSpecialsEnabled(storeConfig.specialsEnabled ?? true);
      setSpecialsTitle(storeConfig.specialsTitle || '');
      setSpecialItems((storeConfig.specialItems || []).map((item: any, idx: number) => ({
        ...item,
        id: item.id || crypto.randomUUID(),
        order: item.order ?? idx,
      })));
    }
  }, [storeConfig]);

  const loadRestaurantData = async () => {
    setLoadingRestaurant(true);
    const result = await getRestaurant(restaurantId);
    if (result.success && result.data) {
      setRestaurantData(result.data);
      setColors({
        primaryColor: result.data.primaryColor || '#282e59',
        secondaryColor: result.data.secondaryColor || '#f03e42',
        accentColor: result.data.accentColor || '#ffffff',
      });
    }
    setLoadingRestaurant(false);
  };

  // Filter items for search
  const filteredItems = useMemo(() => {
    if (!menuItems) return [];
    if (!itemSearchQuery.trim()) return menuItems.slice(0, 10);
    const query = itemSearchQuery.toLowerCase();
    return menuItems.filter((item: any) =>
      item.name.toLowerCase().includes(query)
    ).slice(0, 10);
  }, [menuItems, itemSearchQuery]);

  // Filter categories for search
  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    if (!categorySearchQuery.trim()) return categories;
    const query = categorySearchQuery.toLowerCase();
    return categories.filter((cat: any) =>
      cat.name.toLowerCase().includes(query)
    );
  }, [categories, categorySearchQuery]);

  // Get item/category name by ID
  const getItemName = (itemId: string) => {
    const item = menuItems?.find((i: any) => i.id === itemId);
    return item?.name || 'Unknown Item';
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories?.find((c: any) => c.id === categoryId);
    return category?.name || 'Unknown Category';
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save restaurant colors
      await updateRestaurant(restaurantId, {
        primaryColor: colors.primaryColor,
        secondaryColor: colors.secondaryColor,
        accentColor: colors.accentColor,
      });

      // Save store config
      const keywords = keywordsInput.split(',').map(k => k.trim()).filter(k => k);
      await updateStoreConfig.mutateAsync({
        restaurantId,
        data: {
          metaTitle: seoSettings.metaTitle,
          metaDescription: seoSettings.metaDescription,
          metaKeywords: keywords,
          ogImage: seoSettings.ogImage,
          featuredItemsEnabled: featuredEnabled,
          featuredItemsTitle: featuredTitle,
          featuredItems,
          specialsEnabled: specialsEnabled,
          specialsTitle: specialsTitle,
          specialItems: specialItems.map((item, idx) => ({
            ...item,
            order: idx,
          })),
        },
      });

      showToast('success', t('savedSuccessfully'));
    } catch (error) {
      showToast('error', t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  // Featured Item handlers
  const addFeaturedItem = (item: any) => {
    if (featuredItems.some(fi => fi.type === 'item' && fi.itemId === item.id)) {
      return; // Already added
    }
    setFeaturedItems([...featuredItems, { type: 'item', itemId: item.id }]);
    setItemSearchQuery('');
    setShowItemDropdown(false);
  };

  const addFeaturedCategory = (category: any) => {
    if (featuredItems.some(fi => fi.type === 'category' && fi.categoryId === category.id)) {
      return; // Already added
    }
    setFeaturedItems([...featuredItems, { type: 'category', categoryId: category.id }]);
    setCategorySearchQuery('');
    setShowCategoryDropdown(false);
  };

  const removeFeaturedItem = (index: number) => {
    setFeaturedItems(featuredItems.filter((_, i) => i !== index));
  };

  // Special Item handlers
  const addSpecialItem = () => {
    const newItem: SpecialItem = {
      id: crypto.randomUUID(),
      type: 'custom',
      title: '',
      description: '',
      ctaText: 'Order Now',
      order: specialItems.length,
    };
    setEditingSpecial(newItem);
  };

  const saveSpecialItem = () => {
    if (!editingSpecial || !editingSpecial.title.trim()) return;

    const existingIndex = specialItems.findIndex(item => item.id === editingSpecial.id);
    if (existingIndex >= 0) {
      const updated = [...specialItems];
      updated[existingIndex] = editingSpecial;
      setSpecialItems(updated);
    } else {
      setSpecialItems([...specialItems, editingSpecial]);
    }
    setEditingSpecial(null);
  };

  const removeSpecialItem = (id: string) => {
    setSpecialItems(specialItems.filter(item => item.id !== id));
  };

  const moveSpecialItem = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === specialItems.length - 1)) {
      return;
    }
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...specialItems];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setSpecialItems(updated);
  };

  if (isLoadingConfig || loadingRestaurant) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  return (
    <div className="w-full md:max-w-4xl md:mx-auto p-3 md:p-6 space-y-6 md:space-y-8">
      {/* Store Preview Section */}
      <FormSection title={t('preview')} description={t('previewDescription')}>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={previewMode === 'desktop' ? 'primary' : 'outline'}
              onClick={() => setPreviewMode('desktop')}
              className="flex items-center gap-2"
            >
              <Monitor className="w-4 h-4" />
              {t('desktopView')}
            </Button>
            <Button
              variant={previewMode === 'mobile' ? 'primary' : 'outline'}
              onClick={() => setPreviewMode('mobile')}
              className="flex items-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              {t('mobileView')}
            </Button>
          </div>

          <div className={`border border-gray-200 rounded-lg overflow-hidden bg-gray-100 mx-auto transition-all ${
            previewMode === 'mobile' ? 'max-w-[375px]' : 'w-full'
          }`}>
            <div className="bg-gray-800 px-3 py-2 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="flex-1 bg-gray-600 rounded px-2 py-1 text-xs text-gray-300 text-center">
                {restaurantData?.name || 'Restaurant'} - Store
              </div>
            </div>
            <div className={`bg-white overflow-hidden ${previewMode === 'mobile' ? 'h-[500px]' : 'h-[400px]'}`}>
              {/* Mini Hero */}
              <div
                className="relative h-24 md:h-32"
                style={{ backgroundColor: colors.primaryColor }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${colors.primaryColor} 0%, ${adjustColor(colors.primaryColor, -20)} 100%)`,
                  }}
                />
                {restaurantData?.logo && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <img
                      src={restaurantData.logo}
                      alt={restaurantData.name}
                      className="w-12 h-12 rounded-lg object-cover bg-white shadow-lg"
                    />
                  </div>
                )}
              </div>

              {/* Mini CTA Buttons */}
              <div className="flex gap-2 p-3 justify-center">
                <div
                  className="px-3 py-1.5 rounded-full text-white text-xs font-medium"
                  style={{ backgroundColor: colors.secondaryColor }}
                >
                  Order Now
                </div>
                <div
                  className="px-3 py-1.5 rounded-full text-xs font-medium border"
                  style={{ borderColor: colors.primaryColor, color: colors.primaryColor }}
                >
                  See What's New
                </div>
              </div>

              {/* Mini Specials Carousel */}
              {specialsEnabled && specialItems.length > 0 && (
                <div className="px-3 pb-2">
                  <div
                    className="rounded-lg p-3 text-white text-xs"
                    style={{ backgroundColor: colors.primaryColor }}
                  >
                    <p className="font-semibold">{specialItems[0]?.title || 'Special Offer'}</p>
                    <p className="text-white/80 text-[10px] mt-1 truncate">{specialItems[0]?.description || 'Description...'}</p>
                  </div>
                </div>
              )}

              {/* Mini Featured Section */}
              {featuredEnabled && (
                <div className="px-3">
                  <p className="text-xs font-semibold text-gray-900 mb-2">{featuredTitle || t('featuredItems')}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-gray-100 rounded-lg p-2">
                        <div className="w-full aspect-square bg-gray-200 rounded mb-1"></div>
                        <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </FormSection>

      {/* Brand Colors Section */}
      <FormSection title={t('brandColors')} description={t('brandColorsDescription')}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField label={t('primaryColor')}>
            <div className="flex gap-3">
              <ColorPicker value={colors.primaryColor} onChange={(v) => setColors({ ...colors, primaryColor: v })} />
              <Input
                value={colors.primaryColor}
                onChange={(e) => setColors({ ...colors, primaryColor: e.target.value })}
                placeholder="#282e59"
                className="flex-1"
              />
            </div>
          </FormField>

          <FormField label={t('secondaryColor')}>
            <div className="flex gap-3">
              <ColorPicker value={colors.secondaryColor} onChange={(v) => setColors({ ...colors, secondaryColor: v })} />
              <Input
                value={colors.secondaryColor}
                onChange={(e) => setColors({ ...colors, secondaryColor: e.target.value })}
                placeholder="#f03e42"
                className="flex-1"
              />
            </div>
          </FormField>

          <FormField label={t('accentColor')}>
            <div className="flex gap-3">
              <ColorPicker value={colors.accentColor} onChange={(v) => setColors({ ...colors, accentColor: v })} />
              <Input
                value={colors.accentColor}
                onChange={(e) => setColors({ ...colors, accentColor: e.target.value })}
                placeholder="#ffffff"
                className="flex-1"
              />
            </div>
          </FormField>
        </div>

        <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-4">{t('colorPreview')}</p>
          <div className="flex gap-4">
            <div className="flex-1 text-center">
              <div
                className="h-16 rounded-lg shadow-sm border border-gray-200"
                style={{ backgroundColor: colors.primaryColor }}
              />
              <p className="text-xs text-gray-600 mt-2">{t('primary')}</p>
            </div>
            <div className="flex-1 text-center">
              <div
                className="h-16 rounded-lg shadow-sm border border-gray-200"
                style={{ backgroundColor: colors.secondaryColor }}
              />
              <p className="text-xs text-gray-600 mt-2">{t('secondary')}</p>
            </div>
            <div className="flex-1 text-center">
              <div
                className="h-16 rounded-lg shadow-sm border border-gray-200"
                style={{ backgroundColor: colors.accentColor }}
              />
              <p className="text-xs text-gray-600 mt-2">{t('accent')}</p>
            </div>
          </div>
        </div>
      </FormSection>

      {/* SEO Settings Section */}
      <FormSection title={t('seo')} description={t('seoDescription')}>
        <div className="space-y-4">
          <FormField label={t('metaTitle')} description={t('metaTitleHint')}>
            <Input
              value={seoSettings.metaTitle}
              onChange={(e) => setSeoSettings({ ...seoSettings, metaTitle: e.target.value })}
              placeholder={t('metaTitlePlaceholder')}
              maxLength={60}
            />
            <p className="text-xs text-gray-500 mt-1">
              {seoSettings.metaTitle.length}/60 characters
            </p>
          </FormField>

          <FormField label={t('metaDescription')} description={t('metaDescriptionHint')}>
            <textarea
              value={seoSettings.metaDescription}
              onChange={(e) => setSeoSettings({ ...seoSettings, metaDescription: e.target.value })}
              placeholder={t('metaDescriptionPlaceholder')}
              maxLength={160}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg bg-transparent border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {seoSettings.metaDescription.length}/160 characters
            </p>
          </FormField>

          <FormField label={t('metaKeywords')}>
            <Input
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              placeholder={t('metaKeywordsPlaceholder')}
            />
          </FormField>

          <FormField label={t('ogImage')} description={t('ogImageHint')}>
            <Input
              value={seoSettings.ogImage}
              onChange={(e) => setSeoSettings({ ...seoSettings, ogImage: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </FormField>
        </div>
      </FormSection>

      {/* Featured Items Section */}
      <FormSection title={t('featuredItems')} description={t('featuredItemsDescription')}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Toggle
              checked={featuredEnabled}
              onChange={setFeaturedEnabled}
              label={t('enableFeaturedItems')}
            />
          </div>

          {featuredEnabled && (
            <>
              <FormField label={t('featuredItemsTitle')}>
                <Input
                  value={featuredTitle}
                  onChange={(e) => setFeaturedTitle(e.target.value)}
                  placeholder={t('featuredItemsTitlePlaceholder')}
                />
              </FormField>

              <div className="flex gap-2">
                {/* Add Item Dropdown */}
                <div className="relative flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      value={itemSearchQuery}
                      onChange={(e) => {
                        setItemSearchQuery(e.target.value);
                        setShowItemDropdown(true);
                      }}
                      onFocus={() => setShowItemDropdown(true)}
                      placeholder={t('searchItems')}
                      className="pl-10"
                    />
                  </div>
                  {showItemDropdown && filteredItems.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                      {filteredItems.map((item: any) => (
                        <button
                          key={item.id}
                          onClick={() => addFeaturedItem(item)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Category Dropdown */}
                <div className="relative flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      value={categorySearchQuery}
                      onChange={(e) => {
                        setCategorySearchQuery(e.target.value);
                        setShowCategoryDropdown(true);
                      }}
                      onFocus={() => setShowCategoryDropdown(true)}
                      placeholder={t('searchCategories')}
                      className="pl-10"
                    />
                  </div>
                  {showCategoryDropdown && filteredCategories.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
                      {filteredCategories.map((category: any) => (
                        <button
                          key={category.id}
                          onClick={() => addFeaturedCategory(category)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Featured Items List */}
              {featuredItems.length > 0 ? (
                <div className="space-y-2">
                  {featuredItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          item.type === 'item' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {item.type === 'item' ? t('item') : t('category')}
                        </span>
                        <span className="text-sm font-medium">
                          {item.type === 'item'
                            ? getItemName(item.itemId!)
                            : getCategoryName(item.categoryId!)}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFeaturedItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                  {t('noFeaturedItems')}
                </p>
              )}
            </>
          )}
        </div>
      </FormSection>

      {/* Special Items (Carousel) Section */}
      <FormSection title={t('specialItems')} description={t('specialItemsDescription')}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Toggle
              checked={specialsEnabled}
              onChange={setSpecialsEnabled}
              label={t('enableSpecials')}
            />
          </div>

          {specialsEnabled && (
            <>
              <FormField label={t('specialsTitle')}>
                <Input
                  value={specialsTitle}
                  onChange={(e) => setSpecialsTitle(e.target.value)}
                  placeholder={t('specialsTitlePlaceholder')}
                />
              </FormField>

              <Button onClick={addSpecialItem} variant="outline" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                {t('addSpecialItem')}
              </Button>

              {/* Special Items List */}
              {specialItems.length > 0 ? (
                <div className="space-y-2">
                  {specialItems.map((item, index) => (
                    <div key={item.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveSpecialItem(index, 'up')}
                          disabled={index === 0}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveSpecialItem(index, 'down')}
                          disabled={index === specialItems.length - 1}
                          className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.title || 'Untitled'}</p>
                        <p className="text-xs text-gray-500 truncate">{item.description || 'No description'}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        item.type === 'item' ? 'bg-blue-100 text-blue-700' :
                        item.type === 'category' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.type === 'item' ? t('item') : item.type === 'category' ? t('category') : t('custom')}
                      </span>
                      <button
                        onClick={() => setEditingSpecial(item)}
                        className="text-blue-500 hover:text-blue-700 px-2 py-1 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeSpecialItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                  {t('noSpecialItems')}
                </p>
              )}
            </>
          )}
        </div>
      </FormSection>

      {/* Special Item Edit Modal */}
      {editingSpecial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold">{t('editSpecialItem')}</h3>
              <button onClick={() => setEditingSpecial(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <FormField label={t('specialItemTitle')}>
                <Input
                  value={editingSpecial.title}
                  onChange={(e) => setEditingSpecial({ ...editingSpecial, title: e.target.value })}
                  placeholder={t('specialItemTitlePlaceholder')}
                />
              </FormField>

              <FormField label={t('specialItemDescription')}>
                <textarea
                  value={editingSpecial.description || ''}
                  onChange={(e) => setEditingSpecial({ ...editingSpecial, description: e.target.value })}
                  placeholder={t('specialItemDescriptionPlaceholder')}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg bg-transparent border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors resize-none"
                />
              </FormField>

              <FormField label={t('specialItemCta')}>
                <Input
                  value={editingSpecial.ctaText || ''}
                  onChange={(e) => setEditingSpecial({ ...editingSpecial, ctaText: e.target.value })}
                  placeholder={t('specialItemCtaPlaceholder')}
                />
              </FormField>

              <FormField label={t('specialItemType')}>
                <select
                  value={editingSpecial.type}
                  onChange={(e) => setEditingSpecial({
                    ...editingSpecial,
                    type: e.target.value as 'item' | 'category' | 'custom',
                    itemId: undefined,
                    categoryId: undefined,
                  })}
                  className="w-full px-4 py-2.5 rounded-lg bg-transparent border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors"
                >
                  <option value="custom">{t('specialItemTypeCustom')}</option>
                  <option value="item">{t('specialItemTypeItem')}</option>
                  <option value="category">{t('specialItemTypeCategory')}</option>
                </select>
              </FormField>

              {editingSpecial.type === 'item' && (
                <FormField label={t('selectItem')}>
                  <select
                    value={editingSpecial.itemId || ''}
                    onChange={(e) => setEditingSpecial({ ...editingSpecial, itemId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-transparent border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors"
                  >
                    <option value="">{t('selectItem')}</option>
                    {menuItems?.map((item: any) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </FormField>
              )}

              {editingSpecial.type === 'category' && (
                <FormField label={t('selectCategory')}>
                  <select
                    value={editingSpecial.categoryId || ''}
                    onChange={(e) => setEditingSpecial({ ...editingSpecial, categoryId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg bg-transparent border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent transition-colors"
                  >
                    <option value="">{t('selectCategory')}</option>
                    {categories?.map((category: any) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </FormField>
              )}

              <FormField label={t('specialItemImage')}>
                <Input
                  value={editingSpecial.image || ''}
                  onChange={(e) => setEditingSpecial({ ...editingSpecial, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                />
              </FormField>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingSpecial(null)}>
                Cancel
              </Button>
              <Button onClick={saveSpecialItem} disabled={!editingSpecial.title.trim()}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-4 md:pt-6 border-t border-gray-200">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-red hover:bg-brand-red/90 text-white px-6 md:px-8 w-full md:w-auto"
        >
          {saving ? t('saving') : t('saveChanges')}
        </Button>
      </div>

      {/* Click outside handlers */}
      {(showItemDropdown || showCategoryDropdown) && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => {
            setShowItemDropdown(false);
            setShowCategoryDropdown(false);
          }}
        />
      )}
    </div>
  );
}

// Helper function to adjust color brightness
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}
