'use client';

import { motion } from 'motion/react';
import { useInView } from 'react-intersection-observer';
import { GraduationCap, Clock, Award, InfinityIcon, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface BenefitCard {
  icon: React.ReactNode;
  title: string;
  description: string;
  details: string;
}

const benefits: BenefitCard[] = [
  {
    icon: <GraduationCap className="w-7 h-7" />,
    title: 'Expert Instructors',
    description: 'Learn from industry professionals with real-world experience.',
    details: 'Our instructors are carefully vetted to ensure you get the best education possible.',
  },
  {
    icon: <Clock className="w-7 h-7" />,
    title: 'Learn at Your Pace',
    description: 'Access course materials anytime, anywhere, on any device.',
    details: 'No deadlines, no pressure. Study when it works best for your schedule.',
  },
  {
    icon: <Award className="w-7 h-7" />,
    title: 'Certificate Included',
    description: 'Earn a recognized certificate upon course completion.',
    details: 'Showcase your achievements with our professionally designed certificates.',
  },
  {
    icon: <InfinityIcon className="w-7 h-7" />,
    title: 'Lifetime Access',
    description: 'Get unlimited access to course materials forever.',
    details: 'Revisit lessons, download resources, and learn at your own pace indefinitely.',
  },
];

export default function CourseBenefits() {
  const { ref, inView } = useInView({
    threshold: 0.2,
    triggerOnce: true,
  });

  return (
    <section ref={ref} className="py-20">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center max-w-3xl mx-auto mb-16"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full text-sm font-bold text-orange-600 uppercase tracking-wider mb-6">
          <GraduationCap className="w-4 h-4" />
          Why Choose Our Courses
        </div>
        <h2 className="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Everything You Need to <span className="text-orange-600 italic">Succeed</span>
        </h2>
        <p className="text-lg text-gray-500 leading-relaxed">
          Our courses are designed with your success in mind, packed with features that make learning effective and enjoyable.
        </p>
      </motion.div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {benefits.map((benefit, index) => (
          <BenefitCard key={index} benefit={benefit} index={index} inView={inView} />
        ))}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }}
        className="text-center mt-12"
      >
        <Link
          href="/courses"
          className="group inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-full font-bold hover:bg-orange-600 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl hover:shadow-orange-500/20"
        >
          Explore All Courses
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>
    </section>
  );
}

function BenefitCard({ benefit, index, inView }: { benefit: BenefitCard; index: number; inView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
      className="group relative bg-white rounded-3xl border border-gray-100 shadow-[0_0_20px_rgba(255,167,38,0.2)] overflow-hidden hover:border-orange-200 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/25"
    >
      {/* Front of card */}
      <div className="p-8 min-h-[280px] flex flex-col justify-between">
        <div>
          {/* Icon */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-orange-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative w-14 h-14 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl flex items-center justify-center text-orange-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
              {benefit.icon}
            </div>
          </div>

          {/* Title & Description */}
          <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">
            {benefit.title}
          </h3>
          <p className="text-gray-500 leading-relaxed">
            {benefit.description}
          </p>
        </div>

        {/* Learn More Link */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-sm font-semibold text-orange-600 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            {benefit.details}
          </p>
        </div>
      </div>

      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
}
