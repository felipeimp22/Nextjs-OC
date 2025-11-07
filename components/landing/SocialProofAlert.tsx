'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { CheckCircle, X } from 'lucide-react';

// Fake restaurant data
const recentSignups = [
  { name: 'Bella Italia', location: 'San Francisco', timeAgo: '2 minutes' },
  { name: 'Tokyo Fusion', location: 'Chicago', timeAgo: '5 minutes' },
  { name: 'Le Petit Bistro', location: 'New York', timeAgo: '7 minutes' },
  { name: 'Taco Fiesta', location: 'Austin', timeAgo: '12 minutes' },
  { name: 'The Hungry Dragon', location: 'Seattle', timeAgo: '15 minutes' },
  { name: 'Olive & Herb', location: 'Miami', timeAgo: '18 minutes' },
  { name: 'Spice Paradise', location: 'Denver', timeAgo: '22 minutes' },
  { name: 'Ocean Breeze Sushi', location: 'Los Angeles', timeAgo: '25 minutes' },
];

export default function SocialProofAlert() {
  const [visible, setVisible] = useState(true);
  const [currentSignup, setCurrentSignup] = useState(0);
  const t = useTranslations('socialProof');

  useEffect(() => {
    // Rotate through signups every 5 seconds
    const interval = setInterval(() => {
      setCurrentSignup((prev) => (prev + 1) % recentSignups.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  const signup = recentSignups[currentSignup];

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm animate-fade-in">
      <div className="bg-white border border-brand-red/20 shadow-lg rounded-lg relative overflow-hidden p-4">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-brand-red to-brand-blue"></div>

        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-brand-red/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckCircle className="h-4 w-4 text-brand-red" />
          </div>

          <div className="text-gray-700 pt-0.5 flex-1">
            <span className="font-semibold text-brand-navy">{signup.name}</span> in{' '}
            {signup.location} {t('signedUp')} {signup.timeAgo} {t('ago')}
          </div>

          <button
            onClick={() => setVisible(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}