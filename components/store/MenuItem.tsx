'use client';

import { useState } from 'react';
import {Card} from '@/components/ui/Card';
import { Button } from '@/components/ui';
import Modal from '@/components/ui/Modal';
import ModifierSelector from './ModifierSelector';
import { useIsMobile } from '@/hooks/use-mobile';

interface MenuItemProps {
  item: any;
  menuRules: any[];
  options: any[];
  currencySymbol: string;
  onAddToCart: (item: any, selectedOptions: any[], specialInstructions?: string) => void;
}

export default function MenuItem({
  item,
  menuRules,
  options,
  currencySymbol,
  onAddToCart,
}: MenuItemProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<any[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);
  const isMobile = useIsMobile();

  const itemRules = menuRules.find(rule => rule.menuItemId === item.id);
  const hasModifiers = itemRules && itemRules.appliedOptions && itemRules.appliedOptions.length > 0;

  const handleAddToCart = () => {
    if (hasModifiers) {
      setShowModal(true);
    } else {
      onAddToCart(
        { ...item, quantity },
        [],
        specialInstructions
      );
    }
  };

  const handleConfirmModifiers = () => {
    onAddToCart(
      { ...item, quantity },
      selectedOptions,
      specialInstructions
    );
    setShowModal(false);
    setSelectedOptions([]);
    setSpecialInstructions('');
    setQuantity(1);
  };

  return (
    <>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className={`${isMobile ? 'flex flex-col' : 'flex'}`}>
          {item.image && (
            <div className={`${isMobile ? 'w-full h-48' : 'w-32 h-32'} flex-shrink-0`}>
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                {item.description && (
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                )}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-right">
                <p className="font-bold text-lg text-gray-900">
                  {currencySymbol}{item.price.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <Button onClick={handleAddToCart} variant="primary" className="flex-1">
                {hasModifiers ? 'Customize' : 'Add to Cart'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={item.name}
        >
          <div className="space-y-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-navy focus:border-transparent"
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
              <Button onClick={handleConfirmModifiers} variant="primary" className="flex-1">
                Add to Cart
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
