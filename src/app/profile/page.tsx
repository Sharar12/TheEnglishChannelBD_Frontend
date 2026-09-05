'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { User, Package, Heart, Settings, LogOut, ChevronRight, Clock, Mail, XCircle, CheckCircle2, ChevronDown, ChevronUp, Truck, CreditCard, MapPin, Calendar, DollarSign, ExternalLink, ShoppingBag, Camera, Upload, BookOpen, Filter, GraduationCap, Play, FileText, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { UserProfile, Order, Book } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { api, ApiBook, mapApiBookToBook, mapApiOrderToOrder, joinStorage } from '@/lib/api';
import { toast } from 'sonner';
import { API_URL, storageUrl } from '@/lib/config';

interface ExtendedOrder extends Order {
  shippingAddress?: {
    fullName: string;
    email: string;
    address: string;
    city: string;
    zipCode: string;
    phone: string;
  };
  discount?: { code: string; amount: number } | null;
}

export default function Profile() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  const isStaff = user?.role === 'staff';

  const [activeTab, setActiveTab] = useState<'orders' | 'my-books' | 'my-courses' | 'wishlist' | 'settings'>(isStaff ? 'settings' : 'orders');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [wishlistBooks, setWishlistBooks] = useState<Book[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ displayName: '', email: '' });
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderSort, setOrderSort] = useState<'newest' | 'oldest' | 'total-high' | 'total-low'>('newest');
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [wishlistLoading, setWishlistLoading] = useState(true);
  const [myBooksFilter, setMyBooksFilter] = useState<'physical' | 'pdf'>('physical');
  const [myBooksStatusFilter, setMyBooksStatusFilter] = useState<'all' | 'delivered' | 'to-receive'>('all');
  const [myBooksSort, setMyBooksSort] = useState<'recent' | 'title' | 'price-asc' | 'price-desc'>('recent');
  const [myBooksLoading, setMyBooksLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    if (!user && !loading) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  const fetchData = useCallback(async () => {
    if (!user) {
      setOrders([]);
      return;
    }
    
    setOrdersLoading(true);
    setWishlistLoading(true);
    
    const profileData = user;
    setProfile(profileData);
    setFormData({ displayName: profileData.displayName, email: profileData.email });
    setAvatarUrl(profileData.photoUrl || null);

    // Fetch orders and wishlist in parallel for faster loading
    try {
      const [wishlistRes, ordersRes] = await Promise.all([
        api.get<any[]>('/wishlist').catch(() => []),
        api.get<any>('/orders').catch(() => ({})),
      ]);

      // Process wishlist
      try {
        const books = (wishlistRes || [])
          .filter((item: any) => item.book)
          .map((item: any) => mapApiBookToBook(item.book));
        setWishlistBooks(books);
      } catch (err) {
        console.error('[Profile] Failed to process wishlist:', err);
        setWishlistBooks([]);
      } finally {
        setWishlistLoading(false);
      }

      // Process orders
      try {
        console.debug('[Profile] Fetched orders from API:', ordersRes);
        const list = Array.isArray(ordersRes) ? ordersRes : ordersRes?.data || [];
        const mapped = (list || []).map(mapApiOrderToOrder);
        console.debug('[Profile] Mapped orders:', mapped);

        // Use ONLY API orders (from database) - don't mix with localStorage
        // This ensures we always show the correct data for the current logged-in user
        const allOrders = [...mapped] as ExtendedOrder[];
        setOrders(allOrders);

        // Extract enrolled courses from API orders
        const courses: any[] = [];
        const seenCourseIds = new Set<string>();

        allOrders.forEach((order: any) => {
          // Skip cancelled orders
          if (order.status === 'cancelled') return;

          (order.items || []).forEach((item: any) => {
            // Check if this is a course item
            const courseId = item.courseId || item.course_id;
            const isCourse = item.type === 'course' || item.course || (item.course_id && !item.book_id);

            if (isCourse && courseId && !seenCourseIds.has(String(courseId))) {
              seenCourseIds.add(String(courseId));
              const courseData = item.course || item;
              const courseSlug = courseData?.slug || item.slug || '';
              const courseImg = courseData?.image || courseData?.coverUrl;
              const finalCoverUrl = courseImg
                ? (courseImg.startsWith('http') ? courseImg : storageUrl(courseImg))
                : null;

              console.log(`[Profile] Extracting course:`, {
                id: courseId,
                title: courseData?.title || item.title || 'Unknown Course',
                slug: courseSlug,
                hasCourseObject: !!item.course,
                itemKeys: Object.keys(item),
              });

              courses.push({
                id: String(courseId),
                title: courseData?.title || item.title || 'Unknown Course',
                slug: courseSlug,
                instructor: courseData?.instructor || item.author || 'Unknown',
                price: item.price || courseData?.price || 0,
                coverUrl: finalCoverUrl,
                orderDate: order.createdAt,
                orderId: order.id,
                status: order.status,
              });
            }
          });
        });

        console.log('[Profile] Extracted enrolled courses:', courses);
        setEnrolledCourses(courses);
      } catch (err: any) {
        console.error('[Profile] Failed to process orders:', err?.message || err);
        // If API fails, show empty state instead of using potentially stale localStorage
        setOrders([]);
        setEnrolledCourses([]);
      } finally {
        setOrdersLoading(false);
      }
    } catch (err: any) {
      console.error('[Profile] Failed to fetch data:', err?.message || err);
      // If everything fails, show empty state instead of stale localStorage
      setOrders([]);
      setWishlistBooks([]);
      setEnrolledCourses([]);

      setOrdersLoading(false);
      setWishlistLoading(false);
    }
    
    setLoading(false);
  }, [user]);

  useEffect(() => {
    console.debug('[Profile] User changed:', user?.email);
    if (user) {
      fetchData();
    } else {
      // Clear orders when user logs out
      setOrders([]);
      setProfile(null);
      setWishlistBooks([]);
    }
  }, [user, fetchData]);

  // Refresh on page navigation/visibility to ensure fresh data
  useEffect(() => {
    if (user && pathname === '/profile') {
      console.debug('[Profile] Page accessed (/profile) - fetching fresh data');
      fetchData();
    }
  }, [pathname, user, fetchData]);

  // Also refresh when user returns to the tab (visibility change)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && pathname === '/profile' && user) {
        console.debug('[Profile] Page became visible - fetching fresh data');
        fetchData();
      }
    };
    
    // Also handle pageshow event (browser back button)
    const handlePageShow = () => {
      if (pathname === '/profile' && user) {
        console.debug('[Profile] Page show event - fetching fresh data');
        fetchData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [pathname, user, fetchData]);

  useEffect(() => {
    const handleAuthChange = () => {
      console.debug('[Profile] auth-change event received');
      fetchData();
    };
    window.addEventListener('auth-change', handleAuthChange);
    return () => window.removeEventListener('auth-change', handleAuthChange);
  }, [fetchData]);

  // Listen for profile refresh from navbar click
  useEffect(() => {
    const handleProfileRefresh = () => {
      console.debug('[Profile] profile-refresh event received from navbar');
      if (user) {
        fetchData();
      }
    };
    window.addEventListener('profile-refresh', handleProfileRefresh);
    return () => window.removeEventListener('profile-refresh', handleProfileRefresh);
  }, [user, fetchData]);

  useEffect(() => {
    const handler = () => {
      console.debug('[Profile] orders-changed event received');
      fetchData();
    };
    window.addEventListener('orders-changed', handler);
    return () => window.removeEventListener('orders-changed', handler);
  }, [fetchData]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    
    setTimeout(() => {
      setEditing(false);
      setLoading(false);
    }, 500);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const errors = { currentPassword: '', newPassword: '', confirmPassword: '' };
    let hasError = false;

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
      hasError = true;
    }
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
      hasError = true;
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
      hasError = true;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      hasError = true;
    }

    setPasswordErrors(errors);
    if (hasError) return;

    setLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: passwordData.currentPassword,
        password: passwordData.newPassword,
        password_confirmation: passwordData.confirmPassword,
      });
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPassword(false);
    } catch (err: any) {
      if (err.message?.includes('current password')) {
        setPasswordErrors(prev => ({ ...prev, currentPassword: 'Current password is incorrect' }));
      } else {
        toast.error(err.message || 'Failed to change password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o);
    setOrders(updatedOrders as Order[]);
    localStorage.setItem('lumina_orders', JSON.stringify(updatedOrders));
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleRemoveFromWishlist = async (bookId: string) => {
    if (!user) return;

    try {
      await api.post('/wishlist/toggle', { book_id: parseInt(bookId) });
      setWishlistBooks(prev => prev.filter(b => b.id !== bookId));
      window.dispatchEvent(new Event('auth-change'));
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Failed to remove from wishlist');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setAvatarUploading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/auth/update-profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Upload failed');
      }

      const data = await response.json();
      const avatarPath = data.user.avatar;
      const fullUrl = avatarPath 
        ? storageUrl(avatarPath)
        : null;
      
      setAvatarUrl(fullUrl);
      toast.success('Profile picture updated');
      window.dispatchEvent(new Event('auth-change'));
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  if (loading && !profile) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-12 pb-20">
      <div className="relative p-8 md:p-12 bg-white rounded-[40px] border border-gray-100 shadow-xl shadow-orange-900/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-50 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50"></div>
        <div className="relative flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
              {avatarUrl ? (
                <img src={avatarUrl} alt={profile?.displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-orange-100 flex items-center justify-center text-orange-600 text-4xl font-bold">
                  {profile?.displayName[0]}
                </div>
              )}
            </div>
            <label className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={avatarUploading}
              />
              {avatarUploading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </label>
          </div>
          <div className="flex-1 text-center md:text-left space-y-2">
            <h1 className="font-serif text-4xl font-bold text-gray-900">{profile?.displayName}</h1>
            <p className="text-gray-500 flex items-center justify-center md:justify-start gap-2">
              <Mail className="w-4 h-4" />
              <span>{profile?.email}</span>
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
              <span className={cn(
                "px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full",
                isStaff ? "bg-purple-50 text-purple-600" : "bg-orange-50 text-orange-600"
              )}>
                {user?.role === 'staff' ? 'Staff Member' : 'Customer'}
              </span>
              <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-bold uppercase tracking-widest rounded-full">Verified Account</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="px-6 py-3 bg-gray-50 text-gray-600 rounded-2xl font-bold hover:bg-red-50 hover:text-red-600 transition-all flex items-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-3 space-y-2">
          {[
            { id: 'orders', label: 'Order History', icon: Package, hide: isStaff },
            { id: 'my-books', label: 'My Books', icon: BookOpen, hide: isStaff },
            { id: 'my-courses', label: 'My Courses', icon: GraduationCap, hide: isStaff },
            { id: 'wishlist', label: 'My Wishlist', icon: Heart, hide: isStaff },
            { id: 'settings', label: 'Account Settings', icon: Settings, hide: false },
          ].filter(tab => !tab.hide).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all",
                activeTab === tab.id ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <div className="flex items-center gap-3">
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </button>
          ))}
        </div>

        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
                    <h2 className="text-2xl font-serif font-bold text-gray-900">Your Orders</h2>
                    {orders.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 font-bold">Sort by:</span>
                        <select
                          value={orderSort}
                          onChange={(e) => setOrderSort(e.target.value as typeof orderSort)}
                          className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 cursor-pointer"
                        >
                          <option value="newest">Newest First</option>
                          <option value="oldest">Oldest First</option>
                          <option value="total-high">Total: High to Low</option>
                          <option value="total-low">Total: Low to High</option>
                        </select>
                      </div>
                    )}
                  </div>
                  {ordersLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-8 animate-pulse">
                          <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                            <div className="space-y-2">
                              <div className="h-3 w-16 bg-gray-200 rounded"></div>
                              <div className="h-6 w-24 bg-gray-200 rounded"></div>
                            </div>
                            <div className="space-y-2 text-right">
                              <div className="h-3 w-16 bg-gray-200 rounded"></div>
                              <div className="h-6 w-32 bg-gray-200 rounded"></div>
                            </div>
                            <div className="space-y-2 text-right">
                              <div className="h-3 w-16 bg-gray-200 rounded"></div>
                              <div className="h-6 w-20 bg-gray-200 rounded"></div>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            {[1, 2, 3, 4].map(j => (
                              <div key={j} className="w-16 h-24 bg-gray-200 rounded-lg"></div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : orders.length > 0 ? (() => {
                    const sortedOrders = [...orders].sort((a, b) => {
                      if (orderSort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                      if (orderSort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                      if (orderSort === 'total-high') return b.total - a.total;
                      if (orderSort === 'total-low') return a.total - b.total;
                      return 0;
                    });
                    return sortedOrders.map(order => (
                    <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                      <div 
                        className="p-8 cursor-pointer hover:bg-gray-50/50 transition-colors"
                        onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                      >
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order ID</p>
                            <p className="font-bold text-gray-900">#{order.id}</p>
                          </div>
                          <div className="space-y-1 text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Date</p>
                            <p className="font-bold text-gray-900">{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                          </div>
                          <div className="space-y-1 text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total</p>
                            <p className="font-bold text-gray-900">৳{order.total.toFixed(2)}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status</p>
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1",
                              order.status === 'delivered' ? "bg-green-50 text-green-600" :
                              order.status === 'cancelled' ? "bg-red-50 text-red-600" :
                              order.status === 'shipped' ? "bg-blue-50 text-blue-600" :
                              order.status === 'processing' ? "bg-purple-50 text-purple-600" : "bg-orange-50 text-orange-600"
                            )}>
                              {order.status === 'delivered' ? <CheckCircle2 className="w-3 h-3" /> : 
                               order.status === 'cancelled' ? <XCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {order.status}
                            </span>
                          </div>
                        </div>

                         {order.status !== 'cancelled' && order.status !== 'pending' && order.items.some(item => item.type !== 'course') && (
                           <div className="mt-4 pt-4 border-t border-gray-100">
                             <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Delivery Progress</p>
                             <div className="flex items-center gap-2">
                              {['processing', 'shipped', 'delivered'].map((step, idx) => (
                                <div key={step} className="flex items-center flex-1">
                                  <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                                    order.status === step ? "bg-orange-600 text-white" :
                                    ['processing', 'shipped', 'delivered'].indexOf(order.status) > idx ? "bg-green-600 text-white" : "bg-gray-200 text-gray-400"
                                  )}>
                                    {['processing', 'shipped', 'delivered'].indexOf(order.status) > idx ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                                  </div>
                                  <span className={cn(
                                    "text-xs font-bold ml-2 capitalize",
                                    order.status === step ? "text-orange-600" :
                                    ['processing', 'shipped', 'delivered'].indexOf(order.status) > idx ? "text-green-600" : "text-gray-400"
                                  )}>{step}</span>
                                  {idx < 2 && (
                                    <div className={cn(
                                      "flex-1 h-1 mx-2 rounded-full",
                                      ['processing', 'shipped', 'delivered'].indexOf(order.status) > idx ? "bg-green-600" : "bg-gray-200"
                                    )} />
                                  )}
                                </div>
                              ))}
                            </div>
                            {(order as any).trackingNumber && (
                              <div className="mt-3 p-3 bg-blue-50 rounded-xl flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-bold text-blue-400 uppercase">Tracking Number</p>
                                  <p className="text-sm font-mono text-blue-700">{(order as any).trackingNumber}</p>
                                </div>
                                {(order as any).estimatedDelivery && (
                                  <div className="text-right">
                                    <p className="text-xs font-bold text-blue-400 uppercase">Est. Delivery</p>
                                    <p className="text-sm font-bold text-blue-700">{new Date((order as any).estimatedDelivery).toLocaleDateString()}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                         <div className="flex items-center gap-4">
                            {order.items.slice(0, 4).map((item, idx) => (
                              <Link 
                                key={`${order.id}-item-${idx}`} 
                                href={item.type === 'course' ? `/courses/${item.slug}` : `/book/${item.bookId}`}
                                className={cn(
                                  "rounded-lg overflow-hidden shrink-0 border border-gray-100 shadow-sm group hover:scale-105 transition-transform",
                                  item.type === 'course' ? "w-24 h-16" : "w-16 h-24"
                                )}
                              >
                                <img src={item.coverUrl} className="w-full h-full object-cover" />
                              </Link>
                            ))}
                           {order.items.length > 4 && (
                             <div className={cn(
                               "rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-gray-500 font-bold text-sm",
                               // We can't easily determine the shape for the "+N" bubble if it's mixed, 
                               // so we keep a neutral or book-like shape, or just use a standard size.
                               "w-16 h-24" 
                             )}>
                               +{order.items.length - 4}
                             </div>
                           )}
                          <div className="ml-auto flex items-center gap-2 text-sm font-bold text-orange-600">
                            <span>{expandedOrder === order.id ? 'Hide' : 'View'} Details</span>
                            {expandedOrder === order.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedOrder === order.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-gray-100 p-8 space-y-8">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 bg-gray-50 rounded-2xl space-y-3">
                                  <div className="flex items-center gap-2 text-gray-500">
                                    <MapPin className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Shipping Address</span>
                                  </div>
                                  <div className="text-sm text-gray-700">
                                    <p className="font-semibold">{order.shippingAddress?.fullName}</p>
                                    <p>{order.shippingAddress?.address}</p>
                                    <p>{order.shippingAddress?.city} {order.shippingAddress?.zipCode}</p>
                                    <p className="text-gray-500">{order.shippingAddress?.phone}</p>
                                  </div>
                                </div>

                                <div className="p-6 bg-gray-50 rounded-2xl space-y-3">
                                  <div className="flex items-center gap-2 text-gray-500">
                                    <CreditCard className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Payment</span>
                                  </div>
                                  <div className="text-sm text-gray-700">
                                    <p className="font-semibold capitalize">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod === 'paypal' ? 'PayPal' : 'Credit/Debit Card'}</p>
                                    <p className="text-gray-500">Transaction completed</p>
                                  </div>
                                </div>

                                <div className="p-6 bg-gray-50 rounded-2xl space-y-3">
                                  <div className="flex items-center gap-2 text-gray-500">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Estimated Delivery</span>
                                  </div>
                                  <div className="text-sm text-gray-700">
                                    <p className="font-semibold">
                                      {order.status === 'delivered' 
                                        ? 'Delivered' 
                                        : order.status === 'cancelled' 
                                          ? 'Order cancelled'
                                          : '3-5 Business Days'}
                                    </p>
                                    <p className="text-gray-500">
                                      {order.status === 'pending' || order.status === 'processing' 
                                        ? 'Processing your order' 
                                        : order.status === 'shipped' 
                                          ? 'On its way' 
                                          : ''}
                                    </p>
                                  </div>
                                </div>
                              </div>

                                 <div className="space-y-4">
                                   <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                     <ShoppingBag className="w-4 h-4" />
                                     Order Items ({order.items.length})
                                   </h3>
                                   <div className="space-y-4">
                                     {order.items.map((item, idx) => (
                                       <Link 
                                         key={`${order.id}-detail-${idx}`} 
                                         href={`/book/${item.bookId}`}
                                         className="flex items-center gap-6 p-4 bg-gray-50 rounded-2xl hover:bg-orange-50/50 transition-colors group"
                                       >
                                      <div className="w-16 h-24 rounded-xl overflow-hidden shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                        <img src={item.coverUrl} className="w-full h-full object-cover" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-serif text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors truncate">{item.title}</p>
                                        <p className="text-sm text-gray-500">by {item.author}</p>
                                        <p className="text-sm text-gray-500 mt-1">Quantity: {item.quantity}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-bold text-gray-900">৳{(item.price * item.quantity).toFixed(2)}</p>
                                        <p className="text-xs text-gray-400">৳{item.price.toFixed(2)} each</p>
                                      </div>
                                      <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-orange-600 transition-colors" />
                                    </Link>
                                  ))}
                                </div>
                              </div>

                              <div className="p-6 bg-gray-50 rounded-2xl space-y-4 max-w-sm ml-auto">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">Subtotal</span>
                                  <span className="font-bold text-gray-900">৳{order.total.toFixed(2)}</span>
                                </div>
                                {order.discount && order.discount.amount > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-green-600">Discount ({order.discount.code})</span>
                                    <span className="font-bold text-green-600">-${order.discount.amount.toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">Shipping</span>
                                  <span className="font-bold text-green-600">Free</span>
                                </div>
                                <div className="pt-4 border-t border-gray-200 flex justify-between">
                                  <span className="font-bold text-gray-900">Total Paid</span>
                                  <span className="text-xl font-bold text-gray-900">৳{order.total.toFixed(2)}</span>
                                </div>
                              </div>

                              <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                                <p className="text-sm text-gray-500 flex items-center gap-2">
                                  <Truck className="w-4 h-4" />
                                  Paid via <span className="font-bold text-gray-900 capitalize">{order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}</span>
                                </p>
                                {order.status === 'pending' && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCancelOrder(order.id);
                                    }}
                                    className="text-sm font-bold text-red-600 hover:underline flex items-center gap-1"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Cancel Order
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))})() : (
                    <div className="text-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
                      <Package className="w-16 h-16 text-gray-200 mx-auto mb-6" />
                      <p className="text-gray-500 mb-8">You haven't placed any orders yet.</p>
                      <Link href="/shop" className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all">
                        Start Shopping
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'my-books' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h2 className="text-2xl font-serif font-bold text-gray-900">My Books</h2>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                        <button
                          onClick={() => setMyBooksFilter('physical')}
                          className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5",
                            myBooksFilter === 'physical' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                          )}
                        >
                          <Package className="w-4 h-4" />
                          Physical
                        </button>
                        <button
                          onClick={() => setMyBooksFilter('pdf')}
                          className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5",
                            myBooksFilter === 'pdf' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                          )}
                        >
                          <FileText className="w-4 h-4" />
                          PDF Downloads
                        </button>
                      </div>
                      {myBooksFilter !== 'pdf' && (
                      <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                        <button
                          onClick={() => setMyBooksStatusFilter('all')}
                          className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                            myBooksStatusFilter === 'all' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                          )}
                        >
                          All
                        </button>
                        <button
                          onClick={() => setMyBooksStatusFilter('delivered')}
                          className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                            myBooksStatusFilter === 'delivered' ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                          )}
                        >
                          Delivered
                        </button>
                        <button
                          onClick={() => setMyBooksStatusFilter('to-receive')}
                          className={cn(
                            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                            myBooksStatusFilter === 'to-receive' ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                          )}
                        >
                          To Receive
                        </button>
                      </div>
                      )}
                      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                        <ArrowUpDown className="w-3.5 h-3.5 text-gray-400 ml-1.5" />
                        <select
                          value={myBooksSort}
                          onChange={e => setMyBooksSort(e.target.value as typeof myBooksSort)}
                          className="bg-transparent text-sm font-bold text-gray-700 px-1.5 py-1 rounded-lg outline-none cursor-pointer"
                        >
                          <option value="recent">Recent</option>
                          <option value="title">A–Z</option>
                          <option value="price-asc">Price ↑</option>
                          <option value="price-desc">Price ↓</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {myBooksLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-pulse">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                          <div className="flex gap-4">
                            <div className="w-20 h-28 bg-gray-200 rounded-xl" />
                            <div className="flex-1 space-y-3">
                              <div className="h-4 bg-gray-200 rounded w-3/4" />
                              <div className="h-3 bg-gray-200 rounded w-1/2" />
                              <div className="h-3 bg-gray-200 rounded w-1/3" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (() => {
                    const myBooks: { bookId: string; title: string; author: string; coverUrl: string; price: number; quantity: number; status: string; orderDate: string; orderId: string; format?: string; hasPdf?: boolean }[] = [];
                    orders.forEach(order => {
                      if (order.status === 'cancelled') return;
                      order.items.forEach(item => {
                        myBooks.push({
                          bookId: item.bookId || '',
                          title: item.title,
                          author: item.author,
                          coverUrl: item.coverUrl,
                          price: item.price,
                          quantity: item.quantity,
                          status: order.status,
                          orderDate: order.createdAt,
                          orderId: order.id,
                          format: (item as any).format || 'physical',
                          hasPdf: (item as any).hasPdf,
                        });
                      });
                    });

                    const sortedMyBooks = [...myBooks].sort((a, b) => {
                      switch (myBooksSort) {
                        case 'title': return a.title.localeCompare(b.title);
                        case 'price-asc': return a.price - b.price;
                        case 'price-desc': return b.price - a.price;
                        default: return new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime();
                      }
                    });

                    const filteredBooks = myBooksFilter === 'physical'
                      ? sortedMyBooks
                      : sortedMyBooks.filter(b => b.hasPdf);

                    const statusFiltered = myBooksStatusFilter === 'all'
                      ? filteredBooks
                      : myBooksStatusFilter === 'delivered'
                        ? filteredBooks.filter(b => b.status === 'delivered')
                        : filteredBooks.filter(b => b.status !== 'delivered');

                    if (statusFiltered.length === 0) {
                      return (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                          <h3 className="text-xl font-bold text-gray-900 mb-2">No books found</h3>
                          <p className="text-gray-500">
                            {myBooksFilter === 'physical' && myBooksStatusFilter === 'all'
                              ? 'Your purchased physical books will appear here.'
                              : myBooksFilter === 'pdf' && myBooksStatusFilter === 'all'
                                ? 'Your purchased PDF downloads will appear here.'
                                : 'No books match the selected filters.'}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {statusFiltered.map((book, idx) => (
                            <Link
                            key={`${book.bookId}-${idx}`}
                            href={myBooksFilter === 'pdf' ? `/read/${book.bookId}` : `/book/${book.bookId}`}
                            className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-orange-100 transition-all group"
                          >
                            <div className="flex gap-4">
                              <div className="w-20 h-28 rounded-xl overflow-hidden shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                                {book.coverUrl ? (
                                  <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300">
                                    <BookOpen className="w-6 h-6" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-serif font-bold text-gray-900 truncate group-hover:text-orange-600 transition-colors">{book.title}</h3>
                                <p className="text-sm text-gray-500 truncate">by {book.author}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                                    book.format === 'pdf' ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"
                                  )}>
                                    {book.format === 'pdf' ? 'PDF' : 'Physical'}
                                  </span>
                                  <p className="text-xs text-gray-400">Qty: {book.quantity}</p>
                                </div>
                                <p className="text-sm font-bold text-gray-900 mt-2">৳{(book.price * book.quantity).toFixed(2)}</p>
                                <div className="flex items-center gap-2 mt-3">
                                  {myBooksFilter === 'pdf' ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-600">
                                      Ready to Read
                                    </span>
                                  ) : (
                                    <>
                                      <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        book.status === 'delivered' ? "bg-green-50 text-green-600" :
                                        book.status === 'shipped' ? "bg-blue-50 text-blue-600" :
                                        book.status === 'processing' ? "bg-purple-50 text-purple-600" :
                                        "bg-orange-50 text-orange-600"
                                      )}>
                                        {book.status === 'delivered' ? 'Delivered' :
                                         book.status === 'shipped' ? 'Shipped' :
                                         book.status === 'processing' ? 'Processing' :
                                         'Pending'}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        {new Date(book.orderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

              {activeTab === 'my-courses' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-serif font-bold text-gray-900 mb-8">My Courses</h2>
                  {enrolledCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {enrolledCourses.map((course) => (
                        <Link
                          key={course.id}
                          href={`/courses/${course.slug}/watch`}
                          className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-orange-100 transition-all group"
                        >
                           <div className="relative h-48 bg-gradient-to-br from-orange-100 to-amber-50 overflow-hidden">
                             {course.coverUrl ? (
                               <img src={course.coverUrl} alt={course.title} className="w-full h-full object-cover" />
                             ) : (
                               <div className="w-full h-full bg-orange-100 flex items-center justify-center">
                                 <BookOpen className="w-12 h-12 text-orange-300" />
                               </div>
                             )}
                             <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                               <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                                 <Play className="w-7 h-7 text-orange-600 ml-1" />
                               </div>
                             </div>
                             <div className="absolute top-3 right-3">
                               <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-600 shadow-sm">
                                 Enrolled
                               </span>
                             </div>
                           </div>
                          <div className="p-6">
                            <h3 className="font-serif font-bold text-lg text-gray-900 truncate group-hover:text-orange-600 transition-colors">{course.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">by {course.instructor}</p>
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{new Date(course.orderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm font-bold text-orange-600">
                                <span>Watch Now</span>
                                <ChevronRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
                      <GraduationCap className="w-16 h-16 text-gray-200 mx-auto mb-6" />
                      <p className="text-gray-500 mb-8">You haven't enrolled in any courses yet.</p>
                      <Link href="/courses" className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all">
                        Browse Courses
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'wishlist' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-serif font-bold text-gray-900 mb-8">My Wishlist</h2>
                  {wishlistLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex gap-6">
                          <div className="w-24 aspect-[2/3] rounded-xl bg-gray-200 shrink-0"></div>
                          <div className="flex-1 space-y-3">
                            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-6 bg-gray-200 rounded w-1/3 mt-4"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : wishlistBooks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {wishlistBooks.map(book => (
                        <div key={book.id} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex gap-6 group">
                          <div className="w-24 aspect-[2/3] rounded-xl overflow-hidden shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                            <img src={book.coverUrl} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <Link href={`/book/${book.id}`} className="font-serif text-xl font-bold text-gray-900 hover:text-orange-600 transition-colors block truncate">
                                {book.title}
                              </Link>
                              <p className="text-gray-500 text-sm">{book.author}</p>
                              <p className="text-lg font-bold text-gray-900 mt-2">৳{book.price.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                              <Link href={`/book/${book.id}`} className="text-sm font-bold text-orange-600 hover:underline flex items-center gap-1">
                                <span>View Details</span>
                                <ChevronRight className="w-4 h-4" />
                              </Link>
                              <button 
                                onClick={() => handleRemoveFromWishlist(book.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              >
                                <Heart className="w-5 h-5 fill-red-600 text-red-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
                      <Heart className="w-16 h-16 text-gray-200 mx-auto mb-6" />
                      <p className="text-gray-500 mb-8">Your wishlist is empty.</p>
                      <Link href="/shop" className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all">
                        Discover Books
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-8">
                  <h2 className="text-2xl font-serif font-bold text-gray-900 mb-8">Account Settings</h2>
                  
                  <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-8">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-gray-900">Personal Information</h3>
                      {!editing && (
                        <button 
                          onClick={() => setEditing(true)}
                          className="text-sm font-bold text-orange-600 hover:underline"
                        >
                          Edit Profile
                        </button>
                      )}
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Display Name</label>
                          <input 
                            type="text" 
                            value={formData.displayName}
                            onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                            disabled={!editing}
                            className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none disabled:opacity-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                          <input 
                            type="email" 
                            value={formData.email}
                            disabled
                            className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl outline-none opacity-50"
                          />
                        </div>
                      </div>

                      {editing && (
                        <div className="flex gap-4">
                          <button 
                            type="submit"
                            className="px-8 py-3 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all"
                          >
                            Save Changes
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              setEditing(false);
                              setFormData({ displayName: profile?.displayName || '', email: profile?.email || '' });
                            }}
                            className="px-8 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </form>
                  </div>

                  <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-8">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-gray-900">Change Password</h3>
                      {!showPassword && (
                        <button 
                          onClick={() => setShowPassword(true)}
                          className="text-sm font-bold text-orange-600 hover:underline"
                        >
                          Change Password
                        </button>
                      )}
                    </div>

                    {showPassword ? (
                      <form onSubmit={handleChangePassword} className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Current Password</label>
                          <input 
                            type="password" 
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            placeholder="Enter current password"
                            className={cn(
                              "w-full p-4 bg-gray-50 border rounded-2xl focus:outline-none transition-all",
                              passwordErrors.currentPassword 
                                ? "border-red-200 focus:border-red-500/20 focus:ring-2 focus:ring-red-500/10" 
                                : "border-transparent focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10"
                            )}
                          />
                          {passwordErrors.currentPassword && (
                            <p className="text-xs text-red-500">{passwordErrors.currentPassword}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">New Password</label>
                            <input 
                              type="password" 
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                              placeholder="At least 6 characters"
                              className={cn(
                                "w-full p-4 bg-gray-50 border rounded-2xl focus:outline-none transition-all",
                                passwordErrors.newPassword 
                                  ? "border-red-200 focus:border-red-500/20 focus:ring-2 focus:ring-red-500/10" 
                                  : "border-transparent focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10"
                              )}
                            />
                            {passwordErrors.newPassword && (
                              <p className="text-xs text-red-500">{passwordErrors.newPassword}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Confirm New Password</label>
                            <input 
                              type="password" 
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              placeholder="Re-enter new password"
                              className={cn(
                                "w-full p-4 bg-gray-50 border rounded-2xl focus:outline-none transition-all",
                                passwordErrors.confirmPassword 
                                  ? "border-red-200 focus:border-red-500/20 focus:ring-2 focus:ring-red-500/10" 
                                  : "border-transparent focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10"
                              )}
                            />
                            {passwordErrors.confirmPassword && (
                              <p className="text-xs text-red-500">{passwordErrors.confirmPassword}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <button 
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all disabled:opacity-50"
                          >
                            {loading ? 'Updating...' : 'Update Password'}
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              setShowPassword(false);
                              setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                              setPasswordErrors({ currentPassword: '', newPassword: '', confirmPassword: '' });
                            }}
                            className="px-8 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <p className="text-sm text-gray-500">Keep your account secure by using a strong password. Change it regularly for better security.</p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}