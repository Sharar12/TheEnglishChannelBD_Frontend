'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Clock, BookOpen, Star, ArrowRight, Users, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { useInView } from 'react-intersection-observer';
import { Course } from '@/types';
import { cn } from '@/lib/utils';

interface CourseCardProps {
  course: Course & {
    average_rating?: number;
    reviews_count?: number;
    enrolled_count?: number;
  };
  className?: string;
  index?: number;
}

const levelColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700 border-green-200',
  intermediate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  advanced: 'bg-red-100 text-red-700 border-red-200',
};

export default function CourseCard({ course, className, index = 0 }: CourseCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('perspective(1000px) rotateX(0deg) rotateY(0deg)');
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -5;
    const rotateY = ((x - centerX) / centerX) * 5;

    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`);
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)');
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
      className={cn(
        'group relative bg-white rounded-3xl border border-gray-100 shadow-[0_0_20px_rgba(255,167,38,0.2)] hover:shadow-2xl hover:shadow-orange-500/25 overflow-hidden transition-all duration-300',
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform, transition: 'transform 0.15s ease-out' }}
    >
      {/* Image Section */}
      <div ref={cardRef} className="relative h-48 overflow-hidden">
        {course.image ? (
          <img 
            src={course.image} 
            alt={course.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-orange-300" />
          </div>
        )}
        
        {/* Glass Overlay for Featured */}
        {course.is_featured && (
          <div className="absolute top-4 right-4 backdrop-blur-md bg-white/70 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm border border-white/50">
            <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700">Featured</span>
          </div>
        )}

        {/* Gradient Bottom Fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content Section */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className={cn(
            'text-[10px] font-bold px-2 py-0.5 rounded-full border',
            levelColors[course.level.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200'
          )}>
            {course.level.toUpperCase()}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-600 border-blue-200">
            {course.category}
          </span>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors">
          {course.title}
        </h3>
        
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
          {course.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-gray-400 mb-6">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{course.duration_hours}h</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{course.lessons_count} lessons</span>
          </div>
        </div>

        {/* Rating and Stats Section */}
        <div className="mb-4 p-3 bg-gray-50 rounded-xl">
          {/* Average Rating Stars */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const rating = course.average_rating || 0;
                const filled = star <= Math.floor(rating);
                const partial = !filled && star === Math.ceil(rating) && rating % 1 !== 0;

                return (
                  <span key={star} className="relative inline-block">
                    <Star className="w-3.5 h-3.5 fill-gray-200 text-gray-200" />
                    {(filled || partial) && (
                      <span
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: filled ? '100%' : `${(rating % 1) * 100}%` }}
                      >
                        <Star className="w-3.5 h-3.5 fill-orange-500 text-orange-500" />
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
            <span className="text-sm font-bold text-gray-900">
              {(course.average_rating || 0).toFixed(1)}
            </span>
            <span className="text-xs text-gray-500">
              ({course.reviews_count || 0} review{(course.reviews_count || 0) !== 1 ? 's' : ''})
            </span>
          </div>

          {/* Enrolled Count */}
          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-semibold">{course.enrolled_count || 0} student{(course.enrolled_count || 0) !== 1 ? 's' : ''} enrolled</span>
            </div>
            {(course.reviews_count || 0) > 0 && (
              <div className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                <span>{course.reviews_count} review{(course.reviews_count || 0) !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-medium">Instructor</p>
            <p className="text-sm font-bold text-gray-800">{course.instructor}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-orange-600">৳{course.price}</p>
          </div>
        </div>

        <Link 
          href={`/courses/${course.slug}`}
          className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-50 text-gray-700 font-bold text-sm group-hover:bg-orange-600 group-hover:text-white transition-all duration-300"
        >
          Learn More
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}
