export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  price: number;
  pdfPrice?: number;
  stock: number;
  stockThreshold?: number;
  category: string;
  coverUrl: string;
  previewContent: string[];
  previewImages?: string[];
  language?: string;
  format?: string;
  pages?: number;
  isbn?: string;
  publisher?: string;
  isFeatured: boolean;
  isNewArrival: boolean;
  rating: number;
  reviews_count?: number;
  purchase_count?: number;
  submittedBy?: string;
  status?: 'pending' | 'approved' | 'rejected' | 'draft' | 'pending_deletion';
  pdfPath?: string;
  createdAt: string;
}

export interface Course {
  id: number;
  title: string;
  slug: string;
  instructor: string;
  description: string;
  price: number;
  duration_hours: number;
  lessons_count: number;
  level: string;
  category: string;
  image?: string | null;
  is_featured: boolean;
  language?: string;
  access_time?: string;
  average_rating?: number;
  reviews_count?: number;
  enrolled_count?: number;
  createdAt: string;
}

export interface CategoryRequest {
  id: string;
  type: 'add' | 'delete';
  category: string;
  submittedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Review {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface QandA {
  id: string;
  bookId: string;
  userId: string;
  userName: string;
  question: string;
  answer?: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoUrl: string | null;
  role: 'user' | 'staff';
  wishlist?: string[];
  phone?: string;
  address?: string;
  city?: string;
  zipCode?: string;
}

export interface CartItem {
  bookId?: string;
  courseId?: string;
  type: 'book' | 'course';
  title: string;
  author: string;
  price: number;
  quantity: number;
  coverUrl?: string | null;
  stock: number;
  instructor?: string;
  slug?: string;
  isbn?: string;
  format?: 'physical' | 'pdf';
  includesPdf?: boolean;
  hasPdf?: boolean;
}

export interface Order {
  id: string;
  orderId?: string;
  orderNumber?: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  createdAt: string;
  shippingAddress?: {
    fullName: string;
    email: string;
    address: string;
    city: string;
    zipCode: string;
    phone: string;
  };
  trackingNumber?: string;
  estimatedDelivery?: string;
  deliveredAt?: string;
  statusHistory?: { status: string; date: string; note?: string }[];
}

export interface CourseCartItem {
  id: number;
  title: string;
  slug: string;
  instructor: string;
  description: string;
  price: number;
  duration_hours: number;
  lessons_count: number;
  level: string;
  category: string;
  preview_video: string | null;
  is_featured: boolean;
  image?: string | null;
}
