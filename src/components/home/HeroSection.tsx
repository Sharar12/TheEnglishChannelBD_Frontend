import Link from 'next/link';
import Image from 'next/image';
import { Play } from 'lucide-react';
import { motion } from 'motion/react';
import principalImg from '@/assets/images/principal.png';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gray-900 text-white rounded-3xl mx-4 mt-4 lg:mx-8 lg:mt-8">
      {/* Background blobs for aesthetics */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-[30%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-rose-500/20 to-orange-500/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-16 md:py-24 lg:py-32 flex flex-col-reverse lg:flex-row items-center gap-12">
        {/* Left Content */}
        <div className="flex-1 text-center lg:text-left space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight font-serif tracking-tight">
              Master the English Language with <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">Dhaka University’s Finest.</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
          >
            33+ years of academic excellence, author of 4 definitive English guidebooks, now bringing live and premium recorded courses directly to your screen.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
          >
            <Link
              href="/courses"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-full hover:shadow-xl hover:shadow-orange-500/40 transition-all transform hover:-translate-y-1 text-center relative overflow-hidden group"
            >
              <span className="relative z-10">Explore Courses</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            </Link>
            <Link
              href="#live-courses"
              className="w-full sm:w-auto px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/10 text-white font-bold rounded-full hover:bg-white/10 hover:border-white/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]"
            >
              <Play className="w-4 h-4 fill-current" /> View Live Classes
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="pt-6 border-t border-white/10 inline-block"
          >
            <p className="text-sm font-medium text-gray-400 flex items-center justify-center lg:justify-start gap-2">
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Author of 4 Best-Selling English Books | Over 10,000+ Students Taught
            </p>
          </motion.div>
        </div>

        {/* Right Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex-1 w-full max-w-lg lg:max-w-none relative"
        >
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="relative w-full h-full"
          >
            {/* Decorative frame */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/30 to-purple-500/30 rounded-3xl transform rotate-3 scale-105 -z-10 blur-sm" />
            <div className="absolute inset-0 bg-gradient-to-bl from-orange-500/20 to-transparent rounded-3xl transform -rotate-2 scale-105 -z-10" />

          <div className="relative aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-gray-800">
            {/* Note to developer: Swap this URL with your actual image or import the decrypted profile.enc */}
            <Image
              src={principalImg}
              alt="Principal Md. Tafazzal Hussain"
              className="w-full h-full object-cover object-top"
              placeholder="blur"
              priority
            />
            {/* Elegant gradient overlay at bottom for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-6 left-6 right-6 transform transition-transform duration-500 hover:translate-y-[-5px]">
              <p className="text-2xl font-serif font-bold text-white shadow-sm drop-shadow-md">Principal Md. Tafazzal Hussain</p>
              <p className="text-amber-400 text-sm font-medium tracking-wide">The Legend of English Language</p>
            </div>
          </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
