'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getPublicRestaurantData } from '@/lib/serverActions/order.actions';
import { useCartStore } from '@/stores/useCartStore';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/components/ui/ToastContainer';

// Store components
import StoreHeroSection from '@/components/store/StoreHeroSection';
import StoreCTAButtons from '@/components/store/StoreCTAButtons';
import StoreInfoBar from '@/components/store/StoreInfoBar';
import StoreCategoryNav from '@/components/store/StoreCategoryNav';
import StoreSpecialsCarousel from '@/components/store/StoreSpecialsCarousel';
import StoreFeaturedSection from '@/components/store/StoreFeaturedSection';
import StoreMenuSection from '@/components/store/StoreMenuSection';
import StoreFloatingCart from '@/components/store/StoreFloatingCart';
import CartSidebar from '@/components/store/CartSidebar';

export default function StorePage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.id as string;
  const isMobile = useIsMobile();
  const { showToast } = useToast();

  const [restaurant, setRestaurant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isNavSticky, setIsNavSticky] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const specialsRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const { addItem } = useCartStore();

  useEffect(() => {
    loadRestaurant();
  }, [restaurantId]);

  // Sticky nav logic
  useEffect(() => {
    const handleScroll = () => {
      if (heroRef.current) {
        const heroBottom = heroRef.current.getBoundingClientRect().bottom;
        setIsNavSticky(heroBottom <= 0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadRestaurant = async () => {
    setIsLoading(true);
    const result = await getPublicRestaurantData(restaurantId);

    if (result.success && result.data) {
      setRestaurant(result.data);
      if (result.data.categories.length > 0) {
        setSelectedCategory(result.data.categories[0].id);
      }
    } else {
      showToast('error', result.error || 'Restaurant not found');
    }

    setIsLoading(false);
  };

  const handleAddToCart = (item: any, selectedOptions: any[], specialInstructions?: string) => {
    const itemRules = restaurant.menuRules?.find((rule: any) => rule.menuItemId === item.id);

    const cartOptions = selectedOptions.map((opt) => ({
      optionId: opt.optionId,
      optionName: opt.optionName,
      choiceId: opt.choiceId,
      choiceName: opt.choiceName,
      quantity: opt.quantity || 1,
    }));

    addItem(
      {
        menuItemId: item.id,
        name: item.name,
        basePrice: item.price,
        quantity: item.quantity || 1,
        selectedOptions: cartOptions,
        menuRules: itemRules?.appliedOptions || null,
        specialInstructions,
        image: item.image,
      },
      restaurantId
    );

    showToast('success', `${item.name} added to cart!`);
  };

  const handleCheckout = () => {
    router.push(`/${restaurantId}/checkout`);
  };

  const handleSelectCategory = useCallback((categoryId: string) => {
    setSelectedCategory(categoryId);
    
    // Scroll to the category section
    const section = sectionRefs.current.get(categoryId);
    if (section) {
      const offset = isNavSticky ? 80 : 150; // Account for sticky nav
      const y = section.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, [isNavSticky]);

  const handleScrollToSpecials = () => {
    if (specialsRef.current) {
      const offset = isNavSticky ? 80 : 150;
      const y = specialsRef.current.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Filter items based on search query
  const getFilteredItems = (items: any[]) => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item: any) =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div 
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: '#282e59' }}
          />
          <p className="text-gray-500">Loading restaurant...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Restaurant not found</h1>
          <p className="text-gray-600">The restaurant you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const { primary: primaryColor, secondary: secondaryColor } = restaurant.colors;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div ref={heroRef}>
        <StoreHeroSection restaurant={restaurant} />
      </div>

      {/* CTA Buttons */}
      <StoreCTAButtons
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        onOrderNow={() => handleSelectCategory(restaurant.categories[0]?.id)}
        onSeeWhatsNew={handleScrollToSpecials}
      />

      {/* Info Bar */}
      <StoreInfoBar
        restaurant={restaurant}
        isOpen={true} // Would come from store hours check
        estimatedTime="15-20 min"
      />

      {/* Sticky Category Navigation */}
      <div 
        ref={navRef}
        className={isNavSticky ? 'fixed top-0 left-0 right-0 z-40' : ''}
      >
        <StoreCategoryNav
          categories={restaurant.categories.map((cat: any, index: number) => ({
            ...cat,
            highlight: index === 0, // First category highlighted like "More requests"
          }))}
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
          onSearch={handleSearch}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          isSticky={isNavSticky}
        />
      </div>

      {/* Spacer when nav is sticky */}
      {isNavSticky && <div className="h-16" />}

      {/* Main Content */}
      <div className={`max-w-7xl mx-auto ${isMobile ? '' : 'flex gap-8 px-4'}`}>
        {/* Left Column - Menu */}
        <div className={isMobile ? 'w-full pb-24' : 'flex-1'}>
          {/* Specials Carousel */}
          <div ref={specialsRef} className="py-6">
            <StoreSpecialsCarousel
              specials={[]} // Using sample data from component
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              onCtaClick={(special) => console.log('CTA clicked:', special)}
            />
          </div>

          {/* Featured Items */}
          <StoreFeaturedSection
            items={getFilteredItems(restaurant.items)}
            menuRules={restaurant.menuRules}
            options={restaurant.options}
            currencySymbol={restaurant.currencySymbol}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            onAddToCart={handleAddToCart}
          />

          {/* Menu Sections by Category */}
          {restaurant.categories.map((category: any) => {
            const categoryItems = getFilteredItems(
              restaurant.items.filter((item: any) => item.categoryId === category.id)
            );

            return (
              <StoreMenuSection
                key={category.id}
                ref={(el) => {
                  if (el) sectionRefs.current.set(category.id, el);
                }}
                category={category}
                items={categoryItems}
                menuRules={restaurant.menuRules}
                options={restaurant.options}
                currencySymbol={restaurant.currencySymbol}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                onAddToCart={handleAddToCart}
              />
            );
          })}
        </div>

        {/* Right Column - Cart (Desktop only) */}
        {!isMobile && (
          <div className="w-80 flex-shrink-0">
            <div className="sticky top-20">
              <CartSidebar
                currencySymbol={restaurant.currencySymbol}
                onCheckout={handleCheckout}
              />
            </div>
          </div>
        )}
      </div>

      {/* Floating Cart Button (Mobile only) */}
      {isMobile && (
        <StoreFloatingCart
          currencySymbol={restaurant.currencySymbol}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          onCheckout={handleCheckout}
        />
      )}
    </div>
  );
}