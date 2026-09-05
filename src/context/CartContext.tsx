'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Book, CourseCartItem } from '../types';
import { toast } from 'sonner';
import { api, ApiBook, joinStorage } from '../lib/api';
import { useAuth } from './AuthContext';
import { storageUrl } from '@/lib/config';

interface CartContextType {
  cart: CartItem[];
  addToCart: (book: Book, format?: 'physical' | 'pdf') => void;
  addToCartCourse: (course: CourseCartItem) => void;
  removeFromCart: (bookId: string) => void;
  removeFromCartCourse: (courseId: string) => void;
  updateQuantity: (bookId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setMounted(true);
    const savedCart = localStorage.getItem('lumina_cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      const bookIds = parsedCart.filter((item: CartItem) => item.type === 'book').map((item: CartItem) => item.bookId);
      
      Promise.all(
        bookIds.map((id: string) => api.get<ApiBook>(`/books/${id}`).catch(() => null))
      ).then((results) => {
        const enrichedCart = parsedCart.map((item: CartItem, index: number) => {
          if (item.type === 'book') {
            const apiBook = results[index];
            return {
              ...item,
              stock: apiBook ? apiBook.stock : (item.stock || 0),
            };
          }
          return item;
        });
        setCart(enrichedCart);
      });
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('lumina_cart', JSON.stringify(cart));
    }
  }, [cart, mounted]);

  const addToCart = (book: Book, format: 'physical' | 'pdf' = 'physical') => {
    const hasPdf = !!(book.pdfPrice || book.pdfPath);
    const price = format === 'pdf' && book.pdfPrice ? book.pdfPrice : book.price;
    const key = `${book.id}_${format}`;

    let action: 'added' | 'updated' | 'error' | null = null;

    setCart(prev => {
      if (format === 'physical' && hasPdf) {
        prev = prev.filter(item => !(item.bookId === book.id && item.format === 'pdf'));
      }
      const existingItem = prev.find(item => `${item.bookId}_${item.format || 'physical'}` === key);
      if (existingItem) {
        if (existingItem.quantity >= (format === 'pdf' ? 999 : book.stock)) {
          action = 'error';
          return prev;
        }
        action = 'updated';
        return prev.map(item =>
          `${item.bookId}_${item.format || 'physical'}` === key
            ? { ...item, quantity: Math.min(item.quantity + 1, format === 'pdf' ? 999 : book.stock) }
            : item
        );
      }
      action = 'added';
      return [...prev, {
        bookId: book.id,
        type: 'book',
        title: book.title,
        author: book.author,
        price,
        quantity: 1,
        coverUrl: book.coverUrl,
        stock: format === 'pdf' ? 999 : book.stock,
        format,
        includesPdf: format === 'physical' && hasPdf,
      }];
    });

    if (action === 'error') {
      toast.error(`Only ${book.stock} items available in stock`);
    } else if (action === 'updated') {
      toast.success(`Updated quantity for ${book.title}`);
    } else {
      const label = format === 'pdf' ? 'PDF' : 'Physical + PDF';
      toast.success(`Added ${book.title} (${label}) to cart`);
    }
  };

    const addToCartCourse = (course: CourseCartItem) => {
      if (user) {
        const orders = JSON.parse(localStorage.getItem('lumina_orders') || '[]');
        const alreadyOwned = orders.some((order: any) => {
          if (order.status === 'cancelled') return false;
          return order.items.some((item: any) => 
            item.type === 'course' && String(item.courseId || item.bookId) === String(course.id)
          );
        });

        if (alreadyOwned) {
          toast.info(`You already own "${course.title}"`);
          return;
        }
      }

      let action: 'added' | 'exists' | null = null;

      setCart(prev => {
        const existingItem = prev.find(item => item.courseId === String(course.id));
        if (existingItem) {
          action = 'exists';
          return prev;
        }
        action = 'added';
        const courseImg = course.image;
        const finalCoverUrl = courseImg
          ? storageUrl(courseImg)
          : `https://picsum.photos/seed/course${course.id}/400/600`;

        return [...prev, {
          courseId: String(course.id),
          type: 'course',
          title: course.title,
          author: course.instructor,
          price: course.price,
          quantity: 1,
          coverUrl: finalCoverUrl,
          stock: 999,
          instructor: course.instructor,
          slug: course.slug,
        }];
      });

      if (action === 'exists') {
        toast.info(`${course.title} is already in your cart`);
      } else {
        toast.success(`Added ${course.title} to cart`);
      }
    };

  const removeFromCart = (bookId: string) => {
    let title: string | null = null;

    setCart(prev => {
      const itemToRemove = prev.find(item => item.bookId === bookId);
      title = itemToRemove ? itemToRemove.title : null;
      return prev.filter(item => item.bookId !== bookId);
    });

    if (title) toast.info(`Removed ${title} from cart`);
  };

  const removeFromCartCourse = (courseId: string) => {
    let title: string | null = null;

    setCart(prev => {
      const itemToRemove = prev.find(item => item.courseId === courseId);
      title = itemToRemove ? itemToRemove.title : null;
      return prev.filter(item => item.courseId !== courseId);
    });

    if (title) toast.info(`Removed ${title} from cart`);
  };

  const updateQuantity = (bookId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(bookId);
      return;
    }

    let error: string | null = null;

    setCart(prev => {
      const item = prev.find(i => i.bookId === bookId);
      if (item && quantity > item.stock) {
        error = `Only ${item.stock} items available`;
        return prev.map(i => i.bookId === bookId ? { ...i, quantity: i.stock } : i);
      }
      return prev.map(i => i.bookId === bookId ? { ...i, quantity } : i);
    });

    if (error) toast.error(error);
  };

  const clearCart = () => setCart([]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, addToCartCourse, removeFromCart, removeFromCartCourse, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
