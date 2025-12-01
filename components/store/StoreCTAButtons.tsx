'use client';

interface StoreCTAButtonsProps {
  primaryColor: string;
  secondaryColor: string;
  onOrderNow: () => void;
  onSeeWhatsNew: () => void;
}

export default function StoreCTAButtons({
  primaryColor,
  secondaryColor,
  onOrderNow,
  onSeeWhatsNew,
}: StoreCTAButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-6 px-4">
      <button
        onClick={onOrderNow}
        className="px-8 py-3 rounded-full font-semibold text-white transition-all hover:opacity-90 hover:scale-105 shadow-lg"
        style={{ backgroundColor: secondaryColor }}
      >
        Order now
      </button>
      <button
        onClick={onSeeWhatsNew}
        className="px-8 py-3 rounded-full font-semibold border-2 transition-all hover:opacity-80"
        style={{ 
          borderColor: primaryColor,
          color: primaryColor,
          backgroundColor: 'transparent',
        }}
      >
        see what&apos;s new
      </button>
    </div>
  );
}