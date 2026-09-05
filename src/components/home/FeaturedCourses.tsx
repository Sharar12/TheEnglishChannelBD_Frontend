import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import CourseCard from '@/components/CourseCard';
import { Course } from '@/types';

interface FeaturedCoursesProps {
  courses: Course[];
}

export default function FeaturedCourses({ courses }: FeaturedCoursesProps) {
  if (!courses || courses.length === 0) return null;

  return (
    <section className="py-20 bg-gray-50/50">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-4">Featured Masterclasses</h2>
            <p className="text-lg text-gray-600 max-w-2xl">
              Our most sought-after programs, meticulously designed to guarantee results.
            </p>
          </div>
          <Link 
            href="/courses" 
            className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-800 font-bold rounded-full hover:bg-gray-50 hover:shadow-md transition-all group"
          >
            View All Courses
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.slice(0, 3).map((course, index) => (
            <CourseCard key={course.id} course={course as any} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
