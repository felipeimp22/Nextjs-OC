'use client';

import { ReactNode, useEffect, useRef } from 'react';

interface DropdownMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export default function DropdownMenu({ 
  isOpen, 
  onClose, 
  children, 
  align = 'right',
  className = '' 
}: DropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={menuRef}
      className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 bg-white rounded-md shadow-lg z-50 border border-gray-200 ${className}`}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({ 
  children, 
  onClick,
  className = ''
}: { 
  children: ReactNode; 
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <div className="border-t border-gray-100" />;
}

export function DropdownMenuHeader({ children }: { children: ReactNode }) {
  return (
    <div className="py-2 px-4 border-b border-gray-100">
      {children}
    </div>
  );
}   