'use client';

import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';
import { motion } from 'motion/react';

interface AnimatedCounterProps {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  label: string;
  icon: React.ReactNode;
  decimals?: number;
}

export default function AnimatedCounter({
  end,
  suffix = '',
  prefix = '',
  duration = 2,
  label,
  icon,
  decimals = 0,
}: AnimatedCounterProps) {
  const [hasAnimated, setHasAnimated] = useState(false);
  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [inView, hasAnimated]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="group relative flex flex-col items-center p-8 bg-white rounded-3xl border border-gray-100 hover:border-orange-200 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/5"
    >
      {/* Icon with glow effect */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative w-16 h-16 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </div>

      {/* Counter */}
      <div className="text-4xl md:text-5xl font-black text-gray-900 mb-3">
        {hasAnimated ? (
          <CountUp end={end} duration={duration} suffix={suffix} prefix={prefix} decimals={decimals} />
        ) : (
          <span>0{suffix}</span>
        )}
      </div>

      {/* Label */}
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider text-center">
        {label}
      </p>

      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
}
