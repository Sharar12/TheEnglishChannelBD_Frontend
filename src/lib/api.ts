import { API_URL, STORAGE_URL as STORAGE_BASE_URL, storageUrl } from '@/lib/config';

export function joinStorage(base: string, path: string) {
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  const p = path.startsWith('/') ? path.slice(1) : path;
  return `${b}/${p}`;
}

export function getBookPlaceholder(title: string): string {
  const colors = [
    'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
    'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',
    'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
  ];
  const index = title.charCodeAt(0) % colors.length;
  const letter = title.charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#ea580c;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="400" height="600" fill="${encodeURIComponent(colors[index])}"/>
    <text x="200" y="320" font-family="Arial, sans-serif" font-size="200" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">${letter}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, headers: customHeaders, ...restOptions } = options;

  const fullUrl = `${API_URL}${endpoint}`;
  const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const url = new URL(fullUrl, base);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
  }

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const headers: Record<string, any> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...customHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log('API Request:', url.toString(), 'Token:', token ? 'present' : 'none');

  const response = await fetch(url.toString(), {
    ...restOptions,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error:', response.status, fullUrl, errorText);
    let error = { message: 'Something went wrong' };
    try {
      error = JSON.parse(errorText);
    } catch { }

    if ((error as any).errors) {
      const detailedErrors = Object.entries((error as any).errors)
        .map(([field, messages]) => `${field}: ${(messages as string[])[0]}`)
        .join(', ');
      throw new Error(`${error.message} (${detailedErrors})`);
    }
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, string>) =>
    apiFetch<T>(endpoint, { method: 'GET', params }),

  post: <T>(endpoint: string, data?: any) =>
    apiFetch<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }),

  put: <T>(endpoint: string, data?: any) =>
    apiFetch<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }),

  delete: <T>(endpoint: string) =>
    apiFetch<T>(endpoint, { method: 'DELETE' }),
};

export interface ApiBook {
  id: number;
  category_id: number;
  title: string;
  author: string;
  description: string;
  price: string;
  pdf_price?: string | null;
  stock: number;
  stock_threshold: number;
  isbn: string | null;
  publisher: string | null;
  image: string | null;
  pages: number | null;
  language: string;
  format: string;
  is_featured: boolean;
  status: string;
  pdf_path?: string | null;
  preview_content: string[] | null;
  preview_images: string[] | null;
  created_at: string;
  updated_at: string;
  category?: ApiCategory;
  average_rating?: number;
  reviews_count?: number;
  purchase_count?: number;
}

