'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Images,
  Plus,
  Trash2,
  Edit2,
  Upload,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { API_URL } from '@/lib/config';

interface GalleryPhoto {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  image_path?: string;
  order: number;
  is_active: boolean;
  created_at: string;
}

interface PaginatedResponse {
  data: GalleryPhoto[];
  current_page: number;
  last_page: number;
  total: number;
}

export default function EditGalleryPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 0,
    is_active: true,
    date: new Date().toISOString().split('T')[0],
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeCount = photos.filter((photo) => photo.is_active).length;
  const hiddenCount = photos.length - activeCount;

  useEffect(() => {
    if (user && user.role !== 'staff') {
      toast.error('Access denied. Staff only.');
      router.push('/');
      return;
    }

    fetchGallery();
  }, [currentPage, search, user]);

  const fetchGallery = async () => {
    setLoading(true);

    try {
      const params: Record<string, string> = {
        per_page: '12',
        page: String(currentPage),
      };

      if (search) params.search = search;

      const queryString = new URLSearchParams(params).toString();
      const res = await api.get<PaginatedResponse>(`/staff/gallery?${queryString}`);

      setPhotos(res.data || []);
      setCurrentPage(res.current_page);
      setLastPage(res.last_page);
      setTotal(res.total);
    } catch (error) {
      console.error('Failed to fetch gallery:', error);
      toast.error('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPhoto(null);
    setFormData({ 
      title: '', 
      description: '', 
      order: 0, 
      is_active: true,
      date: new Date().toISOString().split('T')[0],
    });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const openEditModal = (photo: GalleryPhoto) => {
    setEditingPhoto(photo);
    setFormData({
      title: photo.title,
      description: photo.description || '',
      order: photo.order,
      is_active: photo.is_active,
      date: photo.created_at ? photo.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setImageFile(null);
    setImagePreview(photo.image);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile && !editingPhoto?.image) {
      toast.error('Please select an image');
      return;
    }

    setUploading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('order', String(formData.order));
      formDataToSend.append('is_active', String(formData.is_active));
      if (formData.date) {
        formDataToSend.append('date', formData.date);
      }

      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
      const apiUrl = API_URL;

      if (editingPhoto) {
        formDataToSend.append('_method', 'PUT');

        const response = await fetch(`${apiUrl}/staff/gallery/${editingPhoto.id}`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          body: formDataToSend,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update photo');
        }

        toast.success('Photo updated successfully');
      } else {
        const response = await fetch(`${apiUrl}/staff/gallery`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          body: formDataToSend,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create photo');
        }

        toast.success('Photo added successfully');
      }

      setShowModal(false);
      fetchGallery();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save photo');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    try {
      await api.delete(`/staff/gallery/${id}`);
      toast.success('Photo deleted successfully');
      fetchGallery();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete photo');
    }
  };

  const toggleActive = async (photo: GalleryPhoto) => {
    try {
      await api.put(`/staff/gallery/${photo.id}`, {
        is_active: !photo.is_active,
      });

      toast.success(photo.is_active ? 'Photo hidden' : 'Photo shown');
      fetchGallery();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update photo');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-orange-50/30 to-white">
      <div className="space-y-8 bg-white/80 backdrop-blur-sm rounded-3xl p-8">
      {/* Premium Header */}
      <div className="relative overflow-hidden border-b border-orange-100 bg-white/80 backdrop-blur-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(249,115,22,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(251,146,60,0.08),transparent_30%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-orange-600 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                Visual Archive Studio
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-600 to-orange-500 text-white shadow-[0_18px_40px_rgba(249,115,22,0.25)]">
                  <Images className="h-7 w-7" />
                </div>

                <div>
                  <h1 className="font-serif text-4xl font-bold tracking-tight text-gray-900 lg:text-5xl">
                    Manage Gallery
                  </h1>
                  <p className="mt-2 text-sm leading-7 text-gray-500 lg:text-base">
                    Curate, organize, and publish your visual collection with refined premium control.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(249,115,22,0.24)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(249,115,22,0.3)]"
            >
              <Plus className="h-5 w-5" />
              Add Photo
            </button>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[1.75rem] border border-orange-100 bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
                Total Photos
              </p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
                {total}
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-orange-100 bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
                Visible Now
              </p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
                {activeCount}
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-orange-100 bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
                Hidden Now
              </p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
                {hiddenCount}
              </p>
            </div>

            <div className="rounded-[1.75rem] border border-orange-100 bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
                Page Status
              </p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900">
                {currentPage}/{lastPage}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10 space-y-6">
        {/* Search Bar */}
        <section className="rounded-[2rem] border border-orange-100 bg-white p-5 shadow-[0_16px_45px_rgba(15,23,42,0.05)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-500">
                Gallery Search
              </p>
              <h2 className="mt-2 text-lg font-bold text-gray-900">
                Find photos with elegance
              </h2>
            </div>

            <div className="rounded-full border border-orange-100 bg-orange-50/40 px-4 py-2 text-sm font-semibold text-gray-600">
              Showing {photos.length} results
            </div>
          </div>

          <div className="relative mt-5">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search gallery photos..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-2xl border border-orange-100 bg-white py-4 pl-12 pr-4 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-500/10"
            />
          </div>
        </section>

        {/* Gallery Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.05)]"
              >
                <div className="h-56 animate-pulse bg-gradient-to-br from-orange-50 to-orange-100/60" />
                <div className="space-y-3 p-5">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                  <div className="flex gap-2">
                    <div className="h-10 flex-1 animate-pulse rounded-full bg-gray-200" />
                    <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
                    <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-orange-200 bg-gradient-to-br from-white to-orange-50/40 px-6 py-20 text-center">
            <div className="mb-5 flex h-18 w-18 items-center justify-center rounded-3xl bg-orange-50 text-orange-600 shadow-sm ring-1 ring-orange-100">
              <Images className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">No Photos Found</h3>
            <p className="mt-3 max-w-md text-sm leading-6 text-gray-500">
              {search
                ? 'Try adjusting your search terms to discover matching gallery items.'
                : 'Start by adding your first gallery photo to build a premium visual collection.'}
            </p>
            {!search && (
              <button
                onClick={openCreateModal}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(249,115,22,0.24)] transition-all duration-300 hover:-translate-y-0.5"
              >
                <Plus className="h-5 w-5" />
                Add Your First Photo
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {photos.map((photo, index) => (
                <motion.article
                  key={photo.id}
                  initial={{ opacity: 0, y: 18, scale: 0.99 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  className="group overflow-hidden rounded-[2rem] border border-orange-100 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(249,115,22,0.12)]"
                >
                  <div className="relative h-56 overflow-hidden bg-orange-50">
                    {photo.image ? (
                      <img
                        src={photo.image}
                        alt={photo.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-50 to-white">
                        <div className="text-center">
                          <div className="mb-2 text-5xl">📝</div>
                          <div className="text-xs font-bold uppercase tracking-[0.24em] text-orange-600">
                            Text Only
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/95 text-sm font-black text-orange-600 shadow-[0_12px_25px_rgba(0,0,0,0.08)]">
                      {index + 1}
                    </div>

                    <div className="absolute right-4 top-4 z-10">
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] ring-1 backdrop-blur",
                          photo.is_active
                            ? "bg-white/95 text-green-600 ring-green-100"
                            : "bg-white/95 text-gray-500 ring-gray-200"
                        )}
                      >
                        {photo.is_active ? 'Visible' : 'Hidden'}
                      </span>
                    </div>

                    {!photo.is_active && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
                    )}
                  </div>

                  <div className="space-y-4 p-5">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold tracking-tight text-gray-900">
                          {photo.title}
                        </h3>

                        {photo.image && photo.description && (
                          <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-purple-600 ring-1 ring-purple-100">
                            Photo + Text
                          </span>
                        )}

                        {photo.image && !photo.description && (
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-blue-600 ring-1 ring-blue-100">
                            Photo
                          </span>
                        )}

                        {!photo.image && photo.description && (
                          <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-green-600 ring-1 ring-green-100">
                            Text
                          </span>
                        )}
                      </div>

                      {photo.description && (
                        <p className="line-clamp-2 text-sm leading-6 text-gray-500">
                          {photo.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>Order #{photo.order}</span>
                      <span>•</span>
                      <span>{new Date(photo.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => toggleActive(photo)}
                        className={cn(
                          "inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-all duration-300",
                          photo.is_active
                            ? "bg-orange-50 text-orange-700 hover:bg-orange-100"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        )}
                      >
                        {photo.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        <span className="hidden sm:inline">
                          {photo.is_active ? 'Hide' : 'Show'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(photo)}
                        className="inline-flex items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-orange-600 ring-1 ring-orange-100 transition-all duration-300 hover:bg-orange-50"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(photo.id)}
                        className="inline-flex items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-red-500 ring-1 ring-red-100 transition-all duration-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>

            {/* Pagination */}
            {lastPage > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-orange-100 bg-white text-gray-700 shadow-sm transition-all duration-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="rounded-full border border-orange-100 bg-white px-5 py-3 text-sm font-semibold text-gray-600 shadow-sm">
                  Page {currentPage} of {lastPage}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                  disabled={currentPage === lastPage}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-[0_14px_30px_rgba(249,115,22,0.22)] transition-all duration-300 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Premium Modal */}
      <AnimatePresence>
        {showModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-[0_40px_140px_rgba(0,0,0,0.25)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-orange-100/70 bg-gradient-to-r from-orange-50/80 to-white px-6 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-orange-600 shadow-sm">
                      Visual Editor
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                      {editingPhoto ? 'Edit Photo' : 'Add New Photo'}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Craft a polished gallery entry with a premium image-first workflow.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm ring-1 ring-orange-100 transition-all duration-300 hover:bg-orange-50 hover:text-orange-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="grid gap-0 lg:grid-cols-12">
                {/* Left: Image Studio */}
                <div className="lg:col-span-5 border-b border-orange-100/70 bg-gradient-to-br from-orange-50/50 to-white p-6 lg:border-b-0 lg:border-r">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-500">
                        Image Studio
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-gray-900">
                        Preview & Upload
                      </h3>
                    </div>

                    <div className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-500 ring-1 ring-orange-100">
                      PNG / JPG / WEBP
                    </div>
                  </div>

                  <div
                    className="group relative overflow-hidden rounded-[1.75rem] border-2 border-dashed border-orange-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-orange-300 hover:shadow-[0_18px_45px_rgba(249,115,22,0.08)]"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="h-[26rem] w-full rounded-[1.25rem] object-cover"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-red-500 shadow-md ring-1 ring-red-100 transition-all hover:bg-red-50"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-[26rem] cursor-pointer flex-col items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-white to-orange-50/40 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                          <Upload className="h-7 w-7" />
                        </div>
                        <p className="text-base font-semibold text-gray-900">Click to upload image</p>
                        <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
                          High-resolution image recommended for a refined visual presentation.
                        </p>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>

                  <div className="mt-4 rounded-[1.5rem] border border-orange-100 bg-white p-4 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-500">
                      Premium Tip
                    </p>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      Use images with strong composition and clean lighting to elevate the gallery’s visual identity.
                    </p>
                  </div>
                </div>

                {/* Right: Form */}
                <div className="lg:col-span-7 p-6 lg:p-8">
                  <div className="grid gap-5">
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
                        Title
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Enter photo title..."
                        className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-4 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-500/10"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Enter photo description..."
                        rows={5}
                        className="w-full resize-none rounded-2xl border border-orange-100 bg-white px-4 py-4 text-sm outline-none transition-all placeholder:text-gray-400 focus:border-orange-300 focus:ring-4 focus:ring-orange-500/10"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
                          Order
                        </label>
                        <input
                          type="number"
                          value={formData.order}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              order: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-4 text-sm outline-none transition-all focus:border-orange-300 focus:ring-4 focus:ring-orange-500/10"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-[0.24em] text-gray-400">
                          Date
                        </label>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full rounded-2xl border border-orange-100 bg-white px-4 py-4 text-sm outline-none transition-all focus:border-orange-300 focus:ring-4 focus:ring-orange-500/10"
                        />
                      </div>

                      <div className="flex items-end">
                        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-orange-100 bg-white px-4 py-4 shadow-sm">
                          <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="text-sm font-semibold text-gray-700">
                            Show on website
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-orange-100 bg-gradient-to-br from-white to-orange-50/40 p-5">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-orange-500">
                        Status Preview
                      </p>
                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        {formData.is_active
                          ? 'This photo will be visible to visitors.'
                          : 'This photo will remain hidden until manually shown.'}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="inline-flex items-center justify-center rounded-2xl border border-orange-100 bg-white px-6 py-4 text-sm font-semibold text-gray-600 shadow-sm transition-all duration-300 hover:bg-orange-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={uploading}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-4 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(249,115,22,0.24)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(249,115,22,0.3)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {uploading ? (
                          <>
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            {editingPhoto ? 'Updating...' : 'Uploading...'}
                          </>
                        ) : editingPhoto ? (
                          'Update Photo'
                        ) : (
                          'Add Photo'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}