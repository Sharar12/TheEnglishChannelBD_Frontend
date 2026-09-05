'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const PdfReader = dynamic(() => import('./PdfReaderContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-400">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin" />
        <p className="font-bold">Loading reader...</p>
      </div>
    </div>
  ),
});

export default function PdfReaderPage() {
  return <PdfReader />;
}
