'use client';

import { useRef } from 'react';

interface StoreHeroSectionProps {
  restaurant: {
    name: string;
    logo?: string | null;
    colors: { primary: string; secondary: string; accent: string };
  };
}

export default function StoreHeroSection({ restaurant }: StoreHeroSectionProps) {
  return (
    <div
      className="relative w-full h-48 md:h-72 lg:h-80"
      style={{ backgroundColor: restaurant.colors.primary }}
    >
      {/* Gradient overlay for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${restaurant.colors.primary} 0%, ${adjustColor(restaurant.colors.primary, -20)} 100%)`,
        }}
      />
      
      {/* Decorative pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, ${restaurant.colors.secondary} 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
        }}
      />

      {/* Logo centered */}
      {restaurant.logo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={restaurant.logo}
            alt={restaurant.name}
            className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover bg-white shadow-xl"
          />
        </div>
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