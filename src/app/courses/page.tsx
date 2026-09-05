'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  Search,
  Clock,
  BookOpen,
  Star,
  Filter,
  GraduationCap,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Award,
  Zap,
  Grid,
  List,
  X,
  SlidersHorizontal,
  ChevronRight,
  ArrowUpDown,
  Users,
  Check,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { storageUrl } from '@/lib/config';

interface Course {
  id: number;
  title: string;
  slug: string;
  instructor: string;
  description: string;
  syllabus: string | null;
  price: string;
  duration_hours: number;
  lessons_count: number;
  level: string;
  image: string | null;
  is_featured: boolean;
  is_active: boolean;
  category: string;
  created_at: string;
  updated_at: string;
  average_rating?: number;
  reviews_count?: number;
  enrolled_count?: number;
}

interface CoursesResponse {
  data: Course[];
  current_page: number;
  last_page: number;
  total: number;
}

const levelConfig: Record<string, { label: string; class: string; icon: ReactNode }> = {
  beginner: {
    label: 'Beginner',
    class: 'bg-orange-50 text-orange-700 border border-orange-100',
    icon: <Zap className="h-3 w-3" />,
  },
  intermediate: {
    label: 'Intermediate',
    class: 'bg-amber-50 text-amber-700 border border-amber-100',
    icon: <TrendingUp className="h-3 w-3" />,
  },
  advanced: {
    label: 'Advanced',
    class: 'bg-orange-100 text-orange-700 border border-orange-200',
    icon: <Award className="h-3 w-3" />,
  },
};

const categoryLabels: Record<string, string> = {
  writing: 'Writing',
  literature: 'Literature',
  language: 'Language',
  general: 'General',
};

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'featured', label: 'Featured First' },
  { value: 'price_low', label: 'Price: Low → High' },
  { value: 'price_high', label: 'Price: High → Low' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
];

