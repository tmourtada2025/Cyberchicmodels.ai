import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart } from 'lucide-react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { CartIcon } from './CartIcon';
import { AdminKeyIcon } from './AdminKeyIcon';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const favorites = useSelector((state: RootState) => state.favorites.items);
  const location = useLocation();

  return (
    <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-serif">CyberChicModels.ai</Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/models" className="text-gray-700 hover:text-black">Models</Link>
            <Link to="/styles" className="text-gray-700 hover:text-black">Styles</Link>
            <Link to="/about" className="text-gray-700 hover:text-black">About</Link>
            <Link to="/contact" className="text-gray-700 hover:text-black">Contact</Link>
            <Link to="/favorites" className="relative text-gray-700 hover:text-black">
              Favorites
              {favorites.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-rose-300 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {favorites.length}
                </span>
              )}
            </Link>
            <CartIcon />
            <AdminKeyIcon />
          </div>
          <div className="md:hidden flex items-center space-x-4">
            <CartIcon />
            <AdminKeyIcon />
            <button onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/models" className="block px-3 py-2 text-gray-700">Models</Link>
            <Link to="/styles" className="block px-3 py-2 text-gray-700">Styles</Link>
            <Link to="/about" className="block px-3 py-2 text-gray-700">About</Link>
            <Link to="/contact" className="block px-3 py-2 text-gray-700">Contact</Link>
            <Link to="/favorites" className="block px-3 py-2 text-gray-700">Favorites</Link>
          </div>
        </div>
      )}
    </nav>
  );
}