import { useRef } from 'react';
import Link from 'next/link';
import { Book as BookIcon, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Book } from '@/types';
import BookCard from '@/components/BookCard';

interface BookShowroomProps {
  books: Book[];
}

export default function BookShowroom({ books }: BookShowroomProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  // If no books passed, just return null or fallback
  if (!books || books.length === 0) return null;

  // Ideally, we filter or take exactly 4 books for the "4 Book Showroom"
  const showcaseBooks = books.slice(0, 4);

  return (
    <section className="py-24 bg-gray-950 text-white overflow-hidden relative">
      {/* Decorative Background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#f59e0b 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      {/* Spotlight effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="container mx-auto px-4 md:px-8 max-w-7xl relative z-10">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
              <BookIcon className="w-3 h-3" /> Core Curriculum
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">
              The 4 Definitive Books.
            </h2>
            <p className="text-lg text-gray-400">
              Our courses are built on the foundation of these critically acclaimed books. The ultimate guides for competitive exams and language mastery.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={scrollLeft}
              className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 hover:border-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={scrollRight}
              className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 hover:border-white transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Horizontal Scroll Snap Container */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-8 pb-12 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {showcaseBooks.map((book, index) => (
            <motion.div 
              key={book.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="snap-start shrink-0 w-[280px] md:w-[320px] flex flex-col"
            >
              {/* Utilizing the existing BookCard but wrapped for spacing */}
              <div className="relative group/book transform hover:-translate-y-6 transition-all duration-500 ease-out z-10">
                {/* Glow behind book on hover */}
                <div className="absolute inset-0 bg-amber-500/0 group-hover/book:bg-amber-500/20 blur-2xl rounded-3xl transition-colors duration-500 -z-10" />
                <BookCard book={book} />
                {/* Shadow/Reflection beneath book */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-4/5 h-4 bg-black/60 blur-xl rounded-full scale-y-50 group-hover/book:scale-x-110 group-hover/book:bg-amber-900/40 transition-all duration-500 -z-20" />
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-amber-400 text-sm font-medium mb-3">Core Curriculum for Our Courses</p>
                <Link 
                  href={`/shop/${book.id}`}
                  className="inline-flex items-center gap-2 text-white font-bold hover:text-amber-400 transition-colors group"
                >
                  View Details <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Global Style for hiding scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </section>
  );
}
