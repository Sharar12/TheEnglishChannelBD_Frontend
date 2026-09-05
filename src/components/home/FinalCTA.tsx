import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function FinalCTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background with deep premium brand color */}
      <div className="absolute inset-0 bg-[#0f172a]" /> {/* Deep Navy */}
      
      {/* Abstract decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-250px] right-[-250px] w-[800px] h-[800px] bg-gradient-to-tr from-amber-500/20 to-transparent rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-250px] left-[-250px] w-[800px] h-[800px] bg-gradient-to-bl from-rose-500/20 to-transparent rounded-full blur-[120px]" 
        />
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
      </div>

      <div className="container mx-auto px-4 md:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-amber-400 text-sm font-bold tracking-widest uppercase mb-8 border border-white/10">
            <Sparkles className="w-4 h-4" /> Transform Your Future
          </div>
          
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-8 leading-tight">
            Stop struggling with English.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
              Start learning from the master today.
            </span>
          </h2>
          
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Join thousands of successful students who have conquered competitive exams and mastered the English language.
          </p>
          
          <Link 
            href="/register" 
            className="group relative inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-lg font-bold rounded-full hover:shadow-2xl hover:shadow-amber-500/40 transition-all transform hover:-translate-y-1 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-3">
              Get Started Today <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </span>
            {/* Animated shine effect */}
            <div className="absolute inset-0 -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg]" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
