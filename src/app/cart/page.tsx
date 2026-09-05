'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import {
  Trash2, Plus, Minus, ArrowRight, ShoppingBag,
  GraduationCap, Shield, RefreshCw, Sparkles,
  BookOpen, Tag, ChevronRight, Package, FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

/* ── Micro helpers ──────────────────────────────────────────────── */
function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${className}`}>
      {children}
    </span>
  );
}

function TrustBadge({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-gray-400">
      <Icon className="w-3.5 h-3.5 text-emerald-500" />
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
export default function Cart() {
  const { cart, removeFromCart, removeFromCartCourse, updateQuantity, totalPrice, totalItems } = useCart();
  const { user } = useAuth();
  const router  = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  /* ── Empty state ── */
  if (cart.length === 0) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-20 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22,1,0.36,1] }}
        className="space-y-8 max-w-lg">

        {/* Icon */}
        <div className="relative w-28 h-28 mx-auto">
          <div className="absolute inset-0 rounded-3xl bg-orange-50 border border-orange-100 shadow-xl shadow-orange-100/60" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-orange-400" />
          </div>
          {/* dot accents */}
          {['top-0 right-0', 'bottom-2 left-0'].map((pos, i) => (
            <div key={i} className={`absolute ${pos} w-4 h-4 bg-amber-400 rounded-full border-2 border-white shadow-md`} />
          ))}
        </div>

        <div>
          <h2 className="font-serif text-4xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
          <p className="text-gray-500 leading-relaxed">
            Looks like you haven't added any books or courses yet.
            Start exploring our curated collection!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/shop"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-orange-600 to-amber-500
              text-white rounded-2xl font-bold hover:opacity-90 transition-all
              shadow-xl shadow-orange-200 hover:shadow-orange-300 hover:-translate-y-0.5">
            <BookOpen className="w-4.5 h-4.5" /> Browse Books <ChevronRight className="w-4 h-4" />
          </Link>
          <Link href="/courses"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-gray-900 text-white rounded-2xl
              font-bold hover:bg-gray-800 transition-all shadow-xl shadow-gray-900/20 hover:-translate-y-0.5">
            <GraduationCap className="w-4.5 h-4.5" /> Browse Courses
          </Link>
        </div>
      </motion.div>
    </div>
  );

  const physicalBookIds = new Set(cart.filter(i => i.type === 'book' && i.includesPdf).map(i => i.bookId));
  const displayCart = cart.filter(i => !(i.type === 'book' && i.format === 'pdf' && physicalBookIds.has(i.bookId)));
  const bookItems   = displayCart.filter(i => i.type === 'book');
  const courseItems = displayCart.filter(i => i.type === 'course');

  return (
    <div className="space-y-10 pb-24">

      {/* ── Page header ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-orange-50 border border-orange-100 rounded-full text-xs font-bold text-orange-600 uppercase tracking-widest mb-4">
            <Sparkles className="w-3 h-3" /> Your Selection
          </div>
          <h1 className="font-serif text-5xl font-bold text-gray-900 leading-tight tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-gray-400 mt-2 text-sm">
            {totalItems} item{totalItems !== 1 ? 's' : ''} ready for checkout
          </p>
        </div>
        <Link href="/shop"
          className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors group">
          Continue Shopping
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </motion.div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ══ Items column ══ */}
        <div className="lg:col-span-8 space-y-4">

          {/* Section label — books */}
          {bookItems.length > 0 && (
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-1.5 rounded-lg bg-orange-50 border border-orange-100">
                <BookOpen className="w-4 h-4 text-orange-500" />
              </div>
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Books ({bookItems.length})</h2>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {displayCart.map((item, idx) => {
              const isCourse = item.type === 'course';
              const key = item.bookId || item.courseId;

              /* section divider between books and courses */
              const prevItem = displayCart[idx - 1];
              const showCourseDivider = isCourse && prevItem && prevItem.type === 'book';

              return (
                <motion.div key={key} layout
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -24, scale: 0.96 }}
                  transition={{ duration: 0.4, ease: [0.22,1,0.36,1] }}>

                  {/* Course section label */}
                  {showCourseDivider && (
                    <div className="flex items-center gap-2.5 mb-4 mt-6">
                      <div className="p-1.5 rounded-lg bg-violet-50 border border-violet-100">
                        <GraduationCap className="w-4 h-4 text-violet-500" />
                      </div>
                      <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest">Courses ({courseItems.length})</h2>
                    </div>
                  )}

                  <div className="group flex gap-5 p-5 bg-white rounded-2xl border border-gray-100/80
                    hover:border-orange-100 hover:shadow-xl hover:shadow-orange-50/60
                    transition-all duration-300 relative overflow-hidden">

                    {/* left accent bar on hover */}
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity rounded-l-2xl" />

                    {/* ── Thumbnail ── */}
                    <div className={cn(
                      'relative flex-shrink-0 rounded-xl overflow-hidden shadow-md',
                      isCourse ? 'w-[140px] h-[80px]' : 'w-[72px] aspect-[2/3]'
                    )}>
                      {item.coverUrl ? (
                        <img src={item.coverUrl} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
                          {isCourse
                            ? <GraduationCap className="w-7 h-7 text-orange-400" />
                            : <BookOpen className="w-6 h-6 text-orange-400" />}
                        </div>
                      )}
                      {!item.coverUrl && isCourse && (
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-600/70 to-amber-500/70 flex items-center justify-center">
                          <GraduationCap className="w-8 h-8 text-white drop-shadow-lg" />
                        </div>
                      )}
                    </div>

                    {/* ── Info ── */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-start gap-2 mb-1">
                          {isCourse
                            ? <Link href={`/courses/${item.slug}`}
                                className="font-serif text-lg font-bold text-gray-900 hover:text-orange-600 transition-colors line-clamp-1 leading-snug">
                                {item.title}
                              </Link>
                            : <Link href={`/book/${item.bookId}`}
                                className="font-serif text-lg font-bold text-gray-900 hover:text-orange-600 transition-colors line-clamp-1 leading-snug">
                                {item.title}
                              </Link>
                          }
                        </div>

                        <p className="text-sm text-gray-400 mb-2.5 line-clamp-1">{item.author}</p>

                        <div className="flex flex-wrap gap-2">
                          {isCourse ? (
                            <Badge className="bg-violet-50 text-violet-600 border-violet-100">
                              <GraduationCap className="w-2.5 h-2.5" /> Course Enrollment
                            </Badge>
                          ) : item.format === 'pdf' ? (
                            <Badge className="bg-blue-50 text-blue-600 border-blue-100">
                              <FileText className="w-2.5 h-2.5" /> PDF Download
                            </Badge>
                          ) : item.includesPdf ? (
                            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100">
                              <FileText className="w-2.5 h-2.5" /> Includes PDF Version
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-50 text-gray-500 border-gray-100">
                              <Package className="w-2.5 h-2.5" /> Stock: {item.stock}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Qty + remove */}
                      <div className="flex items-center gap-3">
                        {isCourse ? (
                          <Badge className="bg-orange-50 text-orange-500 border-orange-100">
                            <Tag className="w-2.5 h-2.5" /> Single License
                          </Badge>
                        ) : item.format === 'pdf' ? (
                          <Badge className="bg-blue-50 text-blue-600 border-blue-100">
                            <FileText className="w-2.5 h-2.5" /> Digital License
                          </Badge>
                        ) : (
                          <div className="flex items-center bg-gray-50 border border-gray-100 rounded-xl overflow-hidden">
                            <button onClick={() => updateQuantity(item.bookId!, item.quantity - 1)}
                              className="px-3 py-2 text-gray-500 hover:bg-orange-50 hover:text-orange-600 transition-all">
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-9 text-center text-sm font-bold text-gray-900 bg-white border-x border-gray-100 py-2">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.bookId!, item.quantity + 1)}
                              disabled={item.quantity >= item.stock}
                              className={cn('px-3 py-2 transition-all',
                                item.quantity >= item.stock
                                  ? 'text-gray-200 cursor-not-allowed'
                                  : 'text-gray-500 hover:bg-orange-50 hover:text-orange-600')}>
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => isCourse ? removeFromCartCourse(item.courseId!) : removeFromCart(item.bookId!)}
                          className="p-2 rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* ── Price ── */}
                    <div className="text-right flex-shrink-0 flex flex-col justify-between items-end">
                      <div>
                        <p className="text-xl font-extrabold text-gray-900 tracking-tight">
                          ৳{(item.price * item.quantity).toFixed(2)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-gray-400 mt-0.5">৳{item.price.toFixed(2)} each</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* ══ Order Summary sidebar ══ */}
        <div className="lg:col-span-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="sticky top-24 rounded-3xl overflow-hidden border border-gray-100 shadow-2xl shadow-gray-100/80 bg-white">

            {/* Top accent */}
            <div className="h-1.5 bg-gradient-to-r from-orange-600 to-amber-400" />

            <div className="p-7 space-y-7">
              <div>
                <h3 className="font-serif text-2xl font-bold text-gray-900">Order Summary</h3>
                <p className="text-sm text-gray-400 mt-0.5">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
              </div>

              {/* Line items */}
              <div className="space-y-3">
                {bookItems.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <BookOpen className="w-3.5 h-3.5 text-orange-400" />
                      Books ({bookItems.length})
                    </div>
                    <span className="font-semibold text-gray-700">
                      ৳{bookItems.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}
                    </span>
                  </div>
                )}
                {courseItems.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-gray-500">
                      <GraduationCap className="w-3.5 h-3.5 text-violet-400" />
                      Courses ({courseItems.length})
                    </div>
                    <span className="font-semibold text-gray-700">
                      ৳{courseItems.reduce((s, i) => s + i.price, 0).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-emerald-400" /> Shipping
                  </span>
                  <span className="text-emerald-600 font-semibold text-xs uppercase tracking-wide">Calculated at checkout</span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

              {/* Total */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Total</p>
                  <p className="text-4xl font-extrabold text-gray-900 tracking-tight mt-0.5">
                    ৳{totalPrice.toFixed(2)}
                  </p>
                </div>
                <span className="text-xs text-gray-400 font-medium pb-1">BDT</span>
              </div>

              {/* CTA */}
              <button onClick={() => user ? router.push('/checkout') : router.push('/auth')}
                className="w-full group py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5
                  bg-gradient-to-r from-orange-600 to-amber-500 text-white
                  hover:from-orange-500 hover:to-amber-400
                  shadow-xl shadow-orange-200 hover:shadow-orange-300
                  hover:-translate-y-0.5 active:translate-y-0
                  transition-all duration-200">
                Proceed to Checkout
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Trust badges */}
              <div className="pt-1">
                <div className="flex items-center justify-around">
                  <TrustBadge icon={Shield} label="Secure Checkout" />
                  <div className="w-px h-5 bg-gray-100" />
                  <TrustBadge icon={RefreshCw} label="Free Returns" />
                  <div className="w-px h-5 bg-gray-100" />
                  <TrustBadge icon={Sparkles} label="Best Price" />
                </div>
              </div>

              {/* Payment icons strip */}
              <div className="flex items-center justify-center gap-2 pt-1">
                {['bKash', 'Nagad', 'Rocket', 'Card'].map(method => (
                  <div key={method} className="px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-lg">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">{method}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}