export interface ApiCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  books_count?: number;
  last_book?: {
    id: number;
    title: string;
    cover_url: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  zip_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiOrder {
  id: number;
  order_number: string | null;
  user_id: number;
  total: string;
  status: string;
  tracking_number: string | null;
  payment_method: string | null;
  shipping_address: string;
  city: string;
  state: string | null;
  postal_code: string | null;
  phone: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user?: ApiUser;
  items?: ApiOrderItem[];
}

export interface ApiOrderItem {
  id: number;
  order_id: number;
  book_id?: number | null;
  course_id?: number | null;
  quantity: number;
  price: string;
  isbn: string | null;
  format?: string;
  book?: ApiBook;
  course?: any;
}

export function mapApiBookToBook(apiBook: ApiBook) {
  const status = apiBook.status || 'draft';

  const fallbackPreview = apiBook.description
    ? apiBook.description.substring(0, 150) + '...'
    : 'No description available';

  return {
    id: String(apiBook.id),
    title: apiBook.title,
    author: apiBook.author,
    description: apiBook.description,
    price: parseFloat(apiBook.price),
    pdfPrice: apiBook.pdf_price ? parseFloat(apiBook.pdf_price) : undefined,
    stock: apiBook.stock,
    stockThreshold: apiBook.stock_threshold ?? 10,
    category: apiBook.category?.name || 'Unknown',
    coverUrl: apiBook.image
      ? (apiBook.image.startsWith('http')
        ? apiBook.image
        : joinStorage(STORAGE_BASE_URL, apiBook.image))
      : `https://picsum.photos/seed/book${apiBook.id}/400/600`,
    previewContent: (apiBook.preview_content && apiBook.preview_content.length > 0)
      ? apiBook.preview_content
      : [fallbackPreview],
    previewImages: (apiBook.preview_images && apiBook.preview_images.length > 0)
      ? apiBook.preview_images.map(img => img.startsWith('http') ? img : joinStorage(STORAGE_BASE_URL, img))
      : undefined,
    language: apiBook.language || 'English',
    format: apiBook.format || 'Paperback',
    pages: apiBook.pages || undefined,
    isbn: apiBook.isbn || undefined,
    publisher: apiBook.publisher || undefined,
    isFeatured: apiBook.is_featured,
    isNewArrival: false,
    createdAt: apiBook.created_at,
    rating: parseFloat(String(apiBook.average_rating || '0')) || 0,
    reviews_count: apiBook.reviews_count || 0,
    purchase_count: apiBook.purchase_count || 0,
    submittedBy: undefined,
    pdfPath: apiBook.pdf_path || undefined,
    status: status as 'pending' | 'approved' | 'rejected' | 'draft' | 'pending_deletion',
  };
}

export function mapApiUserToUserProfile(apiUser: ApiUser) {
  const hasAvatar = apiUser.avatar && apiUser.avatar.trim() !== '';
  const avatarUrl = hasAvatar
    ? storageUrl(apiUser.avatar)
    : null;
  return {
    uid: String(apiUser.id),
    displayName: apiUser.name,
    email: apiUser.email,
    photoUrl: avatarUrl,
    role: (apiUser.role === 'staff' ? 'staff' : 'user') as 'user' | 'staff',
    wishlist: [],
    phone: apiUser.phone || '',
    address: apiUser.address || '',
    city: apiUser.city || '',
    zipCode: apiUser.zip_code || '',
  };
}

export function mapApiOrderToOrder(apiOrder: ApiOrder) {
  return {
    id: String(apiOrder.id),
    orderId: String(apiOrder.id),
    orderNumber: apiOrder.order_number || String(apiOrder.id),
    userId: String(apiOrder.user_id),
    items: (apiOrder.items || []).map((item) => {
      // Check if this is a course item
      const isCourse = item.course_id && !item.book_id;

      if (isCourse && item.course) {
        // Course item
        return {
          type: 'course',
          courseId: String(item.course_id),
          bookId: null,
          title: item.course?.title || 'Unknown Course',
          author: item.course?.instructor || 'Unknown',
          instructor: item.course?.instructor || 'Unknown',
          price: parseFloat(item.price),
          quantity: item.quantity,
          coverUrl: item.course?.image
            ? storageUrl(item.course.image)
            : `https://picsum.photos/seed/course${item.course_id}/400/600`,
          slug: item.course?.slug || '',
          course: item.course,
        };
      } else {
        // Book item
        const itemFormat = (item as any).format || 'physical';
        const bookHasPdf = !!(item.book as any)?.pdf_price;
        return {
          type: 'book',
          bookId: String(item.book_id),
          courseId: null,
          title: item.book?.title || 'Unknown',
          author: item.book?.author || 'Unknown',
          price: parseFloat(item.price),
          quantity: item.quantity,
          coverUrl: item.book?.image
            ? storageUrl(item.book.image)
            : `https://picsum.photos/seed/book${item.book_id}/400/600`,
          isbn: item.isbn || '',
          format: itemFormat,
          hasPdf: itemFormat === 'pdf' || bookHasPdf,
          pdfPath: (item.book as any)?.pdf_path || '',
        };
      }
    }),
    total: parseFloat(apiOrder.total),
    status: apiOrder.status as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
    trackingNumber: apiOrder.tracking_number || '',
    paymentMethod: apiOrder.payment_method || 'Unknown',
    createdAt: apiOrder.created_at,
    shipping_address: apiOrder.shipping_address || '',
    city: apiOrder.city || '',
    postal_code: apiOrder.postal_code || '',
    phone: apiOrder.phone || '',
  };
}