function prettyLabel(value: string) {
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
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

function Chip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700 transition-colors hover:bg-orange-100">
      <span className="max-w-[180px] truncate">{label}</span>
      <button
        onClick={onRemove}
        className="rounded-full p-0.5 transition-colors hover:bg-orange-200/70"
        aria-label={`Remove ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function EmptyState({
  onReset,
  hasFilters,
}: {
  onReset: () => void;
  hasFilters: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[32px] border border-dashed border-orange-200 bg-white/70 py-24 text-center shadow-[0_18px_50px_-30px_rgba(249,115,22,0.18)]">
      <div className="relative mb-6">
        <div className="grid h-20 w-20 place-items-center rounded-3xl bg-orange-50 text-orange-500">
          <BookOpen className="h-8 w-8" />
        </div>
        <div className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-orange-600 text-white shadow-lg shadow-orange-600/20">
          <Search className="h-3.5 w-3.5" />
        </div>
      </div>
      <h3 className="text-2xl font-bold text-gray-900">
        {hasFilters ? 'No courses match your filters' : 'No courses found'}
      </h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
        {hasFilters
          ? 'Try widening your search, clearing category or level filters, or resetting everything to discover more results.'
          : 'We could not find any courses right now. Please check back again soon.'}
      </p>
      <button
        onClick={onReset}
        className="mt-8 inline-flex items-center justify-center rounded-2xl bg-orange-600 px-8 py-4 font-bold text-white transition-all hover:bg-orange-700 hover:shadow-[0_18px_40px_-18px_rgba(234,88,12,0.45)]"
      >
        Reset All Filters
      </button>
    </div>
  );
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.floor(rating);
        const partial = !filled && star === Math.ceil(rating) && rating % 1 !== 0;

        return (
          <span key={star} className="relative inline-block">
            <Star className="h-3.5 w-3.5 fill-gray-200 text-gray-200" />
            {(filled || partial) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? '100%' : `${(rating % 1) * 100}%` }}
              >
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

function PremiumSelect({
  value,
  onChange,
  options,
  icon,
  allLabel,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: ReactNode;
  allLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      {icon && (
        <span className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-gray-400">
          {icon}
        </span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full appearance-none rounded-2xl border border-white/80 bg-white/75 py-3 pr-11 text-sm font-medium text-gray-900 shadow-sm outline-none transition-all',
          icon ? 'pl-11' : 'pl-4',
          'focus:border-orange-300 focus:ring-2 focus:ring-orange-500/15'
        )}
      >
        {allLabel ? <option value="all">{allLabel}</option> : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    </div>
  );
}

function FilterPanel({
  search,
  setSearch,
  categories,
  levels,
  selectedCategory,
  setSelectedCategory,
  selectedLevel,
  setSelectedLevel,
  clearAllFilters,
  activeFilterCount,
  onClose,
}: {
  search: string;
  setSearch: (value: string) => void;
  categories: { name: string; slug: string; count: number }[];
  levels: { id: number; name: string; slug: string }[];
  selectedCategory: string;
  setSelectedCategory: (value: string) => void;
  selectedLevel: string;
  setSelectedLevel: (value: string) => void;
  clearAllFilters: () => void;
  activeFilterCount: number;
  onClose?: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-orange-500/70">
            Refine
          </p>
          <h3 className="mt-1 text-lg font-bold text-gray-900">Filters</h3>
          <p className="mt-1 text-sm text-gray-500">
            Precision search with elegant control.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-orange-600 transition-colors hover:bg-orange-100"
            >
              Reset
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
              aria-label="Close filters"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-orange-500" />
        <input
          type="text"
          placeholder="Search courses, instructors, topics..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-gray-200/80 bg-white px-12 py-3.5 text-sm text-gray-900 placeholder-gray-400 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all focus:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500/15"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="rounded-[28px] border border-white/70 bg-white/70 p-5 shadow-[0_16px_50px_-30px_rgba(249,115,22,0.14)]">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-50 text-orange-600">
              <Filter className="h-4 w-4" />
            </span>
            <h4 className="text-sm font-bold uppercase tracking-[0.22em] text-gray-900">
              Categories
            </h4>
          </div>

          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600 transition-colors hover:text-orange-700"
            >
              Clear
            </button>
          )}
        </div>

        <div className="max-h-[250px] space-y-1 overflow-y-auto pr-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-all duration-200',
              selectedCategory === 'all'
                ? 'bg-orange-50 text-orange-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <span className="text-sm font-medium">All Categories</span>
            {selectedCategory === 'all' && <Check className="h-4 w-4 text-orange-600" />}
          </button>

          {categories.map((cat) => {
            const isActive = selectedCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={cn(
                  'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-all duration-200',
                  isActive
                    ? 'bg-orange-50 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{cat.name}</p>
                  <p className="text-[11px] text-gray-400">
                    {cat.count} course{cat.count !== 1 ? 's' : ''}
                  </p>
                </div>
                {isActive && <Check className="h-4 w-4 text-orange-600" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[28px] border border-white/70 bg-white/70 p-5 shadow-[0_16px_50px_-30px_rgba(249,115,22,0.14)]">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-50 text-orange-600">
              <GraduationCap className="h-4 w-4" />
            </span>
            <h4 className="text-sm font-bold uppercase tracking-[0.22em] text-gray-900">
              Levels
            </h4>
          </div>

          {selectedLevel !== 'all' && (
            <button
              onClick={() => setSelectedLevel('all')}
              className="text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600 transition-colors hover:text-orange-700"
            >
              Clear
            </button>
          )}
        </div>

        <div className="space-y-1">
          <button
            onClick={() => setSelectedLevel('all')}
            className={cn(
              'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-all duration-200',
              selectedLevel === 'all'
                ? 'bg-orange-50 text-orange-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <span className="text-sm font-medium">All Levels</span>
            {selectedLevel === 'all' && <Check className="h-4 w-4 text-orange-600" />}
          </button>

          {levels.map((level) => {
            const isActive = selectedLevel === level.slug;
            return (
              <button
                key={level.id}
                onClick={() => setSelectedLevel(level.slug)}
                className={cn(
                  'flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-all duration-200',
                  isActive
                    ? 'bg-orange-50 text-orange-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <span className="text-sm font-medium">{level.name}</span>
                {isActive && <Check className="h-4 w-4 text-orange-600" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CourseCard({
  course,
  viewMode,
}: {
  course: Course;
  viewMode: 'grid' | 'list';
}) {
  const [imgError, setImgError] = useState(false);
  const level = levelConfig[course.level];
  const rating = course.average_rating || 0;
  const reviewCount = course.reviews_count || 0;
  const enrolledCount = course.enrolled_count || 0;
  const courseHref = course.slug ? `/courses/${course.slug}` : '/courses';

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className={cn(
        'group overflow-hidden rounded-[32px] border border-white/70 bg-white/80 shadow-[0_18px_60px_-28px_rgba(249,115,22,0.12)] backdrop-blur-xl transition-all duration-300 hover:shadow-[0_24px_80px_-30px_rgba(249,115,22,0.2)]',
        viewMode === 'list' ? 'md:flex md:min-h-[260px]' : ''
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100',
          viewMode === 'list' ? 'h-56 md:h-auto md:w-[340px] md:shrink-0' : 'h-56'
        )}
      >
        {course.image && !imgError ? (
          <img
            src={storageUrl(course.image)}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="rounded-3xl bg-white/60 p-5 shadow-inner backdrop-blur-sm">
              <BookOpen className="h-12 w-12 text-orange-400" />
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <div className="absolute left-4 top-4 flex items-center gap-2">
          {level ? (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em]',
                level.class
              )}
            >
              {level.icon}
              {level.label}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-600">
              {prettyLabel(course.level)}
            </span>
          )}
        </div>

        {course.is_featured && (
          <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-600 via-amber-400 to-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-orange-500/30">
            <Star className="h-3 w-3 fill-current" />
            Featured
          </div>
        )}

        <div className="absolute bottom-4 left-4">
          <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm backdrop-blur-sm">
            {prettyLabel(course.category)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6 md:p-7">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-orange-400" />
            {course.duration_hours}h
          </span>
          <span className="h-3 w-px bg-gray-200" />
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-orange-400" />
            {course.lessons_count} lessons
          </span>
        </div>

        <h3 className="line-clamp-2 text-base font-bold leading-snug text-gray-900 transition-colors duration-200 group-hover:text-orange-600">
          {course.title}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
          {course.description}
        </p>

        <div className="mt-5 rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-orange-50/30 p-4">
          <div className="mb-2 flex items-center gap-2">
            <StarRating rating={rating} />
            <span className="text-sm font-bold text-gray-800">{rating.toFixed(1)}</span>
            <span className="text-xs text-gray-400">
              ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <Users className="h-3.5 w-3.5 text-orange-400" />
            {enrolledCount > 0 ? (
              <span className="font-semibold text-orange-600">
                {enrolledCount.toLocaleString()} student{enrolledCount !== 1 ? 's' : ''} enrolled
              </span>
            ) : (
              <span className="font-semibold text-emerald-600">Be the first to enroll!</span>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-end justify-between border-t border-white/70 pt-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">
              Instructor
            </p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{course.instructor}</p>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gray-400">
              Price
            </p>
            <p className="text-2xl font-extrabold leading-none tracking-tight text-orange-600">
              ৳{course.price}
            </p>
          </div>
        </div>

        <Link
          href={courseHref}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 px-5 py-3.5 text-sm font-bold text-white shadow-[0_18px_40px_-18px_rgba(234,88,12,0.45)] transition-all hover:shadow-[0_22px_45px_-18px_rgba(234,88,12,0.5)]"
        >
          View Course
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </motion.article>
  );
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [categories, setCategories] = useState<{ name: string; slug: string; count: number }[]>([]);
  const [levels, setLevels] = useState<{ id: number; name: string; slug: string }[]>([]);
  const categoryOptions = categories.map((c) => ({ value: c.slug, label: c.name }));
  const levelOptions = levels.map((l) => ({ value: l.slug, label: l.name }));
  const [totalCount, setTotalCount] = useState(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 12;

  const activeFilterCount =
    (search.trim() ? 1 : 0) +
    (selectedCategory !== 'all' ? 1 : 0) +
    (selectedLevel !== 'all' ? 1 : 0);

  const featuredCount = courses.filter((c) => c.is_featured).length;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedLevel, debouncedSearch, sortBy]);

  useEffect(() => {
    let alive = true;

    const fetchMeta = async () => {
      try {
        const [categoriesRes, levelsRes] = await Promise.all([
          fetch('/api/courses/categories'),
          fetch('/api/courses/levels'),
        ]);

        if (alive && categoriesRes.ok) {
          setCategories(await categoriesRes.json());
        }

        if (alive && levelsRes.ok) {
          setLevels(await levelsRes.json());
        }
      } catch (error) {
        console.error('Failed to fetch meta:', error);
      }
    };

    fetchMeta();

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;

    const fetchCourses = async () => {
      setLoading(true);

      const params: Record<string, string> = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedLevel !== 'all') params.level = selectedLevel;
      if (debouncedSearch) params.search = debouncedSearch;
      params.sort = sortBy;
      params.per_page = '100';

      try {
        const res = await fetch(`/api/courses?${new URLSearchParams(params).toString()}`);
        if (!res.ok) throw new Error('Failed to fetch courses');

        const data: CoursesResponse = await res.json();
        if (!alive) return;

        setCourses(data.data || []);
        setTotalCount(data.total || 0);
      } catch (error) {
        console.error('Failed to fetch courses:', error);
        if (!alive) return;
        setCourses([]);
        setTotalCount(0);
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchCourses();

    return () => {
      alive = false;
    };
  }, [selectedCategory, selectedLevel, debouncedSearch, sortBy]);

  useEffect(() => {
    if (mobileFiltersOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileFiltersOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileFiltersOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const clearAllFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setSelectedCategory('all');
    setSelectedLevel('all');
    setSortBy('newest');
  };

  const isInitialLoading = loading && courses.length === 0;
  const isRefreshing = loading && courses.length > 0;
  const hasFilters = search.trim() || selectedCategory !== 'all' || selectedLevel !== 'all';
  const totalCards = viewMode === 'grid' ? 6 : 4;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-orange-50/35 to-white">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:px-6 lg:px-8">
        {/* HERO */}
        <PremiumSurface className="p-6 md:p-8 lg:p-10">
          <div className="absolute right-0 top-0 h-72 w-72 -translate-y-1/2 translate-x-1/2 rounded-full bg-orange-100/60 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-56 w-56 -translate-x-1/2 translate-y-1/2 rounded-full bg-orange-50/80 blur-3xl" />

          <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.28em] text-orange-600">
                <Sparkles className="h-3.5 w-3.5" />
                Premium Learning Library
              </div>

              <h1 className="mt-4 font-serif text-4xl font-bold tracking-tight text-gray-900 md:text-6xl">
                Our Courses
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-gray-500 md:text-lg">
                Expand your knowledge with expertly designed courses in writing, literature, and language
                mastery — delivered in a refined premium experience.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
                  Expert-led
                </span>
                <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
                  Curated curriculum
                </span>
                <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
                  Premium access
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <HeroStat label="Total Courses" value={totalCount.toLocaleString()} />
              <HeroStat label="Categories" value={categories.length} />
              <HeroStat label="Featured" value={featuredCount} />
            </div>
          </div>
        </PremiumSurface>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* DESKTOP FILTERS */}
          <aside className="lg:hidden">
            <PremiumSurface className="p-5">
              <FilterPanel
                search={search}
                setSearch={setSearch}
                categories={categories}
                levels={levels}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                selectedLevel={selectedLevel}
                setSelectedLevel={setSelectedLevel}
                clearAllFilters={clearAllFilters}
                activeFilterCount={activeFilterCount}
              />
            </PremiumSurface>
          </aside>

          {/* MAIN CONTENT */}
          <main className="lg:col-span-12">
            <PremiumSurface className="p-5 md:p-6 lg:p-8">
              {/* Search and Filters at Top */}
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-gray-200/80 bg-white px-4 py-2.5 pl-11 text-sm focus:border-orange-300 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <PremiumSelect
                    value={selectedCategory}
                    onChange={setSelectedCategory}
                    options={[{ value: 'all', label: 'All Categories' }, ...categoryOptions]}
                    className="min-w-[140px]"
                  />

                  <PremiumSelect
                    value={selectedLevel}
                    onChange={setSelectedLevel}
                    options={[{ value: 'all', label: 'All Levels' }, ...levelOptions]}
                    className="min-w-[120px]"
                  />

                  <PremiumSelect
                    value={sortBy}
                    onChange={setSortBy}
                    options={sortOptions}
                    icon={<ArrowUpDown className="h-4 w-4" />}
                    className="min-w-[140px]"
                  />
                </div>
              </div>

              {/* Catalog Header */}
              <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-orange-50 text-orange-600">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-orange-500/70">
                      Catalog
                    </p>
                    <h2 className="mt-1 font-serif text-2xl font-bold tracking-tight text-gray-900">
                      Premium Courses
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {loading
                        ? 'Refreshing catalog...'
                        : `${courses.length} course${courses.length !== 1 ? 's' : ''} in view · ${featuredCount} featured`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex rounded-2xl border border-white/80 bg-white/75 p-1 shadow-sm">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        'rounded-xl p-2.5 transition-all duration-300',
                        viewMode === 'grid'
                          ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                          : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
                      )}
                      aria-label="Grid view"
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'rounded-xl p-2.5 transition-all duration-300',
                        viewMode === 'list'
                          ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                          : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
                      )}
                      aria-label="List view"
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>

                  </div>
              </div>

              {/* ACTIVE FILTERS */}
              {hasFilters && (
                <div className="mb-6 flex flex-wrap items-center gap-2 rounded-3xl border border-white/70 bg-white/60 p-4">
                  <span className="mr-1 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">
                    Active filters
                  </span>

                  {search && <Chip label={`"${search}"`} onRemove={() => setSearch('')} />}

                  {selectedCategory !== 'all' && (
                    <Chip
                      label={
                        categories.find((c) => c.slug === selectedCategory)?.name ||
                        prettyLabel(selectedCategory)
                      }
                      onRemove={() => setSelectedCategory('all')}
                    />
                  )}

                  {selectedLevel !== 'all' && (
                    <Chip
                      label={
                        levels.find((l) => l.slug === selectedLevel)?.name ||
                        prettyLabel(selectedLevel)
                      }
                      onRemove={() => setSelectedLevel('all')}
                    />
                  )}

                  <button
                    onClick={clearAllFilters}
                    className="ml-auto text-xs font-bold uppercase tracking-[0.18em] text-gray-500 transition-colors hover:text-orange-600"
                  >
                    Clear all
                  </button>
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${viewMode}-${sortBy}-${selectedCategory}-${selectedLevel}-${debouncedSearch}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className={cn(isRefreshing ? 'opacity-80' : 'opacity-100')}
                >
                  {isRefreshing && (
                    <div className="mb-6 inline-flex items-center gap-2 rounded-2xl bg-orange-50/75 px-4 py-3 text-sm font-medium text-orange-700">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-200 border-t-orange-600" />
                      Updating results...
                    </div>
                  )}

                  {isInitialLoading ? (
                    <div
                      className={cn(
                        'grid gap-6',
                        viewMode === 'grid'
                          ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3'
                          : 'grid-cols-1'
                      )}
                    >
                      {Array.from({ length: totalCards }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            'overflow-hidden rounded-[32px] border border-white/70 bg-white/75 shadow-[0_18px_60px_-28px_rgba(249,115,22,0.12)] animate-pulse',
                            viewMode === 'list' ? 'md:flex md:min-h-[260px]' : ''
                          )}
                        >
                          <div
                            className={cn(
                              'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100',
                              viewMode === 'list'
                                ? 'h-56 md:h-auto md:w-[340px] md:shrink-0'
                                : 'h-56'
                            )}
                          />
                          <div className="space-y-4 p-6">
                            <div className="flex gap-2">
                              <div className="h-5 w-20 rounded-full bg-gray-200" />
                              <div className="h-5 w-16 rounded-full bg-gray-200" />
                            </div>
                            <div className="h-6 w-3/4 rounded-xl bg-gray-200" />
                            <div className="space-y-2">
                              <div className="h-4 w-full rounded-lg bg-gray-200" />
                              <div className="h-4 w-5/6 rounded-lg bg-gray-200" />
                            </div>
                            <div className="h-16 rounded-2xl bg-gray-100" />
                            <div className="flex justify-between pt-2">
                              <div className="h-8 w-1/3 rounded-xl bg-gray-200" />
                              <div className="h-8 w-1/4 rounded-xl bg-gray-200" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : courses.length > 0 ? (
                    <>
                      <div
                        className={cn(
                          'grid gap-6',
                          viewMode === 'grid'
                            ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                            : 'grid-cols-1'
                        )}
                      >
                        {courses.slice((currentPage - 1) * coursesPerPage, currentPage * coursesPerPage).map((course) => (
                          <CourseCard key={course.id} course={course} viewMode={viewMode} />
                        ))}
                      </div>

                      {/* Pagination */}
                      {Math.ceil(courses.length / coursesPerPage) > 1 && (
                        <div className="mt-10 flex items-center justify-center gap-2">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                          >
                            Previous
                          </button>
                          {Array.from({ length: Math.ceil(courses.length / coursesPerPage) }).map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setCurrentPage(i + 1)}
                              className={cn(
                                'h-9 w-9 rounded-lg text-sm font-medium transition-colors',
                                currentPage === i + 1
                                  ? 'bg-orange-600 text-white'
                                  : 'text-gray-500 hover:bg-gray-100'
                              )}
                            >
                              {i + 1}
                            </button>
                          ))}
                          <button
                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(courses.length / coursesPerPage), p + 1))}
                            disabled={currentPage === Math.ceil(courses.length / coursesPerPage)}
                            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <EmptyState onReset={clearAllFilters} hasFilters={!!hasFilters} />
                  )}
                </motion.div>
              </AnimatePresence>
            </PremiumSurface>
          </main>
        </div>
      </div>

      {/* MOBILE FILTER DRAWER */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            />

            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-white/70 bg-gradient-to-b from-white to-orange-50/40 p-5 shadow-2xl lg:hidden"
            >
              <PremiumSurface className="p-5">
                <FilterPanel
                  search={search}
                  setSearch={setSearch}
                  categories={categories}
                  levels={levels}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  selectedLevel={selectedLevel}
                  setSelectedLevel={setSelectedLevel}
                  clearAllFilters={clearAllFilters}
                  activeFilterCount={activeFilterCount}
                  onClose={() => setMobileFiltersOpen(false)}
                />
              </PremiumSurface>

              <div className="sticky bottom-0 mt-5 border-t border-white/70 bg-gradient-to-t from-white via-white to-transparent pt-4">
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="w-full rounded-2xl bg-orange-600 px-5 py-4 font-bold text-white shadow-[0_18px_40px_-18px_rgba(234,88,12,0.45)] transition-all hover:bg-orange-700"
                >
                  Done
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}