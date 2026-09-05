'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Book } from '@/types';
import BookCard from '@/components/BookCard';
import { Search, Filter, Grid, List, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, ApiBook, mapApiBookToBook, ApiCategory } from '@/lib/api';
import { useWishlist } from '@/context/WishlistContext';

function ShopContent() {
  const searchParams = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [priceMax, setPriceMax] = useState<number>(100);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const { checkWishlist } = useWishlist();
  const booksPerPage = viewMode === 'grid' ? 12 : 10; // Grid: 3 columns × 4 rows, List: 10 rows

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    api.get<ApiCategory[]>('/categories')
      .then((res) => {
        setCategories(res || []);
        const catParam = searchParams?.get('category');
        if (catParam) {
          const found = (res || []).find(c => c.name.toLowerCase() === catParam.toLowerCase());
          if (found) setSelectedCategoryIds([found.id]);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset page when switching view modes
  }, [viewMode]);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (sortBy === 'price_asc') params.sort = 'price_asc';
    else if (sortBy === 'price_desc') params.sort = 'price_desc';
    else if (sortBy === 'newest') params.sort = 'newest';

    const fetchAllBooks = async () => {
      try {
        const firstRes = await api.get<any>('/books', { ...params, per_page: '12' });
        const allData = [...(firstRes.data || [])];
        const totalPages = firstRes.last_page || 1;
        const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
        const pageResults = await Promise.all(
          remainingPages.map(async (page) => {
            try {
              return await api.get<any>('/books', { ...params, per_page: '12', page: String(page) });
            } catch (err) {
              console.error('Failed to fetch books page', page, err);
              return null;
            }
          })
        );
        pageResults.forEach(res => {
          if (res && res.data) allData.push(...res.data);
        });

        const fetchedBooks = allData.map(mapApiBookToBook);
        setAllBooks(fetchedBooks);

        // Check wishlist for all books in batch
        const bookIds = fetchedBooks.map(b => b.id);
        checkWishlist(bookIds);

        // Set price range to include all fetched books so expensive books aren't
        // excluded by the default slider. Round the max to a "nice" value.
        if (fetchedBooks.length > 0) {
          const prices = fetchedBooks.map(b => b.price || 0);
          const rawMax = Math.max(...prices, 100);
          const niceMax = (() => {
            if (rawMax <= 20) return Math.ceil(rawMax / 5) * 5;
            if (rawMax <= 100) return Math.ceil(rawMax / 10) * 10;
            if (rawMax <= 500) return Math.ceil(rawMax / 50) * 50;
            if (rawMax <= 2000) return Math.ceil(rawMax / 100) * 100;
            return Math.ceil(rawMax / 500) * 500;
          })();
          const finalMax = Math.max(10000, niceMax);
          setPriceMax(finalMax);
          setPriceRange([0, finalMax]);
        }
      } catch {
        setAllBooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllBooks();
  }, [debouncedSearch, sortBy]);

  useEffect(() => {
    let filtered = allBooks;
    if (selectedCategoryIds.length > 0) {
      const selectedCategoryNames = categories
        .filter(c => selectedCategoryIds.includes(c.id))
        .map(c => c.name);
      filtered = filtered.filter(b => selectedCategoryNames.includes(b.category));
    }
    filtered = filtered.filter(b => b.price >= priceRange[0] && b.price <= priceRange[1]);
    setBooks(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [priceRange, allBooks, selectedCategoryIds, categories]);

  const toggleCategory = (catId: number) => {
    setSelectedCategoryIds(prev => 
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="font-serif text-4xl font-bold text-gray-900 mb-2">Browse Collection</h1>
          <p className="text-gray-500">Discover your next favorite read from our extensive library.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-orange-50 text-orange-600 shadow-sm" : "text-gray-400 hover:text-gray-600")}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-orange-50 text-orange-600 shadow-sm" : "text-gray-400 hover:text-gray-600")}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-gray-100 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Name: A-Z</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="space-y-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Search title, author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-orange-600" />
                <span>Categories</span>
              </h3>
              {selectedCategoryIds.length > 0 && (
                <button 
                  onClick={() => setSelectedCategoryIds([])}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 uppercase tracking-wider"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="space-y-3">
              {categories.map(cat => (
                <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox"
                      checked={selectedCategoryIds.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="peer appearance-none w-5 h-5 border-2 border-gray-200 rounded-md checked:bg-orange-600 checked:border-orange-600 transition-all"
                    />
                    <X className="absolute inset-0 w-3 h-3 m-auto text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className={cn("text-sm font-medium transition-colors", selectedCategoryIds.includes(cat.id) ? "text-orange-600" : "text-gray-500 group-hover:text-gray-700")}>
                    {cat.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-6">Price Range</h3>
            <div className="space-y-4">
              <div className="relative h-2 bg-gray-100 rounded-lg">
                <div 
                  className="absolute h-full bg-orange-600 rounded-lg"
                  style={{
                    left: `${(priceRange[0] / Math.max(1, priceMax)) * 100}%`,
                    right: `${100 - (priceRange[1] / Math.max(1, priceMax)) * 100}%`,
                  }}
                />
                <input 
                  type="range"
                  min={0}
                  max={priceMax}
                  value={priceRange[0]}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val <= priceRange[1]) setPriceRange([val, priceRange[1]]);
                  }}
                  className="absolute w-full h-2 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10"
                />
                <input 
                  type="range"
                  min={0}
                  max={priceMax}
                  value={priceRange[1]}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val >= priceRange[0]) setPriceRange([priceRange[0], val]);
                  }}
                  className="absolute w-full h-2 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10"
                />
              </div>
              <div className="flex items-center justify-between text-sm font-medium text-gray-500">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">৳</span>
                  <input
                    type="number"
                    min={0}
                    max={priceRange[1]}
                    value={priceRange[0]}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      if (val <= priceRange[1]) setPriceRange([val, priceRange[1]]);
                    }}
                    className="w-20 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/20"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">৳</span>
                  <input
                    type="number"
                    min={priceRange[0]}
                    max={priceMax}
                    value={priceRange[1]}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      if (val >= priceRange[0] && val <= priceMax) setPriceRange([priceRange[0], val]);
                    }}
                    className="w-20 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/20"
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-gray-100 rounded-2xl animate-pulse"></div>
              ))}
            </div>
          ) : books.length > 0 ? (
            <>
              <div className={cn(
                "grid gap-6",
                viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"
              )}>
                {books.slice((currentPage - 1) * booksPerPage, currentPage * booksPerPage).map(book => (
                  <BookCard key={book.id} book={book} viewMode={viewMode} />
                ))}
              </div>

              {/* Pagination Controls */}
              {Math.ceil(books.length / booksPerPage) > 1 && (
                <div className="mt-12 flex flex-col items-center gap-6">
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg border border-gray-200 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      ← Previous
                    </button>
                    
                    <div className="flex gap-1">
                      {Array.from({ length: Math.ceil(books.length / booksPerPage) }).map((_, i) => {
                        const page = i + 1;
                        const isCurrentPage = page === currentPage;
                        const isVisible = page === 1 || page === Math.ceil(books.length / booksPerPage) || 
                                        (page >= currentPage - 1 && page <= currentPage + 1);
                        const isGap = page === 2 && currentPage > 3;
                        const isEndGap = page === Math.ceil(books.length / booksPerPage) - 1 && currentPage < Math.ceil(books.length / booksPerPage) - 2;
                        
                        if (isGap || isEndGap) {
                          return <span key={page} className="px-2 text-gray-400">...</span>;
                        }
                        
                        if (!isVisible) return null;
                        
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={cn(
                              "w-10 h-10 rounded-lg font-semibold transition-all",
                              isCurrentPage
                                ? "bg-orange-600 text-white shadow-md"
                                : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                            )}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(Math.ceil(books.length / booksPerPage), p + 1))}
                      disabled={currentPage === Math.ceil(books.length / booksPerPage)}
                      className="px-4 py-2 rounded-lg border border-gray-200 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Next →
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-500 font-medium">
                    Page {currentPage} of {Math.ceil(books.length / booksPerPage)} | Showing {Math.min((currentPage - 1) * booksPerPage + 1, books.length)}-{Math.min(currentPage * booksPerPage, books.length)} of {books.length} books
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No books found</h3>
              <p className="text-gray-500">Try adjusting your filters or search query.</p>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategoryIds([]);
                  setPriceRange([0, priceMax]);
                  setCurrentPage(1);
                }}
                className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-orange-600 transition-all"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Shop() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div></div>}>
      <ShopContent />
    </Suspense>
  );
}
