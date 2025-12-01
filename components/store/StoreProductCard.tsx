'use client';

import { useState } from 'react';
import { Star, ArrowUpRight } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import ModifierSelector from './ModifierSelector';
import { Button } from '@/components/ui/Button';

interface StoreProductCardProps {
  item: {
    id: string;
    name: string;
    description?: string;
    image?: string;
    price: number;
    tags?: string[];
    allowSpecialNotes?: boolean;
  };
  menuRules: any[];
  options: any[];
  currencySymbol: string;
  primaryColor: string;
  secondaryColor: string;
  onAddToCart: (item: any, selectedOptions: any[], specialInstructions?: string) => void;
  variant?: 'card' | 'list';
}

export default function StoreProductCard({
  item,
  menuRules,
  options,
  currencySymbol,
  primaryColor,
  secondaryColor,
  onAddToCart,
  variant = 'card',
}: StoreProductCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<any[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);

  const itemRules = menuRules.find(rule => rule.menuItemId === item.id);
  const hasModifiers = itemRules && itemRules.appliedOptions && itemRules.appliedOptions.length > 0;

  // Random rating for demo (would come from real data)
  const rating = 4.5;

  const handleAddToCart = () => {
    if (hasModifiers) {
      setShowModal(true);
    } else {
      onAddToCart({ ...item, quantity }, [], specialInstructions);
    }
  };

  const handleConfirmModifiers = () => {
    onAddToCart({ ...item, quantity }, selectedOptions, specialInstructions);
    setShowModal(false);
    setSelectedOptions([]);
    setSpecialInstructions('');
    setQuantity(1);
  };

  if (variant === 'list') {
    return (
      <>
        <div className="flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
          {/* Image */}
          {item.image && (
            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
            {item.description && (
              <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-gray-600">{rating}</span>
            </div>
          </div>

          {/* Price and action */}
          <div className="flex flex-col items-end gap-2">
            <span className="font-bold text-lg">{currencySymbol}{item.price.toFixed(0)}</span>
            <button
              onClick={handleAddToCart}
              className="p-2 rounded-full text-white transition-all hover:opacity-90 hover:scale-105"
              style={{ backgroundColor: secondaryColor }}
            >
              <ArrowUpRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal for modifiers */}
        {renderModal()}
      </>
    );
  }

  // Card variant (default)
  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all group border border-gray-100">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <span className="text-4xl">🍽️</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-center mb-1">{item.name}</h3>
          {item.description && (
            <p className="text-xs text-gray-500 text-center line-clamp-3 mb-3 min-h-[3rem]">
              {item.description}
            </p>
          )}

          {/* Rating */}
          <div className="flex items-center justify-center gap-1 mb-3">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm text-gray-600">{rating}</span>
            <span className="text-xs text-gray-400">/5</span>
          </div>

          {/* Price and Add to Cart */}
          <div className="flex items-center justify-between">
            <span className="font-bold text-xl text-gray-900">
              {currencySymbol}{item.price.toFixed(0)}
            </span>
            <button
              onClick={handleAddToCart}
              className="px-4 py-2 rounded-full text-white text-sm font-medium transition-all hover:opacity-90 hover:scale-105"
              style={{ backgroundColor: secondaryColor }}
            >
              Add to cart
            </button>
          </div>
        </div>
      </div>

      {/* Modal for modifiers */}
      {renderModal()}
    </>
  );

  function renderModal() {
    return (
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={item.name}
      >
        <div className="space-y-4">
          {item.image && (
            <div className="w-full h-48 rounded-lg overflow-hidden">
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {item.description && (
            <p className="text-gray-600">{item.description}</p>
          )}

          <ModifierSelector
            itemRules={itemRules}
            options={options}
            selectedOptions={selectedOptions}
            onOptionsChange={setSelectedOptions}
          />

          {item.allowSpecialNotes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any special requests?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center font-semibold"
              >
                -
              </button>
              <span className="w-12 text-center font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center font-semibold"
              >
                +
              </button>
            </div>
          </div>

          <div className="pt-4 border-t flex gap-2">
            <Button onClick={() => setShowModal(false)} variant="secondary" className="flex-1">
              Cancel
            </Button>
            <button
              onClick={handleConfirmModifiers}
              className="flex-1 py-2.5 rounded-lg text-white font-medium transition-all hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              Add to Cart - {currencySymbol}{(item.price * quantity).toFixed(2)}
            </button>
          </div>
        </div>
      </Modal>
    );
  }
}