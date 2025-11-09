import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export default function Tabs({ tabs, activeTab, onTabChange, className }: TabsProps) {
  return (
    <div className={cn("border-b border-gray-200", className)}>
      <nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "py-3 md:py-4 px-2 md:px-1 border-b-2 font-medium text-xs md:text-sm transition-colors whitespace-nowrap flex-shrink-0",
              activeTab === tab.id
                ? "border-brand-navy text-brand-navy"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
