'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Clock, BookOpen, Star, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Course } from '@/types';
import { cn } from '@/lib/utils';

interface CourseHeroProps {
  courses: Course[];
  autoRotateInterval?: number;
}

const levelColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700 border-green-200',
  intermediate: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  advanced: 'bg-red-100 text-red-700 border-red-200',
};

export default function CourseHero({ courses, autoRotateInterval = 8000 }: CourseHeroProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying || courses.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % courses.length);
    }, autoRotateInterval);

    return () => clearInterval(interval);
  }, [isPlaying, courses.length, autoRotateInterval]);

  if (courses.length === 0) return null;

  const currentCourse = courses[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + courses.length) % courses.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % courses.length);
  };

  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
    >
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-orange-500/30 to-amber-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-orange-600/20 to-transparent rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 md:p-12 lg:p-16">
        {/* Left: Image Section */}
        <div className="relative group">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCourse.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl shadow-orange-500/20"
            >
              {currentCourse.image ? (
                <img
                  src={currentCourse.image}
                  alt={currentCourse.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-50 flex items-center justify-center">
                  <BookOpen className="w-24 h-24 text-orange-300" />
                </div>
              )}

              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-20 h-20 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg"
                >
                  <Play className="w-8 h-8 text-orange-600 ml-1" fill="currentColor" />
                </motion.div>
              </div>

              {/* Featured Badge */}
              {currentCourse.is_featured && (
                <div className="absolute top-4 right-4 backdrop-blur-md bg-white/90 px-4 py-2 rounded-full flex items-center gap-2 shadow-lg border border-white/50">
                  <Star className="w-4 h-4 fill-orange-500 text-orange-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-700">Featured Course</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: Content Section */}
        <div className="flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCourse.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
              className="space-y-6"
            >
              {/* Tags */}
              <div className="flex flex-wrap gap-3">
                <span className={cn(
                  'text-xs font-bold px-3 py-1.5 rounded-full border',
                  levelColors[currentCourse.level.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-200'
                )}>
                  {currentCourse.level.toUpperCase()}
                </span>
                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 uppercase tracking-wider">
                  {currentCourse.category}
                </span>
              </div>

              {/* Title */}
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                {currentCourse.title}
              </h2>

              {/* Description */}
              <p className="text-lg text-gray-300 leading-relaxed line-clamp-3">
                {currentCourse.description}
              </p>

              {/* Stats */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <Clock className="w-5 h-5 text-orange-400" />
                  <span>{currentCourse.duration_hours} hours</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <BookOpen className="w-5 h-5 text-orange-400" />
                  <span>{currentCourse.lessons_count} lessons</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Star className="w-5 h-5 text-orange-400 fill-orange-400" />
                  <span>{(currentCourse.average_rating || 0).toFixed(1)} rating</span>
                </div>
              </div>

              {/* Instructor & Price */}
              <div className="flex items-end justify-between pt-6 border-t border-white/10">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Instructor</p>
                  <p className="text-lg font-bold text-white">{currentCourse.instructor}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Price</p>
                  <p className="text-4xl font-black text-orange-400">৳{currentCourse.price}</p>
                </div>
              </div>

              {/* CTA Button */}
              <Link
                href={`/courses/${currentCourse.slug}`}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-full font-bold text-lg hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                Enroll Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Arrows */}
          {courses.length > 1 && (
            <div className="flex items-center gap-3 mt-8">
              <button
                onClick={goToPrevious}
                className="p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all border border-white/20"
                aria-label="Previous course"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToNext}
                className="p-3 bg-white/10 backdrop-blur-md rounded-full hover:bg-white/20 transition-all border border-white/20"
                aria-label="Next course"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Dots Indicator */}
              <div className="flex gap-2 ml-4">
                {courses.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all duration-300',
                      index === currentIndex
                        ? 'bg-orange-500 w-8'
                        : 'bg-white/30 hover:bg-white/50'
                    )}
                    aria-label={`Go to course ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
