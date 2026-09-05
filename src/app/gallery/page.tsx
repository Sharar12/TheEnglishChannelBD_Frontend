'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useInView } from 'react-intersection-observer';
import {
  Images,
  X,
  Calendar,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ZoomIn,
  Grid3X3,
  LayoutGrid,
  BookOpen,
} from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface GalleryPhoto {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  order: number;
  created_at: string;
  date?: string;
}

type LayoutType = 'small' | 'big' | 'portrait' | 'landscape';

function getLayout(index: number): LayoutType {
  const patterns: LayoutType[] = [
    'big',
    'small',
    'portrait',
    'landscape',
    'portrait',
    'small',
    'landscape',
    'small',
  ];
  return patterns[index % patterns.length];
}

const layoutCls: Record<LayoutType, string> = {
  small: 'col-span-1 row-span-1',
  big: 'col-span-2 row-span-2',
  portrait: 'col-span-1 row-span-2',
  landscape: 'col-span-2 row-span-1',
};

const placeholderGradients = [
  'from-orange-100 via-amber-50 to-orange-50',
  'from-amber-100 via-orange-50 to-amber-50',
  'from-orange-50 via-amber-100 to-orange-50',
  'from-orange-100 via-orange-50 to-amber-50',
];

function getPhotoDate(photo: { date?: string; created_at: string }) {
  return photo.date || photo.created_at;
}

function formatDate(photo: { date?: string; created_at: string }) {
  const d = getPhotoDate(photo);
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatLongDate(photo: { date?: string; created_at: string }) {
  const d = getPhotoDate(photo);
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function PremiumSurface({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[32px] border border-white/70 bg-white/80 shadow-[0_24px_80px_-24px_rgba(249,115,22,0.14)] backdrop-blur-2xl',
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,146,60,0.12),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(251,146,60,0.06),transparent_35%)]" />
      <div className="relative">{children}</div>
    </div>
  );
}

function HeroStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/75 px-4 py-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-gray-900">{value}</p>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-orange-500/70">
          Premium collection
        </p>
        <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
          {title}
        </h2>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-gray-500">{subtitle}</p>}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}

function TopBadge({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.28em] text-orange-600">
      {children}
    </div>
  );
}

/* ── Gallery Card (Bento) ──────────────────────────────────────── */
function GalleryCard({
  photo,
  index,
  layout,
  onClick,
}: {
  photo: GalleryPhoto;
  index: number;
  layout: LayoutType;
  onClick: () => void;
}) {
  const { ref, inView } = useInView({ threshold: 0.08, triggerOnce: true });
  const [imgErr, setImgErr] = useState(false);

  const hasImg = !!photo.image && !imgErr;
  const grad = placeholderGradients[index % placeholderGradients.length];

  return (
    <motion.button
      ref={ref}
      type="button"
      initial={{ opacity: 0, scale: 0.93, y: 16 }}
      animate={inView ? { opacity: 1, scale: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: Math.min(index * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-[28px] text-left cursor-pointer select-none',
        'ring-1 ring-white/70 shadow-[0_18px_60px_-28px_rgba(249,115,22,0.18)]',
        'transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_-30px_rgba(249,115,22,0.24)]',
        layoutCls[layout]
      )}
    >
      {/* Image / placeholder */}
      {hasImg ? (
        <img
          src={photo.image!}
          alt={photo.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          onError={() => setImgErr(true)}
        />
      ) : (
        <div className={cn('absolute inset-0 bg-gradient-to-br flex items-center justify-center overflow-hidden', grad)}>
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, #f97316 1.5px, transparent 1.5px)',
              backgroundSize: '22px 22px',
            }}
          />
          <div className="relative z-10 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 text-xl font-black text-white shadow-xl lg:h-16 lg:w-16 lg:text-2xl">
              {index + 1}
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-orange-600">
              Photo {index + 1}
            </p>
          </div>
        </div>
      )}

      {/* Top index chip */}
      <div className="absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-xl border border-white/15 bg-black/40 text-[10px] font-bold text-white backdrop-blur-md">
        {index + 1}
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/18 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Hover content */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 opacity-0 translate-y-3 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 lg:p-5">
        <div className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-gray-700 backdrop-blur-sm">
          <Sparkles className="h-3 w-3 text-orange-500" />
          Gallery frame
        </div>

        <h3 className="mb-1 line-clamp-1 text-sm font-bold text-white lg:text-base">
          {photo.title}
        </h3>

        {photo.description && (
          <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-gray-300">
            {photo.description}
          </p>
        )}

        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-gray-300">
            <Calendar className="h-3.5 w-3.5 text-orange-300" />
            <span>{formatDate(photo)}</span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-orange-300">
            <ZoomIn className="h-3.5 w-3.5" />
            <span>View</span>
          </div>
        </div>
      </div>

      {/* Ring */}
      <div className="pointer-events-none absolute inset-0 rounded-[28px] ring-0 ring-orange-400/50 transition-all duration-300 group-hover:ring-2" />
    </motion.button>
  );
}

