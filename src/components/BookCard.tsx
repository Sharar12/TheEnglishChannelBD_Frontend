'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Star, ArrowRight, Heart, FileText } from 'lucide-react';
import { Book } from '@/types';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { useInView } from 'react-intersection-observer';

interface BookCardProps {
  book: Book;
  viewMode?: 'grid' | 'list';
  index?: number;
}

export default function BookCard({ book, viewMode = 'grid', index = 0 }: BookCardProps) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist: toggleWishlistFromContext } = useWishlist();
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const isStaff = user && user.role === 'staff';
  const isInList = isInWishlist(book.id);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isStaff) {
      toast.error('Staff members cannot use wishlist');
      return;
    }

    if (!user) {
      toast.error('Please login to add to wishlist');
      return;
    }

    setWishlistLoading(true);
    try {
      const added = await toggleWishlistFromContext(book.id);
      toast.success(added ? 'Added to wishlist' : 'Removed from wishlist');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, x: -50 }}
        animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
        transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
        whileHover={{ x: 8 }}
        className="group flex gap-6 p-4 bg-white rounded-2xl border border-gray-100 shadow-[0_0_20px_rgba(255,167,38,0.2)] hover:shadow-2xl hover:shadow-orange-500/25 transition-all duration-300"
      >
