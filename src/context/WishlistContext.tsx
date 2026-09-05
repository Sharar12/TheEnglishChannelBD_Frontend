'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlistMap: Record<string, boolean>;
  checkWishlist: (bookIds: string[]) => Promise<void>;
  toggleWishlist: (bookId: string) => Promise<boolean>;
  isInWishlist: (bookId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [wishlistMap, setWishlistMap] = useState<Record<string, boolean>>({});
  const [pendingBookIds, setPendingBookIds] = useState<string[]>([]);

  // Listen for logout event and clear wishlist
  useEffect(() => {
    const handleClearWishlist = () => {
      setWishlistMap({});
    };

    window.addEventListener('wishlist-clear', handleClearWishlist);
    return () => window.removeEventListener('wishlist-clear', handleClearWishlist);
  }, []);

  // Retry pending wishlist check when user finishes loading
  useEffect(() => {
    if (!loading && !user && pendingBookIds.length > 0) {
      setWishlistMap({});
      setPendingBookIds([]);
    } else if (!loading && user && pendingBookIds.length > 0) {
      const fetchWishlist = async () => {
        try {
          const res = await api.post<{ wishlist: Record<string, boolean> }>('/wishlist/check-batch', {
            book_ids: pendingBookIds.map(id => parseInt(id))
          });
          setWishlistMap(prev => ({ ...prev, ...(res.wishlist || {}) }));
          setPendingBookIds([]);
        } catch (err: any) {
          if (err?.message?.includes('401') || err?.message?.includes('Unauthenticated')) {
            setWishlistMap({});
          }
          console.error('Failed to check wishlist:', err);
          setPendingBookIds([]);
        }
      };
      fetchWishlist();
    }
  }, [user, loading]);

  const checkWishlist = useCallback(async (bookIds: string[]) => {
    if (loading) {
      // Store the request to retry later
      setPendingBookIds(bookIds);
      return;
    }

    if (!user || bookIds.length === 0) {
      // Clear wishlist when user is not logged in
      setWishlistMap({});
      setPendingBookIds([]);
      return;
    }

    try {
      const res = await api.post<{ wishlist: Record<string, boolean> }>('/wishlist/check-batch', {
        book_ids: bookIds.map(id => parseInt(id))
      });
      setWishlistMap(prev => ({ ...prev, ...(res.wishlist || {}) }));
      setPendingBookIds([]);
    } catch (err: any) {
      // Silently handle 401 errors (user logged out)
      if (err?.message?.includes('401') || err?.message?.includes('Unauthenticated')) {
        setWishlistMap({});
        setPendingBookIds([]);
        return;
      }
      console.error('Failed to check wishlist:', err);
    }
  }, [user, loading]);

  const toggleWishlist = useCallback(async (bookId: string): Promise<boolean> => {
    try {
      const res = await api.post<{ action: string }>('/wishlist/toggle', {
        book_id: parseInt(bookId),
      });
      setWishlistMap(prev => ({ ...prev, [bookId]: res.action === 'added' }));
      return res.action === 'added';
    } catch (err: any) {
      // Handle 401 errors (user not authenticated)
      if (err?.message?.includes('401') || err?.message?.includes('Unauthenticated')) {
        throw new Error('Please log in to use the wishlist');
      }
      console.error('Failed to toggle wishlist:', err);
      throw err;
    }
  }, []);

  const isInWishlist = useCallback((bookId: string): boolean => {
    return wishlistMap[bookId] || false;
  }, [wishlistMap]);

  return (
    <WishlistContext.Provider value={{ wishlistMap, checkWishlist, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}