/* ── Uniform card (grid view) ───────────────────────────────────── */
function UniformCard({
  photo,
  index,
  onClick,
}: {
  photo: GalleryPhoto;
  index: number;
  onClick: () => void;
}) {
  const { ref, inView } = useInView({ threshold: 0.1, triggerOnce: true });
  const [imgErr, setImgErr] = useState(false);
  const hasImg = !!photo.image && !imgErr;
  const grad = placeholderGradients[index % placeholderGradients.length];

  return (
    <motion.button
      ref={ref}
      type="button"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.45, delay: Math.min(index * 0.03, 0.28), ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className="group relative aspect-square overflow-hidden rounded-[26px] text-left cursor-pointer ring-1 ring-white/70 shadow-[0_16px_50px_-30px_rgba(249,115,22,0.18)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_70px_-26px_rgba(249,115,22,0.22)]"
    >
      {hasImg ? (
        <img
          src={photo.image!}
          alt={photo.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={() => setImgErr(true)}
        />
      ) : (
        <div className={cn('absolute inset-0 flex items-center justify-center bg-gradient-to-br', grad)}>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 text-sm font-black text-white shadow-lg">
            {index + 1}
          </div>
        </div>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
        <p className="line-clamp-1 text-xs font-bold text-white">{photo.title}</p>
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-[26px] ring-0 ring-orange-400/50 transition-all duration-300 group-hover:ring-2" />
    </motion.button>
  );
}

/* ── Lightbox ───────────────────────────────────────────────────── */
function Lightbox({
  photo,
  allPhotos,
  onClose,
  onNavigate,
  onJump,
}: {
  photo: GalleryPhoto;
  allPhotos: GalleryPhoto[];
  onClose: () => void;
  onNavigate: (dir: 'next' | 'prev') => void;
  onJump: (photoId: number) => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const idx = allPhotos.findIndex((p) => p.id === photo.id);
  const hasImg = !!photo.image && !imgErr;

  useEffect(() => {
    setImgErr(false);
  }, [photo.id]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 p-3 backdrop-blur-xl sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.93, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 24 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[34px] bg-white shadow-[0_40px_100px_rgba(0,0,0,0.5)] lg:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent */}
        <div className="absolute left-0 top-0 z-10 h-1.5 w-full bg-gradient-to-r from-orange-500 to-amber-400" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-30 rounded-2xl border border-white/10 bg-black/50 p-2.5 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-black/70 active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Prev / Next */}
        <button
          onClick={() => onNavigate('prev')}
          className="absolute left-4 top-1/2 z-30 -translate-y-1/2 rounded-2xl border border-white/10 bg-black/50 p-2.5 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-orange-600 active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          onClick={() => onNavigate('next')}
          className="absolute right-4 top-1/2 z-30 -translate-y-1/2 rounded-2xl border border-white/10 bg-black/50 p-2.5 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-orange-600 active:scale-95"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Photo pane */}
        <div className="relative flex min-h-[280px] w-full flex-shrink-0 items-center justify-center bg-gray-950 lg:min-h-full lg:w-[55%]">
          {hasImg ? (
            <img
              src={photo.image!}
              alt={photo.title}
              className="max-h-[92vh] w-full object-contain"
              onError={() => setImgErr(true)}
            />
          ) : (
            <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden">
              <div
                className="absolute inset-0 opacity-[0.05]"
                style={{
                  backgroundImage: 'radial-gradient(circle, #f97316 2px, transparent 2px)',
                  backgroundSize: '36px 36px',
                }}
              />
              <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 to-amber-400 text-4xl font-black text-white shadow-2xl">
                {idx + 1}
              </div>
              <p className="text-sm text-gray-400">Image not yet uploaded</p>
            </div>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/60 px-4 py-1.5 text-xs font-bold text-white backdrop-blur-md">
            {idx + 1} / {allPhotos.length}
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-300"
              style={{ width: `${((idx + 1) / allPhotos.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Info pane */}
        <div className="flex flex-1 flex-col overflow-hidden bg-white">
          <div className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-amber-400" />
          <div className="flex-shrink-0 border-b border-gray-100 px-8 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-sm font-black text-orange-600">
                {idx + 1}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-orange-500/70">
                  Gallery item
                </p>
                <p className="mt-1 text-sm text-gray-500">{formatLongDate(photo)}</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 lg:p-10">
            <div className="space-y-8">
              {/* Title */}
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.26em] text-gray-400">
                  Photo title
                </p>
                <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900 lg:text-4xl">
                  {photo.title}
                </h2>
              </div>

              {/* Description */}
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.26em] text-gray-400">
                  Description
                </p>
                {photo.description ? (
                  <div className="rounded-[28px] border border-orange-100 bg-orange-50/70 p-5">
                    <p className="whitespace-pre-wrap text-[15px] leading-7 text-gray-700">
                      {photo.description}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-[28px] border border-gray-100 bg-gray-50 p-5">
                    <p className="text-sm italic text-gray-400">
                      No description provided for this photo.
                    </p>
                  </div>
                )}
              </div>

              {/* Quick facts */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-400">
                    Index
                  </p>
                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {idx + 1} of {allPhotos.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-400">
                    Date
                  </p>
                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {new Date(getPhotoDate(photo)).getFullYear()}
                  </p>
                </div>
              </div>

              {/* Thumbnail rail */}
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-gray-400">
                    Navigate
                  </p>
                  <p className="text-xs font-medium text-gray-400">
                    Tap any thumbnail to jump
                  </p>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 pr-1">
                  {allPhotos.map((p, thumbIndex) => {
                    const isActive = p.id === photo.id;

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onJump(p.id)}
                        className={cn(
                          'relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition-all',
                          isActive
                            ? 'border-orange-500 scale-105 shadow-[0_12px_30px_-12px_rgba(249,115,22,0.35)]'
                            : 'border-gray-100 opacity-70 hover:opacity-100 hover:border-orange-200'
                        )}
                        aria-label={`Go to photo ${thumbIndex + 1}`}
                      >
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-100 to-amber-50 text-[10px] font-bold text-orange-500">
                            {thumbIndex + 1}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom nav */}
          <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50/60 px-8 py-4">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => onNavigate('prev')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-orange-600"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <span className="text-xs font-medium text-gray-400">
                <span className="text-gray-600">{idx + 1}</span>
                <span className="mx-1 text-gray-300">of</span>
                <span className="text-gray-600">{allPhotos.length}</span>
              </span>

              <button
                onClick={() => onNavigate('next')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-orange-600"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════ */
export default function GalleryPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [view, setView] = useState<'bento' | 'grid'>('bento');

  const fetchGallery = useCallback(async () => {
    try {
      const res = await api.get<any>('/gallery');
      const apiPhotos: GalleryPhoto[] = Array.isArray(res) ? res : res?.data || [];

      if (apiPhotos.length === 0) {
        setPhotos(
          Array.from({ length: 25 }, (_, i) => ({
            id: i + 1,
            title: `Photo ${i + 1}`,
            description: `Placeholder for Photo ${i + 1}. Upload photos from the staff gallery to replace this.`,
            image: null,
            order: i,
            created_at: new Date(Date.now() - i * 86400000).toISOString(),
          }))
        );
      } else {
        setPhotos(apiPhotos);
      }
    } catch {
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  const navigate = useCallback(
    (dir: 'next' | 'prev') => {
      if (!selectedPhoto || photos.length === 0) return;

      const idx = photos.findIndex((p) => p.id === selectedPhoto.id);
      const next =
        dir === 'next'
          ? (idx + 1) % photos.length
          : (idx - 1 + photos.length) % photos.length;

      setSelectedPhoto(photos[next]);
    },
    [selectedPhoto, photos]
  );

  const jumpTo = useCallback(
    (photoId: number) => {
      const nextPhoto = photos.find((p) => p.id === photoId);
      if (nextPhoto) setSelectedPhoto(nextPhoto);
    },
    [photos]
  );

  useEffect(() => {
    if (!selectedPhoto) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPhoto(null);
      if (e.key === 'ArrowRight') navigate('next');
      if (e.key === 'ArrowLeft') navigate('prev');
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handler);

    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [selectedPhoto, navigate]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const photoCount = photos.length;
  const storyCount = photos.filter((p) => p.description).length;

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-gradient-to-b from-white via-orange-50/35 to-white">
        <div className="text-center">
          <div className="relative mx-auto mb-5 h-16 w-16">
            <div className="absolute inset-0 rounded-full border-4 border-orange-100 border-t-orange-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Images className="h-5 w-5 animate-pulse text-orange-400" />
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-gray-400 animate-pulse">
            Loading gallery…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-orange-50/35 to-white">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-6 lg:px-8">
        <div className="space-y-8 bg-white/80 backdrop-blur-sm rounded-3xl p-8">
        {/* HERO */}
        <PremiumSurface className="p-6 md:p-8 lg:p-10">
          <div className="absolute right-0 top-0 h-72 w-72 -translate-y-1/2 translate-x-1/2 rounded-full bg-orange-100/60 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-56 w-56 -translate-x-1/2 translate-y-1/2 rounded-full bg-orange-50/80 blur-3xl" />

          <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <TopBadge>
                <Sparkles className="h-3.5 w-3.5" />
                Our Collection
              </TopBadge>

              <h1 className="mt-4 font-serif text-4xl font-bold tracking-tight text-gray-900 md:text-6xl">
                Gallery &amp; <span className="text-orange-600">Memories</span>
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-gray-500 md:text-lg">
                Explore our curated collection of moments, milestones, and stories — each frame
                designed to feel immersive, elegant, and unforgettable.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
                  Premium visual archive
                </span>
                <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
                  Curated storytelling
                </span>
                <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
                  Lightbox experience
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <HeroStat label="Photos" value={photoCount} />
              <HeroStat label="Moments" value="∞" />
              <HeroStat label="Stories" value={storyCount} />
            </div>
          </div>
        </PremiumSurface>

        {/* TOOLBAR */}
        <div className="flex flex-col gap-4 rounded-[32px] border border-white/70 bg-white/75 p-5 shadow-[0_18px_60px_-30px_rgba(249,115,22,0.14)] backdrop-blur-2xl md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-orange-500/70">
              Browse
            </p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">{photoCount} Photos</h2>
            <p className="mt-1 text-sm text-gray-500">
              Tap any frame to open the immersive lightbox.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-2xl border border-white/80 bg-white/80 p-1 shadow-sm">
              {([
                ['bento', LayoutGrid],
                ['grid', Grid3X3],
              ] as const).map(([v, Icon]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    'rounded-xl p-2.5 transition-all duration-300',
                    view === v
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                      : 'text-gray-400 hover:bg-gray-50 hover:text-gray-700'
                  )}
                  aria-label={`${v} view`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            <div className="hidden rounded-2xl border border-white/80 bg-white/75 px-4 py-3 shadow-sm md:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-400">
                View mode
              </p>
              <p className="mt-1 text-sm font-bold text-gray-900 capitalize">{view}</p>
            </div>
          </div>
        </div>

        {/* GALLERY */}
        <div className="pb-20">
          {photos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[32px] border border-dashed border-orange-200 bg-white/70 py-28 text-center shadow-[0_18px_50px_-30px_rgba(249,115,22,0.18)]"
            >
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-orange-100 bg-orange-50">
                <Images className="h-9 w-9 text-orange-300" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Gallery Coming Soon</h3>
              <p className="mt-2 text-gray-500">We&apos;re curating amazing content for you!</p>
            </motion.div>
          ) : view === 'bento' ? (
            <div className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[200px] sm:gap-4 md:grid-cols-4 lg:auto-rows-[220px]">
              {photos.map((photo, i) => (
                <GalleryCard
                  key={photo.id}
                  photo={photo}
                  index={i}
                  layout={getLayout(i)}
                  onClick={() => setSelectedPhoto(photo)}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
              {photos.map((photo, i) => (
                <UniformCard
                  key={photo.id}
                  photo={photo}
                  index={i}
                  onClick={() => setSelectedPhoto(photo)}
                />
              ))}
            </div>
          )}
        </div>

        {/* LIGHTBOX */}
        <AnimatePresence>
          {selectedPhoto && (
            <Lightbox
              photo={selectedPhoto}
              allPhotos={photos}
              onClose={() => setSelectedPhoto(null)}
              onNavigate={navigate}
              onJump={jumpTo}
            />
          )}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}