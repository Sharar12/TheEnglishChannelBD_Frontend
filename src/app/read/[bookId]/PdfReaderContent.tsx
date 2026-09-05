'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Loader2, AlertCircle, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, PanelLeftClose, PanelLeft } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export default function PdfReaderContent() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [showSidebar, setShowSidebar] = useState(true);
  const [pageInput, setPageInput] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const renderTaskRef = useRef<any>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const thumbCache = useRef<Map<number, string>>(new Map());
  const dpr = useRef(1);
  const scaleRef = useRef(scale);
  const sidebarPageWidth = 180;
  const sidebarPageHeight = Math.round(sidebarPageWidth * 1.4);

  useEffect(() => {
    dpr.current = window.devicePixelRatio || 1;
  }, []);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  const renderGuardRef = useRef(false);
  const pendingPageRef = useRef<number | null>(null);

  const renderPage = useCallback(async (num: number) => {
    if (renderGuardRef.current) {
      pendingPageRef.current = num;
      return;
    }
    renderGuardRef.current = true;
    pendingPageRef.current = null;

    try {
      const pdf = pdfDocRef.current;
      const canvas = canvasRef.current;
      if (!pdf || !canvas) return;

      const currentScale = scaleRef.current;

      if (renderTaskRef.current) {
        try {
          await renderTaskRef.current.cancel();
        } catch {}
        renderTaskRef.current = null;
      }

      const page = await pdf.getPage(num);
      const baseViewport = page.getViewport({ scale: 1 });
      const cssWidth = baseViewport.width * currentScale;
      const cssHeight = baseViewport.height * currentScale;

      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      canvas.width = cssWidth * dpr.current;
      canvas.height = cssHeight * dpr.current;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr.current, dpr.current);

      const viewport = page.getViewport({ scale: currentScale });
      const renderTask = page.render({ canvasContext: ctx, viewport, canvas });
      renderTaskRef.current = renderTask;

      await renderTask.promise;
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Render error:', err);
      }
    } finally {
      renderGuardRef.current = false;
      if (pendingPageRef.current !== null) {
        renderPage(pendingPageRef.current);
      }
    }
  }, []);

  const thumbnailGuardMap = useRef(new WeakMap<HTMLCanvasElement, boolean>());
  const thumbnailTaskMap = useRef(new WeakMap<HTMLCanvasElement, any>());
  const thumbnailPendingMap = useRef(new WeakMap<HTMLCanvasElement, number>());

  const renderThumbnail = useCallback(async (num: number, canvas: HTMLCanvasElement) => {
    const pdf = pdfDocRef.current;
    if (!pdf) return;

    if (thumbnailGuardMap.current.get(canvas)) {
      thumbnailPendingMap.current.set(canvas, num);
      return;
    }
    thumbnailGuardMap.current.set(canvas, true);
    thumbnailPendingMap.current.delete(canvas);

    const prevTask = thumbnailTaskMap.current.get(canvas);
    if (prevTask) {
      try { await prevTask.cancel(); } catch {}
    }

    try {
      const page = await pdf.getPage(num);
      const base = page.getViewport({ scale: 1 });
      const displayScale = sidebarPageWidth / base.width;
      const finalScale = displayScale * dpr.current;

      canvas.width = base.width * finalScale;
      canvas.height = base.height * finalScale;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr.current, dpr.current);

      const viewport = page.getViewport({ scale: displayScale });
      const renderTask = page.render({ canvasContext: ctx, viewport, canvas });
      thumbnailTaskMap.current.set(canvas, renderTask);

      await renderTask.promise;
      thumbCache.current.set(num, canvas.toDataURL('image/jpeg', 0.6));
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Thumbnail error:', err);
      }
    } finally {
      thumbnailGuardMap.current.set(canvas, false);
      if (thumbnailPendingMap.current.has(canvas)) {
        const nextNum = thumbnailPendingMap.current.get(canvas)!;
        thumbnailPendingMap.current.delete(canvas);
        renderThumbnail(nextNum, canvas);
      }
    }
  }, [sidebarPageWidth]);

  useEffect(() => {
    if (!bookId) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('You must be logged in');
      setLoading(false);
      return;
    }

    fetch(`/api/pdf/${bookId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(async res => {
        if (res.status === 403) throw new Error('You have not purchased this book');
        if (res.status === 404) throw new Error('PDF not available');
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.message || `Failed (${res.status})`);
        }
        const contentDisp = res.headers.get('content-disposition') || '';
        const match = contentDisp.match(/filename="?(.+?)"?$/);
        setTitle(match ? match[1].replace('.pdf', '') : 'PDF Reader');

        const blob = await res.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        pdfDocRef.current = pdf;
        setPageCount(pdf.numPages);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to load');
        setLoading(false);
      });
  }, [bookId]);

  useEffect(() => {
    if (pdfDocRef.current && currentPage >= 1 && currentPage <= pageCount) {
      renderPage(currentPage);
    }
  }, [currentPage, pageCount, renderPage]);

  useEffect(() => {
    if (pdfDocRef.current && currentPage >= 1) {
      renderPage(currentPage);
    }
  }, [scale]);

  const goToPage = (num: number) => {
    const n = Math.max(1, Math.min(num, pageCount));
    setCurrentPage(n);
    setPageInput('');
    if (sidebarRef.current) {
      const thumb = sidebarRef.current.querySelector(`[data-page="${n}"]`);
      thumb?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const n = parseInt(pageInput, 10);
      if (!isNaN(n)) goToPage(n);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PageDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        goToPage(currentPage + 1);
      } else if (e.key === 'PageUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPage(currentPage - 1);
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        setScale(s => Math.min(s + 0.2, 3));
      } else if (e.key === '-') {
        e.preventDefault();
        setScale(s => Math.max(s - 0.2, 0.5));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, pageCount]);

  useEffect(() => {
    const preventPrint = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's' || e.key === 'P' || e.key === 'S')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const preventDrag = (e: DragEvent) => e.preventDefault();

    window.addEventListener('keydown', preventPrint);
    window.addEventListener('dragstart', preventDrag);
    window.addEventListener('drop', preventDrag);

    return () => {
      window.removeEventListener('keydown', preventPrint);
      window.removeEventListener('dragstart', preventDrag);
      window.removeEventListener('drop', preventDrag);
    };
  }, []);

  return (
    <div
      className="h-screen bg-gray-900 select-none flex flex-col"
      onContextMenu={e => e.preventDefault()}
      style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
    >
      <style>{`
        @media print { body { display: none !important; } }
        canvas { -webkit-user-drag: none; user-select: none; -webkit-user-select: none; }
        .sidebar-thumb { transition: border-color 0.15s; }
        .sidebar-thumb:hover { border-color: #60a5fa; }
        .sidebar-thumb.active { border-color: #3b82f6; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #1f2937; }
        ::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 3px; }
      `}</style>

      <header className="sticky top-0 z-20 bg-gray-800 border-b border-gray-700 text-white shrink-0">
        <div className="flex items-center gap-3 px-4 py-2.5">
          {!loading && pageCount > 0 && (
            <button
              onClick={() => setShowSidebar(s => !s)}
              className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
              title={showSidebar ? 'Hide previews' : 'Show previews'}
            >
              {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors font-bold text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="h-5 w-px bg-gray-600" />
          <FileText className="w-5 h-5 text-blue-400 shrink-0" />
          <h1 className="font-bold truncate text-sm">{loading ? 'Loading...' : title}</h1>
          {!loading && pageCount > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <div className="flex items-center gap-1 bg-gray-700 rounded-lg px-1.5 py-1">
                <button
                  onClick={() => setScale(s => Math.max(s - 0.2, 0.5))}
                  className="p-1 hover:text-blue-400 transition-colors"
                  title="Zoom out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold w-9 text-center">{Math.round(scale * 100)}%</span>
                <button
                  onClick={() => setScale(s => Math.min(s + 0.2, 3))}
                  className="p-1 hover:text-blue-400 transition-colors"
                  title="Zoom in"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-1 bg-gray-700 rounded-lg px-1.5 py-1">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="p-1 disabled:opacity-30 hover:text-blue-400 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-0.5">
                  <input
                    type="text"
                    value={pageInput}
                    onChange={e => setPageInput(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={handlePageInputKeyDown}
                    onFocus={e => e.target.select()}
                    placeholder={String(currentPage)}
                    className="w-10 bg-transparent text-center text-xs font-bold outline-none border-b border-transparent focus:border-blue-400"
                  />
                  <span className="text-xs text-gray-400">/ {pageCount}</span>
                </div>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= pageCount}
                  className="p-1 disabled:opacity-30 hover:text-blue-400 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {showSidebar && !loading && !error && pageCount > 0 && (
          <aside className="w-52 bg-gray-800 border-r border-gray-700 overflow-y-auto" ref={sidebarRef}>
            <div className="p-1.5 space-y-1">
              {Array.from({ length: pageCount }, (_, i) => i + 1).map(num => (
                <ThumbnailItem
                  key={num}
                  pageNum={num}
                  isActive={num === currentPage}
                  pdfDoc={pdfDocRef.current}
                  cached={thumbCache.current.get(num)}
                  onClick={() => goToPage(num)}
                />
              ))}
            </div>
          </aside>
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col items-center min-h-full">
            {loading && (
              <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="font-bold">Loading PDF...</p>
              </div>
            )}

            {error && (
              <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                <p className="text-lg font-bold text-white mb-2">Unable to load</p>
                <p className="text-gray-400 mb-6">{error}</p>
                <Link
                  href="/profile?tab=my-books"
                  className="px-6 py-3 bg-white text-gray-900 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Back to My Books
                </Link>
              </div>
            )}

            {!loading && !error && (
              <div className="shadow-2xl rounded-2xl overflow-hidden" onContextMenu={e => e.preventDefault()}>
                <canvas ref={canvasRef} className="block" />
              </div>
            )}

            {pageCount > 1 && (
              <div className="mt-6 mb-12 flex items-center gap-4">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="px-5 py-2.5 bg-gray-700 text-white rounded-xl font-bold disabled:opacity-30 hover:bg-gray-600 transition-colors flex items-center gap-2 text-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <div className="flex items-center gap-1.5 bg-gray-800 rounded-xl px-3 py-2 border border-gray-700">
                  <input
                    type="text"
                    value={pageInput}
                    onChange={e => setPageInput(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={handlePageInputKeyDown}
                    onFocus={e => e.target.select()}
                    placeholder={String(currentPage)}
                    className="w-12 bg-transparent text-center text-sm font-bold outline-none border-b border-transparent focus:border-blue-400 text-white"
                  />
                  <span className="text-gray-400 text-sm font-bold">/ {pageCount}</span>
                </div>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= pageCount}
                  className="px-5 py-2.5 bg-gray-700 text-white rounded-xl font-bold disabled:opacity-30 hover:bg-gray-600 transition-colors flex items-center gap-2 text-sm"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function ThumbnailItem({
  pageNum,
  isActive,
  pdfDoc,
  cached,
  onClick,
}: {
  pageNum: number;
  isActive: boolean;
  pdfDoc: pdfjsLib.PDFDocumentProxy | null;
  cached: string | undefined;
  onClick: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (cached) {
      setLoaded(true);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas || !pdfDoc) return;

    let cancelled = false;
    const taskRef = { current: null as any };

    (async () => {
      const page = await pdfDoc.getPage(pageNum).catch(() => null);
      if (!page || cancelled) return;

      const base = page.getViewport({ scale: 1 });
      const dpr = window.devicePixelRatio || 1;
      const sidebarPageWidth = 180;
      const displayScale = sidebarPageWidth / base.width;
      const finalScale = displayScale * dpr;

      canvas.width = base.width * finalScale;
      canvas.height = base.height * finalScale;
      const ctx = canvas.getContext('2d');
      if (!ctx || cancelled) return;
      ctx.scale(dpr, dpr);

      const viewport = page.getViewport({ scale: displayScale });
      const renderTask = page.render({ canvasContext: ctx, viewport, canvas });
      taskRef.current = renderTask;

      try {
        await renderTask.promise;
        if (!cancelled) setLoaded(true);
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Thumbnail render error:', err);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (taskRef.current) {
        try { taskRef.current.cancel(); } catch {}
      }
    };
  }, [pageNum, pdfDoc, cached]);

  return (
    <button
      data-page={pageNum}
      onClick={onClick}
      className={`sidebar-thumb block w-full rounded-lg overflow-hidden border-2 ${isActive ? 'border-blue-500 active' : 'border-transparent'} ${loaded ? 'opacity-100' : 'opacity-50'} transition-all`}
    >
      {cached ? (
        <img src={cached} alt={`Page ${pageNum}`} className="w-full object-cover" />
      ) : (
        <canvas ref={canvasRef} className="w-full" />
      )}
      <div className={`text-[10px] font-bold text-center py-0.5 ${isActive ? 'text-blue-400' : 'text-gray-400'}`}>
        {pageNum}
      </div>
    </button>
  );
}
