"use client";

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/hooks/useCart';

interface CartIconProps {
  onClick: () => void;
  className?: string;
}

export const CartIcon: React.FC<CartIconProps> = ({ onClick, className = "" }) => {
  const { itemCount } = useCart();

  return (
    <div className="relative cursor-pointer" onClick={onClick}>
      <ShoppingCart className={`w-6 h-6 ${className}`} />
      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
          {itemCount}
        </span>
      )}
    </div>
  );
};