<Link href={`/book/${book.id}`} className="shrink-0 w-32 h-48 rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-all relative">
          <img
            src={book.coverUrl || 'https://via.placeholder.com/400x600?text=No+Image'}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              const el = e.currentTarget as HTMLImageElement;
              el.src = 'https://via.placeholder.com/400x600?text=No+Image';
            }}
          />
          {(!isStaff && isInList) && (
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(e as any); }}
              className="absolute top-2 right-2 z-50 p-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-[0_4px_15px_rgba(249,115,22,0.5)] transition-transform hover:scale-110"
            >
              <Heart className="w-4 h-4 fill-current" />
            </button>
          )}
          {(!isStaff && !isInList) && (
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(e as any); }}
              className="absolute top-2 right-2 p-2 rounded-full bg-white/90 text-gray-400 hover:text-orange-500 backdrop-blur-md transition-all z-40 shadow-sm hover:z-50"
            >
              <Heart className="w-4 h-4" />
            </button>
          )}
        </Link>
        <div className="flex flex-col justify-between py-2 flex-1">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold uppercase tracking-wider rounded-full">{book.category}</span>
              {book.isNewArrival && <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-full">New</span>}
            </div>
            <Link href={`/book/${book.id}`}>
              <h3 className="font-serif text-xl font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors">{book.title}</h3>
            </Link>
            <p className="text-sm text-gray-500 mb-2 italic">by {book.author}</p>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1 text-orange-400">
                <Star className="w-3 h-3 fill-current" />
                <span className="text-xs font-bold text-gray-600">{(book.rating || 0).toFixed(1)}</span>
              </div>
              {book.reviews_count !== undefined && book.reviews_count > 0 && (
                <span className="text-xs text-gray-400">({book.reviews_count} reviews)</span>
              )}
              {book.purchase_count !== undefined && book.purchase_count > 0 && (
                <span className="text-xs text-gray-400">• {book.purchase_count} sold</span>
              )}
            </div>
            <p className="text-sm text-gray-400 line-clamp-3 mb-4 leading-relaxed">{book.description || 'No description available.'}</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xl font-bold text-gray-900">৳{book.price.toFixed(2)}</span>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-gray-700 font-semibold">Stock: {book.stock}</p>
                {book.purchase_count !== undefined && book.purchase_count > 0 && (
                  <span className="text-xs text-gray-400">• {book.purchase_count} sold</span>
                )}
              </div>
            </div>
            {!isStaff && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => addToCart(book, 'physical')}
                  disabled={book.stock === 0}
                  title="Add physical book to cart"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95",
                    book.stock === 0 
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
                      : "bg-gray-900 text-white hover:bg-orange-600"
                  )}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
                {(book.pdfPrice || book.pdfPath) && (
                  <button 
                    onClick={() => addToCart(book, 'pdf')}
                    title="Add PDF version to cart"
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 bg-gray-900 text-white hover:bg-blue-600"
                  >
                    <FileText className="w-4 h-4" />
                    <span>PDF</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 50, scale: 0.95 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="group flex flex-col bg-white rounded-2xl border border-gray-100 shadow-[0_0_20px_rgba(255,167,38,0.2)] hover:shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 overflow-hidden relative"
    >
{(!isStaff && isInList) && (
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(e as any); }}
            className="absolute top-3 right-3 z-50 p-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-[0_4px_15px_rgba(249,115,22,0.5)] transition-transform hover:scale-110"
          >
            <Heart className="w-4 h-4 fill-current" />
          </button>
        )}
        {(!isStaff && !isInList) && (
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(e as any); }}
            className="absolute top-3 right-3 p-2.5 rounded-full bg-white/90 text-gray-400 hover:text-orange-500 backdrop-blur-md transition-all z-40 shadow-sm hover:z-50"
          >
            <Heart className="w-4 h-4" />
          </button>
        )}
      <Link href={`/book/${book.id}`} className="relative aspect-[2/3] overflow-hidden">
        <img
          src={book.coverUrl || 'https://via.placeholder.com/400x600?text=No+Image'}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            const el = e.currentTarget as HTMLImageElement;
            el.src = 'https://via.placeholder.com/400x600?text=No+Image';
          }}
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="p-3 bg-white rounded-full text-gray-900 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <ArrowRight className="w-6 h-6" />
          </div>
        </div>
        {book.isFeatured && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-600 via-amber-400 to-orange-500 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-lg shadow-orange-500/30 z-20">
            <Star className="h-3 w-3 fill-current" />
            Featured
          </div>
        )}
      </Link>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{book.category}</span>
          <div className="flex items-center gap-1 text-orange-400">
            <Star className="w-3 h-3 fill-current" />
            <span className="text-[10px] font-bold text-gray-600">{(book.rating || 0).toFixed(1)}</span>
            {book.reviews_count !== undefined && book.reviews_count > 0 && (
              <span className="text-[9px] font-medium text-gray-400">({book.reviews_count})</span>
            )}
          </div>
        </div>
        <Link href={`/book/${book.id}`}>
          <h3 className="font-serif text-lg font-bold text-gray-900 mb-1 group-hover:text-orange-600 transition-colors line-clamp-1">{book.title}</h3>
        </Link>
        <p className="text-xs text-gray-500 mb-4 italic">by {book.author}</p>
        <div className="mt-auto flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-gray-900">৳{book.price.toFixed(2)}</span>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-gray-700 font-semibold">Stock: {book.stock}</p>
              {book.purchase_count !== undefined && book.purchase_count > 0 && (
                <span className="text-xs text-gray-400">• {book.purchase_count} sold</span>
              )}
            </div>
          </div>
          {!isStaff && (
            <div className="flex items-center gap-1">
              <button 
                onClick={() => addToCart(book, 'physical')}
                disabled={book.stock === 0}
                title="Add physical book to cart"
                className={cn(
                  "p-2.5 rounded-xl transition-all active:scale-90",
                  book.stock === 0 
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                    : "bg-gray-50 text-gray-900 hover:bg-orange-600 hover:text-white"
                )}
              >
                <ShoppingCart className="w-5 h-5" />
              </button>
              {(book.pdfPrice || book.pdfPath) && (
                <button 
                  onClick={() => addToCart(book, 'pdf')}
                  title="Add PDF version to cart"
                  className="p-2.5 rounded-xl transition-all active:scale-90 bg-gray-50 text-gray-900 hover:bg-blue-600 hover:text-white"
                >
                  <FileText className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
