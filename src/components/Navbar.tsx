'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Book as BookIcon, Search, ShoppingCart, User, LogOut, Menu, X, Images } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { totalItems } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    router.push('/');
  };

  const handleProfileClick = () => {
    // Dispatch event to refresh profile data
    window.dispatchEvent(new Event('profile-refresh'));
    setIsMenuOpen(false);
  };

  const isStaff = user && user.role === 'staff';

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
              <BookIcon className="w-6 h-6 text-orange-600" />
            </div>
            <span className="font-serif text-xl font-bold tracking-tight text-gray-900">The English Channel BD</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors">Home</Link>
            <Link href="/shop" className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors">Books</Link>
            <Link href="/courses" className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors">Courses</Link>
            <Link href="/gallery" className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors flex items-center gap-1">
              <Images className="w-4 h-4" />
              <span>Gallery</span>
            </Link>
            <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-orange-600 transition-colors">About</Link>
            {isStaff && (
              <Link href="/staff" className="text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-1">
                <span>Staff Panel</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {!isStaff && (
              <Link href="/cart" className="p-2 text-gray-400 hover:text-orange-600 transition-colors relative">
                <ShoppingCart className="w-5 h-5" />
                {mounted && totalItems > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>
            )}
            
            {mounted && user ? (
              <div className="hidden md:flex items-center gap-4 border-l pl-4 ml-2">
                <Link href="/profile" onClick={handleProfileClick} className="flex items-center gap-2 group">
                  <img src={user.photoUrl || `https://ui-avatars.com/api/?name=${user.displayName}`} className="w-8 h-8 rounded-full border border-gray-200 group-hover:border-orange-600 transition-colors" alt="" />
                  <span className="hidden lg:block text-sm font-medium text-gray-700 group-hover:text-orange-600 transition-colors">{user.displayName}</span>
                </Link>
                <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : mounted ? (
              <Link href="/auth" className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            ) : null}

            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-orange-600 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      <div className={cn(
        "md:hidden bg-white border-b border-gray-100 overflow-hidden transition-all duration-300",
        isMenuOpen ? "max-h-96" : "max-h-0"
      )}>
        <div className="px-4 pt-2 pb-6 space-y-4">
          <Link href="/" onClick={() => setIsMenuOpen(false)} className="block text-base font-medium text-gray-600 hover:text-orange-600">Home</Link>
          <Link href="/shop" onClick={() => setIsMenuOpen(false)} className="block text-base font-medium text-gray-600 hover:text-orange-600">Books</Link>
          <Link href="/courses" onClick={() => setIsMenuOpen(false)} className="block text-base font-medium text-gray-600 hover:text-orange-600">Courses</Link>
          <Link href="/gallery" onClick={() => setIsMenuOpen(false)} className="block text-base font-medium text-gray-600 hover:text-orange-600 flex items-center gap-2">
            <Images className="w-4 h-4" />
            <span>Gallery</span>
          </Link>
          <Link href="/about" onClick={() => setIsMenuOpen(false)} className="block text-base font-medium text-gray-600 hover:text-orange-600">About</Link>
          {isStaff && (
            <Link href="/staff" onClick={() => setIsMenuOpen(false)} className="block text-base font-bold text-orange-600">Staff Panel</Link>
          )}
          
          <div className="pt-4 border-t border-gray-100">
            {mounted && user ? (
              <div className="space-y-4">
                <Link href="/profile" onClick={handleProfileClick} className="flex items-center gap-3">
                  <img src={user.photoUrl || `https://ui-avatars.com/api/?name=${user.displayName}`} className="w-10 h-10 rounded-full border border-gray-200" alt="" />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{user.displayName}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gray-50 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : mounted ? (
              <Link 
                href="/auth" 
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors"
              >
                <User className="w-5 h-5" />
                <span>Sign In</span>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}