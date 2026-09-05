'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Book } from '@/types';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  X,
  Clock,
  HelpCircle,
  Heart,
  Send,
  Shield,
  ShoppingCart,
  Sparkles,
  Star,
  Truck,
  Quote,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { api, ApiBook, mapApiBookToBook } from '@/lib/api';
import { toast } from 'sonner';

interface ApiReview {
  id: number;
  book_id: number;
  user_id: number | null;
  user_name: string;
  user_email: string | null;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
}

interface ApiQuestion {
  id: number;
  book_id: number;
  user_id: number | null;
  user_name: string;
  user_email: string | null;
  question: string;
  answer: string | null;
  is_answered: boolean;
  is_approved: boolean;
  created_at: string;
}

function RatingStars({
  value,
  className = 'w-4 h-4',
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.floor(value);
        const partial = !filled && star === Math.ceil(value) && value % 1 !== 0;

        return (
          <span key={star} className="relative inline-block">
            <Star className={cn(className, 'text-gray-200 fill-gray-200')} />
            {(filled || partial) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? '100%' : `${(value % 1) * 100}%` }}
              >
                <Star className={cn(className, 'text-orange-400 fill-orange-400')} />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

export default function BookDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist: toggleWishlistFromContext } = useWishlist();

  const [book, setBook] = useState<Book | null>(null);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [questions, setQuestions] = useState<ApiQuestion[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);

  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(2);

  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [newQuestion, setNewQuestion] = useState('');
  const [reviewPage, setReviewPage] = useState(0);
  const [questionPage, setQuestionPage] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const [hasPurchased, setHasPurchased] = useState(false);
  const [userReview, setUserReview] = useState<ApiReview | null>(null);
  const [editingReview, setEditingReview] = useState(false);

  useEffect(() => {
    setPreviewModalOpen(false);
    setPreviewZoom(2);
    setReviewPage(0);
    setQuestionPage(0);
    setEditingReview(false);
    setUserReview(null);
    setHasPurchased(false);
    setNewReview({ rating: 5, comment: '' });
    setNewQuestion('');
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      api.get<ApiBook>(`/books/${id}`),
      api.get<{ reviews: ApiReview[]; average_rating: number; total: number }>(`/books/${id}/reviews`),
      api.get<{ questions: ApiQuestion[]; total: number }>(`/books/${id}/questions`),
    ])
      .then(([bookRes, reviewsRes, questionsRes]) => {
        setBook(mapApiBookToBook(bookRes));
        setReviews(reviewsRes.reviews || []);
        setAverageRating(reviewsRes.average_rating || 0);
        setQuestions(questionsRes.questions || []);
      })
      .catch((err) => {
        console.error('Book detail error:', err);
        setBook(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!user || !id) {
      setHasPurchased(false);
      return;
    }

    const checkPurchase = async () => {
      try {
        const ordersRes = await api.get<any>('/orders');
        const orders = Array.isArray(ordersRes) ? ordersRes : ordersRes?.data || [];

        const purchased = orders.some(
          (order: any) =>
            order.status === 'delivered' &&
            order.items.some((item: any) => String(item.book_id) === String(id))
        );

        setHasPurchased(purchased);
      } catch {
        const orders = JSON.parse(localStorage.getItem('lumina_orders') || '[]');
        const purchased = orders.some(
          (order: any) =>
            order.status === 'delivered' &&
            order.items.some((item: any) => String(item.book_id) === String(id))
        );

        setHasPurchased(purchased);
      }
    };

    checkPurchase();
  }, [user, id]);

  useEffect(() => {
    if (!user) {
      setUserReview(null);
      setEditingReview(false);
      return;
    }

    const mine =
      reviews.find(
        (r) =>
          r.user_email === user.email ||
          (user.displayName && r.user_name === user.displayName)
      ) || null;

    setUserReview(mine);
    setEditingReview(false);

    if (mine) {
      setNewReview({ rating: mine.rating, comment: mine.comment });
    } else {
      setNewReview({ rating: 5, comment: '' });
    }
  }, [user, reviews]);

  const isStaff = user?.role === 'staff';
  const wishlistActive = !!id && isInWishlist(id);
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    return {
      star,
      count,
      percentage: reviews.length > 0 ? (count / reviews.length) * 100 : 0,
    };
  });
  const summary = book?.description || '';

  const REVIEWS_PER_PAGE = 5;
  const QUESTIONS_PER_PAGE = 5;

  const sortedReviews = [...reviews].sort((a, b) => b.rating - a.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const totalReviewPages = Math.max(1, Math.ceil(sortedReviews.length / REVIEWS_PER_PAGE));
  const clampedReviewPage = Math.min(reviewPage, totalReviewPages - 1);
  const currentPageReviews = sortedReviews.slice(clampedReviewPage * REVIEWS_PER_PAGE, (clampedReviewPage + 1) * REVIEWS_PER_PAGE);

  const sortedQuestions = [...questions].sort((a, b) => {
    if (a.answer && !b.answer) return -1;
    if (!a.answer && b.answer) return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const totalQuestionPages = Math.max(1, Math.ceil(sortedQuestions.length / QUESTIONS_PER_PAGE));
  const clampedQuestionPage = Math.min(questionPage, totalQuestionPages - 1);
  const currentPageQuestions = sortedQuestions.slice(clampedQuestionPage * QUESTIONS_PER_PAGE, (clampedQuestionPage + 1) * QUESTIONS_PER_PAGE);

  const handleAddToCart = (format: 'physical' | 'pdf') => {
    if (isStaff) { toast.error('Staff accounts cannot purchase books.'); return; }
    if (book) addToCart(book, format);
  };

  const handleToggleWishlist = async () => {
    if (isStaff) { toast.error('Staff accounts cannot use wishlist.'); return; }
    if (!user) {
      toast.error('Please login to add to wishlist');
      router.push('/auth');
      return;
    }

    if (!id) return;

    setWishlistLoading(true);
    try {
      const added = await toggleWishlistFromContext(id);
      toast.success(added ? 'Added to wishlist' : 'Removed from wishlist');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || submitting || !user) return;

    const name = user.displayName?.trim() || user.email?.split('@')[0] || 'Reader';

    if (!hasPurchased) {
      toast.error('You can only review books you have received');
      return;
    }

    setSubmitting(true);

    try {
      if (userReview) {
        await api.put(`/books/${id}/reviews/${userReview.id}`, {
          user_name: name,
          user_email: user.email,
          rating: newReview.rating,
          comment: newReview.comment,
        });
        toast.success('Review updated successfully!');
      } else {
        await api.post(`/books/${id}/reviews`, {
          user_name: name,
          user_email: user.email,
          rating: newReview.rating,
          comment: newReview.comment,
        });
        toast.success('Review submitted!');
      }

      setEditingReview(false);
      setNewReview({ rating: 5, comment: '' });

      const res = await api.get<{ reviews: ApiReview[]; average_rating: number; total: number }>(
        `/books/${id}/reviews`
      );
      setReviews(res.reviews || []);
      setAverageRating(res.average_rating || 0);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || submitting || !user) return;

    const name = user.displayName?.trim() || user.email?.split('@')[0] || 'Reader';

    setSubmitting(true);

    try {
      await api.post(`/books/${id}/questions`, {
        user_name: name,
        user_email: user.email,
        question: newQuestion,
      });

      toast.success('Question submitted!');
      setNewQuestion('');

      const res = await api.get<{ questions: ApiQuestion[]; total: number }>(`/books/${id}/questions`);
      setQuestions(res.questions || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit question');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[72vh] items-center justify-center px-4">
        <div className="relative overflow-hidden rounded-[2rem] border border-orange-100/70 bg-white/85 px-10 py-12 shadow-[0_30px_80px_rgba(0,0,0,0.08)] backdrop-blur-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.08),transparent_55%)]" />
          <div className="relative flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-[3px] border-orange-100 border-t-orange-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-orange-500" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.24em] text-orange-500 uppercase">
                Curating Details
              </p>
              <p className="mt-2 text-sm text-gray-500">Preparing an elevated reading experience…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex min-h-[68vh] flex-col items-center justify-center px-4 text-center">
        <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-orange-50 ring-1 ring-orange-100">
          <BookOpen className="h-9 w-9 text-orange-300" />
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Book not found</h2>
        <p className="mt-3 max-w-md text-sm leading-7 text-gray-500">
          The book you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 hover:shadow-orange-600/30"
        >
          Browse Collection
          <ArrowLeft className="h-4 w-4 rotate-180" />
        </Link>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[2.2rem] p-6 md:p-8 lg:p-10 pb-24">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.95),transparent_30%),linear-gradient(to_bottom,#ffffff,#fff7f2_45%,#ffffff)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 bg-gradient-to-b from-orange-50/70 to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <Link
          href="/shop"
          className="inline-flex items-center gap-3 rounded-full border border-orange-100/70 bg-white/80 px-4 py-2 text-[13px] font-semibold uppercase tracking-[0.18em] text-gray-500 shadow-sm backdrop-blur-md transition hover:border-orange-200 hover:text-orange-600 hover:shadow-md"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-orange-500">
            <ArrowLeft className="h-3.5 w-3.5" />
          </span>
          Back to Collection
        </Link>
      </motion.div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
        {/* Left / Cover */}
        <motion.aside
          className="lg:col-span-5 xl:col-span-4"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="sticky top-24 space-y-6">
            <div className="relative overflow-hidden rounded-[2.2rem] border border-orange-100/70 bg-white/85 p-4 shadow-[0_30px_80px_rgba(0,0,0,0.09)] backdrop-blur-xl">
              <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-orange-100/35 blur-3xl" />
              <div className="absolute -right-10 bottom-10 h-40 w-40 rounded-full bg-amber-100/30 blur-3xl" />

              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-600">
                    <Sparkles className="h-3.5 w-3.5" />
                    Curated Pick
                  </div>
                  <div className="rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 ring-1 ring-gray-100">
                    {book.category}
                  </div>
                </div>

                <div className="group relative">
                  <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-orange-200/35 via-orange-100/20 to-transparent blur-2xl opacity-70 transition-opacity duration-700 group-hover:opacity-100" />
                  <button
                    type="button"
                    onClick={() => { if (book.previewImages?.length) setPreviewModalOpen(true); }}
                    className="relative w-full aspect-[3/4] overflow-hidden rounded-[1.75rem] bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.04)] text-left"
                  >
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
                  </button>
                </div>

                {book.previewImages && book.previewImages.length > 0 && (
                  <div className="mt-4">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                      {book.previewImages.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPreviewModalOpen(true)}
                          className="shrink-0 w-16 h-20 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 shadow-sm hover:border-orange-200 hover:shadow-md transition-all"
                        >
                          <img src={url} alt={`Page ${i + 1}`} className="w-full h-full object-cover" onContextMenu={(e) => e.preventDefault()} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 space-y-3">
                    <button
                      onClick={() => handleAddToCart('physical')}
                      disabled={book.stock <= 0}
                      className="group flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-orange-600/20 transition hover:from-orange-700 hover:to-orange-600 hover:shadow-orange-600/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ShoppingCart className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
                      <span>Buy Physical Book</span>
                      <span className="ml-auto text-orange-100">৳{book.price.toFixed(2)}</span>
                    </button>

                    {book.pdfPrice && (
                      <button
                        onClick={() => handleAddToCart('pdf')}
                        className="group flex w-full items-center gap-3 rounded-2xl border border-orange-100 bg-white px-5 py-4 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50/50 hover:text-orange-600 active:scale-[0.99]"
                      >
                        <BookOpen className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
                        <span>Buy PDF Version</span>
                        <span className="ml-auto text-orange-500">৳{book.pdfPrice.toFixed(2)}</span>
                      </button>
                    )}

                    {book.pdfPrice && (
                      <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-orange-50 p-4 ring-1 ring-emerald-100/70">
                        <p className="text-xs font-semibold leading-relaxed text-emerald-700">
                          Buy the physical book and get the PDF + a full course on this book absolutely free!
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleToggleWishlist}
                      disabled={wishlistLoading}
                      className={cn(
                        'flex w-full items-center justify-center gap-3 rounded-2xl border px-5 py-3.5 text-sm font-semibold transition active:scale-[0.99]',
                        wishlistActive
                          ? 'border-red-100 bg-red-50 text-red-500 hover:bg-red-100/70'
                          : 'border-orange-100 bg-white text-gray-700 hover:border-orange-200 hover:bg-orange-50/50 hover:text-orange-600'
                      )}
                    >
                      <Heart className={cn('h-[18px] w-[18px]', wishlistActive && 'fill-current')} />
                      <span>{wishlistActive ? 'Saved to Wishlist' : 'Add to Wishlist'}</span>
                    </button>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-2.5">
                    {[
                      { icon: Shield, label: 'Secure' },
                      { icon: Truck, label: 'Fast Delivery' },
                      { icon: Award, label: 'Quality' },
                    ].map(({ icon: Icon, label }) => (
                      <div
                        key={label}
                        className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white/80 px-3 py-4 text-center"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-orange-100/70 bg-white/85 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.06)] backdrop-blur-xl">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-orange-500">Quick Value</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="col-span-2 rounded-2xl border border-orange-100 bg-orange-50/60 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-orange-500">Price</p>
                    <p className="mt-1 text-3xl font-black tracking-tight text-gray-900">
                      ৳{book.price.toFixed(2)}
                    </p>
                    {book.pdfPrice && (
                      <p className="mt-1 text-lg font-bold text-gray-700">
                        ৳{book.pdfPrice.toFixed(2)} <span className="text-xs font-normal text-gray-400">PDF</span>
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-300">Stock</p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      {book.stock} available
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-300">Sold</p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Sparkles className="h-4 w-4 text-orange-500" />
                      {book.purchase_count || 0} copies
                    </p>
                  </div>


                </div>
              </div>
          </div>
        </motion.aside>

        {/* Right / Content */}
        <motion.section
          className="lg:col-span-7 xl:col-span-8 space-y-6"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        >
          {/* Hero Summary */}
          <div className="relative overflow-hidden rounded-[2.2rem] border border-orange-100/70 bg-white/85 p-6 md:p-8 shadow-[0_30px_80px_rgba(0,0,0,0.07)] backdrop-blur-xl">
            <div className="absolute right-0 top-0 h-36 w-36 translate-x-1/3 -translate-y-1/3 rounded-full bg-orange-100/30 blur-3xl" />

            <div className="relative flex flex-col gap-6">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-full bg-orange-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-600">
                  {book.category}
                </span>

                <span className="rounded-full bg-gray-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">
                  {book.language || 'English'}
                </span>
                {book.pages ? (
                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600">
                    {book.pages} Pages
                  </span>
                ) : null}
                <span
                  className={cn(
                    'rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em]',
                    book.stock > 0
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-red-50 text-red-500'
                  )}
                >
                  {book.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>

              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div className="max-w-3xl space-y-4">
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {book.stock > 0 ? `${book.stock} copies available` : 'Currently unavailable'}
                  </div>

                  <h1 className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl lg:text-[3.7rem]">
                    {book.title}
                  </h1>

                  <p className="text-lg text-gray-400">
                    by <span className="font-medium text-gray-700">{book.author}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-4">
                    <RatingStars value={averageRating} className="h-4 w-4" />
                    <span className="text-sm font-semibold text-gray-600">
                      {averageRating.toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-300">·</span>
                    <span className="text-sm text-gray-500">
                      {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-sm text-gray-300">·</span>
                    <span className="text-sm font-medium text-emerald-600">
                      {book.purchase_count || 0} sold
                    </span>
                  </div>

                  <div className="rounded-[1.7rem] border border-orange-100 bg-orange-50/55 p-5">
                    <div className="flex items-start gap-3">
                      <Quote className="mt-0.5 h-5 w-5 text-orange-500" />
                      <p className="text-[15px] leading-8 text-gray-600">
                        {summary}
                      </p>
                    </div>
                  </div>
                </div>


              </div>
            </div>
          </div>

          {/* Preview Modal */}
          {previewModalOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setPreviewModalOpen(false)}
            >
              <div
                className="relative flex w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold text-gray-700">Book Preview</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1">
                      <button
                        type="button"
                        onClick={() => setPreviewZoom((z) => Math.max(0.5, z - 0.25))}
                        className="flex h-6 w-6 items-center justify-center rounded text-sm font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-xs font-semibold text-gray-500">
                        {Math.round(previewZoom * 100)}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewZoom((z) => Math.min(3, z + 0.25))}
                        className="flex h-6 w-6 items-center justify-center rounded text-sm font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewModalOpen(false)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 70px)' }}>
                  <div className="space-y-6">
                    {book.previewImages?.map((url, i) => (
                      <div
                        key={i}
                        className="mx-auto overflow-hidden rounded-xl border border-gray-100 bg-gray-50 shadow-sm transition-all duration-200"
                        style={{ maxWidth: Math.round(280 * previewZoom) }}
                      >
                        <img
                          src={url}
                          alt={`Page ${i + 1}`}
                          className="w-full object-cover"
                          onContextMenu={(e) => e.preventDefault()}
                        />
                        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-3 py-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Page</span>
                          <span className="text-[11px] font-semibold text-gray-600">{i + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reviews & Q&A */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Reviews Column */}
            <div className="rounded-[2rem] border border-gray-100 bg-white/90 p-6 md:p-8 shadow-[0_30px_80px_rgba(0,0,0,0.05)] backdrop-blur-xl space-y-6">
              {reviews.length > 0 && (
                <div className="grid gap-4 rounded-[1.8rem] border border-orange-100/60 bg-gradient-to-br from-orange-50/60 to-white p-5 md:p-6">
                  <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-orange-100 bg-white p-5 text-center shadow-sm">
                    <p className="text-4xl font-black tracking-tight text-gray-900">
                      {averageRating.toFixed(1)}
                    </p>
                    <div className="mt-2">
                      <RatingStars value={averageRating} className="h-4 w-4" />
                    </div>
                    <p className="mt-2 text-xs font-medium text-gray-400">
                      {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {ratingDistribution.map(({ star, count, percentage }) => (
                      <div key={star} className="flex items-center gap-2">
                        <span className="w-3 text-right text-xs font-semibold text-gray-400">
                          {star}
                        </span>
                        <Star className="h-3 w-3 fill-gray-300 text-gray-300" />
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: (5 - star) * 0.08 }}
                            className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500"
                          />
                        </div>
                        <span className="w-6 text-xs font-medium text-gray-400">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {reviews.length > 0 ? (
                  <>
                    {currentPageReviews.map((review) => (
                      <div key={review.id} className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 text-sm font-bold text-orange-600">
                              {(review.user_name?.[0] || 'R').toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-gray-800">{review.user_name}</p>
                              <p className="text-[10px] text-gray-400">
                                {new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <RatingStars value={review.rating} className="h-3 w-3" />
                        </div>
                        <p className="text-[14px] leading-7 text-gray-500">{review.comment}</p>
                      </div>
                    ))}
                    {totalReviewPages > 1 && (
                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          disabled={clampedReviewPage === 0}
                          onClick={() => setReviewPage((p) => p - 1)}
                          className="px-4 py-2 text-xs font-semibold text-gray-500 rounded-xl border border-gray-200 hover:border-orange-200 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          disabled={clampedReviewPage >= totalReviewPages - 1}
                          onClick={() => setReviewPage((p) => p + 1)}
                          className="px-4 py-2 text-xs font-semibold text-gray-500 rounded-xl border border-gray-200 hover:border-orange-200 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-[1.8rem] border border-dashed border-gray-200 bg-gray-50/50 py-12 text-center">
                    <Star className="mx-auto mb-3 h-6 w-6 text-gray-300" />
                    <p className="text-sm text-gray-400">No reviews yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Q&A Column */}
            <div className="rounded-[2rem] border border-gray-100 bg-white/90 p-6 md:p-8 shadow-[0_30px_80px_rgba(0,0,0,0.05)] backdrop-blur-xl space-y-6">
              {user && !isStaff ? (
                <form onSubmit={handleAddQuestion} className="rounded-[1.8rem] border border-blue-100/60 bg-gradient-to-br from-blue-50/40 to-white p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-500">
                      <HelpCircle className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800">Ask a Question</h3>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="What would you like to know?"
                      required
                      className="flex-1 rounded-2xl border border-blue-100 bg-white p-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-300 focus:border-blue-200 focus:ring-2 focus:ring-blue-100"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center justify-center rounded-2xl bg-blue-500 p-3 text-white shadow-sm transition hover:bg-blue-600 disabled:opacity-40"
                    >
                      {submitting ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </form>
              ) : !user ? (
                <div className="rounded-[1.8rem] border border-dashed border-gray-200 bg-gray-50/60 p-6 text-center">
                  <User className="mx-auto mb-3 h-5 w-5 text-gray-300" />
                  <p className="text-sm text-gray-400">Please sign in to ask a question.</p>
                  <Link href="/auth" className="mt-2 inline-block text-xs font-semibold text-orange-600 hover:text-orange-700">
                    Sign In →
                  </Link>
                </div>
              ) : null}

              {user && isStaff && (
                <div className="rounded-[1.8rem] border border-dashed border-gray-200 bg-gray-50/60 p-6 text-center">
                  <Shield className="mx-auto mb-3 h-5 w-5 text-gray-300" />
                  <p className="text-sm text-gray-400">Staff accounts cannot submit questions.</p>
                </div>
              )}

              <div className="space-y-3">
                {sortedQuestions.length > 0 ? (
                  <>
                    {currentPageQuestions.map((item) => (
                      <div key={item.id} className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="mb-3 flex items-start gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[10px] font-bold text-orange-500">
                            Q
                          </div>
                          <div className="flex-1">
                            <p className="text-[14px] font-semibold leading-snug text-gray-800">{item.question}</p>
                            <p className="mt-1 flex items-center gap-1.5 text-[10px] text-gray-400">
                              {item.user_name} · {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              {item.answer && <span className="inline-flex items-center gap-0.5 text-emerald-500"><span className="h-1 w-1 rounded-full bg-emerald-500" />Answered</span>}
                            </p>
                          </div>
                        </div>
                        {item.answer ? (
                          <div className="ml-[36px] border-t border-gray-50 pt-3">
                            <div className="flex items-start gap-3">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[10px] font-bold text-emerald-500">
                                A
                              </div>
                              <p className="text-[13px] italic leading-7 text-gray-500">{item.answer}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="ml-[36px] border-t border-gray-50 pt-2">
                            <p className="flex items-center gap-1 text-[11px] italic text-gray-300">
                              <Clock className="h-3 w-3" />
                              Awaiting response...
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                    {totalQuestionPages > 1 && (
                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          disabled={clampedQuestionPage === 0}
                          onClick={() => setQuestionPage((p) => p - 1)}
                          className="px-4 py-2 text-xs font-semibold text-gray-500 rounded-xl border border-gray-200 hover:border-orange-200 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          disabled={clampedQuestionPage >= totalQuestionPages - 1}
                          onClick={() => setQuestionPage((p) => p + 1)}
                          className="px-4 py-2 text-xs font-semibold text-gray-500 rounded-xl border border-gray-200 hover:border-orange-200 hover:text-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-[1.8rem] border border-dashed border-gray-200 bg-gray-50/50 py-12 text-center">
                    <HelpCircle className="mx-auto mb-3 h-6 w-6 text-gray-300" />
                    <p className="text-sm text-gray-400">No questions yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}