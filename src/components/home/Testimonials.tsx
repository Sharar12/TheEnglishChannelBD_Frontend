import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react';
import { motion } from 'motion/react';

export default function Testimonials() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const testimonials = [
    {
      id: 1,
      name: 'Rahim Uddin',
      achievement: 'Cleared BCS English Section',
      image: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&q=80',
      text: "The structured approach and live doubt-clearing sessions made all the difference. I finally conquered my fear of the BCS English section.",
      type: 'text'
    },
    {
      id: 2,
      name: 'Sadia Rahman',
      achievement: 'Admitted to Dhaka University',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
      text: "Principal sir's methodology is simply unparalleled. The recorded courses allowed me to revise constantly before my admission test.",
      type: 'text'
    },
    {
      id: 3,
      name: 'Kamrul Hasan',
      achievement: 'IELTS Band 8.0',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      text: "The resources and the seamless video player on this platform made my IELTS preparation incredibly smooth. Highly recommended!",
      type: 'text'
    },
    {
      id: 4,
      name: 'Nusrat Jahan',
      achievement: 'Corporate Professional',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
      text: "My spoken English and corporate communication have improved drastically. The foundational grammar rules taught here are life-saving.",
      type: 'text'
    }
  ];

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -350, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 350, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-24 bg-slate-50 overflow-hidden relative">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-6">
              Success Stories.
            </h2>
            <p className="text-lg text-gray-600">
              Don't just take our word for it. Hear from the students who transformed their careers and futures with our guidance.
            </p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={scrollLeft}
              className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-colors text-gray-600"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={scrollRight}
              className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-gray-300 transition-colors text-gray-600"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Carousel Container */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div 
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="snap-start shrink-0 w-[300px] md:w-[350px] bg-white rounded-3xl p-8 relative shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all duration-300 border border-slate-100 group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/0 to-amber-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl pointer-events-none" />
              <Quote className="absolute top-6 right-6 w-10 h-10 text-slate-100 group-hover:text-amber-100 transition-colors duration-300" />
              
              <div className="flex gap-1 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-4 h-4 fill-amber-500 text-amber-500" />
                ))}
              </div>

              <p className="text-gray-700 italic mb-8 relative z-10 line-clamp-4">
                "{testimonial.text}"
              </p>

              <div className="flex items-center gap-4 mt-auto">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name} 
                  className="w-12 h-12 rounded-full object-cover shadow-md border-2 border-white group-hover:border-amber-100 transition-colors"
                />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{testimonial.name}</h4>
                  <p className="text-xs font-semibold text-amber-600">{testimonial.achievement}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </section>
  );
}
