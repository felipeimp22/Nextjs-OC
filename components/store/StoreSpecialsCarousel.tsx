'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Special {
  id: string;
  title: string;
  description: string;
  image?: string;
  ctaText?: string;
}

interface StoreSpecialsCarouselProps {
  specials: Special[];
  primaryColor: string;
  secondaryColor: string;
  onCtaClick?: (special: Special) => void;
}

// Sample specials data for demonstration
const sampleSpecials: Special[] = [
  {
    id: '1',
    title: 'NEW DISH COMING SOON!',
    description: 'This dish is a bowl of fresh salmon (Salmon Don), elegantly assembled and perfect for those who love pure flavor and soft texture.',
    ctaText: 'order now',
  },
  {
    id: '2',
    title: 'WEEKEND SPECIAL',
    description: 'Get 20% off on all combo meals this weekend. Perfect for family gatherings!',
    ctaText: 'view deals',
  },
  {
    id: '3',
    title: 'LOYALTY REWARDS',
    description: 'Join our loyalty program and earn points on every order. Redeem for free items!',
    ctaText: 'join now',
  },
];

export default function StoreSpecialsCarousel({
  specials = sampleSpecials,
  primaryColor,
  secondaryColor,
  onCtaClick,
}: StoreSpecialsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying || specials.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % specials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, specials.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToPrev = () => {
    goToSlide((currentIndex - 1 + specials.length) % specials.length);
  };

  const goToNext = () => {
    goToSlide((currentIndex + 1) % specials.length);
  };

  if (specials.length === 0) return null;

  const currentSpecial = specials[currentIndex];

  return (
    <div className="relative">
      <h2 className="text-xl font-bold text-gray-900 mb-4 px-4">Specials</h2>
      
      <div className="relative overflow-hidden rounded-2xl mx-4">
        {/* Background gradient */}
        <div
          className="relative p-6 md:p-8 min-h-[200px] md:min-h-[240px]"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${adjustColor(primaryColor, -30)} 100%)`,
          }}
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Text content */}
            <div className="flex-1 text-white">
              <h3 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
                {currentSpecial.title}
              </h3>
              <p className="text-white/90 text-sm md:text-base mb-4 max-w-md">
                {currentSpecial.description}
              </p>
              {currentSpecial.ctaText && (
                <button
                  onClick={() => onCtaClick?.(currentSpecial)}
                  className="px-6 py-2.5 rounded-full font-semibold text-sm transition-all hover:opacity-90 hover:scale-105"
                  style={{ backgroundColor: secondaryColor }}
                >
                  {currentSpecial.ctaText}
                </button>
              )}
            </div>

            {/* Image placeholder - would show actual special image */}
            <div className="w-40 h-40 md:w-52 md:h-52 rounded-full overflow-hidden bg-white/10 flex-shrink-0 relative">
              {currentSpecial.image ? (
                <img
                  src={currentSpecial.image}
                  alt={currentSpecial.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 opacity-80" />
                </div>
              )}
            </div>
          </div>

          {/* Navigation arrows */}
          {specials.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </>
          )}
        </div>

        {/* Dots indicator */}
        {specials.length > 1 && (
          <div className="flex items-center justify-center gap-2 py-4">
            {specials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === currentIndex
                    ? "w-6"
                    : "bg-gray-300 hover:bg-gray-400"
                )}
                style={{
                  backgroundColor: index === currentIndex ? secondaryColor : undefined,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}