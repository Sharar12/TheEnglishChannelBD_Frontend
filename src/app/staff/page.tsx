'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Edit3,
  Trash2,
  ChevronRight,
  Package,
  Image as ImageIcon,
  FileText,
  Tag,
  Layers,
  Images,
  Search,
  Filter,
  MessageSquare,
  Bell,
  Info,
  LayoutGrid,
  List,
  GraduationCap,
  X,
  Plus,
  Upload,
  ArrowLeft,
  ClipboardList,
  Link2,
  Percent,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/lib/useDebounce';
import { api, ApiBook, mapApiBookToBook, ApiCategory } from '@/lib/api';
import { Book, CartItem } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { API_URL, storageUrl } from '@/lib/config';

interface StaffBook extends Book {
  submittedBy?: string;
  status?: 'approved' | 'draft' | 'pending_deletion';
  previewImages?: string[];
}

interface StaffQuestion {
  id: number;
  book_id?: number;
  user_name: string;
  question: string;
  answer: string | null;
  is_answered: boolean;
  created_at: string;
  book_title?: string;
  book_cover_url?: string;
  course_id?: number;
  course_title?: string;
  course_image?: string;
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'my-books' | 'drafts' | 'add-book' | 'add-course' | 'inventory' | 'categories' | 'qanda' | 'orders' | 'gallery' | 'about' | 'course-access'>('overview');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [myBooks, setMyBooks] = useState<StaffBook[]>([]);
  const [draftBooks, setDraftBooks] = useState<StaffBook[]>([]);
  const [lowStockBooks, setLowStockBooks] = useState<StaffBook[]>([]);
  const [allBooks, setAllBooks] = useState<StaffBook[]>([]);
  const [inventoryBooks, setInventoryBooks] = useState<StaffBook[]>([]);
  const [inventoryTotal, setInventoryTotal] = useState(0);
  const [qandaItems, setQandaItems] = useState<StaffQuestion[]>([]);
  const [qandaFilter, setQandaFilter] = useState<'all' | 'answered' | 'unanswered'>('all');
  const [qandaType, setQandaType] = useState<'books' | 'courses'>('books');
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [staffOrders, setStaffOrders] = useState<{
    id: string;
    userId: string;
    items: CartItem[];
    total: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
    shippingAddress?: { fullName: string; email: string; address: string; city: string; zipCode: string; phone: string };
    trackingNumber?: string;
    estimatedDelivery?: string;
    statusHistory?: { status: string; date: string; note?: string }[];
  }[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [orderCurrentPage, setOrderCurrentPage] = useState(1);
  const ordersPerPage = 20;
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [qandaCurrentPage, setQandaCurrentPage] = useState(1);
  const qandaPerPage = 10;
  const [qandaTotal, setQandaTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [courseOverview, setCourseOverview] = useState<{ total: number; recent: any[] } | null>(null);
  const [booksMetrics, setBooksMetrics] = useState({ totalTitles: 0, warehouseStock: 0, categories: 0, totalRevenue: 0 });
  const [coursesMetrics, setCoursesMetrics] = useState({ total: 0, total_videos: 0, categories: 0, revenue: 0 });

  const formatMoney = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return Math.floor(n / 1000) + 'k';
    return String(n);
  };

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info'
  });
  
  const [newBook, setNewBook] = useState<Partial<Book & { previewImages?: string[] }>>({
    title: '',
    author: '',
    description: '',
    category: 'Fiction',
    price: 0,
    stock: 0,
    coverUrl: '',
    pages: 0,
    language: '',
    previewContent: [],
    previewImages: [],
  });
  const [newBookCoverUploading, setNewBookCoverUploading] = useState(false);
  const [newBookPreviewUploading, setNewBookPreviewUploading] = useState(false);
  const [newBookCoverFile, setNewBookCoverFile] = useState<File | null>(null);
  const [newBookCoverPreview, setNewBookCoverPreview] = useState<string>('');
  const [newBookPreviewFiles, setNewBookPreviewFiles] = useState<File[]>([]);
  const [newBookPreviewPreviews, setNewBookPreviewPreviews] = useState<string[]>([]);
  const [newBookPdfFile, setNewBookPdfFile] = useState<File | null>(null);
  const [newBookPdfName, setNewBookPdfName] = useState<string>('');
  const [newBookPdfInputKey, setNewBookPdfInputKey] = useState(0);
  const [newBookPdfUploading, setNewBookPdfUploading] = useState(false);
  const [newBookPdfPreviewPages, setNewBookPdfPreviewPages] = useState<number>(5);
  const [newBookPdfPagesInput, setNewBookPdfPagesInput] = useState<string>('5');
  const [newBookPdfPath, setNewBookPdfPath] = useState<string | null>(null);
  const [newBookPdfTotalPages, setNewBookPdfTotalPages] = useState(0);
  const [pdfPreviewZoom, setPdfPreviewZoom] = useState(2);
  const [newBookPdfExtracted, setNewBookPdfExtracted] = useState<string[]>([]);

  const [courseStep, setCourseStep] = useState<'overview' | 'curriculum' | 'quizzes' | 'review'>('overview');
  const [newCourse, setNewCourse] = useState({
    title: '', slug: '', instructor: '', description: '', image: '',
    price: 0, duration_hours: 0, lessons_count: 0,
    level: 'beginner', preview_video: '', category: 'language',
    is_featured: false, is_active: true,
    sections: [{ 
      title: '', 
      lessons: [{ 
        title: '', 
        description: '', 
        video_url: '', 
        video_file: null as File | null, 
        video_file_url: '', 
        duration_minutes: 0, 
        is_free_preview: false,
        resources: [],
        quizzes: []
      }] 
    }],
    quizzes: [{ title: '', questions: [{ question: '', options: ['', '', '', ''], correct_answer: 0 }] }],
  });
  const [courseFileUploading, setCourseFileUploading] = useState<Record<string, boolean>>({});

  const uploadImageFile = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/staff/books/upload-cover`, {
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
      return data.url || storageUrl(data.path);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload image');
      return null;
    }
  };

  const uploadPdfToServer = async (file: File, pages: number) => {
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('preview_pages', String(pages));
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${API_URL}/staff/books/upload-pdf`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
      body: formData,
    });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  };

  const reextractPreviews = async (pdfPath: string, pages: number) => {
    if (!pdfPath) return;
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${API_URL}/staff/books/extract-preview-pages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdf_path: pdfPath, preview_pages: pages }),
    });
    if (!res.ok) throw new Error('Re-extraction failed');
    return res.json();
  };

  const handlePdfFileSelect = async (file: File) => {
    setNewBookPdfFile(file);
    setNewBookPdfName(file.name);
    setNewBookPdfExtracted([]);
    setNewBookPdfTotalPages(0);
    setNewBookPdfUploading(true);
    try {
      const data = await uploadPdfToServer(file, newBookPdfPreviewPages);
      const t = Date.now();
      const urls = (data.preview_image_urls || []).map((url: string) => `${url}?t=${t}`);
      setNewBookPdfPath(data.pdf_path);
      setNewBookPdfTotalPages(data.total_pages || 0);
      setNewBookPdfExtracted(urls);
      if (data.total_pages) setNewBook(prev => ({ ...prev, pages: data.total_pages }));
    } catch {
      toast.error('Failed to upload PDF');
    } finally {
      setNewBookPdfUploading(false);
    }
  };

  const handlePdfPagesChange = async (pages: number) => {
    const clamped = Math.min(50, Math.max(1, pages));
    setNewBookPdfPreviewPages(clamped);
    setNewBookPdfPagesInput(String(clamped));
    if (!newBookPdfPath) return;
    setNewBookPdfUploading(true);
    try {
      const data = await reextractPreviews(newBookPdfPath, clamped);
      const t = Date.now();
      setNewBookPdfTotalPages(data.total_pages || newBookPdfTotalPages);
      setNewBookPdfExtracted((data.preview_image_urls || []).map((url: string) => `${url}?t=${t}`));
    } catch {
      toast.error('Failed to update preview pages');
    } finally {
      setNewBookPdfUploading(false);
    }
  };

  const handleEditPdfFileSelect = async (file: File) => {
    setEditPdfFile(file);
    setEditPdfName(file.name);
    setEditPdfExtracted([]);
    setEditPdfTotalPages(0);
    setEditPdfUploading(true);
    try {
      const data = await uploadPdfToServer(file, editPdfPreviewPages);
      const t = Date.now();
      setEditPdfPath(data.pdf_path);
      setEditPdfTotalPages(data.total_pages || 0);
      setEditPdfExtracted((data.preview_image_urls || []).map((url: string) => `${url}?t=${t}`));
      if (data.total_pages) setEditForm(prev => ({ ...prev, pages: data.total_pages }));
    } catch {
      toast.error('Failed to upload PDF');
    } finally {
      setEditPdfUploading(false);
    }
  };

  const handleEditPdfPagesChange = async (pages: number) => {
    const clamped = Math.min(50, Math.max(1, pages));
    setEditPdfPreviewPages(clamped);
    setEditPdfPagesInput(String(clamped));
    if (!editPdfPath) return;
    setEditPdfUploading(true);
    try {
      const data = await reextractPreviews(editPdfPath, clamped);
      const t = Date.now();
      setEditPdfTotalPages(data.total_pages || editPdfTotalPages);
      setEditPdfExtracted((data.preview_image_urls || []).map((url: string) => `${url}?t=${t}`));
    } catch {
      toast.error('Failed to update preview pages');
    } finally {
      setEditPdfUploading(false);
    }
  };

  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
  const [courseCategories, setCourseCategories] = useState<{ id?: number; name: string; slug: string; count?: number }[]>([]);
  const [newCourseCategory, setNewCourseCategory] = useState('');

  const [inventorySearch, setInventorySearch] = useState('');
  const debouncedInventorySearch = useDebounce(inventorySearch, 300);
  const [inventoryType, setInventoryType] = useState<'books' | 'courses'>('books');
  const [inventoryCourses, setInventoryCourses] = useState<any[]>([]);
  const [inventoryCoursesTotal, setInventoryCoursesTotal] = useState(0);
  const [courseSearch, setCourseSearch] = useState('');
  const debouncedCourseSearch = useDebounce(courseSearch, 300);
  const [courseSort, setCourseSort] = useState('newest');
  const [courseStatusFilter, setCourseStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editingCourse, setEditingCourse] = useState<any | null>(null);
  const [courseEditForm, setCourseEditForm] = useState({
    title: '',
    slug: '',
    instructor: '',
    description: '',
    image: '',
    price: 0,
    duration_hours: 0,
    lessons_count: 0,
    level: 'beginner',
    preview_video: '',
    category: 'language',
    is_featured: false,
    is_active: true,
  });
  const [courseCoverFile, setCourseCoverFile] = useState<File | null>(null);
  const [courseCoverPreview, setCourseCoverPreview] = useState<string>('');
  const [courseCoverUploading, setCourseCoverUploading] = useState(false);
  const [courseVideoFile, setCourseVideoFile] = useState<File | null>(null);
  const [courseVideoPreview, setCourseVideoPreview] = useState<string>('');
  const [courseVideoUploading, setCourseVideoUploading] = useState(false);
  const [courseEditStep, setCourseEditStep] = useState<'overview' | 'curriculum' | 'quizzes' | 'review'>('overview');
  const [courseEditData, setCourseEditData] = useState<any>({
    sections: [],
    quizzes: [],
  });
  const [courseEditFileUploading, setCourseEditFileUploading] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    setInventoryCurrentPage(1);
  }, [debouncedInventorySearch]);
  
  const [inventoryCategories, setInventoryCategories] = useState<string[]>([]);
  const [inventorySort, setInventorySort] = useState('newest');
  const [inventoryStockFilter, setInventoryStockFilter] = useState('all');
  const [inventoryPriceRange, setInventoryPriceRange] = useState<[number, number]>([0, 10000]);
  const [inventoryMaxPrice, setInventoryMaxPrice] = useState(10000);
  const [inventoryCurrentPage, setInventoryCurrentPage] = useState(1);
  const inventoryPerPage = 50;
  const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set());
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [myBooksCurrentPage, setMyBooksCurrentPage] = useState(1);
  const myBooksPerPage = 10;
  const [myBooksTotal, setMyBooksTotal] = useState(0);
  const [draftBooksCurrentPage, setDraftBooksCurrentPage] = useState(1);
  const draftBooksPerPage = 10;
  const [draftBooksTotal, setDraftBooksTotal] = useState(0);
  const [aboutData, setAboutData] = useState<any>(null);
  const [aboutForm, setAboutForm] = useState({
    title: '',
    hero_description: '',
    our_story: '',
    our_mission: '',
    our_values: '',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
  });
  const [aboutSaving, setAboutSaving] = useState(false);
  const [editingInventoryBook, setEditingInventoryBook] = useState<StaffBook | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    author: '',
    description: '',
    category: '',
    price: 0,
    pdfPrice: undefined as number | undefined,
    stock: 0,
    coverUrl: '',
    pages: 0,
    language: '',
    previewImages: [] as string[],
  });
  const [editSaving, setEditSaving] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [coverUploading, setCoverUploading] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [editPdfFile, setEditPdfFile] = useState<File | null>(null);
  const [editPdfName, setEditPdfName] = useState('');
  const [editPdfInputKey, setEditPdfInputKey] = useState(0);
  const [editPdfUploading, setEditPdfUploading] = useState(false);
  const [editPdfPreviewPages, setEditPdfPreviewPages] = useState(5);
  const [editPdfPagesInput, setEditPdfPagesInput] = useState('5');
  const [editPdfPath, setEditPdfPath] = useState<string | null>(null);
  const [editPdfTotalPages, setEditPdfTotalPages] = useState(0);
  const [editPdfExtracted, setEditPdfExtracted] = useState<string[]>([]);
  const [editPdfPreviewZoom, setEditPdfPreviewZoom] = useState(2);

  const loadInventoryBooks = async () => {
    setInventoryLoading(true);
    try {
      const [batchRes, maxRes] = await Promise.all([
        api.get<any>('/staff/books/batch'),
        api.get<any>('/staff/books', { per_page: '1', sort: 'price-high' }),
      ]);
      
      const allBooks = (batchRes.data || []).map(mapApiBookToBook) as StaffBook[];
      setInventoryBooks(allBooks);
      setInventoryTotal(allBooks.length);
      setSelectedBookIds(new Set());
      
      if (maxRes.data && maxRes.data.length > 0) {
        const highestPrice = maxRes.data[0].price;
        const roundedMax = Math.ceil(highestPrice / 1000) * 1000;
        const finalMax = Math.max(10000, roundedMax);
        setInventoryMaxPrice(finalMax);
        setInventoryPriceRange([0, finalMax]);
      }
    } catch (err) {
      console.error('Inventory load error:', err);
      setInventoryBooks([]);
      setInventoryTotal(0);
    } finally {
      setInventoryLoading(false);
    }
  };

  const loadInventoryCourses = async () => {
    setInventoryLoading(true);
    try {
      const res = await api.get<any>('/staff/courses');
      console.log('Courses API response:', res);
      const courses = Array.isArray(res) ? res : (res?.data || res?.courses || []);
      setInventoryCourses(courses);
      setInventoryCoursesTotal(courses.length);
    } catch (err) {
      console.error('Course inventory load error:', err);
      setInventoryCourses([]);
      setInventoryCoursesTotal(0);
    } finally {
      setInventoryLoading(false);
    }
  };

  const openCourseEdit = (course: any) => {
    setEditingCourse(course);
    setCourseEditForm({
      title: course.title || '',
      slug: course.slug || '',
      instructor: course.instructor || '',
      description: course.description || '',
      price: course.price || 0,
      duration_hours: course.duration_hours || 0,
      lessons_count: course.lessons_count || 0,
      level: course.level || 'beginner',
      preview_video: course.preview_video || '',
      category: course.category || 'language',
      is_featured: !!course.is_featured,
      is_active: !!course.is_active,
      image: course.image || '',
    });
    setCourseEditData({
      sections: course.sections || [{ title: '', lessons: [{ title: '', description: '', video_url: '', video_file: null, video_file_url: '', duration_minutes: 0, is_free_preview: false, resources: [], quizzes: [] }] }],
      quizzes: course.quizzes || [{ title: '', questions: [{ question: '', options: ['', '', '', ''], correct_answer: 0 }] }],
    });
    setCourseCoverFile(null);
    setCourseCoverPreview('');
    setCourseVideoFile(null);
    setCourseVideoPreview('');
    setCourseEditStep('overview');
  };

  const handleCourseCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setCourseCoverFile(file);
    setCourseEditForm(prev => ({ ...prev, image: '' }));
    const reader = new FileReader();
    reader.onloadend = () => {
      setCourseCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadCourseCover = async (): Promise<string | null> => {
    if (!courseCoverFile) return null;
    setCourseCoverUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', courseCoverFile);
      formData.append('type', 'image');
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/staff/courses/upload-file`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      return data.url || storageUrl(data.path);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload image');
      return null;
    } finally {
      setCourseCoverUploading(false);
    }
  };

  const handleCourseVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      toast.error('Video file is too large (max 500MB)');
      return;
    }
    setCourseVideoFile(file);
    setCourseEditForm(prev => ({ ...prev, preview_video: '' }));
    setCourseVideoPreview(URL.createObjectURL(file));
  };

  const uploadCourseVideo = async (): Promise<string | null> => {
    if (!courseVideoFile) return null;
    setCourseVideoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', courseVideoFile);
      formData.append('type', 'video');
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/staff/courses/upload-file`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      return data.url || storageUrl(data.path);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload video');
      return null;
    } finally {
      setCourseVideoUploading(false);
    }
  };

  const handleCourseEditSave = async () => {
    if (!editingCourse) return;
    setEditSaving(true);
    try {
      let imageUrl: string | null = null;
      if (courseCoverFile) {
        imageUrl = await uploadCourseCover();
      }
      let videoUrl: string | null = null;
      if (courseVideoFile) {
        videoUrl = await uploadCourseVideo();
      }

      const cleanSections = courseEditData.sections
        .filter((s: any) => s.title.trim())
        .map((s: any, sIdx: number) => ({
          id: s.id || undefined,
          title: s.title,
          order: sIdx,
          lessons: (s.lessons || []).filter((l: any) => l.title.trim()).map((l: any, lIdx: number) => ({
            id: l.id || undefined,
            title: l.title,
            description: l.description || null,
            video_url: l.video_file_url || l.video_url || null,
            duration_minutes: l.duration_minutes || 0,
            is_free_preview: l.is_free_preview || false,
            order: lIdx,
            resources: (l.resources || []).map((r: any, rIdx: number) => ({
              id: r.id || undefined,
              title: r.title,
              file_path: r.file_path,
              file_type: r.file_type || 'document',
              file_size: r.file_size || 0,
            })),
            quizzes: (l.quizzes || []).filter((q: any) => q.title.trim()).map((q: any, qIdx: number) => ({
              id: q.id || undefined,
              title: q.title,
              order: qIdx,
              questions: (q.questions || []).filter((qq: any) => qq.question.trim()).map((qq: any, qqIdx: number) => {
                const opts = Array.isArray(qq.options) ? qq.options : JSON.parse(qq.options || '[]');
                return {
                  id: qq.id || undefined,
                  question: qq.question,
                  options: opts.filter((o: string) => o.trim()),
                  correct_answer: qq.correct_answer,
                  order: qqIdx,
                };
              }),
            })),
          })),
          lessons_count: (s.lessons || []).filter((l: any) => l.title.trim()).length,
        }));

      const cleanQuizzes = courseEditData.quizzes
        .filter((q: any) => q.title.trim())
        .map((q: any, qIdx: number) => ({
          id: q.id || undefined,
          title: q.title,
          order: qIdx,
          questions: (q.questions || []).filter((qq: any) => qq.question.trim()).map((qq: any, qqIdx: number) => {
            const opts = Array.isArray(qq.options) ? qq.options : JSON.parse(qq.options || '[]');
            return {
              id: qq.id || undefined,
              question: qq.question,
              options: opts.filter((o: string) => o.trim()),
              correct_answer: qq.correct_answer,
              order: qqIdx,
            };
          }),
        }));

      const totalMinutes = courseEditData.sections.reduce((acc: number, s: any) =>
        acc + (s.lessons || []).reduce((lAcc: number, l: any) => lAcc + (l.duration_minutes || 0), 0), 0);
      const totalLessons = courseEditData.sections.reduce((acc: number, s: any) =>
        acc + (s.lessons || []).filter((l: any) => l.title.trim()).length, 0);

      const updateData: any = {
        ...courseEditForm,
        sections: cleanSections,
        quizzes: cleanQuizzes,
        price: parseFloat(String(courseEditForm.price)) || 0,
        duration_hours: totalMinutes > 0 ? Math.ceil(totalMinutes / 60) : 0,
        lessons_count: totalLessons,
      };
      if (imageUrl) updateData.image = imageUrl;
      if (videoUrl) updateData.preview_video = videoUrl;

      await api.put(`/staff/courses/${editingCourse.id}`, updateData);
      toast.success('Course updated successfully');
      setEditingCourse(null);
      loadInventoryCourses();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update course');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteCourse = async (courseId: number, courseTitle: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Course',
      message: `Are you sure you want to delete "${courseTitle}"? This action cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/staff/courses/${courseId}`);
          toast.success('Course deleted successfully');
          loadInventoryCourses();
        } catch {
          toast.error('Failed to delete course');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleToggleCourseFeatured = async (course: any) => {
    const newFeatured = !course.is_featured;
    try {
      await api.put(`/staff/courses/${course.id}`, { is_featured: newFeatured });
      toast.success(newFeatured ? 'Course featured' : 'Course unfeatured');
      setInventoryCourses(prev => prev.map(c => c.id === course.id ? { ...c, is_featured: newFeatured } : c));
    } catch {
      toast.error('Failed to update featured status');
    }
  };

  const handleToggleCourseActive = async (course: any) => {
    const newActive = !course.is_active;
    try {
      await api.put(`/staff/courses/${course.id}`, { is_active: newActive });
      toast.success(newActive ? 'Course activated' : 'Course deactivated');
      setInventoryCourses(prev => prev.map(c => c.id === course.id ? { ...c, is_active: newActive } : c));
    } catch {
      toast.error('Failed to update status');
    }
  };

  const toggleSelectBook = (id: string) => {
    setSelectedBookIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedBookIds.size === inventoryBooks.length) {
      setSelectedBookIds(new Set());
    } else {
      setSelectedBookIds(new Set(inventoryBooks.map(b => b.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedBookIds.size === 0) return;
    setConfirmModal({
      isOpen: true,
      title: `Delete ${selectedBookIds.size} Books`,
      message: `Are you sure you want to delete ${selectedBookIds.size} selected books? This action cannot be undone.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          const ids = Array.from(selectedBookIds);
          await Promise.all(ids.map(id => api.delete(`/staff/books/${id}`)));
          toast.success(`${ids.length} books deleted successfully`);
          setSelectedBookIds(new Set());
          loadInventoryBooks();
        } catch {
          toast.error('Failed to delete some books');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleBatchRestock = async () => {
    if (selectedBookIds.size === 0) return;
    try {
      const ids = Array.from(selectedBookIds);
      await Promise.all(ids.map(id => api.put(`/staff/books/${id}`, { stock: 50 })));
      toast.success(`${ids.length} books restocked to 50 units`);
      setSelectedBookIds(new Set());
      loadInventoryBooks();
    } catch {
      toast.error('Failed to restock some books');
    }
  };

  const handleBatchFeature = async (featured: boolean) => {
    if (selectedBookIds.size === 0) return;
    try {
      const ids = Array.from(selectedBookIds);
      await Promise.all(ids.map(id => api.put(`/staff/books/${id}`, { is_featured: featured })));
      toast.success(`${ids.length} books ${featured ? 'featured' : 'unfeatured'}`);
      setSelectedBookIds(new Set());
      loadInventoryBooks();
    } catch {
      toast.error('Failed to update some books');
    }
  };

  const loadMyBooks = async () => {
    if (!user) return;
    try {
      const res = await api.get<any>('/staff/books', {
        per_page: String(myBooksPerPage),
        page: String(myBooksCurrentPage),
        status: 'approved',
      });
      const mappedBooks = (res.data || []).map(mapApiBookToBook) as StaffBook[];
      setMyBooks(mappedBooks);
      setMyBooksTotal(res.total || 0);
    } catch {
      setMyBooks([]);
      setMyBooksTotal(0);
    }
  };

  const loadDraftBooks = async () => {
    try {
      const res = await api.get<any>('/staff/books', {
        per_page: String(draftBooksPerPage),
        page: String(draftBooksCurrentPage),
        status: 'draft',
      });
      const mappedBooks = (res.data || []).map(mapApiBookToBook) as StaffBook[];
      setDraftBooks(mappedBooks);
      setDraftBooksTotal(res.total || 0);
    } catch {
      setDraftBooks([]);
      setDraftBooksTotal(0);
    }
  };

  const loadOverviewBooks = async () => {
    try {
      const res = await api.get<any>('/staff/books', { per_page: '50' });
      const mappedBooks = (res.data || []).map(mapApiBookToBook) as StaffBook[];
      setAllBooks(mappedBooks);
      setMyBooks(mappedBooks.filter(b => b.status !== 'draft'));
      setDraftBooks(mappedBooks.filter(b => b.status === 'draft'));
      setLowStockBooks(mappedBooks.filter(b => b.stock < 10));
    } catch {
      setAllBooks([]);
      setMyBooks([]);
      setDraftBooks([]);
      setLowStockBooks([]);
    }
  };

  const loadOrders = async () => {
    try {
      const ordersRes = await api.get<any>('/staff/orders', { per_page: String(ordersPerPage), page: String(orderCurrentPage) });
      const ordersData = ordersRes.data || [];
      setStaffOrders(ordersData.map((order: any) => ({
        id: String(order.id),
        userId: String(order.user_id),
        items: (order.items || []).map((item: any) => ({
          bookId: String(item.book_id),
          id: String(item.book_id),
          title: item.book?.title || 'Unknown Book',
          author: item.book?.author || '',
          price: item.price,
          quantity: item.quantity,
          coverUrl: item.book?.image || '',
          stock: item.book?.stock || 0,
          type: 'book' as const,
        } as CartItem)),
        total: parseFloat(order.total),
        status: order.status,
        paymentMethod: order.payment_method || 'unknown',
        createdAt: order.created_at,
        shippingAddress: {
          fullName: order.shipping_address || '',
          email: order.user?.email || '',
          address: order.shipping_address || '',
          city: order.city || '',
          zipCode: order.postal_code || '',
          phone: order.phone || '',
        },
      })));
      setOrdersTotal(ordersRes.total || 0);
    } catch {
      setStaffOrders([]);
      setOrdersTotal(0);
    }
  };

  useEffect(() => {
    if (activeTab === 'inventory') {
      loadInventoryBooks();
    }
    if (activeTab === 'my-books') {
      loadMyBooks();
    }
    if (activeTab === 'drafts') {
      loadDraftBooks();
    }
    if (activeTab === 'overview' && allBooks.length === 0) {
      loadOverviewBooks();
    }
  }, [activeTab, inventoryCurrentPage, debouncedInventorySearch, inventoryCategories, inventorySort, inventoryStockFilter, myBooksCurrentPage, draftBooksCurrentPage]);

  useEffect(() => {
    if (!user || user.role !== 'staff') {
      router.push('/');
      return;
    }

    const loadData = async () => {
      // Fetch dashboard metrics from staff dashboard endpoint
      try {
        const dashRes = await api.get<any>('/staff/dashboard');
        console.log('Dashboard response:', dashRes);
        if (dashRes) {
          const totalTitles = Number(dashRes.stats?.total_books) || 0;
          const warehouseStock = Number(dashRes.stats?.warehouse_stock) || 0;
          const categoriesCount = Number(dashRes.stats?.book_categories) || 0;
          const totalRevenue = Number(dashRes.stats?.total_revenue) || 0;
          setBooksMetrics({ totalTitles, warehouseStock, categories: categoriesCount, totalRevenue });
          const totalCourses = Number(dashRes.courses?.total) || 0;
          const totalVideos = Number(dashRes.courses?.total_videos) || 0;
          const courseCategoriesCount = Number(dashRes.courses?.categories) || 0;
          const courseRevenue = Number(dashRes.courses?.revenue) || 0;
          setCoursesMetrics({ total: totalCourses, total_videos: totalVideos, categories: courseCategoriesCount, revenue: courseRevenue });
          setCourseOverview({ total: totalCourses, recent: dashRes.courses?.recent ?? [] });
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        setCourseOverview(null);
      }

      // Fetch categories
      try {
        const categoriesRes = await api.get<ApiCategory[]>('/categories');
        setCategories(categoriesRes.map(c => c.name));
        setApiCategories(categoriesRes);
      } catch {
      }

      // Fetch course categories
      try {
        const courseCatRes = await api.get<{ id: number; name: string; slug: string; count: number }[]>('/staff/course-categories');
        setCourseCategories(courseCatRes || []);
      } catch {
        setCourseCategories([]);
      }

      // Fetch about data
      try {
        const aboutRes = await api.get<any>('/about');
        setAboutData(aboutRes);
        setAboutForm({
          title: aboutRes.title || '',
          hero_description: aboutRes.hero_description || '',
          our_story: aboutRes.our_story || '',
          our_mission: aboutRes.our_mission || '',
          our_values: aboutRes.our_values || '',
          contact_email: aboutRes.contact_email || '',
          contact_phone: aboutRes.contact_phone || '',
          contact_address: aboutRes.contact_address || '',
        });
      } catch {
      }

      // Fetch orders
      try {
        const ordersRes = await api.get<any>('/staff/orders', { per_page: String(ordersPerPage), page: String(orderCurrentPage) });
        const ordersData = ordersRes.data || [];
        setStaffOrders(ordersData.map((order: any) => ({
          id: String(order.id),
          userId: String(order.user_id),
          items: (order.items || []).map((item: any) => ({
            bookId: String(item.book_id),
            id: String(item.book_id),
            title: item.book?.title || 'Unknown Book',
            author: item.book?.author || '',
            price: item.price,
            quantity: item.quantity,
            coverUrl: item.book?.image || '',
            stock: item.book?.stock || 0,
            type: 'book' as const,
          } as CartItem)),
          total: parseFloat(order.total),
          status: order.status,
          paymentMethod: order.payment_method || 'unknown',
          createdAt: order.created_at,
          shippingAddress: {
            fullName: order.shipping_address || '',
            email: order.user?.email || '',
            address: order.shipping_address || '',
            city: order.city || '',
            zipCode: order.postal_code || '',
            phone: order.phone || '',
          },
        })));
        setOrdersTotal(ordersRes.total || 0);
      } catch {
        setStaffOrders([]);
        setOrdersTotal(0);
      }
    };

    loadData();
  }, [user, router]);

  const loadQanda = async () => {
    try {
      if (qandaType === 'books') {
        const res = await api.get<any>('/staff/all-questions', {
          per_page: String(qandaPerPage),
          page: String(qandaCurrentPage),
        });

        const questionsWithBookInfo = (res.data || []).map((q: any) => ({
          id: q.id,
          book_id: q.book_id,
          user_name: q.user_name,
          question: q.question,
          answer: q.answer,
          is_answered: q.is_answered,
          created_at: q.created_at,
          book_title: q.book?.title || 'Unknown',
          book_cover_url: q.book?.image || '',
        }));

        setQandaItems(questionsWithBookInfo);
        setQandaTotal(res.total || 0);
      } else {
        const res = await api.get<any>('/staff/all-course-questions', {
          per_page: String(qandaPerPage),
          page: String(qandaCurrentPage),
        });

        const questionsWithCourseInfo = (res.data || []).map((q: any) => ({
          id: q.id,
          course_id: q.course_id,
          user_name: q.user_name,
          question: q.question,
          answer: q.answer,
          is_answered: q.is_answered,
          created_at: q.created_at,
          course_title: q.course?.title || 'Unknown',
          course_image: q.course?.image || '',
        }));

        setQandaItems(questionsWithCourseInfo);
        setQandaTotal(res.total || 0);
      }
    } catch (err: any) {
      console.error('Failed to load Q&A:', err);
      setQandaItems([]);
      setQandaTotal(0);
    }
  };

  useEffect(() => {
    if (activeTab === 'inventory') {
      if (inventoryType === 'books') {
        loadInventoryBooks();
      } else {
        loadInventoryCourses();
      }
    }
    if (activeTab === 'my-books') {
      loadMyBooks();
    }
    if (activeTab === 'drafts') {
      loadDraftBooks();
    }
    if (activeTab === 'orders') {
      loadOrders();
    }
    if (activeTab === 'qanda') {
      loadQanda();
    }
  }, [activeTab, inventoryType, inventoryCurrentPage, inventoryPerPage, debouncedInventorySearch, inventoryCategories, inventorySort, inventoryStockFilter, myBooksCurrentPage, draftBooksCurrentPage, orderCurrentPage, qandaCurrentPage, qandaType, qandaFilter]);

  const filteredInventory = inventoryBooks.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                         book.author.toLowerCase().includes(inventorySearch.toLowerCase());
    const matchesCategory = inventoryCategories.length === 0 || inventoryCategories.includes(book.category);
    const matchesStock = inventoryStockFilter === 'all' || 
                        (inventoryStockFilter === 'low' && book.stock < 10) ||
                        (inventoryStockFilter === 'out' && book.stock === 0) ||
                        (inventoryStockFilter === 'in' && book.stock >= 10);
    const matchesPrice = book.price >= inventoryPriceRange[0] && book.price <= inventoryPriceRange[1];
    return matchesSearch && matchesCategory && matchesStock && matchesPrice;
  }).sort((a, b) => {
    if (inventorySort === 'newest') return new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime();
    if (inventorySort === 'oldest') return new Date((a as any).createdAt).getTime() - new Date((b as any).createdAt).getTime();
    if (inventorySort === 'title') return a.title.localeCompare(b.title);
    if (inventorySort === 'stock-low') return a.stock - b.stock;
    if (inventorySort === 'stock-high') return b.stock - a.stock;
    if (inventorySort === 'price-low') return a.price - b.price;
    if (inventorySort === 'price-high') return b.price - a.price;
    return 0;
  });

  const filteredStaffOrders = staffOrders.filter(order => {
    const matchesFilter = orderFilter === 'all' || order.status === orderFilter;
    const matchesSearch = !orderSearch || 
      order.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      (order.shippingAddress?.fullName || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
      (order.shippingAddress?.email || '').toLowerCase().includes(orderSearch.toLowerCase());
    return matchesFilter && matchesSearch;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim() || !user) return;
    try {
      const existingCat = apiCategories.find(c => c.name.toLowerCase() === newCategory.trim().toLowerCase());
      if (existingCat) {
        toast.error('Category already exists');
        return;
      }
      await api.post('/staff/categories', { name: newCategory.trim() });
      toast.success('Category added successfully');
      setNewCategory('');
      const catsRes = await api.get<ApiCategory[]>('/categories');
      setCategories(catsRes.map(c => c.name));
      setApiCategories(catsRes);
    } catch {
      toast.error('Failed to add category');
    }
  };

  const handleDeleteCategory = async (cat: string) => {
    if (!user) return;
    try {
      const catObj = apiCategories.find(c => c.name === cat);
      if (catObj) {
        await api.delete(`/staff/categories/${catObj.id}`);
        toast.success('Category deleted successfully');
        const catsRes = await api.get<ApiCategory[]>('/categories');
        setCategories(catsRes.map(c => c.name));
        setApiCategories(catsRes);
      }
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const handleAddCourseCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseCategory.trim() || !user) return;
    try {
      const existingCat = courseCategories.find(c => c.name.toLowerCase() === newCourseCategory.trim().toLowerCase());
      if (existingCat) {
        toast.error('Course category already exists');
        return;
      }
      await api.post('/staff/course-categories', { name: newCourseCategory.trim() });
      toast.success('Course category added successfully');
      setNewCourseCategory('');
      const catRes = await api.get<{ id: number; name: string; slug: string; count: number }[]>('/staff/course-categories');
      setCourseCategories(catRes || []);
    } catch {
      toast.error('Failed to add course category');
    }
  };

  const handleDeleteCourseCategory = async (id: number) => {
    if (!user) return;
    try {
      await api.delete(`/staff/course-categories/${id}`);
      toast.success('Course category deleted successfully');
      const catRes = await api.get<{ id: number; name: string; slug: string; count: number }[]>('/staff/course-categories');
      setCourseCategories(catRes || []);
    } catch {
      toast.error('Failed to delete course category');
    }
  };

  const handleAddBook = async (e: React.FormEvent, saveAsDraft: boolean = false) => {
    e.preventDefault();
    if (!newBook.title || !newBook.author || !newBook.description) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!newBook.category) {
      toast.error('Please select a category');
      return;
    }

    setLoading(true);
    try {
      const catObj = apiCategories.find(c => c.name === newBook.category);
      if (!catObj) {
        toast.error('Selected category not found');
        setLoading(false);
        return;
      }

      let coverImage = newBook.coverUrl || null;
      if (newBookCoverFile) {
        setNewBookCoverUploading(true);
        const uploadedUrl = await uploadImageFile(newBookCoverFile);
        setNewBookCoverUploading(false);
        if (uploadedUrl) {
          coverImage = uploadedUrl;
        }
      }

      let previewImages: string[] = [];
      if (newBookPreviewFiles.length > 0) {
        setNewBookPreviewUploading(true);
        for (const file of newBookPreviewFiles) {
          const url = await uploadImageFile(file);
          if (url) previewImages.push(url);
        }
        setNewBookPreviewUploading(false);
      }

      await api.post('/staff/books', {
        title: newBook.title,
        author: newBook.author,
        description: newBook.description,
        category_id: catObj.id,
        price: newBook.price || 0,
        pdf_price: newBook.pdfPrice || null,
        pages: newBook.pages || null,
        stock: newBook.stock || 0,
        language: newBook.language || null,
        image: coverImage,
        preview_images: [...previewImages, ...newBookPdfExtracted],
        pdf_path: newBookPdfPath,
        status: saveAsDraft ? 'draft' : 'approved',
      });
      toast.success(saveAsDraft ? 'Book saved as draft!' : 'Book added successfully!');
      
      const booksRes = await api.get<{ data: ApiBook[] }>('/staff/books');
      const mappedBooks = (booksRes.data || []).map(mapApiBookToBook) as StaffBook[];
      setAllBooks(mappedBooks);
      setMyBooks(mappedBooks.filter(b => b.submittedBy === user?.uid && b.status !== 'draft'));
      setDraftBooks(mappedBooks.filter(b => b.status === 'draft'));
      setLowStockBooks(mappedBooks.filter(b => b.stock < 5));
      
      
      setActiveTab('my-books');
      setNewBook({
        title: '',
        author: '',
        description: '',
        category: categories[0] || 'Fiction',
        price: 0,
        stock: 0,
        coverUrl: '',
        previewContent: [],
        previewImages: [],
      });
      setNewBookCoverFile(null);
      setNewBookCoverPreview('');
      setNewBookPreviewFiles([]);
      setNewBookPreviewPreviews([]);
      setNewBookPdfFile(null);
      setNewBookPdfName('');
      setNewBookPdfPath(null);
      setNewBookPdfExtracted([]);
      setNewBookPdfTotalPages(0);
    } catch (err: any) {
      const msg = err.message || err.error || 'Failed to add book';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEditBook = (book: StaffBook) => {
    setEditingBookId(book.id);
    setNewBook({
      title: book.title,
      author: book.author,
      description: book.description,
      category: book.category,
      price: book.price,
      stock: book.stock,
      coverUrl: book.coverUrl,
      pages: book.pages || 0,
      previewContent: book.previewContent
    });
    setActiveTab('add-book');
  };

  const openInventoryEdit = (book: StaffBook) => {
    setEditingInventoryBook(book);
    setEditForm({
      title: book.title,
      author: book.author,
      description: book.description || '',
      category: book.category,
      price: book.price,
      pdfPrice: book.pdfPrice || undefined,
      stock: book.stock,
      coverUrl: book.coverUrl || '',
      pages: book.pages || 0,
      language: book.language || '',
      previewImages: book.previewImages || [],
    });
    setCoverFile(null);
    setCoverPreview('');
    setPreviewFiles([]);
    setPreviewUrls(book.previewImages || []);
    setEditPdfFile(null);
    setEditPdfPath(book.pdfPath || null);
    if (book.pdfPath) {
      const pdfPreviews = (book.previewImages || []).filter(u => u.includes('book-previews'));
      setEditPdfExtracted(pdfPreviews);
      setEditPdfPreviewPages(pdfPreviews.length || 5);
      setEditPdfPagesInput(String(pdfPreviews.length || 5));
      setEditPdfName('PDF already uploaded');
    } else {
      setEditPdfName('');
      setEditPdfExtracted([]);
      setEditPdfTotalPages(0);
    }
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setCoverFile(file);
    setEditForm(prev => ({ ...prev, coverUrl: '' }));
    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadCover = async (): Promise<string | null> => {
    if (!coverFile) return null;
    setCoverUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', coverFile);
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/staff/books/upload-cover`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const msg = err.message || err.error || 'Upload failed';
        throw new Error(msg);
      }
      const data = await response.json();
      return data.url || storageUrl(data.path);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload cover image');
      return null;
    } finally {
      setCoverUploading(false);
    }
  };

  const handlePreviewFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast.error('Please select image files');
      return;
    }
    setPreviewFiles(prev => [...prev, ...imageFiles]);
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removePreviewImage = (index: number) => {
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    setPreviewFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPreviewImages = async (): Promise<string[]> => {
    if (previewFiles.length === 0) return [];
    const urls: string[] = [];
    for (const file of previewFiles) {
      const formData = new FormData();
      formData.append('image', file);
      const token = localStorage.getItem('auth_token');
      try {
        const response = await fetch(`${API_URL}/staff/books/upload-cover`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
          body: formData,
        });
        if (response.ok) {
          const data = await response.json();
          urls.push(data.url || storageUrl(data.path));
        }
      } catch {}
    }
    return urls;
  };

  const handleInventoryEditSave = async () => {
    if (!editingInventoryBook) return;
    setEditSaving(true);
    try {
      let imageUrl: string | null = null;
      if (coverFile) {
        imageUrl = await uploadCover();
      }
      const newPreviewUrls = await uploadPreviewImages();
      const allPreviewUrls = [...previewUrls.filter((_, i) => i < previewUrls.length - previewFiles.length), ...newPreviewUrls];
      const catObj = apiCategories.find(c => c.name === editForm.category);
      const updateData: any = {
        title: editForm.title,
        author: editForm.author,
        description: editForm.description,
        category_id: catObj?.id,
        price: editForm.price,
        pdf_price: editForm.pdfPrice || null,
        pages: editForm.pages || null,
        stock: editForm.stock,
        language: editForm.language || null,
        preview_images: allPreviewUrls,
        pdf_path: editPdfPath,
      };
      if (imageUrl) {
        updateData.image = imageUrl;
      }
      await api.put(`/staff/books/${editingInventoryBook.id}`, updateData);
      toast.success('Book updated successfully');
      setEditingInventoryBook(null);
      const booksRes = await api.get<{ data: ApiBook[] }>('/staff/books');
      const mappedBooks = (booksRes.data || []).map(mapApiBookToBook) as StaffBook[];
      setAllBooks(mappedBooks);
      setMyBooks(mappedBooks.filter(b => b.submittedBy === user?.uid && b.status !== 'draft'));
      setDraftBooks(mappedBooks.filter(b => b.status === 'draft'));
      setLowStockBooks(mappedBooks.filter(b => b.stock < 5));
      
    } catch {
      toast.error('Failed to update book');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirm Deletion',
      message: 'Are you sure you want to delete this book? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await api.delete(`/staff/books/${bookId}`);
          toast.success('Book deleted successfully');
          const booksRes = await api.get<{ data: ApiBook[] }>('/staff/books');
          const mappedBooks = (booksRes.data || []).map(mapApiBookToBook) as StaffBook[];
          setAllBooks(mappedBooks);
          setMyBooks(mappedBooks.filter(b => b.submittedBy === user?.uid && b.status !== 'draft'));
          setDraftBooks(mappedBooks.filter(b => b.status === 'draft'));
          setLowStockBooks(mappedBooks.filter(b => b.stock < 5));
          
        } catch {
          toast.error('Failed to delete book');
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      type: 'danger'
    });
  };

  const handleSaveDraft = async () => {
    if (!newBook.title) {
      toast.error('Please enter at least a book title to save as draft');
      return;
    }

    setLoading(true);
    try {
      const catObj = apiCategories.find(c => c.name === newBook.category);
      await api.post('/staff/books', {
        title: newBook.title,
        author: newBook.author || '',
        description: newBook.description || '',
        category_id: catObj?.id || null,
        price: newBook.price || 0,
        stock: newBook.stock || 0,
        image: newBook.coverUrl || null,
        preview_images: newBook.previewImages || [],
        status: 'draft',
      });
      toast.success('Book saved as draft!');
      
      const booksRes = await api.get<{ data: ApiBook[] }>('/staff/books');
      const mappedBooks = (booksRes.data || []).map(mapApiBookToBook) as StaffBook[];
      setAllBooks(mappedBooks);
      setMyBooks(mappedBooks.filter(b => b.submittedBy === user?.uid && b.status !== 'draft'));
      setDraftBooks(mappedBooks.filter(b => b.status === 'draft'));
      setLowStockBooks(mappedBooks.filter(b => b.stock < 5));
      
      
      setActiveTab('drafts');
      setNewBook({
        title: '',
        author: '',
        description: '',
        category: categories[0] || 'Fiction',
        price: 0,
        stock: 0,
        coverUrl: '',
        previewContent: [],
        previewImages: [],
      });
    } catch (err: any) {
      const msg = err.message || err.error || 'Failed to save draft';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'draft': return <FileText className="w-4 h-4 text-gray-500" />;
      case 'pending_deletion': return <Trash2 className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-orange-500" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved': return 'bg-green-50 text-green-700 border-green-100';
      case 'draft': return 'bg-gray-50 text-gray-700 border-gray-100';
      case 'pending_deletion': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-orange-50 text-orange-700 border-orange-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 space-y-2">
          <div className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-gray-900">Staff Panel</h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Management</p>
              </div>
            </div>
          </div>

          {[
            { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
            { id: 'my-books', label: 'My Submissions', icon: BookOpen },
            { id: 'drafts', label: 'Drafts', icon: FileText },
            { id: 'inventory', label: 'Inventory Management', icon: Package },
            { id: 'categories', label: 'Manage Categories', icon: Tag },
            { id: 'add-book', label: 'Add New Book', icon: PlusCircle },
            { id: 'add-course', label: 'Add New Course', icon: GraduationCap },
            { id: 'course-access', label: 'Course Access', icon: Link2 },
            { id: 'qanda', label: 'Q&A Management', icon: MessageSquare },
            { id: 'orders', label: 'Order Management', icon: Package },
            { id: 'gallery', label: 'Manage Gallery', icon: Images },
            { id: 'about', label: 'Edit About Page', icon: Info },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all text-left relative",
                activeTab === tab.id 
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </aside>

        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Books Management</h2>
                  <a href="/staff/inventory" className="text-sm text-orange-600 font-semibold hover:underline">Manage Books</a>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-xs font-bold uppercase text-gray-500 mb-1">Total Titles</div>
                    <div className="text-3xl font-bold text-gray-900">{booksMetrics.totalTitles}</div>
                    <div className="text-xs text-gray-400 mt-1">Books</div>
                  </div>
                  <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-xs font-bold uppercase text-gray-500 mb-1">Warehouse Stock</div>
                    <div className="text-3xl font-bold text-gray-900">{booksMetrics.warehouseStock.toLocaleString()}</div>
                    <div className="text-xs text-gray-400 mt-1">Total stock across books</div>
                  </div>
                  <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-xs font-bold uppercase text-gray-500 mb-1">Categories</div>
                    <div className="text-3xl font-bold text-gray-900">{booksMetrics.categories.toString().padStart(2, '0')}</div>
                    <div className="text-xs text-gray-400 mt-1">Book categories</div>
                  </div>
                  <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-xs font-bold uppercase text-gray-500 mb-1">Total Revenue</div>
                    <div className="text-3xl font-bold text-gray-900">{formatMoney(booksMetrics.totalRevenue)}</div>
                    <div className="text-xs text-gray-400 mt-1">All-time revenue</div>
                  </div>
                </div>

                <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <h3 className="text-lg font-semibold text-gray-900">Inventory Alert: Books Needing Restock</h3>
                    </div>
                  </div>
                  {lowStockBooks.length > 0 ? (
                    <div className="space-y-3">
                      {lowStockBooks.map(book => (
                        <div key={book.id} className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                          <div className="flex items-center gap-3">
                            <img src={book.coverUrl} alt={book.title} className="w-12 h-12 rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48x48?text=Book'; }} />
                            <div>
                              <div className="font-semibold text-gray-900">{book.title}</div>
                              <div className="text-sm text-red-600">Only {book.stock} left in stock</div>
                            </div>
                          </div>
                          <button className="px-4 py-2 rounded-lg border border-red-600 text-red-600 bg-white text-sm font-semibold hover:bg-red-600 hover:text-white transition-all">Restock Now</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-sm text-gray-500">All items are well-stocked.</div>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Course Academy</h2>
                  <a href="/staff/courses" className="text-sm text-orange-600 font-semibold hover:underline">Manage Courses</a>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-xs font-bold uppercase text-gray-500 mb-1">Total Courses</div>
                    <div className="text-3xl font-bold text-gray-900">{coursesMetrics.total}</div>
                    <div className="text-xs text-gray-400 mt-1">Courses</div>
                  </div>
                  <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-xs font-bold uppercase text-gray-500 mb-1">Total Videos</div>
                    <div className="text-3xl font-bold text-gray-900">{coursesMetrics.total_videos}</div>
                    <div className="text-xs text-gray-400 mt-1">Videos</div>
                  </div>
                  <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-xs font-bold uppercase text-gray-500 mb-1">Categories</div>
                    <div className="text-3xl font-bold text-gray-900">{coursesMetrics.categories.toString().padStart(2, '0')}</div>
                    <div className="text-xs text-gray-400 mt-1">Categories</div>
                  </div>
                  <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-xs font-bold uppercase text-gray-500 mb-1">Total Revenue</div>
                    <div className="text-3xl font-bold text-gray-900">{formatMoney(coursesMetrics.revenue)}</div>
                    <div className="text-xs text-gray-400 mt-1">Revenue</div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'my-books' && (
              <motion.div
                key="my-books"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-3xl font-serif font-bold text-gray-900">My Submissions</h3>
                      <p className="text-sm text-gray-500">{myBooksTotal} books</p>
                    </div>
                    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          viewMode === 'grid' ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          viewMode === 'list' ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {myBooks.length > 0 ? (
                    viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {myBooks.map(book => (
                          <div key={book.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                            <div className="flex gap-4">
                              <div className="w-20 h-28 rounded-xl overflow-hidden shrink-0">
                                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-serif font-bold text-gray-900 truncate">{book.title}</h3>
                                <p className="text-sm text-gray-500 truncate">by {book.author}</p>
                                <p className="text-sm font-bold text-gray-900 mt-2">৳{book.price.toFixed(2)}</p>
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-2 inline-block",
                                  book.status === 'approved' ? 'bg-green-50 text-green-600' :
                                  book.status === 'draft' ? 'bg-yellow-50 text-yellow-600' :
                                  'bg-gray-50 text-gray-600'
                                )}>
                                  {book.status || 'draft'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        </div>
                    ) : (
                      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                              <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Book</th>
                              <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Price</th>
                              <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                              <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {myBooks.map(book => (
                              <tr key={book.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0">
                                      <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                      <p className="font-bold text-gray-900">{book.title}</p>
                                      <p className="text-sm text-gray-500">{book.author}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 text-sm font-bold text-gray-900">৳{book.price.toFixed(2)}</td>
                                <td className="p-4">
                                  <span className={cn(
                                    "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                    book.status === 'approved' ? 'bg-green-50 text-green-600' :
                                    book.status === 'draft' ? 'bg-yellow-50 text-yellow-600' :
                                    'bg-gray-50 text-gray-600'
                                  )}>
                                    {book.status || 'draft'}
                                  </span>
                                </td>
                                <td className="p-4 text-sm text-gray-500">
                                  {(book as any).createdAt ? new Date((book as any).createdAt).toLocaleDateString() : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                      <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No submissions yet.</p>
                    </div>
                  )}

                  {myBooksTotal > myBooksPerPage && (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setMyBooksCurrentPage(p => Math.max(1, p - 1))}
                        disabled={myBooksCurrentPage === 1}
                        className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="px-4 py-2 text-sm text-gray-500">
                        Page {myBooksCurrentPage} of {Math.ceil(myBooksTotal / myBooksPerPage)}
                      </span>
                      <button
                        onClick={() => setMyBooksCurrentPage(p => p + 1)}
                        disabled={myBooksCurrentPage >= Math.ceil(myBooksTotal / myBooksPerPage)}
                        className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'drafts' && (
              <motion.div
                key="drafts"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-3xl font-serif font-bold text-gray-900">Draft Books</h3>
                    <p className="text-sm text-gray-500">{draftBooksTotal} books</p>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        viewMode === 'grid' ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        viewMode === 'list' ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {draftBooks.length > 0 ? (
                  viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {draftBooks.map(book => (
                        <div key={book.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                          <div className="flex gap-4">
                            <div className="w-20 h-28 rounded-xl overflow-hidden shrink-0">
                              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-serif font-bold text-gray-900 truncate">{book.title}</h3>
                              <p className="text-sm text-gray-500 truncate">by {book.author}</p>
                              <p className="text-sm font-bold text-gray-900 mt-2">৳{book.price.toFixed(2)}</p>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-2 inline-block bg-yellow-50 text-yellow-600">
                                draft
                              </span>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                            <button
                              onClick={() => openInventoryEdit(book)}
                              className="flex-1 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-100 transition-all"
                            >
                              Edit
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Book</th>
                            <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Price</th>
                            <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                            <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {draftBooks.map(book => (
                            <tr key={book.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0">
                                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900">{book.title}</p>
                                    <p className="text-sm text-gray-500">{book.author}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-sm font-bold text-gray-900">৳{book.price.toFixed(2)}</td>
                              <td className="p-4">
                                <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-50 text-yellow-600">
                                  draft
                                </span>
                              </td>
                              <td className="p-4 text-sm text-gray-500">
                                {(book as any).createdAt ? new Date((book as any).createdAt).toLocaleDateString() : '-'}
                              </td>
                              <td className="p-4">
                                <button
                                  onClick={() => openInventoryEdit(book)}
                                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No draft books yet.</p>
                  </div>
                )}

                {draftBooksTotal > draftBooksPerPage && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setDraftBooksCurrentPage(p => Math.max(1, p - 1))}
                      disabled={draftBooksCurrentPage === 1}
                      className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-500">
                      Page {draftBooksCurrentPage} of {Math.ceil(draftBooksTotal / draftBooksPerPage)}
                    </span>
                    <button
                      onClick={() => setDraftBooksCurrentPage(p => p + 1)}
                      disabled={draftBooksCurrentPage >= Math.ceil(draftBooksTotal / draftBooksPerPage)}
                      className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'inventory' && (
              <motion.div
                key="inventory"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-serif font-bold text-gray-900">Inventory Management</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                      <button
                        onClick={() => setInventoryType('books')}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                          inventoryType === 'books' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        <BookOpen className="w-4 h-4 inline mr-1" />
                        Books
                      </button>
                      <button
                        onClick={() => setInventoryType('courses')}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                          inventoryType === 'courses' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        <GraduationCap className="w-4 h-4 inline mr-1" />
                        Courses
                      </button>
                    </div>
                    {inventoryType === 'books' && (
                      <>
                        <p className="text-sm text-gray-500">{inventoryTotal} total books</p>
                        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                          <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              viewMode === 'grid' ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                          >
                            <LayoutGrid className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              viewMode === 'list' ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                          >
                            <List className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                    {inventoryType === 'courses' && (
                      <>
                        <p className="text-sm text-gray-500">{inventoryCoursesTotal} total courses</p>
                        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                          <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              viewMode === 'grid' ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                          >
                            <LayoutGrid className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              viewMode === 'list' ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                          >
                            <List className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Books Inventory */}
                {inventoryType === 'books' && (
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                      placeholder="Search by title or author..."
                      className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                    />
                  </div>
                  <select
                    value={inventorySort}
                    onChange={(e) => setInventorySort(e.target.value)}
                    className="px-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title">Sort by Title</option>
                    <option value="stock-low">Stock: Low to High</option>
                    <option value="stock-high">Stock: High to Low</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                  <select
                    value={inventoryStockFilter}
                    onChange={(e) => setInventoryStockFilter(e.target.value)}
                    className="px-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                  >
                    <option value="all">All Stock</option>
                    <option value="in">In Stock (10+)</option>
                    <option value="low">Low Stock (&lt;10)</option>
                    <option value="out">Out of Stock</option>
                  </select>
                  <div className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold">
                    <span className="text-gray-500">৳</span>
                    <input
                      type="range"
                      min="0"
                      max={inventoryMaxPrice}
                      value={inventoryPriceRange[1]}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setInventoryPriceRange([0, val]);
                      }}
                      className="w-24 accent-orange-600"
                    />
                    <span className="text-gray-700">৳{inventoryPriceRange[1].toLocaleString()}</span>
                  </div>
                </div>
                )}

                {/* Courses Inventory Filters */}
                {inventoryType === 'courses' && (
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      placeholder="Search by title or instructor..."
                      className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                    />
                  </div>
                  <select
                    value={courseSort}
                    onChange={(e) => setCourseSort(e.target.value)}
                    className="px-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title">Sort by Title</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                  <select
                    value={courseStatusFilter}
                    onChange={(e) => setCourseStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                    className="px-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                )}

                {/* Books Inventory Content */}
                {inventoryType === 'books' && filteredInventory.length > 0 ? (
                  viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredInventory.map(book => (
                        <div key={book.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                          <div className="flex gap-4">
                            <div className="w-20 h-28 rounded-xl overflow-hidden shrink-0">
                              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-serif font-bold text-gray-900 truncate">{book.title}</h3>
                              <p className="text-sm text-gray-500 truncate">by {book.author}</p>
                              <p className="text-sm font-bold text-gray-900 mt-2">৳{book.price.toFixed(2)}</p>
                              <div className="mt-2 flex items-center gap-2 flex-wrap">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                  (book as any).status === 'draft' ? "bg-yellow-50 text-yellow-600" :
                                  "bg-green-50 text-green-600"
                                )}>
                                  {(book as any).status || 'approved'}
                                </span>
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                  book.stock === 0 ? "bg-red-50 text-red-600" :
                                  book.stock < 10 ? "bg-orange-50 text-orange-600" :
                                  "bg-green-50 text-green-600"
                                )}>
                                  {book.stock === 0 ? "Out of Stock" : book.stock < 10 ? `Low Stock (${book.stock})` : `In Stock (${book.stock})`}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                            <button
                              onClick={async () => {
                                const newFeatured = !(book as any).isFeatured;
                                setInventoryBooks(prev => prev.map(b => 
                                  b.id === book.id ? { ...b, isFeatured: newFeatured } as StaffBook : b
                                ));
                                try {
                                  await api.put(`/staff/books/${book.id}`, { is_featured: newFeatured });
                                  toast.success(newFeatured ? 'Added to featured' : 'Removed from featured');
                                } catch {
                                  setInventoryBooks(prev => prev.map(b => 
                                    b.id === book.id ? { ...b, isFeatured: !newFeatured } as StaffBook : b
                                  ));
                                  toast.error('Failed to update featured status');
                                }
                              }}
                              className={cn(
                                "flex-1 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                                (book as any).isFeatured 
                                  ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100" 
                                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                              )}
                            >
                              {(book as any).isFeatured ? "★ Featured" : "☆ Feature"}
                            </button>
                            <button
                              onClick={() => openInventoryEdit(book)}
                              className="flex-1 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-100 transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: 'Delete Book',
                                  message: `Are you sure you want to delete "${book.title}"? This action cannot be undone.`,
                                  type: 'danger',
                                  onConfirm: async () => {
                                    try {
                                      await api.delete(`/staff/books/${book.id}`);
                                      toast.success('Book deleted successfully');
                                      loadInventoryBooks();
                                    } catch {
                                      toast.error('Failed to delete book');
                                    }
                                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                  }
                                });
                              }}
                              className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Book</th>
                            <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Category</th>
                            <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Price</th>
                            <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Stock</th>
                            <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                            <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredInventory.map(book => (
                            <tr key={book.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0">
                                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-900 truncate max-w-[200px]">{book.title}</p>
                                    <p className="text-sm text-gray-500">{book.author}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-sm text-gray-600">{book.category}</td>
                              <td className="p-4 text-sm font-bold text-gray-900">৳{book.price.toFixed(2)}</td>
                              <td className="p-4">
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                  book.stock === 0 ? "bg-red-50 text-red-600" :
                                  book.stock < 10 ? "bg-orange-50 text-orange-600" :
                                  "bg-green-50 text-green-600"
                                )}>
                                  {book.stock === 0 ? "Out of Stock" : book.stock < 10 ? `Low (${book.stock})` : `${book.stock}`}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={cn(
                                  "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                  (book as any).status === 'draft' ? "bg-yellow-50 text-yellow-600" :
                                  "bg-green-50 text-green-600"
                                )}>
                                  {(book as any).status || 'approved'}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openInventoryEdit(book)}
                                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setConfirmModal({
                                        isOpen: true,
                                        title: 'Delete Book',
                                        message: `Are you sure you want to delete "${book.title}"?`,
                                        type: 'danger',
                                        onConfirm: async () => {
                                          try {
                                            await api.delete(`/staff/books/${book.id}`);
                                            toast.success('Book deleted');
                                            loadInventoryBooks();
                                          } catch {
                                            toast.error('Failed to delete');
                                          }
                                          setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                        }
                                      });
                                    }}
                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : inventoryType === 'books' ? (
                  <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No books found in inventory</p>
                  </div>
                ) : null}

                {/* Courses Inventory Content */}
                {inventoryType === 'courses' && (() => {
                  const filteredCourses = inventoryCourses.filter(course => {
                    const matchesSearch = course.title?.toLowerCase().includes(courseSearch.toLowerCase()) ||
                                         course.instructor?.toLowerCase().includes(courseSearch.toLowerCase());
                    const matchesStatus = courseStatusFilter === 'all' ||
                                         (courseStatusFilter === 'active' && course.is_active) ||
                                         (courseStatusFilter === 'inactive' && !course.is_active);
                    return matchesSearch && matchesStatus;
                  }).sort((a, b) => {
                    if (courseSort === 'newest') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
                    if (courseSort === 'oldest') return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
                    if (courseSort === 'title') return (a.title || '').localeCompare(b.title || '');
                    if (courseSort === 'price-low') return (a.price || 0) - (b.price || 0);
                    if (courseSort === 'price-high') return (b.price || 0) - (a.price || 0);
                    return 0;
                  });

                  return filteredCourses.length > 0 ? (
                    viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCourses.map(course => {
                          const totalLessons = (course.sections || []).reduce((acc: number, s: any) => acc + (s.lessons?.length || 0), 0);
                          const totalQuizzes = (course.quizzes || []).length + (course.sections || []).flatMap((s: any) => s.lessons || []).reduce((acc: number, l: any) => acc + (l.quizzes?.length || 0), 0);
                          return (
                            <div key={course.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                              <div className="w-full h-40 rounded-xl overflow-hidden shrink-0 bg-gray-100 mb-4">
                                {course.image ? (
                                  <img src={course.image} alt={course.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class=\'w-full h-full flex items-center justify-center text-gray-400\'><svg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><path d=\'M22 10v6M2 10l10-5 10 5-10 5z\'/><path d=\'M6 12v5c3 3 9 3 12 0v-5\'/></svg></div>'; }} />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <GraduationCap className="w-8 h-8" />
                                  </div>
                                )}
                              </div>
                              <h3 className="font-serif font-bold text-gray-900 truncate">{course.title}</h3>
                              <p className="text-sm text-gray-500 truncate">by {course.instructor}</p>
                              <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {course.duration_hours || 0}h
                                </span>
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" />
                                  {totalLessons} lessons
                                </span>
                                {totalQuizzes > 0 && (
                                  <span className="flex items-center gap-1">
                                    <ClipboardList className="w-3 h-3" />
                                    {totalQuizzes} quizzes
                                  </span>
                                )}
                              </div>
                              <div className="mt-3 flex items-center gap-2 flex-wrap">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                  course.level === 'beginner' ? "bg-green-50 text-green-600" :
                                  course.level === 'intermediate' ? "bg-yellow-50 text-yellow-600" :
                                  "bg-red-50 text-red-600"
                                )}>
                                  {course.level}
                                </span>
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                  course.is_active ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-500"
                                )}>
                                  {course.is_active ? 'Active' : 'Inactive'}
                                </span>
                                {course.is_featured && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-50 text-yellow-600">
                                    ★ Featured
                                  </span>
                                )}
                              </div>
                              <p className="text-lg font-bold text-gray-900 mt-3">৳{course.price || 0}</p>
                              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                                <button
                                  onClick={() => handleToggleCourseFeatured(course)}
                                  className={cn(
                                    "flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all",
                                    course.is_featured 
                                      ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100" 
                                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                                  )}
                                >
                                  {course.is_featured ? "★ Featured" : "☆ Feature"}
                                </button>
                                <button
                                  onClick={() => handleToggleCourseActive(course)}
                                  className={cn(
                                    "flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all",
                                    course.is_active 
                                      ? "bg-green-50 text-green-600 hover:bg-green-100" 
                                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                                  )}
                                >
                                  {course.is_active ? "Active" : "Activate"}
                                </button>
                                <button
                                  onClick={() => openCourseEdit(course)}
                                  className="px-3 py-2 bg-gray-50 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-100 transition-all"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteCourse(course.id, course.title)}
                                  className="px-3 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                              <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Course</th>
                              <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Category</th>
                              <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Level</th>
                              <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Duration</th>
                              <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Lessons</th>
                              <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Price</th>
                              <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                              <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredCourses.map(course => {
                              const totalLessons = (course.sections || []).reduce((acc: number, s: any) => acc + (s.lessons?.length || 0), 0);
                              return (
                                <tr key={course.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                  <td className="p-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-16 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                                        {course.image ? (
                                          <img src={course.image} alt={course.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <GraduationCap className="w-4 h-4" />
                                          </div>
                                        )}
                                      </div>
                                      <div>
                                        <p className="font-bold text-gray-900 truncate max-w-[200px]">{course.title}</p>
                                        <p className="text-xs text-gray-500">{course.instructor}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-4 text-sm text-gray-600 capitalize">{course.category || '-'}</td>
                                  <td className="p-4">
                                    <span className={cn(
                                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                      course.level === 'beginner' ? "bg-green-50 text-green-600" :
                                      course.level === 'intermediate' ? "bg-yellow-50 text-yellow-600" :
                                      "bg-red-50 text-red-600"
                                    )}>
                                      {course.level}
                                    </span>
                                  </td>
                                  <td className="p-4 text-sm text-gray-600">{course.duration_hours || 0}h</td>
                                  <td className="p-4 text-sm text-gray-600">{totalLessons}</td>
                                  <td className="p-4 text-sm font-bold text-gray-900">৳{course.price || 0}</td>
                                  <td className="p-4">
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <span className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                        course.is_active ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-500"
                                      )}>
                                        {course.is_active ? 'Active' : 'Inactive'}
                                      </span>
                                      {course.is_featured && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-50 text-yellow-600">
                                          ★
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleToggleCourseActive(course)}
                                        className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                        title={course.is_active ? 'Deactivate' : 'Activate'}
                                      >
                                        {course.is_active ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                      </button>
                                      <button
                                        onClick={() => openCourseEdit(course)}
                                        className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                                        title="Edit"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteCourse(course.id, course.title)}
                                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all"
                                        title="Delete"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                      <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No courses found</p>
                    </div>
                  );
                })()}

                {/* Books Pagination */}
                {inventoryType === 'books' && inventoryTotal > inventoryPerPage && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setInventoryCurrentPage(p => Math.max(1, p - 1))}
                      disabled={inventoryCurrentPage === 1}
                      className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-500">
                      Page {inventoryCurrentPage} of {Math.ceil(inventoryTotal / inventoryPerPage)}
                    </span>
                    <button
                      onClick={() => setInventoryCurrentPage(p => p + 1)}
                      disabled={inventoryCurrentPage >= Math.ceil(inventoryTotal / inventoryPerPage)}
                      className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'categories' && (
              <motion.div
                key="categories"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Books Categories */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Book Categories</h3>
                  <form onSubmit={handleAddCategory} className="flex gap-4 mb-4">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="New book category name..."
                      className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                    />
                    <button
                      type="submit"
                      className="px-5 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all"
                    >
                      Add
                    </button>
                  </form>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {categories.map(cat => (
                      <div key={cat} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="font-semibold text-gray-800 text-sm">{cat}</span>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {categories.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No book categories yet</div>
                  )}
                </div>

                {/* Course Categories */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Course Categories</h3>
                  <form onSubmit={handleAddCourseCategory} className="flex gap-4 mb-4">
                    <input
                      type="text"
                      value={newCourseCategory}
                      onChange={(e) => setNewCourseCategory(e.target.value)}
                      placeholder="New course category name..."
                      className="flex-1 p-3 bg-gray-50 border border-gray-100 rounded-xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                    />
                    <button
                      type="submit"
                      className="px-5 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all"
                    >
                      Add
                    </button>
                  </form>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {courseCategories.map((cat, idx) => (
                      <div key={cat.id ?? `cat-${idx}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="font-semibold text-gray-800 text-sm">{cat.name}</span>
                        <button
                          onClick={() => handleDeleteCourseCategory(cat.id!)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {courseCategories.length === 0 && (
                    <div className="text-center py-8 text-gray-500">No course categories yet</div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'add-book' && (
              <motion.div
                key="add-book"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <h3 className="text-3xl font-serif font-bold text-gray-900">Add New Book</h3>
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Title *</label>
                        <input
                          type="text"
                          value={newBook.title || ''}
                          onChange={(e) => setNewBook(prev => ({ ...prev, title: e.target.value }))}
                          required
                          className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Author *</label>
                        <input
                          type="text"
                          value={newBook.author || ''}
                          onChange={(e) => setNewBook(prev => ({ ...prev, author: e.target.value }))}
                          required
                          className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description *</label>
                      <textarea
                        rows={4}
                        value={newBook.description || ''}
                        onChange={(e) => setNewBook(prev => ({ ...prev, description: e.target.value }))}
                        required
                        className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Category</label>
                        <select
                          value={newBook.category || ''}
                          onChange={(e) => setNewBook(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none appearance-none"
                        >
                          <option value="">Select category</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Language</label>
                        <select
                          value={newBook.language || ''}
                          onChange={(e) => setNewBook(prev => ({ ...prev, language: e.target.value }))}
                          className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none appearance-none"
                        >
                          <option value="">Select language</option>
                          <option value="English">English</option>
                          <option value="Bangla">Bangla</option>
                          <option value="English & Bangla">English & Bangla</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Physical Price (৳)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={newBook.price || ''}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/\D/g, '');
                            setNewBook(prev => ({ ...prev, price: cleaned ? parseInt(cleaned) : 0 }));
                          }}
                          className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">PDF Price (৳)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={newBook.pdfPrice ?? ''}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/\D/g, '');
                            setNewBook(prev => ({ ...prev, pdfPrice: cleaned ? parseInt(cleaned) : undefined }));
                          }}
                          className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Stock</label>
                        <input
                          type="number"
                          value={newBook.stock || ''}
                          onChange={(e) => setNewBook(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                          className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pages</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={newBook.pages || ''}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/\D/g, '');
                            setNewBook(prev => ({ ...prev, pages: cleaned ? parseInt(cleaned) : 0 }));
                          }}
                          className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                          placeholder="Auto-filled from PDF"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cover Image</label>
                        <div className="flex gap-3">
                          <div className="flex-1 space-y-2">
                            <input
                              type="url"
                              value={newBook.coverUrl || ''}
                              onChange={(e) => {
                                setNewBook(prev => ({ ...prev, coverUrl: e.target.value }));
                                setNewBookCoverFile(null);
                                setNewBookCoverPreview('');
                              }}
                              placeholder="Or paste image URL..."
                              className="w-full p-3 bg-gray-50 border border-transparent rounded-xl text-sm focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                            />
                            <label className="flex items-center justify-center gap-2 w-full p-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-orange-300 hover:bg-orange-50/50 transition-all">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  if (!file.type.startsWith('image/')) {
                                    toast.error('Please select an image file');
                                    return;
                                  }
                                  setNewBookCoverFile(file);
                                  setNewBook(prev => ({ ...prev, coverUrl: '' }));
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setNewBookCoverPreview(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }}
                                className="hidden"
                              />
                              <ImageIcon className="w-4 h-4 text-gray-400" />
                              <span className="text-xs font-bold text-gray-500">Upload Cover Image</span>
                            </label>
                          </div>
                          {(newBookCoverPreview || newBook.coverUrl) && (
                            <div className="w-20 h-28 rounded-xl overflow-hidden shrink-0 border border-gray-100 shadow-sm">
                              <img src={newBookCoverPreview || newBook.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Preview Images</label>
                      <label className="flex items-center justify-center gap-2 w-full p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-orange-300 hover:bg-orange-50/50 transition-all">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            const imageFiles = files.filter(f => f.type.startsWith('image/'));
                            if (imageFiles.length === 0) {
                              toast.error('Please select image files');
                              return;
                            }
                            setNewBookPreviewFiles(prev => [...prev, ...imageFiles]);
                            imageFiles.forEach(file => {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setNewBookPreviewPreviews(prev => [...prev, reader.result as string]);
                              };
                              reader.readAsDataURL(file);
                            });
                          }}
                          className="hidden"
                        />
                        <ImageIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-bold text-gray-500">Upload Preview Images</span>
                      </label>
                      {newBookPreviewPreviews.length > 0 && (
                        <div className="grid grid-cols-4 gap-3">
                          {newBookPreviewPreviews.map((url, i) => (
                            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group">
                              <img src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                              <button
                                onClick={() => {
                                  setNewBookPreviewPreviews(prev => prev.filter((_, idx) => idx !== i));
                                  setNewBookPreviewFiles(prev => prev.filter((_, idx) => idx !== i));
                                }}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <XCircle className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">PDF Upload (Optional)</label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-orange-300 hover:bg-orange-50/50 transition-all">
                          <input
                            key={newBookPdfInputKey}
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.type !== 'application/pdf') { toast.error('Please select a PDF file'); return; }
                              handlePdfFileSelect(file);
                            }}
                            className="hidden"
                          />
                          <FileText className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-bold text-gray-500">{newBookPdfName || 'Choose PDF'}</span>
                        </label>
                        {newBookPdfName && (
                          <>
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-bold text-gray-400">Pages:</label>
                              <input
                                type="number"
                                min={1}
                                max={50}
                                value={newBookPdfPagesInput}
                                onChange={(e) => setNewBookPdfPagesInput(e.target.value)}
                                onBlur={() => handlePdfPagesChange(parseInt(newBookPdfPagesInput) || 5)}
                                onKeyDown={(e) => e.key === 'Enter' && handlePdfPagesChange(parseInt(newBookPdfPagesInput) || 5)}
                                className="w-20 p-3 bg-gray-50 border border-transparent rounded-xl text-sm focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none text-center"
                              />
                            </div>
                            {newBookPdfUploading && (
                              <span className="flex items-center gap-2 text-sm text-orange-500">
                                <span className="w-3 h-3 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
                                {newBookPdfPath ? 'Updating...' : 'Extracting...'}
                              </span>
                            )}
                            <button
                              onClick={() => { setNewBookPdfFile(null); setNewBookPdfName(''); setNewBookPdfPath(null); setNewBookPdfExtracted([]); setNewBookPdfTotalPages(0); setNewBookPdfInputKey(k => k + 1); }}
                              className="ml-auto p-1 text-red-500 hover:text-red-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                      {newBookPdfExtracted.length > 0 && (
                        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                          <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">PDF Preview Pages</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">
                                {newBookPdfTotalPages > 0 ? `≈${newBookPdfTotalPages} pages` : `${newBookPdfExtracted.length} pages`}
                              </span>
                              <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
                                <button
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); setPdfPreviewZoom(z => Math.max(0.5, z - 0.25)); }}
                                  className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-500"
                                  title="Zoom out"
                                >
                                  <span className="text-sm font-bold">−</span>
                                </button>
                                <span className="text-xs text-gray-500 w-8 text-center">{Math.round(pdfPreviewZoom * 100)}%</span>
                                <button
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); setPdfPreviewZoom(z => Math.min(3, z + 0.25)); }}
                                  className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-500"
                                  title="Zoom in"
                                >
                                  <span className="text-sm font-bold">+</span>
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="max-h-96 overflow-y-auto p-3 space-y-3">
                            {newBookPdfExtracted.map((url, i) => (
                              <div key={i} className="relative rounded-lg overflow-hidden border border-gray-100 shadow-sm bg-gray-50 mx-auto transition-all duration-200" style={{ maxWidth: Math.round(280 * pdfPreviewZoom) }}>
                                <img src={url} alt={`Page ${i + 1}`} className="w-full object-cover" />
                                <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded">PDF</div>
                                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/50 text-white text-[10px] rounded">{i + 1}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        onClick={(e) => handleAddBook(e, true)}
                        disabled={loading || newBookCoverUploading || newBookPreviewUploading || newBookPdfUploading}
                        className="px-6 py-3 bg-yellow-500 text-white rounded-2xl font-bold hover:bg-yellow-600 transition-all disabled:opacity-50"
                      >
                        {loading ? 'Saving...' : 'Save as Draft'}
                      </button>
                      <button
                        onClick={(e) => handleAddBook(e, false)}
                        disabled={loading || newBookCoverUploading || newBookPreviewUploading || newBookPdfUploading}
                        className="flex-1 py-3 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all disabled:opacity-50"
                      >
                        {loading ? 'Adding...' : 'Add Book'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === 'add-course' && (
              <motion.div
                key="add-course"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-3xl font-serif font-bold text-gray-900">Add New Course</h3>
                  <p className="text-sm text-gray-500 mt-1">Build a professional course with lessons, videos, documents, and quizzes</p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-4 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  {['overview', 'curriculum', 'quizzes', 'review'].map((step, i) => (
                    <div key={step} className="flex items-center flex-1">
                      <button
                        onClick={() => setCourseStep(step as any)}
                        className="flex items-center gap-3 flex-1"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                          courseStep === step ? 'bg-orange-600 text-white' :
                          ['overview', 'curriculum', 'quizzes', 'review'].indexOf(courseStep) > i ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {['overview', 'curriculum', 'quizzes', 'review'].indexOf(courseStep) > i ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                        </div>
                        <span className={`text-sm font-bold capitalize hidden sm:block ${
                          courseStep === step ? 'text-gray-900' : 'text-gray-400'
                        }`}>{step}</span>
                      </button>
                      {i < 3 && <div className="w-8 h-px bg-gray-200 hidden sm:block" />}
                    </div>
                  ))}
                </div>

                {/* Step 1: Overview */}
                {courseStep === 'overview' && (
                  <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Course Title *</label>
                         <input type="text" required value={newCourse.title}
                           onChange={(e) => setNewCourse(prev => ({ ...prev, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }))}
                           className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none" />
                       </div>
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">URL Slug</label>
                         <input type="text" value={newCourse.slug}
                           onChange={(e) => setNewCourse(prev => ({ ...prev, slug: e.target.value }))}
                           className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none" />
                       </div>
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Instructor *</label>
                         <input type="text" required value={newCourse.instructor}
                           onChange={(e) => setNewCourse(prev => ({ ...prev, instructor: e.target.value }))}
                           className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none" />
                       </div>
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Category</label>
                         <select value={newCourse.category}
                           onChange={(e) => setNewCourse(prev => ({ ...prev, category: e.target.value }))}
                           className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none">
                           <option value="">Select a category</option>
                           {courseCategories.map(cat => (
                             <option key={cat.id ?? cat.slug} value={cat.slug}>{cat.name}</option>
                           ))}
                         </select>
                       </div>
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Course Thumbnail</label>
                       <div className="flex gap-4 items-start">
                         <div className="w-32 h-40 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden relative group">
                           {newCourse.image ? (
                             <img src={newCourse.image} alt="Thumbnail" className="w-full h-full object-cover" />
                           ) : (
                             <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                               <ImageIcon className="w-8 h-8 mb-2" />
                               <span className="text-[10px] font-bold uppercase">No Image</span>
                             </div>
                           )}
                           {newCourse.image && (
                             <button type="button" onClick={() => setNewCourse(prev => ({ ...prev, image: '' }))}
                               className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                               <X className="w-3 h-3" />
                             </button>
                           )}
                         </div>
                         <div className="flex-1 space-y-2">
                           <input type="text" placeholder="Paste image URL..." value={newCourse.image}
                             onChange={(e) => setNewCourse(prev => ({ ...prev, image: e.target.value }))}
                             className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none" />
                           <label className={`flex items-center justify-center gap-2 w-full py-3 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all cursor-pointer ${courseFileUploading['course_image'] ? 'opacity-50' : ''}`}>
                             {courseFileUploading['course_image'] ? (
                               <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                             ) : (
                               <>
                                 <Upload className="w-3.5 h-3.5" />
                                 Upload Thumbnail
                               </>
                             )}
                             <input type="file" accept="image/*" className="hidden"
                               onChange={async (e) => {
                                 const file = e.target.files?.[0];
                                 if (!file) return;
                                 setCourseFileUploading(prev => ({ ...prev, 'course_image': true }));
                                 try {
                                   const formData = new FormData();
                                   formData.append('file', file);
                                   formData.append('type', 'image');
                                   const token = localStorage.getItem('auth_token');
                                   const res = await fetch(`${API_URL}/staff/courses/upload-file`, {
                                     method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                                     body: formData,
                                   });
                                   const data = await res.json();
                                   setNewCourse(prev => ({ ...prev, image: data.url }));
                                   toast.success('Thumbnail uploaded');
                                 } catch {
                                   toast.error('Thumbnail upload failed');
                                 } finally {
                                   setCourseFileUploading(prev => ({ ...prev, 'course_image': false }));
                                 }
                               }} />
                           </label>
                         </div>
                       </div>
                     </div>
                     <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description *</label>
                       <textarea required rows={4} value={newCourse.description}
                         onChange={(e) => setNewCourse(prev => ({ ...prev, description: e.target.value }))}
                         className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none resize-none" />
                     </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Price (৳)</label>
                        <input type="number" min="0" step="0.01" value={newCourse.price}
                          onChange={(e) => setNewCourse(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                          className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Duration (hours)</label>
                        <input type="text" readOnly value={Math.ceil((newCourse.sections || []).reduce((acc, s) => acc + (s.lessons || []).reduce((lAcc, l) => lAcc + (l.duration_minutes || 0), 0), 0) / 60)}
                          className="w-full p-4 bg-gray-100 border border-transparent rounded-2xl text-gray-500 cursor-not-allowed outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Lessons</label>
                        <input type="text" readOnly value={(newCourse.sections || []).reduce((acc, s) => acc + (s.lessons || []).length, 0)}
                          className="w-full p-4 bg-gray-100 border border-transparent rounded-2xl text-gray-500 cursor-not-allowed outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Level</label>
                        <select value={newCourse.level}
                          onChange={(e) => setNewCourse(prev => ({ ...prev, level: e.target.value }))}
                          className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none">
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                    </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Promo Video</label>
                        <div className="flex flex-col gap-3">
                          <input type="text" placeholder="YouTube/Vimeo embed URL" value={newCourse.preview_video}
                            onChange={(e) => setNewCourse(prev => ({ ...prev, preview_video: e.target.value }))}
                            className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none" />
                          
                          <div className="flex items-center gap-3">
                            <label className={`flex-1 py-3 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all cursor-pointer flex items-center justify-center gap-2 ${courseFileUploading['promo_video'] ? 'opacity-50' : ''}`}>
                              {courseFileUploading['promo_video'] ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Upload className="w-3.5 h-3.5" />
                                  Upload Promo Video
                                </>
                              )}
                              <input type="file" accept="video/*" className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setCourseFileUploading(prev => ({ ...prev, 'promo_video': true }));
                                  try {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    formData.append('type', 'video');
                                    const token = localStorage.getItem('auth_token');
                                    const res = await fetch(`${API_URL}/staff/courses/upload-file`, {
                                      method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                                      body: formData,
                                    });
                                    const data = await res.json();
                                    setNewCourse(prev => ({ ...prev, preview_video: data.url }));
                                    toast.success('Promo video uploaded');
                                  } catch {
                                    toast.error('Promo video upload failed');
                                  } finally {
                                    setCourseFileUploading(prev => ({ ...prev, 'promo_video': false }));
                                  }
                                }} />
                            </label>
                            {newCourse.preview_video && (
                              <button type="button" onClick={() => setNewCourse(prev => ({ ...prev, preview_video: '' }))}
                                className="p-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all">
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={newCourse.is_featured}
                          onChange={(e) => setNewCourse(prev => ({ ...prev, is_featured: e.target.checked }))}
                          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                        <span className="text-sm font-bold text-gray-700">Featured Course</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={newCourse.is_active}
                          onChange={(e) => setNewCourse(prev => ({ ...prev, is_active: e.target.checked }))}
                          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                        <span className="text-sm font-bold text-gray-700">Active</span>
                      </label>
                    </div>
                     <div className="flex justify-end pt-4 border-t border-gray-100">
                       <button type="button" onClick={() => {
                         if (!newCourse.title.trim() || !newCourse.instructor.trim() || !newCourse.description.trim() || !newCourse.category.trim()) {
                           toast.error('Please fill in all required overview fields (Title, Instructor, Description, and Category) before proceeding');
                           return;
                         }
                         setCourseStep('curriculum');
                       }} className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all flex items-center gap-2">
                         <span>Next: Curriculum</span>
                         <ChevronRight className="w-4 h-4" />
                       </button>
                     </div>
                  </div>
                )}

                {/* Step 2: Curriculum Builder */}
                {courseStep === 'curriculum' && (
                  <div className="space-y-4">
                    {newCourse.sections.map((section, sIdx) => (
                      <div key={sIdx} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                          <input type="text" value={section.title}
                            onChange={(e) => {
                              const updated = [...newCourse.sections];
                              updated[sIdx] = { ...updated[sIdx], title: e.target.value };
                              setNewCourse(prev => ({ ...prev, sections: updated }));
                            }}
                            placeholder="Section Title (e.g., Module 1: Introduction)"
                            className="flex-1 bg-transparent font-bold text-gray-900 outline-none placeholder:text-gray-400" />
                          <button type="button" onClick={() => {
                            const updated = newCourse.sections.filter((_, i) => i !== sIdx);
                            setNewCourse(prev => ({ ...prev, sections: updated.length ? updated : [{ title: '', lessons: [{ title: '', description: '', video_url: '', video_file: null, video_file_url: '', duration_minutes: 0, is_free_preview: false, resources: [], quizzes: [] }] }] }));
                          }} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="divide-y divide-gray-50">
                          {section.lessons.map((lesson, lIdx) => (
                            <div key={lIdx} className="p-4 space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                  {lIdx + 1}
                                </div>
                                <input type="text" value={lesson.title}
                                  onChange={(e) => {
                                    const updated = [...newCourse.sections];
                                    updated[sIdx].lessons[lIdx] = { ...updated[sIdx].lessons[lIdx], title: e.target.value };
                                    setNewCourse(prev => ({ ...prev, sections: updated }));
                                  }}
                                  placeholder="Lesson title"
                                  className="flex-1 bg-transparent font-medium text-gray-900 outline-none placeholder:text-gray-400" />
                                <label className="flex items-center gap-1 text-xs text-gray-500 shrink-0 cursor-pointer">
                                  <input type="checkbox" checked={lesson.is_free_preview}
                                    onChange={(e) => {
                                      const updated = [...newCourse.sections];
                                      updated[sIdx].lessons[lIdx] = { ...updated[sIdx].lessons[lIdx], is_free_preview: e.target.checked };
                                      setNewCourse(prev => ({ ...prev, sections: updated }));
                                    }}
                                    className="w-3.5 h-3.5 text-orange-600 rounded" />
                                  Free Preview
                                </label>
                                <button type="button" onClick={() => {
                                  const updated = [...newCourse.sections];
                                  updated[sIdx].lessons = updated[sIdx].lessons.filter((_, i) => i !== lIdx);
                                  if (updated[sIdx].lessons.length === 0) updated[sIdx].lessons = [{ title: '', description: '', video_url: '', video_file: null, video_file_url: '', duration_minutes: 0, is_free_preview: false, resources: [], quizzes: [] }];
                                  setNewCourse(prev => ({ ...prev, sections: updated }));
                                }} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="ml-10 space-y-3">
                                <textarea rows={2} value={lesson.description}
                                  onChange={(e) => {
                                    const updated = [...newCourse.sections];
                                    updated[sIdx].lessons[lIdx] = { ...updated[sIdx].lessons[lIdx], description: e.target.value };
                                    setNewCourse(prev => ({ ...prev, sections: updated }));
                                  }}
                                  placeholder="Lesson description (optional)"
                                  className="w-full p-3 bg-gray-50 border border-transparent rounded-xl text-sm outline-none resize-none placeholder:text-gray-400" />
                                <div className="flex flex-col sm:flex-row gap-3">
                                  <input type="text" value={lesson.video_url}
                                    onChange={(e) => {
                                      const updated = [...newCourse.sections];
                                      updated[sIdx].lessons[lIdx] = { ...updated[sIdx].lessons[lIdx], video_url: e.target.value };
                                      setNewCourse(prev => ({ ...prev, sections: updated }));
                                    }}
                                    placeholder="Video URL (YouTube/Vimeo embed link)"
                                    className="flex-1 p-3 bg-gray-50 border border-transparent rounded-xl text-sm outline-none placeholder:text-gray-400" />
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs text-gray-400 font-bold">OR</span>
                                    <label className={`px-4 py-3 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-all cursor-pointer flex items-center gap-2 ${courseFileUploading[`lesson_${sIdx}_${lIdx}`] ? 'opacity-50' : ''}`}>
                                      {courseFileUploading[`lesson_${sIdx}_${lIdx}`] ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      ) : (
                                        <>
                                          <Upload className="w-3.5 h-3.5" />
                                          Upload Video
                                        </>
                                      )}
                                      <input type="file" accept="video/*" className="hidden"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) return;
                                          const key = `lesson_${sIdx}_${lIdx}`;
                                          setCourseFileUploading(prev => ({ ...prev, [key]: true }));
                                          try {
                                            const formData = new FormData();
                                            formData.append('file', file);
                                            formData.append('type', 'video');
                                            const token = localStorage.getItem('auth_token');
                                            const res = await fetch(`${API_URL}/staff/courses/upload-file`, {
                                              method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                                              body: formData,
                                            });
                                            const data = await res.json();
                                            const updated = [...newCourse.sections];
                                            updated[sIdx].lessons[lIdx] = { ...updated[sIdx].lessons[lIdx], video_file_url: data.url, video_file: file };
                                            setNewCourse(prev => ({ ...prev, sections: updated }));
                                            toast.success('Video uploaded');
                                          } catch {
                                            toast.error('Video upload failed');
                                          } finally {
                                            setCourseFileUploading(prev => ({ ...prev, [key]: false }));
                                          }
                                        }} />
                                    </label>
                                  </div>
                                  <input type="number" min="0" value={lesson.duration_minutes || ''}
                                    onChange={(e) => {
                                      const updated = [...newCourse.sections];
                                      updated[sIdx].lessons[lIdx] = { ...updated[sIdx].lessons[lIdx], duration_minutes: parseInt(e.target.value) || 0 };
                                      setNewCourse(prev => ({ ...prev, sections: updated }));
                                    }}
                                    placeholder="Min"
                                    className="w-20 p-3 bg-gray-50 border border-transparent rounded-xl text-sm outline-none text-center placeholder:text-gray-400" />
                                </div>
                                 {lesson.video_file_url && (
                                   <p className="text-xs text-green-600 flex items-center gap-1">
                                     <CheckCircle2 className="w-3 h-3" />
                                     Video uploaded: {lesson.video_file_url.split('/').pop()}
                                   </p>
                                 )}
                                 
                                 <div className="pt-4 space-y-3 border-t border-gray-100">
                                   <div className="flex items-center justify-between">
                                     <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lesson Resources</span>
                                     <label className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200 transition-all cursor-pointer flex items-center gap-1">
                                       <Plus className="w-3 h-3" /> Add Resource
                                       <input type="file" className="hidden"
                                         onChange={async (e) => {
                                           const file = e.target.files?.[0];
                                           if (!file) return;
                                           const key = `res_${sIdx}_${lIdx}`;
                                           setCourseFileUploading(prev => ({ ...prev, [key]: true }));
                                           try {
                                             const formData = new FormData();
                                             formData.append('file', file);
                                             formData.append('type', 'document');
                                             const token = localStorage.getItem('auth_token');
                                             const res = await fetch(`${API_URL}/staff/courses/upload-file`, {
                                               method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                                               body: formData,
                                             });
                                             const data = await res.json();
                                             const updated = [...newCourse.sections];
                                             if (!updated[sIdx].lessons[lIdx].resources) updated[sIdx].lessons[lIdx].resources = [];
                                             (updated[sIdx].lessons[lIdx].resources as any[]).push({
                                               title: file.name,
                                               file_path: data.path,
                                               file_type: 'document',
                                               file_size: file.size,
                                             });
                                             setNewCourse(prev => ({ ...prev, sections: updated }));
                                             toast.success('Resource uploaded');
                                           } catch {
                                             toast.error('Resource upload failed');
                                           } finally {
                                             setCourseFileUploading(prev => ({ ...prev, [key]: false }));
                                           }
                                         }} />
                                     </label>
                                   </div>
                                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                       {((lesson.resources || []) as any[]).map((res: any, rIdx: number) => (
                                         <div key={rIdx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl border border-transparent hover:border-gray-200 transition-all group">
                                           <FileText className="w-4 h-4 text-gray-400" />
                                           <input type="text" value={res.title}
                                             onChange={(e) => {
                                               const updated = [...newCourse.sections];
                                               (updated[sIdx].lessons[lIdx].resources as any[])[rIdx].title = e.target.value;
                                               setNewCourse(prev => ({ ...prev, sections: updated }));
                                             }}
                                             className="flex-1 bg-transparent text-xs font-medium text-gray-700 outline-none" />
                                           <button type="button" onClick={() => {
                                             const updated = [...newCourse.sections] as any[];
                                             const lesson = updated[sIdx].lessons[lIdx];
                                             lesson.resources = lesson.resources?.filter((_: any, i: number) => i !== rIdx) || [];
                                             setNewCourse(prev => ({ ...prev, sections: updated } as any));
                                           }} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all">
                                             <X className="w-3 h-3" />
                                           </button>
                                         </div>
                                       ))}
                                     </div>
                                 </div>

                                 <div className="pt-4 space-y-3 border-t border-gray-100">
                                   <div className="flex items-center justify-between">
                                     <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lesson Quiz</span>
                                     <button type="button" onClick={() => {
                                       const updated = [...newCourse.sections] as any[];
                                       if (!updated[sIdx].lessons[lIdx].quizzes) updated[sIdx].lessons[lIdx].quizzes = [];
                                       updated[sIdx].lessons[lIdx].quizzes.push({ title: '', questions: [{ question: '', options: ['', '', '', ''], correct_answer: 0 }] });
                                       setNewCourse(prev => ({ ...prev, sections: updated } as any));
                                     }} className="px-3 py-1.5 bg-purple-100 text-purple-600 rounded-lg text-xs font-bold hover:bg-purple-200 transition-all flex items-center gap-1">
                                       <Plus className="w-3 h-3" /> Add Quiz
                                     </button>
                                   </div>
                                    <div className="space-y-4">
                                      {((lesson.quizzes || []) as any[]).map((quiz: any, qIdx: number) => (
                                        <div key={qIdx} className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-3">
                                         <div className="flex items-center gap-2">
                                           <input type="text" value={quiz.title}
                                             onChange={(e) => {
                                               const updated = [...newCourse.sections] as any[];
                                               updated[sIdx].lessons[lIdx].quizzes[qIdx].title = e.target.value;
                                               setNewCourse(prev => ({ ...prev, sections: updated } as any));
                                             }}
                                             placeholder="Quiz title"
                                             className="flex-1 bg-transparent font-bold text-sm text-purple-900 outline-none placeholder:text-purple-300" />
                                           <button type="button" onClick={() => {
                                             const updated = [...newCourse.sections] as any[];
                                             updated[sIdx].lessons[lIdx].quizzes = updated[sIdx].lessons[lIdx].quizzes.filter((_: any, i: number) => i !== qIdx);
                                             setNewCourse(prev => ({ ...prev, sections: updated } as any));
                                           }} className="p-1 text-purple-300 hover:text-red-600 transition-colors">
                                             <Trash2 className="w-3 h-3" />
                                           </button>
                                         </div>
                                         <div className="space-y-2">
                                           {quiz.questions.map((q: any, qqIdx: number) => (
                                             <div key={qqIdx} className="p-2 bg-white rounded-xl border border-purple-100 space-y-2">
                                               <div className="flex items-center gap-2">
                                                 <input type="text" value={q.question}
                                                   onChange={(e) => {
                                                     const updated = [...newCourse.sections] as any[];
                                                     updated[sIdx].lessons[lIdx].quizzes[qIdx].questions[qqIdx].question = e.target.value;
                                                     setNewCourse(prev => ({ ...prev, sections: updated } as any));
                                                   }}
                                                   placeholder="Question"
                                                   className="flex-1 bg-transparent text-xs font-medium outline-none" />
                                                 <button type="button" onClick={() => {
                                                   const updated = [...newCourse.sections] as any[];
                                                   updated[sIdx].lessons[lIdx].quizzes[qIdx].questions = updated[sIdx].lessons[lIdx].quizzes[qIdx].questions.filter((_: any, i: number) => i !== qqIdx);
                                                   setNewCourse(prev => ({ ...prev, sections: updated } as any));
                                                 }} className="p-1 text-gray-300 hover:text-red-600 transition-colors">
                                                   <X className="w-3 h-3" />
                                                 </button>
                                               </div>
                                               <div className="grid grid-cols-2 gap-2">
                                                 {q.options.map((opt: any, oIdx: number) => (
                                                   <div key={oIdx} className="flex items-center gap-1">
                                                     <input type="radio" name={`lq_${sIdx}_${lIdx}_${qIdx}_${qqIdx}`} checked={q.correct_answer === oIdx}
                                                       onChange={() => {
                                                         const updated = [...newCourse.sections] as any[];
                                                         updated[sIdx].lessons[lIdx].quizzes[qIdx].questions[qqIdx].correct_answer = oIdx;
                                                         setNewCourse(prev => ({ ...prev, sections: updated } as any));
                                                       }}
                                                       className="w-3 h-3 text-purple-600" />
                                                     <input type="text" value={opt}
                                                       onChange={(e) => {
                                                         const updated = [...newCourse.sections] as any[];
                                                         const newOpts = [...updated[sIdx].lessons[lIdx].quizzes[qIdx].questions[qqIdx].options];
                                                         newOpts[oIdx] = e.target.value;
                                                         updated[sIdx].lessons[lIdx].quizzes[qIdx].questions[qqIdx].options = newOpts;
                                                         setNewCourse(prev => ({ ...prev, sections: updated } as any));
                                                       }}
                                                       placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                                       className="flex-1 p-1 bg-transparent text-xs outline-none border-b border-transparent focus:border-purple-200" />
                                                   </div>
                                                 ))}
                                               </div>
                                             </div>
                                           ))}
                                           <button type="button" onClick={() => {
                                             const updated = [...newCourse.sections] as any[];
                                             if (!updated[sIdx].lessons[lIdx].quizzes[qIdx].questions) updated[sIdx].lessons[lIdx].quizzes[qIdx].questions = [];
                                             updated[sIdx].lessons[lIdx].quizzes[qIdx].questions.push({ question: '', options: ['', '', '', ''], correct_answer: 0 });
                                             setNewCourse(prev => ({ ...prev, sections: updated } as any));
                                           }} className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1 px-1">
                                             <Plus className="w-3 h-3" /> Add Question
                                           </button>
                                         </div>
                                       </div>
                                     ))}
                                   </div>
                                 </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="p-3 border-t border-gray-100">
                          <button type="button" onClick={() => {
                            const updated = [...newCourse.sections];
                                   updated[sIdx].lessons.push({ 
                                     title: '', 
                                     description: '', 
                                     video_url: '', 
                                     video_file: null, 
                                     video_file_url: '', 
                                     duration_minutes: 0, 
                                     is_free_preview: false,
                                     resources: [],
                                     quizzes: []
                                   });
                            setNewCourse(prev => ({ ...prev, sections: updated }));
                          }} className="text-sm font-bold text-orange-600 hover:underline flex items-center gap-1">
                            <Plus className="w-4 h-4" /> Add Lesson
                          </button>
                        </div>
                      </div>
                    ))}
                      <button type="button" onClick={() => {
                        setNewCourse(prev => ({ ...prev, sections: [...prev.sections, { title: '', lessons: [{ title: '', description: '', video_url: '', video_file: null, video_file_url: '', duration_minutes: 0, is_free_preview: false, resources: [], quizzes: [] }] }] }));
                      }} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 hover:border-orange-300 hover:text-orange-600 transition-all font-bold flex items-center justify-center gap-2">
                      <PlusCircle className="w-5 h-5" /> Add New Section
                    </button>
                    <div className="flex justify-between pt-4">
                      <button type="button" onClick={() => setCourseStep('overview')}
                        className="px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>
                       <button type="button" onClick={() => {
                         const hasEmptySection = newCourse.sections.some(s => !s.title.trim());
                         if (hasEmptySection) {
                           toast.error('All sections must have a title before moving to quizzes');
                           return;
                         }

                         const hasEmptyLesson = newCourse.sections.some(s => 
                           s.lessons.some(l => !l.title.trim())
                         );
                         if (hasEmptyLesson) {
                           toast.error('All lessons must have a title before moving to quizzes');
                           return;
                         }

                         setCourseStep('quizzes');
                       }} className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all flex items-center gap-2">
                         Next: Quizzes <ChevronRight className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                )}

                {/* Step 3: Quizzes */}
                {courseStep === 'quizzes' && (
                  <div className="space-y-4">
                    {newCourse.quizzes.map((quiz, qIdx) => (
                      <div key={qIdx} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 bg-purple-50 border-b border-gray-100 flex items-center justify-between">
                          <input type="text" value={quiz.title}
                            onChange={(e) => {
                              const updated = [...newCourse.quizzes];
                              updated[qIdx] = { ...updated[qIdx], title: e.target.value };
                              setNewCourse(prev => ({ ...prev, quizzes: updated }));
                            }}
                            placeholder="Quiz Title (e.g., Mid-Course Quiz)"
                            className="flex-1 bg-transparent font-bold text-gray-900 outline-none placeholder:text-gray-400" />
                          <button type="button" onClick={() => {
                            const updated = newCourse.quizzes.filter((_, i) => i !== qIdx);
                            setNewCourse(prev => ({ ...prev, quizzes: updated.length ? updated : [{ title: '', questions: [{ question: '', options: ['', '', '', ''], correct_answer: 0 }] }] }));
                          }} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="divide-y divide-gray-50 p-4 space-y-6">
                          {quiz.questions.map((q, qQIdx) => (
                            <div key={qQIdx} className="space-y-3">
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">Q{qQIdx + 1}</span>
                                <input type="text" value={q.question}
                                  onChange={(e) => {
                                    const updated = [...newCourse.quizzes];
                                    updated[qIdx].questions[qQIdx] = { ...updated[qIdx].questions[qQIdx], question: e.target.value };
                                    setNewCourse(prev => ({ ...prev, quizzes: updated }));
                                  }}
                                  placeholder="Question text"
                                  className="flex-1 bg-transparent font-medium text-gray-900 outline-none placeholder:text-gray-400" />
                                <button type="button" onClick={() => {
                                  const updated = [...newCourse.quizzes];
                                  updated[qIdx].questions = updated[qIdx].questions.filter((_, i) => i !== qQIdx);
                                  if (updated[qIdx].questions.length === 0) updated[qIdx].questions = [{ question: '', options: ['', '', '', ''], correct_answer: 0 }];
                                  setNewCourse(prev => ({ ...prev, quizzes: updated }));
                                }} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="ml-8 space-y-2">
                                {q.options.map((opt, oIdx) => (
                                  <div key={oIdx} className="flex items-center gap-2">
                                    <input type="radio" name={`q_${qIdx}_${qQIdx}`} checked={q.correct_answer === oIdx}
                                      onChange={() => {
                                        const updated = [...newCourse.quizzes];
                                        updated[qIdx].questions[qQIdx] = { ...updated[qIdx].questions[qQIdx], correct_answer: oIdx };
                                        setNewCourse(prev => ({ ...prev, quizzes: updated }));
                                      }}
                                      className="w-4 h-4 text-green-600" />
                                    <input type="text" value={opt}
                                      onChange={(e) => {
                                        const updated = [...newCourse.quizzes];
                                        const newOpts = [...updated[qIdx].questions[qQIdx].options];
                                        newOpts[oIdx] = e.target.value;
                                        updated[qIdx].questions[qQIdx] = { ...updated[qIdx].questions[qQIdx], options: newOpts };
                                        setNewCourse(prev => ({ ...prev, quizzes: updated }));
                                      }}
                                      placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                      className={`flex-1 p-2.5 bg-gray-50 border border-transparent rounded-lg text-sm outline-none placeholder:text-gray-400 ${q.correct_answer === oIdx ? 'border-green-200 bg-green-50' : ''}`} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                          <button type="button" onClick={() => {
                            const updated = [...newCourse.quizzes];
                            updated[qIdx].questions.push({ question: '', options: ['', '', '', ''], correct_answer: 0 });
                            setNewCourse(prev => ({ ...prev, quizzes: updated }));
                          }} className="text-sm font-bold text-purple-600 hover:underline flex items-center gap-1">
                            <Plus className="w-4 h-4" /> Add Question
                          </button>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={() => {
                      setNewCourse(prev => ({ ...prev, quizzes: [...prev.quizzes, { title: '', questions: [{ question: '', options: ['', '', '', ''], correct_answer: 0 }] }] }));
                    }} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 hover:border-purple-300 hover:text-purple-600 transition-all font-bold flex items-center justify-center gap-2">
                      <PlusCircle className="w-5 h-5" /> Add New Quiz
                    </button>
                    <div className="flex justify-between pt-4">
                      <button type="button" onClick={() => setCourseStep('curriculum')}
                        className="px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>
                      <button type="button" onClick={() => setCourseStep('review')}
                        className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all flex items-center gap-2">
                        Review & Publish <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 4: Review & Submit */}
                {courseStep === 'review' && (
                  <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-6">
                    <h3 className="text-2xl font-serif font-bold text-gray-900">Review Course</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Course</p>
                        <p className="font-bold text-gray-900">{newCourse.title || 'Untitled'}</p>
                        <p className="text-sm text-gray-500">by {newCourse.instructor || 'Unknown'} · ৳{newCourse.price} · {newCourse.level}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Curriculum</p>
                        <p className="text-sm text-gray-700">
                          {newCourse.sections.filter(s => s.title.trim()).length} sections, {newCourse.sections.reduce((acc, s) => acc + s.lessons.filter(l => l.title.trim()).length, 0)} lessons
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Quizzes</p>
                        <p className="text-sm text-gray-700">
                          {newCourse.quizzes.filter(q => q.title.trim()).length} quizzes, {newCourse.quizzes.reduce((acc, q) => acc + q.questions.filter(qq => qq.question.trim()).length, 0)} questions
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between pt-4 border-t border-gray-100">
                      <button type="button" onClick={() => setCourseStep('quizzes')}
                        className="px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all flex items-center gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back
                      </button>
                       <button type="button" onClick={async () => {
                         if (!newCourse.title.trim() || !newCourse.instructor.trim() || !newCourse.description.trim() || !newCourse.category.trim()) {
                           toast.error('Please fill in all required course fields (Title, Instructor, Description, and Category)');
                           return;
                         }

                         const hasEmptySection = newCourse.sections.some(s => !s.title.trim());
                         if (hasEmptySection) {
                           toast.error('All sections must have a title before publishing');
                           return;
                         }

                           const hasEmptyLesson = newCourse.sections.some(s => 
                             s.lessons.some(l => !l.title.trim())
                           );
                           if (hasEmptyLesson) {
                             toast.error('All lessons must have a title before publishing');
                             return;
                           }

                           if (newCourse.preview_video && newCourse.preview_video.startsWith('data:')) {
                             toast.error('Promo video must be a URL, not a base64 image/video string');
                             return;
                           }

                           if (newCourse.image && newCourse.image.startsWith('data:')) {
                             toast.error('Course thumbnail must be a URL, not a base64 image string');
                             return;
                           }

                           setLoading(true);
                        try {
                           const cleanSections = newCourse.sections
                             .filter(s => s.title.trim())
                             .map((s, sIdx) => ({
                               title: s.title,
                               order: sIdx,
                               lessons: s.lessons.filter(l => l.title.trim()).map((l, lIdx) => ({
                                 title: l.title,
                                 description: l.description || null,
                                 video_url: l.video_file_url || l.video_url || null,
                                 duration_minutes: l.duration_minutes || 0,
                                 is_free_preview: l.is_free_preview || false,
                                 order: lIdx,
                                 resources: l.resources || [],
                                 quizzes: (l.quizzes as any[] || []).filter((q: any) => q.title.trim()).map((q: any, qIdx: number) => ({
                                   title: q.title,
                                   order: qIdx,
                                   questions: (q.questions as any[] || []).filter((qq: any) => qq.question.trim()).map((qq: any, qqIdx: number) => ({
                                     question: qq.question,
                                     options: (qq.options as string[] || []).filter((o: string) => o.trim()),
                                     correct_answer: qq.correct_answer,
                                     order: qqIdx,
                                   })),
                                 })),
                               })),
                               lessons_count: s.lessons.filter(l => l.title.trim()).length,
                               duration_hours: Math.ceil(s.lessons.reduce((acc, l) => acc + (l.duration_minutes || 0), 0) / 60),
                             }));
                          const cleanQuizzes = newCourse.quizzes
                            .filter(q => q.title.trim())
                            .map((q, qIdx) => ({
                              title: q.title,
                              order: qIdx,
                              questions: q.questions.filter(qq => qq.question.trim()).map((qq, qqIdx) => ({
                                question: qq.question,
                                options: qq.options.filter(o => o.trim()),
                                correct_answer: qq.correct_answer,
                                order: qqIdx,
                              })),
                            }));
                           await api.post('/staff/courses', {
                             ...newCourse,
                             sections: cleanSections,
                             quizzes: cleanQuizzes,
                             price: parseFloat(String(newCourse.price)) || 0,
                             duration_hours: Math.ceil(newCourse.sections.reduce((acc, s) => acc + s.lessons.reduce((lAcc, l) => lAcc + (l.duration_minutes || 0), 0), 0) / 60) || 0,
                             lessons_count: newCourse.sections.reduce((acc, s) => acc + s.lessons.length, 0) || 0,
                           });
                          toast.success('Course created successfully!');
                          setNewCourse({
                            title: '', slug: '', instructor: '', description: '', image: '',
                            price: 0, duration_hours: 0, lessons_count: 0,
                            level: 'beginner', preview_video: '', category: 'language',
                            is_featured: false, is_active: true,
                            sections: [{ title: '', lessons: [{ title: '', description: '', video_url: '', video_file: null, video_file_url: '', duration_minutes: 0, is_free_preview: false, resources: [], quizzes: [] }] }],
                            quizzes: [{ title: '', questions: [{ question: '', options: ['', '', '', ''], correct_answer: 0 }] }],
                          });
                          setCourseStep('overview');
                        } catch (err: any) {
                          toast.error(err.message || 'Failed to create course');
                        } finally {
                          setLoading(false);
                        }
                      }} disabled={loading}
                        className="px-12 py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 flex items-center gap-2 disabled:opacity-50">
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            <span>Publish Course</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'qanda' && (
              <motion.div
                key="qanda"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-3xl font-serif font-bold text-gray-900">Q&A Management</h3>
                    <p className="text-sm text-gray-500">{qandaTotal} questions</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Books/Courses Toggle */}
                    <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                      <button
                        onClick={() => setQandaType('books')}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                          qandaType === 'books' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        Books
                      </button>
                      <button
                        onClick={() => setQandaType('courses')}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                          qandaType === 'courses' ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                      >
                        Courses
                      </button>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                      <button
                        onClick={() => setQandaFilter('all')}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                        qandaFilter === 'all' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      All ({qandaItems.length})
                    </button>
                    <button
                      onClick={() => setQandaFilter('unanswered')}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                        qandaFilter === 'unanswered' ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      Unanswered ({qandaItems.filter(q => !q.answer).length})
                    </button>
                    <button
                      onClick={() => setQandaFilter('answered')}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                        qandaFilter === 'answered' ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      Answered ({qandaItems.filter(q => q.answer).length})
                    </button>
                    </div>
                  </div>
                </div>

                {(() => {
                  const filtered = qandaFilter === 'all' ? qandaItems :
                    qandaFilter === 'answered' ? qandaItems.filter(q => q.answer) :
                    qandaItems.filter(q => !q.answer);

                  return filtered.length > 0 ? (
                    filtered.map(item => (
                    <div key={item.id} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
                       <div className="flex items-start gap-4 mb-4">
                         {qandaType === 'books' ? (
                           <a href={`/book/${item.book_id}`} className="shrink-0 w-16 h-24 rounded-lg overflow-hidden border border-gray-200 hover:border-orange-400 transition-colors">
                             <img
                               src={item.book_cover_url || `https://picsum.photos/seed/book${item.book_id}/400/600`}
                               alt={item.book_title || 'Book cover'}
                               className="w-full h-full object-cover"
                             />
                           </a>
                         ) : (
                           <a href={`/courses/${item.course_id}`} className="shrink-0 w-24 h-16 rounded-lg overflow-hidden border border-gray-200 hover:border-orange-400 transition-colors">
                             <img
                               src={item.course_image || `https://picsum.photos/seed/course${item.course_id}/400/300`}
                               alt={item.course_title || 'Course cover'}
                               className="w-full h-full object-cover"
                             />
                           </a>
                         )}
                         <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-bold shrink-0">Q</div>
                         <div>
                           <p className="font-bold text-gray-900">{item.question}</p>
                           <p className="text-xs text-gray-400">
                             Asked by {item.user_name} • {new Date(item.created_at).toLocaleDateString()} • {qandaType === 'books' ? `Book: ${item.book_title}` : `Course: ${item.course_title}`}
                           </p>
                         </div>
                       </div>
                      {item.answer ? (
                        <div className="flex items-start gap-4 pl-12">
                          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600 font-bold shrink-0">A</div>
                          <p className="text-gray-600 italic leading-relaxed">{item.answer}</p>
                        </div>
                      ) : (
                        <div className="pl-12">
                          {replyingToId === item.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Write your answer..."
                                className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none resize-none"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={async () => {
                                    if (!replyText.trim()) return;
                                    try {
                                      const endpoint = qandaType === 'books' 
                                        ? `/staff/questions/${item.id}/answer`
                                        : `/staff/course-questions/${item.id}/answer`;
                                      await api.put(endpoint, {
                                        answer: replyText,
                                      });
                                      toast.success('Answer posted');
                                      setReplyingToId(null);
                                      setReplyText('');
                                      loadQanda();
                                    } catch {
                                      toast.error('Failed to post answer');
                                    }
                                  }}
                                  className="px-4 py-2 bg-orange-600 text-white rounded-xl text-sm font-bold hover:bg-orange-700 transition-all"
                                >
                                  Post Answer
                                </button>
                                <button
                                  onClick={() => {
                                    setReplyingToId(null);
                                    setReplyText('');
                                  }}
                                  className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReplyingToId(item.id)}
                              className="text-sm font-bold text-orange-600 hover:underline"
                            >
                              Reply to this question
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    ))
                  ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                      <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">
                        {qandaFilter === 'answered' ? 'No answered questions yet' :
                         qandaFilter === 'unanswered' ? 'No unanswered questions' :
                         'No questions yet'}
                      </p>
                    </div>
                  );
                })()}

                {qandaTotal > qandaPerPage && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setQandaCurrentPage(p => Math.max(1, p - 1))}
                      disabled={qandaCurrentPage === 1}
                      className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-500">
                      Page {qandaCurrentPage} of {Math.ceil(qandaTotal / qandaPerPage)}
                    </span>
                    <button
                      onClick={() => setQandaCurrentPage(p => p + 1)}
                      disabled={qandaCurrentPage >= Math.ceil(qandaTotal / qandaPerPage)}
                      className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-3xl font-serif font-bold text-gray-900">Order Management</h3>
                    <p className="text-sm text-gray-500">{ordersTotal} orders</p>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
                    <button
                      onClick={() => setOrderFilter('all')}
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                        orderFilter === 'all' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      All ({staffOrders.length})
                    </button>
                    {(['pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => setOrderFilter(status)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-bold transition-all capitalize",
                          orderFilter === status ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700",
                          status === 'pending' && orderFilter === status && 'text-orange-600',
                          status === 'processing' && orderFilter === status && 'text-purple-600',
                          status === 'shipped' && orderFilter === status && 'text-blue-600',
                          status === 'delivered' && orderFilter === status && 'text-green-600',
                          status === 'cancelled' && orderFilter === status && 'text-red-600'
                        )}
                      >
                        {status} ({staffOrders.filter(o => o.status === status).length})
                      </button>
                    ))}
                  </div>
                </div>

                {orderSearch && (
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      placeholder="Search by order ID, customer name or email..."
                      className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                    />
                  </div>
                )}

                {filteredStaffOrders.length > 0 ? (
                  <div className="space-y-4">
                    {filteredStaffOrders.map(order => (
                      <div key={order.id} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <p className="font-bold text-gray-900 font-mono text-lg">{order.id}</p>
                              <span className={cn(
                                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest",
                                order.status === 'delivered' && "bg-green-50 text-green-600",
                                order.status === 'shipped' && "bg-blue-50 text-blue-600",
                                order.status === 'processing' && "bg-purple-50 text-purple-600",
                                order.status === 'pending' && "bg-orange-50 text-orange-600",
                                order.status === 'cancelled' && "bg-red-50 text-red-600"
                              )}>
                                {order.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {order.shippingAddress?.fullName || 'N/A'} • {order.shippingAddress?.email || 'N/A'} • {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-xl font-serif font-bold text-gray-900">৳{order.total.toFixed(2)}</p>
                        </div>

                        <div className="mb-4">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Items</p>
                          <div className="flex flex-wrap gap-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                                <div className="w-8 h-10 rounded overflow-hidden bg-gray-100">
                                  {item.coverUrl ? (
                                    <img src={item.coverUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                      <BookOpen className="w-3 h-3" />
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-900">{item.title}</p>
                                  <p className="text-xs text-gray-500">Qty: {item.quantity} × ৳{item.price}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {order.shippingAddress && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Shipping Address</p>
                            <p className="text-sm text-gray-700">{order.shippingAddress.address}, {order.shippingAddress.city} {order.shippingAddress.zipCode}</p>
                            <p className="text-sm text-gray-700">{order.shippingAddress.phone}</p>
                          </div>
                        )}

                        {order.trackingNumber && (
                          <div className="mb-4 p-3 bg-blue-50 rounded-xl">
                            <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Tracking Number</p>
                            <p className="text-sm font-mono text-blue-700">{order.trackingNumber}</p>
                            {order.estimatedDelivery && <p className="text-xs text-blue-600 mt-1">Est. delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}</p>}
                          </div>
                        )}

                        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                          <select
                            value={order.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              try {
                                await api.put(`/staff/orders/${order.id}`, { status: newStatus });
                                setStaffOrders(prev => prev.map(o => 
                                  o.id === order.id ? { ...o, status: newStatus } : o
                                ));
                                toast.success(`Order marked as ${newStatus}`);
                              } catch {
                                toast.error('Failed to update order status');
                              }
                            }}
                            className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Tracking number"
                            defaultValue={(order as any).trackingNumber || ''}
                            onBlur={(e) => {
                              const val = e.target.value;
                              if (!val) return;
                              const updatedOrders = staffOrders.map(o =>
                                o.id === order.id ? { ...o, trackingNumber: val } : o
                              );
                              setStaffOrders(updatedOrders);
                              localStorage.setItem('lumina_orders', JSON.stringify(updatedOrders));
                              toast.success('Tracking number saved');
                            }}
                            className="flex-1 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No orders found</p>
                  </div>
                )}

                {ordersTotal > ordersPerPage && (
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setOrderCurrentPage(p => Math.max(1, p - 1))}
                      disabled={orderCurrentPage === 1}
                      className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-500">
                      Page {orderCurrentPage} of {Math.ceil(ordersTotal / ordersPerPage)}
                    </span>
                    <button
                      onClick={() => setOrderCurrentPage(p => p + 1)}
                      disabled={orderCurrentPage >= Math.ceil(ordersTotal / ordersPerPage)}
                      className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm font-bold disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'gallery' && (
              <motion.div
                key="gallery"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <h3 className="text-3xl font-serif font-bold text-gray-900 mb-8">Manage Gallery</h3>
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
                  <Images className="w-16 h-16 text-orange-600 mx-auto mb-6" />
                  <p className="text-lg text-gray-700 mb-6">
                    Manage your gallery photos, add new images, and organize your collection.
                  </p>
                  <button
                    onClick={() => window.location.href = '/staff/gallery'}
                    className="px-8 py-4 bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-full font-bold hover:shadow-xl transition-all inline-flex items-center gap-2"
                  >
                    <Images className="w-5 h-5" />
                    Open Gallery Manager
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'course-access' && (
              <CourseAccessTab />
            )}

            {activeTab === 'about' && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <h3 className="text-3xl font-serif font-bold text-gray-900 mb-8">Edit About Page</h3>
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setAboutSaving(true);
                      try {
                        await api.post('/about', aboutForm);
                        toast.success('About page updated successfully');
                      } catch {
                        toast.error('Failed to update about page');
                      } finally {
                        setAboutSaving(false);
                      }
                    }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Page Title</label>
                      <input
                        type="text"
                        value={aboutForm.title}
                        onChange={(e) => setAboutForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hero Description</label>
                      <textarea
                        rows={3}
                        value={aboutForm.hero_description}
                        onChange={(e) => setAboutForm(prev => ({ ...prev, hero_description: e.target.value }))}
                        className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Our Story</label>
                      <textarea
                        rows={6}
                        value={aboutForm.our_story}
                        onChange={(e) => setAboutForm(prev => ({ ...prev, our_story: e.target.value }))}
                        className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Our Mission</label>
                      <textarea
                        rows={4}
                        value={aboutForm.our_mission}
                        onChange={(e) => setAboutForm(prev => ({ ...prev, our_mission: e.target.value }))}
                        className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Our Values</label>
                      <textarea
                        rows={4}
                        value={aboutForm.our_values}
                        onChange={(e) => setAboutForm(prev => ({ ...prev, our_values: e.target.value }))}
                        className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-100">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contact Email</label>
                        <input
                          type="email"
                          value={aboutForm.contact_email}
                          onChange={(e) => setAboutForm(prev => ({ ...prev, contact_email: e.target.value }))}
                          className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contact Phone</label>
                        <input
                          type="text"
                          value={aboutForm.contact_phone}
                          onChange={(e) => setAboutForm(prev => ({ ...prev, contact_phone: e.target.value }))}
                          className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contact Address</label>
                        <input
                          type="text"
                          value={aboutForm.contact_address}
                          onChange={(e) => setAboutForm(prev => ({ ...prev, contact_address: e.target.value }))}
                          className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        disabled={aboutSaving}
                        className="px-8 py-3 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all disabled:opacity-50"
                      >
                        {aboutSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmModal.title}</h3>
            <p className="text-gray-500 mb-6">{confirmModal.message}</p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-6 py-3 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={cn(
                  "px-6 py-3 rounded-2xl font-bold text-white transition-all",
                  confirmModal.type === 'danger' ? "bg-red-600 hover:bg-red-700" : "bg-orange-600 hover:bg-orange-700"
                )}
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {editingInventoryBook && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-serif font-bold text-gray-900">Edit Book</h3>
              <button
                onClick={() => setEditingInventoryBook(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Title</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Author</label>
                  <input
                    type="text"
                    value={editForm.author}
                    onChange={(e) => setEditForm(prev => ({ ...prev, author: e.target.value }))}
                    className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description</label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none appearance-none"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cover Image</label>
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-2">
                      <input
                        type="url"
                        value={editForm.coverUrl}
                        onChange={(e) => {
                          setEditForm(prev => ({ ...prev, coverUrl: e.target.value }));
                          setCoverFile(null);
                          setCoverPreview('');
                        }}
                        placeholder="Or paste image URL..."
                        className="w-full p-3 bg-gray-50 border border-transparent rounded-xl text-sm focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                      />
                      <label className="flex items-center justify-center gap-2 w-full p-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-orange-300 hover:bg-orange-50/50 transition-all">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverFileChange}
                          className="hidden"
                        />
                        <ImageIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-bold text-gray-500">Upload Image</span>
                      </label>
                    </div>
                    {(coverPreview || editForm.coverUrl) && (
                      <div className="w-20 h-28 rounded-xl overflow-hidden shrink-0 border border-gray-100 shadow-sm">
                        <img src={coverPreview || editForm.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Language</label>
                <select
                  value={editForm.language || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none appearance-none"
                >
                  <option value="">Select language</option>
                  <option value="English">English</option>
                  <option value="Bangla">Bangla</option>
                  <option value="English & Bangla">English & Bangla</option>
                </select>
              </div>

              <div className="grid grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Physical Price (৳)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editForm.price || ''}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '');
                      setEditForm(prev => ({ ...prev, price: cleaned ? parseInt(cleaned) : 0 }));
                    }}
                    className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">PDF Price (৳)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editForm.pdfPrice ?? ''}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '');
                      setEditForm(prev => ({ ...prev, pdfPrice: cleaned ? parseInt(cleaned) : undefined }));
                    }}
                    className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Stock</label>
                  <input
                    type="number"
                    value={editForm.stock}
                    onChange={(e) => setEditForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                    className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pages</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={editForm.pages || ''}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '');
                      setEditForm(prev => ({ ...prev, pages: cleaned ? parseInt(cleaned) : 0 }));
                    }}
                    className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                    placeholder="Auto-filled from PDF"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Preview Images</label>
                <label className="flex items-center justify-center gap-2 w-full p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-orange-300 hover:bg-orange-50/50 transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePreviewFilesChange}
                    className="hidden"
                  />
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-bold text-gray-500">Upload Preview Images</span>
                </label>
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {previewUrls.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group">
                        <img src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removePreviewImage(i)}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XCircle className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">PDF Upload (Optional)</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-orange-300 hover:bg-orange-50/50 transition-all">
                    <input
                      key={editPdfInputKey}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.type !== 'application/pdf') { toast.error('Please select a PDF file'); return; }
                        handleEditPdfFileSelect(file);
                      }}
                      className="hidden"
                    />
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-bold text-gray-500">{editPdfName && editPdfName !== 'PDF already uploaded' ? editPdfName : 'Choose PDF'}</span>
                  </label>
                  {(editPdfName || editPdfPath) && (
                    <>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-gray-400">Pages:</label>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={editPdfPagesInput}
                          onChange={(e) => setEditPdfPagesInput(e.target.value)}
                          onBlur={() => handleEditPdfPagesChange(parseInt(editPdfPagesInput) || 5)}
                          onKeyDown={(e) => e.key === 'Enter' && handleEditPdfPagesChange(parseInt(editPdfPagesInput) || 5)}
                          className="w-20 p-3 bg-gray-50 border border-transparent rounded-xl text-sm focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none text-center"
                        />
                      </div>
                      {editPdfUploading && (
                        <span className="flex items-center gap-2 text-sm text-orange-500">
                          <span className="w-3 h-3 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
                          {editPdfPath ? 'Updating...' : 'Extracting...'}
                        </span>
                      )}
                      {editPdfPath && !editPdfFile && (
                        <span className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle2 className="w-4 h-4" /> PDF file on server
                        </span>
                      )}
                      <button
                        onClick={() => { setEditPdfFile(null); setEditPdfName(''); setEditPdfPath(null); setEditPdfExtracted([]); setEditPdfTotalPages(0); setEditPdfInputKey(k => k + 1); }}
                        className="ml-auto p-1 text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
                {(editPdfExtracted.length > 0) && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">PDF Preview Pages</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {editPdfTotalPages > 0 ? `≈${editPdfTotalPages} pages` : `${editPdfExtracted.length} pages`}
                        </span>
                        <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setEditPdfPreviewZoom(z => Math.max(0.5, z - 0.25)); }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-500"
                            title="Zoom out"
                          >
                            <span className="text-sm font-bold">−</span>
                          </button>
                          <span className="text-xs text-gray-500 w-8 text-center">{Math.round(editPdfPreviewZoom * 100)}%</span>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setEditPdfPreviewZoom(z => Math.min(3, z + 0.25)); }}
                            className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-500"
                            title="Zoom in"
                          >
                            <span className="text-sm font-bold">+</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto p-3 space-y-3">
                      {editPdfExtracted.map((url, i) => (
                        <div key={i} className="relative rounded-lg overflow-hidden border border-gray-100 shadow-sm bg-gray-50 mx-auto transition-all duration-200" style={{ maxWidth: Math.round(280 * editPdfPreviewZoom) }}>
                          <img src={url} alt={`Page ${i + 1}`} className="w-full object-cover" />
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-orange-500 text-white text-[10px] font-bold rounded">PDF</div>
                          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/50 text-white text-[10px] rounded">{i + 1}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                {editingInventoryBook?.status === 'draft' && (
                  <button
                    onClick={async () => {
                      try {
                        await api.put(`/staff/books/${editingInventoryBook.id}`, { status: 'approved' });
                        toast.success('Book approved successfully');
                        setDraftBooks(prev => prev.filter(b => b.id !== editingInventoryBook.id));
                        setAllBooks(prev => prev.map(b => 
                          b.id === editingInventoryBook.id ? { ...b, status: 'approved' } as StaffBook : b
                        ));
                        setEditingInventoryBook(null);
                        loadInventoryBooks();
                      } catch {
                        toast.error('Failed to approve book');
                      }
                    }}
                    className="px-6 py-4 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all"
                  >
                    Approve
                  </button>
                )}
                <button
                  onClick={handleInventoryEditSave}
                  disabled={editSaving}
                  className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all disabled:opacity-50"
                >
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditingInventoryBook(null)}
                  className="px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {editingCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-serif font-bold text-gray-900">Edit Course</h3>
              <button
                onClick={() => setEditingCourse(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Step Tabs */}
            <div className="flex items-center gap-2 mb-8 bg-gray-50 rounded-2xl p-2">
              {[
                { key: 'overview', label: 'Overview', icon: Layers },
                { key: 'curriculum', label: 'Curriculum', icon: BookOpen },
                { key: 'quizzes', label: 'Quizzes', icon: ClipboardList },
                { key: 'review', label: 'Review', icon: CheckCircle2 },
              ].map((step, i) => (
                <button
                  key={step.key}
                  onClick={() => setCourseEditStep(step.key as any)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all",
                    courseEditStep === step.key
                      ? "bg-white shadow-sm text-orange-600"
                      : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  <step.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{step.label}</span>
                  <span className="sm:hidden">{i + 1}</span>
                </button>
              ))}
            </div>

            {/* Step 1: Overview */}
            {courseEditStep === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Title *</label>
                    <input
                      type="text"
                      required
                      value={courseEditForm.title}
                      onChange={(e) => setCourseEditForm(prev => ({ ...prev, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }))}
                      className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Slug</label>
                    <input
                      type="text"
                      value={courseEditForm.slug}
                      onChange={(e) => setCourseEditForm(prev => ({ ...prev, slug: e.target.value }))}
                      className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Instructor *</label>
                    <input
                      type="text"
                      required
                      value={courseEditForm.instructor}
                      onChange={(e) => setCourseEditForm(prev => ({ ...prev, instructor: e.target.value }))}
                      className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Category *</label>
                    <select
                      required
                      value={courseEditForm.category}
                      onChange={(e) => setCourseEditForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none appearance-none"
                    >
                      {courseCategories.map(cat => (
                        <option key={cat.id} value={cat.slug || cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Thumbnail Image</label>
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-2">
                      <input
                        type="url"
                        value={courseEditForm.image}
                        onChange={(e) => {
                          setCourseEditForm(prev => ({ ...prev, image: e.target.value }));
                          setCourseCoverFile(null);
                          setCourseCoverPreview('');
                        }}
                        placeholder="Paste image URL..."
                        className="w-full p-3 bg-gray-50 border border-transparent rounded-xl text-sm focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                      />
                      <label className="flex items-center justify-center gap-2 w-full p-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-orange-300 hover:bg-orange-50/50 transition-all">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCourseCoverFileChange}
                          className="hidden"
                        />
                        {courseCoverUploading ? (
                          <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-xs font-bold text-gray-500">{courseCoverUploading ? 'Uploading...' : 'Upload Image'}</span>
                      </label>
                    </div>
                    {(courseCoverPreview || courseEditForm.image) && (
                      <div className="w-32 h-20 rounded-xl overflow-hidden shrink-0 border border-gray-100 shadow-sm">
                        <img src={courseCoverPreview || courseEditForm.image} alt="Thumbnail" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description *</label>
                  <textarea
                    rows={4}
                    required
                    value={courseEditForm.description}
                    onChange={(e) => setCourseEditForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Price (৳)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={courseEditForm.price}
                      onChange={(e) => setCourseEditForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Duration (hours)</label>
                    <div className="p-4 bg-gray-50 border border-transparent rounded-2xl text-sm text-gray-500">
                      {courseEditForm.duration_hours || 0}h
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lessons</label>
                    <div className="p-4 bg-gray-50 border border-transparent rounded-2xl text-sm text-gray-500">
                      {courseEditForm.lessons_count || 0}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Level</label>
                  <select
                    value={courseEditForm.level}
                    onChange={(e) => setCourseEditForm(prev => ({ ...prev, level: e.target.value }))}
                    className="w-full p-4 bg-gray-50 border border-transparent rounded-2xl focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none appearance-none"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Promo Video</label>
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-2">
                      <input
                        type="url"
                        value={courseEditForm.preview_video}
                        onChange={(e) => {
                          setCourseEditForm(prev => ({ ...prev, preview_video: e.target.value }));
                          setCourseVideoFile(null);
                          setCourseVideoPreview('');
                        }}
                        placeholder="YouTube, Vimeo, or direct video URL..."
                        className="w-full p-3 bg-gray-50 border border-transparent rounded-xl text-sm focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                      />
                      <label className="flex items-center justify-center gap-2 w-full p-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-orange-300 hover:bg-orange-50/50 transition-all">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleCourseVideoFileChange}
                          className="hidden"
                        />
                        {courseVideoUploading ? (
                          <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-xs font-bold text-gray-500">{courseVideoUploading ? 'Uploading...' : 'Upload Video (max 500MB)'}</span>
                      </label>
                    </div>
                    {(courseVideoPreview || courseEditForm.preview_video) && (
                      <div className="w-32 h-20 rounded-xl overflow-hidden shrink-0 border border-gray-100 shadow-sm bg-black">
                        {courseVideoPreview ? (
                          <video src={courseVideoPreview} className="w-full h-full object-cover" muted />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-[10px] truncate px-1">
                            {courseEditForm.preview_video.split('/').pop()?.split('?')[0] || 'video'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={courseEditForm.is_active}
                      onChange={(e) => setCourseEditForm(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm font-bold text-gray-700">Active</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={courseEditForm.is_featured}
                      onChange={(e) => setCourseEditForm(prev => ({ ...prev, is_featured: e.target.checked }))}
                      className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm font-bold text-gray-700">Featured</span>
                  </label>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => {
                      if (!courseEditForm.title.trim() || !courseEditForm.instructor.trim() || !courseEditForm.description.trim() || !courseEditForm.category.trim()) {
                        toast.error('Please fill in all required overview fields (Title, Instructor, Description, and Category)');
                        return;
                      }
                      setCourseEditStep('curriculum');
                    }}
                    className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all"
                  >
                    Next: Curriculum
                  </button>
                  <button
                    onClick={() => setEditingCourse(null)}
                    className="px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Curriculum Builder */}
            {courseEditStep === 'curriculum' && (
              <div className="space-y-6">
                {courseEditData.sections.map((section: any, sIdx: number) => (
                  <div key={sIdx} className="bg-gray-50 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => {
                          const updated = [...courseEditData.sections];
                          updated[sIdx].title = e.target.value;
                          setCourseEditData((prev: any) => ({ ...prev, sections: updated }));
                        }}
                        placeholder="Section title..."
                        className="flex-1 p-3 bg-white border border-transparent rounded-xl text-sm font-bold focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                      />
                      {courseEditData.sections.length > 1 && (
                        <button
                          onClick={() => {
                            const updated = courseEditData.sections.filter((_: any, i: number) => i !== sIdx);
                            if (updated.length === 0) updated.push({ title: '', lessons: [{ title: '', description: '', video_url: '', video_file: null, video_file_url: '', duration_minutes: 0, is_free_preview: false, resources: [], quizzes: [] }] });
                            setCourseEditData((prev: any) => ({ ...prev, sections: updated }));
                          }}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {(section.lessons || []).map((lesson: any, lIdx: number) => (
                      <div key={lIdx} className="bg-white rounded-xl p-4 space-y-3 ml-4 border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0">
                            {lIdx + 1}
                          </div>
                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) => {
                              const updated = [...courseEditData.sections];
                              updated[sIdx].lessons[lIdx].title = e.target.value;
                              setCourseEditData((prev: any) => ({ ...prev, sections: updated }));
                            }}
                            placeholder="Lesson title..."
                            className="flex-1 p-2 bg-gray-50 border border-transparent rounded-lg text-sm focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                          />
                          <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={lesson.is_free_preview}
                              onChange={(e) => {
                                const updated = [...courseEditData.sections];
                                updated[sIdx].lessons[lIdx].is_free_preview = e.target.checked;
                                setCourseEditData((prev: any) => ({ ...prev, sections: updated }));
                              }}
                              className="w-3 h-3 rounded border-gray-300 text-orange-600"
                            />
                            Free
                          </label>
                          {(section.lessons || []).length > 1 && (
                            <button
                              onClick={() => {
                                const updated = [...courseEditData.sections];
                                updated[sIdx].lessons = updated[sIdx].lessons.filter((_: any, i: number) => i !== lIdx);
                                if (updated[sIdx].lessons.length === 0) updated[sIdx].lessons.push({ title: '', description: '', video_url: '', video_file: null, video_file_url: '', duration_minutes: 0, is_free_preview: false, resources: [], quizzes: [] });
                                setCourseEditData((prev: any) => ({ ...prev, sections: updated }));
                              }}
                              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <textarea
                          rows={2}
                          value={lesson.description || ''}
                          onChange={(e) => {
                            const updated = [...courseEditData.sections];
                            updated[sIdx].lessons[lIdx].description = e.target.value;
                            setCourseEditData((prev: any) => ({ ...prev, sections: updated }));
                          }}
                          placeholder="Lesson description..."
                          className="w-full p-2 bg-gray-50 border border-transparent rounded-lg text-sm focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none resize-none"
                        />

                        <div className="space-y-2">
                          <div className="flex gap-3">
                            <input
                              type="url"
                              value={lesson.video_url || ''}
                              onChange={(e) => {
                                const updated = [...courseEditData.sections];
                                updated[sIdx].lessons[lIdx].video_url = e.target.value;
                                setCourseEditData((prev: any) => ({ ...prev, sections: updated }));
                              }}
                              placeholder="YouTube or video URL..."
                              className="flex-1 p-2 bg-gray-50 border border-transparent rounded-lg text-sm focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                            />
                            <input
                              type="number"
                              value={lesson.duration_minutes || ''}
                              onChange={(e) => {
                                const updated = [...courseEditData.sections];
                                updated[sIdx].lessons[lIdx].duration_minutes = parseInt(e.target.value) || 0;
                                setCourseEditData((prev: any) => ({ ...prev, sections: updated }));
                              }}
                              placeholder="Min"
                              className="w-20 p-2 bg-gray-50 border border-transparent rounded-lg text-sm focus:border-orange-500/20 focus:ring-2 focus:ring-orange-500/10 transition-all outline-none"
                            />
                          </div>
                          <label className="flex items-center justify-center gap-2 w-full p-2 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-orange-300 hover:bg-orange-50/50 transition-all">
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                if (!file.type.startsWith('video/')) { toast.error('Please select a video file'); return; }
                                if (file.size > 500 * 1024 * 1024) { toast.error('Video file is too large (max 500MB)'); return; }
                                const key = `edit-vid-${sIdx}-${lIdx}`;
                                setCourseEditFileUploading(prev => ({ ...prev, [key]: true }));
                                try {
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  formData.append('type', 'video');
                                  const token = localStorage.getItem('auth_token');
                                  const response = await fetch(`${API_URL}/staff/courses/upload-file`, {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                                    body: formData,
                                  });
                                  if (!response.ok) throw new Error('Upload failed');
                                  const data = await response.json();
                                  const videoUrl = data.url || storageUrl(data.path);
                                  const updated = [...courseEditData.sections];
                                  updated[sIdx].lessons[lIdx].video_file_url = videoUrl;
                                  updated[sIdx].lessons[lIdx].video_url = videoUrl;
                                  setCourseEditData((prev: any) => ({ ...prev, sections: updated }));
                                  toast.success('Video uploaded');
                                } catch (err: any) {
                                  toast.error(err.message || 'Failed to upload video');
                                } finally {
                                  setCourseEditFileUploading(prev => ({ ...prev, [key]: false }));
                                }
                              }}
                            />
                            {courseEditFileUploading[`edit-vid-${sIdx}-${lIdx}`] ? (
                              <div className="w-3 h-3 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Upload className="w-3 h-3 text-gray-400" />
                            )}
                            <span className="text-xs font-bold text-gray-500">{courseEditFileUploading[`edit-vid-${sIdx}-${lIdx}`] ? 'Uploading...' : 'Upload Video'}</span>
                          </label>
                        </div>

                        {/* Lesson Resources */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Resources</span>
                            <label className="flex items-center gap-1 text-xs text-orange-600 cursor-pointer font-bold hover:underline">
                              <input
                                type="file"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const key = `edit-res-${sIdx}-${lIdx}`;
                                  setCourseEditFileUploading(prev => ({ ...prev, [key]: true }));
                                  try {
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    formData.append('type', 'document');
                                    const token = localStorage.getItem('auth_token');
                                    const response = await fetch(`${API_URL}/staff/courses/upload-file`, {
                                      method: 'POST',
                                      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
                                      body: formData,
                                    });
                                    if (!response.ok) throw new Error('Upload failed');
                                    const data = await response.json();
                                    const filePath = data.url || storageUrl(data.path);
                                    const updated = [...courseEditData.sections];
                                    if (!updated[sIdx].lessons[lIdx].resources) updated[sIdx].lessons[lIdx].resources = [];
                                    updated[sIdx].lessons[lIdx].resources.push({
                                      title: file.name,
                                      file_path: filePath,
                                      file_type: 'document',
                                      file_size: file.size,
                                    });
                                    setCourseEditData((prev: any) => ({ ...prev, sections: updated }));
                                    toast.success('Resource uploaded');
                                  } catch (err: any) {
                                    toast.error(err.message || 'Failed to upload');
                                  } finally {
                                    setCourseEditFileUploading(prev => ({ ...prev, [key]: false }));
                                  }
                                }}
                              />
                              <Plus className="w-3 h-3" />
                              Add
                            </label>
                          </div>
                          {(lesson.resources || []).map((res: any, rIdx: number) => (
                            <div key={rIdx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                              <FileText className="w-3 h-3 text-gray-400 shrink-0" />
                              <input
                                type="text"
                                value={res.title}
                                onChange={(e) => {
                                  const updated = [...courseEditData.sections];
                                  updated[sIdx].lessons[lIdx].resources[rIdx].title = e.target.value;
                                  setCourseEditData((prev: any) => ({ ...prev, sections: updated }));
                                }}
                                className="flex-1 text-xs bg-transparent outline-none"
                              />
                              <button
                                onClick={() => {
                                  const updated = [...courseEditData.sections];
                                  updated[sIdx].lessons[lIdx].resources = updated[sIdx].lessons[lIdx].resources.filter((_: any, i: number) => i !== rIdx);
                                  setCourseEditData((prev: any) => ({ ...prev, sections: updated }));
                                }}
                                className="text-red-400 hover:text-red-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Lesson Quizzes */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Lesson Quiz</span>
                            <button
                              onClick={() => {
                                const updated = [...courseEditData.sections];
                                if (!updated[sIdx].lessons[lIdx].quizzes) updated[sIdx].lessons[lIdx].quizzes = [];
                                updated[sIdx].lessons[lIdx].quizzes.push({
                                  title: '',
                                  questions: [{ question: '', options: ['', '', '', ''], correct_answer: 0 }],
                                });
                                setCourseEditData((prev: any) => ({ ...prev, sections: updated }));
                              }}
                              className="flex items-center gap-1 text-xs text-purple-600 cursor-pointer font-bold hover:underline"
                            >
                              <Plus className="w-3 h-3" />
                              Add Quiz
                            </button>
                          </div>
                          {(lesson.quizzes || []).map((quiz: any, qIdx: number) => (
                            <div key={qIdx} className="p-3 bg-purple-50 rounded-lg space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={quiz.title}
                                  onChange={(e) => {
                                    const updated = [...courseEditData.sections];
                                    updated[sIdx].lessons[lIdx].quizzes[qIdx].title = e.target.value;
                                    setCourseEditData((prev: any) => ({ ...prev, sections: updated }));
                                  }}
                                  placeholder="Quiz title..."
                                  className="flex-1 p-2 bg-white border border-transparent rounded-lg text-sm focus:border-purple-500/20 focus:ring-2 focus:ring-purple-500/10 transition-all outline-none"
                                />
                                <button
                                  onClick={() => {
                                    const updated = [...courseEditData.sections];
                                    updated[sIdx].lessons[lIdx].quizzes = updated[sIdx].lessons[lIdx].quizzes.filter((_: any, i: number) => i !== qIdx);
                                    setCourseEditData((prev: any) => ({ ...prev, sections: updated }));
                                  }}
                                  className="p-1 text-red-400 hover:text-red-600 rounded transition-all"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              {(quiz.questions || []).map((qq: any, qqIdx: number) => (
                                <div key={qqIdx} className="p-2 bg-white rounded-lg space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-purple-400">Q{qqIdx + 1}.</span>
                                    <input
                                      type="text"
                                      value={qq.question}
                                      onChange={(e) => {
                                        const updated = [...courseEditData.sections];
                                        updated[sIdx].lessons[lIdx].quizzes[qIdx].questions[qqIdx].question = e.target.value;
                                        setCourseEditData((prev: any) => ({ ...prev, sections: updated }));
                                      }}
                                      placeholder="Question..."
                                      className="flex-1 text-xs bg-gray-50 border border-transparent rounded-lg p-1.5 focus:border-purple-500/20 focus:ring-2 focus:ring-purple-500/10 transition-all outline-none"
                                    />
                                    {(quiz.questions || []).length > 1 && (
                                      <button
                                        onClick={() => {
                                          const updated = [...courseEditData.sections];
                                          updated[sIdx].lessons[lIdx].quizzes[qIdx].questions = updated[sIdx].lessons[lIdx].quizzes[qIdx].questions.filter((_: any, i: number) => i !== qqIdx);
                                          setCourseEditData((prev: any) => ({ ...prev, sections: updated }));
                                        }}
                                        className="text-red-400 hover:text-red-600"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 gap-1 ml-4">
                                    {(() => {
                                      const lqOpts = Array.isArray(qq.options) ? qq.options : JSON.parse(qq.options || '[]');
                                      return lqOpts.map((opt: string, oIdx: number) => (
                                        <div key={oIdx} className="flex items-center gap-1">
                                          <input
                                            type="radio"
                                            name={`edit-lq-${sIdx}-${lIdx}-${qIdx}-${qqIdx}`}
                                            checked={qq.correct_answer === oIdx}
                                            onChange={() => {
                                              const updated = [...courseEditData.sections];
                                              updated[sIdx].lessons[lIdx].quizzes[qIdx].questions[qqIdx].correct_answer = oIdx;
                                              setCourseEditData((prev: any) => ({ ...prev, sections: updated }));
                                            }}
                                            className="w-3 h-3 accent-green-600"
                                          />
                                          <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => {
                                              const updated = [...courseEditData.sections];
                                              updated[sIdx].lessons[lIdx].quizzes[qIdx].questions[qqIdx].options[oIdx] = e.target.value;
                                              setCourseEditData((prev: any) => ({ ...prev, sections: updated }));
                                            }}
                                            placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                            className="flex-1 text-xs bg-gray-50 border border-transparent rounded p-1 focus:border-purple-500/20 focus:ring-2 focus:ring-purple-500/10 transition-all outline-none"
                                          />
                                        </div>
                                      ));
                                    })()}
                                  </div>
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  const updated = [...courseEditData.sections];
                                  updated[sIdx].lessons[lIdx].quizzes[qIdx].questions.push({ question: '', options: ['', '', '', ''], correct_answer: 0 });
                                  setCourseEditData((prev: any) => ({ ...prev, sections: updated }));
                                }}
                                className="text-xs text-purple-600 font-bold hover:underline"
                              >
                                + Add Question
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => {
                        const updated = [...courseEditData.sections];
                        updated[sIdx].lessons.push({ title: '', description: '', video_url: '', video_file: null, video_file_url: '', duration_minutes: 0, is_free_preview: false, resources: [], quizzes: [] });
                        setCourseEditData((prev: any) => ({ ...prev, sections: updated }));
                      }}
                      className="flex items-center gap-2 text-sm text-orange-600 font-bold hover:underline ml-4"
                    >
                      <Plus className="w-4 h-4" />
                      Add Lesson
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => {
                    const updated = [...courseEditData.sections];
                    updated.push({ title: '', lessons: [{ title: '', description: '', video_url: '', video_file: null, video_file_url: '', duration_minutes: 0, is_free_preview: false, resources: [], quizzes: [] }] });
                    setCourseEditData((prev: any) => ({ ...prev, sections: updated }));
                  }}
                  className="w-full p-4 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-bold text-gray-500 hover:border-orange-300 hover:text-orange-600 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Section
                </button>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setCourseEditStep('overview')}
                    className="px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      const hasEmptySection = courseEditData.sections.some((s: any) => !s.title.trim());
                      if (hasEmptySection) {
                        toast.error('All sections must have a title before moving to quizzes');
                        return;
                      }
                      const hasEmptyLesson = courseEditData.sections.some((s: any) =>
                        s.lessons.some((l: any) => !l.title.trim())
                      );
                      if (hasEmptyLesson) {
                        toast.error('All lessons must have a title before moving to quizzes');
                        return;
                      }
                      setCourseEditStep('quizzes');
                    }}
                    className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all"
                  >
                    Next: Quizzes
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Course-Level Quizzes */}
            {courseEditStep === 'quizzes' && (
              <div className="space-y-6">
                {courseEditData.quizzes.map((quiz: any, qIdx: number) => (
                  <div key={qIdx} className="bg-gray-50 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <ClipboardList className="w-5 h-5 text-purple-400" />
                      <input
                        type="text"
                        value={quiz.title}
                        onChange={(e) => {
                          const updated = [...courseEditData.quizzes];
                          updated[qIdx].title = e.target.value;
                          setCourseEditData((prev: any) => ({ ...prev, quizzes: updated }));
                        }}
                        placeholder="Quiz title..."
                        className="flex-1 p-3 bg-white border border-transparent rounded-xl text-sm font-bold focus:border-purple-500/20 focus:ring-2 focus:ring-purple-500/10 transition-all outline-none"
                      />
                      {courseEditData.quizzes.length > 1 && (
                        <button
                          onClick={() => {
                            const updated = courseEditData.quizzes.filter((_: any, i: number) => i !== qIdx);
                            if (updated.length === 0) updated.push({ title: '', questions: [{ question: '', options: ['', '', '', ''], correct_answer: 0 }] });
                            setCourseEditData((prev: any) => ({ ...prev, quizzes: updated }));
                          }}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {(quiz.questions || []).map((qq: any, qqIdx: number) => (
                      <div key={qqIdx} className="bg-white rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-purple-400">Q{qqIdx + 1}.</span>
                          <input
                            type="text"
                            value={qq.question}
                            onChange={(e) => {
                              const updated = [...courseEditData.quizzes];
                              updated[qIdx].questions[qqIdx].question = e.target.value;
                              setCourseEditData((prev: any) => ({ ...prev, quizzes: updated }));
                            }}
                            placeholder="Question..."
                            className="flex-1 p-2 bg-gray-50 border border-transparent rounded-lg text-sm focus:border-purple-500/20 focus:ring-2 focus:ring-purple-500/10 transition-all outline-none"
                          />
                          {(quiz.questions || []).length > 1 && (
                            <button
                              onClick={() => {
                                const updated = [...courseEditData.quizzes];
                                updated[qIdx].questions = updated[qIdx].questions.filter((_: any, i: number) => i !== qqIdx);
                                setCourseEditData((prev: any) => ({ ...prev, quizzes: updated }));
                              }}
                              className="p-1 text-red-400 hover:text-red-600 rounded transition-all"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(() => {
                            const opts = Array.isArray(qq.options) ? qq.options : JSON.parse(qq.options || '[]');
                            return opts.map((opt: string, oIdx: number) => (
                              <div key={oIdx} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`edit-cq-${qIdx}-${qqIdx}`}
                                  checked={qq.correct_answer === oIdx}
                                  onChange={() => {
                                    const updated = [...courseEditData.quizzes];
                                    updated[qIdx].questions[qqIdx].correct_answer = oIdx;
                                    setCourseEditData((prev: any) => ({ ...prev, quizzes: updated }));
                                  }}
                                  className="w-4 h-4 accent-green-600"
                                />
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const updated = [...courseEditData.quizzes];
                                    updated[qIdx].questions[qqIdx].options[oIdx] = e.target.value;
                                    setCourseEditData((prev: any) => ({ ...prev, quizzes: updated }));
                                  }}
                                  placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                  className="flex-1 p-2 bg-gray-50 border border-transparent rounded-lg text-sm focus:border-purple-500/20 focus:ring-2 focus:ring-purple-500/10 transition-all outline-none"
                                />
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => {
                        const updated = [...courseEditData.quizzes];
                        updated[qIdx].questions.push({ question: '', options: ['', '', '', ''], correct_answer: 0 });
                        setCourseEditData((prev: any) => ({ ...prev, quizzes: updated }));
                      }}
                      className="flex items-center gap-2 text-sm text-purple-600 font-bold hover:underline"
                    >
                      <Plus className="w-4 h-4" />
                      Add Question
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => {
                    courseEditData.quizzes.push({ title: '', questions: [{ question: '', options: ['', '', '', ''], correct_answer: 0 }] });
                    setCourseEditData((prev: any) => ({ ...prev, quizzes: [...courseEditData.quizzes] }));
                  }}
                  className="w-full p-4 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-bold text-gray-500 hover:border-purple-300 hover:text-purple-600 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Quiz
                </button>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setCourseEditStep('curriculum')}
                    className="px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setCourseEditStep('review')}
                    className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all"
                  >
                    Next: Review
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Review & Save */}
            {courseEditStep === 'review' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                  <h4 className="font-bold text-gray-900">Course Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Title:</span>
                      <p className="font-bold text-gray-900">{courseEditForm.title}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Instructor:</span>
                      <p className="font-bold text-gray-900">{courseEditForm.instructor}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Price:</span>
                      <p className="font-bold text-gray-900">৳{courseEditForm.price}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Level:</span>
                      <p className="font-bold text-gray-900 capitalize">{courseEditForm.level}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-500">
                      {courseEditData.sections.length} sections, {courseEditData.sections.reduce((acc: number, s: any) => acc + (s.lessons || []).length, 0)} lessons, {courseEditData.quizzes.length} quiz(es)
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setCourseEditStep('quizzes')}
                    className="px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCourseEditSave}
                    disabled={editSaving || courseCoverUploading || courseVideoUploading}
                    className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all disabled:opacity-50"
                  >
                    {editSaving || courseCoverUploading || courseVideoUploading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ── Searchable Select ─────────────────────────────────────────────
function SearchableSelect({
  items,
  selectedId,
  onSelect,
  placeholder,
  label,
  imageShape = 'portrait',
}: {
  items: { id: number; title: string; image: string | null }[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder: string;
  label: string;
  imageShape?: 'portrait' | 'landscape';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = items.find(i => i.id.toString() === selectedId);

  const filtered = useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter(i => i.title.toLowerCase().includes(q));
  }, [items, search]);

  useEffect(() => {
    if (!isOpen) return;
    setSearch('');
    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-gray-900 bg-gray-50 border border-gray-100 outline-none hover:border-gray-200 focus:border-orange-300 focus:ring-4 focus:ring-orange-50 transition-all text-left"
      >
        {selected ? (
          <>
            <div className={cn('rounded-lg bg-gray-100 overflow-hidden flex-shrink-0', imageShape === 'landscape' ? 'w-12 h-8' : 'w-8 h-11')}>
              {selected.image ? (
                <img src={storageUrl(selected.image)} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-[9px] font-bold">{selected.title[0]}</div>
              )}
            </div>
            <span className="flex-1 truncate">{selected.title}</span>
          </>
        ) : (
          <span className="text-gray-400 flex-1">{placeholder}</span>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-2xl shadow-xl shadow-gray-200/60 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}…`}
                className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">No results found</div>
            ) : (
              filtered.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { onSelect(item.id.toString()); setIsOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:bg-orange-50 ${
                    item.id.toString() === selectedId ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-gray-700'
                  }`}
                >
                  <div className={cn('rounded-lg bg-gray-100 overflow-hidden flex-shrink-0', imageShape === 'landscape' ? 'w-12 h-8' : 'w-8 h-11')}>
                    {item.image ? (
                      <img src={storageUrl(item.image)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-[9px] font-bold">{item.title[0]}</div>
                    )}
                  </div>
                  <span className="truncate">{item.title}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Course Access Tab ─────────────────────────────────────────────
function CourseAccessTab() {
  const [books, setBooks] = useState<{ id: number; title: string; image: string | null }[]>([]);
  const [courses, setCourses] = useState<{ id: number; title: string; image: string | null }[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [accessType, setAccessType] = useState<'free' | 'discount'>('free');
  const [discountPercent, setDiscountPercent] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [booksRes, coursesRes, rulesRes] = await Promise.all([
        api.get<any>('/staff/books/batch').catch(() => ({ data: [] })),
        api.get<any>('/staff/courses').catch(() => []),
        api.get<any>('/staff/book-course-access'),
      ]);
      const booksData = Array.isArray(booksRes) ? booksRes : (booksRes.data || []);
      setBooks(booksData.map((b: any) => ({ id: b.id, title: b.title, image: b.image || null })));
      setCourses(Array.isArray(coursesRes) ? coursesRes.map((c: any) => ({ id: c.id, title: c.title, image: c.image || null })) : []);
      setRules(rulesRes);
    } catch (e: any) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAdd = async () => {
    if (!selectedBookId || !selectedCourseId) {
      toast.error('Select both a book and a course');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        book_id: parseInt(selectedBookId),
        course_id: parseInt(selectedCourseId),
        access_type: accessType,
      };
      if (accessType === 'discount') {
        const pct = parseInt(discountPercent);
        if (!pct || pct < 1 || pct > 100) {
          toast.error('Enter a valid discount percentage (1-100)');
          setSaving(false);
          return;
        }
        payload.discount_percent = pct;
      }
      const newRule = await api.post<any>('/staff/book-course-access', payload);
      setRules(prev => [newRule, ...prev]);
      setSelectedBookId('');
      setSelectedCourseId('');
      setAccessType('free');
      setDiscountPercent('');
      toast.success('Access rule created');
    } catch (e: any) {
      toast.error(e.message || 'Failed to create rule');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/staff/book-course-access/${id}`);
      setRules(prev => prev.filter(r => r.id !== id));
      toast.success('Access rule deleted');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete rule');
    }
  };

  if (loading) {
    return (
      <motion.div key="course-access" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </motion.div>
    );
  }

  return (
    <motion.div
      key="course-access"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <h3 className="text-3xl font-serif font-bold text-gray-900 mb-2">Course Access</h3>
      <p className="text-gray-500 text-sm -mt-4 mb-6">Link books to courses — grant free access or a discount when a book is purchased.</p>

      {/* ── Add Form ── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
        <h4 className="text-lg font-bold text-gray-900 mb-6">Add New Link</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <SearchableSelect
            items={books}
            selectedId={selectedBookId}
            onSelect={setSelectedBookId}
            placeholder="Select a book…"
            label="Book"
          />
          <SearchableSelect
            items={courses}
            selectedId={selectedCourseId}
            onSelect={setSelectedCourseId}
            placeholder="Select a course…"
            label="Course"
            imageShape="landscape"
          />
        </div>

        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-1.5 border border-gray-100">
            <button
              onClick={() => setAccessType('free')}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${accessType === 'free' ? 'bg-white text-gray-900 shadow-md shadow-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Free Access
            </button>
            <button
              onClick={() => setAccessType('discount')}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${accessType === 'discount' ? 'bg-white text-gray-900 shadow-md shadow-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Discount
            </button>
          </div>
          {accessType === 'discount' && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                placeholder="%"
                value={discountPercent}
                onChange={e => setDiscountPercent(e.target.value.replace(/\D/g, '').slice(0, 3))}
                className="w-20 px-4 py-3 rounded-2xl text-sm font-bold text-gray-900 bg-gray-50 border border-gray-100 outline-none focus:bg-white focus:border-orange-300 focus:ring-4 focus:ring-orange-50 text-center transition-all"
              />
              <Percent className="w-4 h-4 text-gray-400" />
            </div>
          )}
        </div>

        <button
          onClick={handleAdd}
          disabled={saving || !selectedBookId || !selectedCourseId}
          className="px-8 py-3.5 bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-2xl font-bold text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 inline-flex items-center gap-2"
        >
          {saving ? 'Adding…' : 'Add Link'}
          <Link2 className="w-4 h-4" />
        </button>
      </div>

      {/* ── Existing Rules ── */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 pb-0">
          <h4 className="text-lg font-bold text-gray-900 mb-1">Existing Links</h4>
          <p className="text-sm text-gray-500 mb-6">{rules.length} link{rules.length !== 1 ? 's' : ''} total</p>
        </div>
        {rules.length === 0 ? (
          <div className="px-8 pb-8 text-center text-gray-400 py-12 text-sm font-medium">
            No links created yet. Use the form above to link a book to a course.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-gray-100 text-xs font-bold uppercase tracking-widest text-gray-400">
                  <th className="text-left px-8 py-4">Book</th>
                  <th className="text-left px-6 py-4">Course</th>
                  <th className="text-left px-6 py-4">Access</th>
                  <th className="text-right px-8 py-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {rules.map(rule => (
                  <tr key={rule.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-14 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                          {rule.book?.image ? (
                            <img src={storageUrl(rule.book.image)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs font-bold">{rule.book?.title?.[0] || '?'}</div>
                          )}
                        </div>
                        <span className="font-semibold text-gray-900">{rule.book?.title || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-7 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                          {rule.course?.image ? (
                            <img src={storageUrl(rule.course.image)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px] font-bold">{rule.course?.title?.[0] || '?'}</div>
                          )}
                        </div>
                        <span className="text-gray-700">{rule.course?.title || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {rule.access_type === 'free' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Free
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
                          <Percent className="w-3 h-3" /> {rule.discount_percent}% Off
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-4 text-right">
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}
