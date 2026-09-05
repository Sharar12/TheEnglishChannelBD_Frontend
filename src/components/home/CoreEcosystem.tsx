import { MonitorPlay, RadioReceiver, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';

export default function CoreEcosystem() {
  return (
    <section className="py-20 px-4 md:px-8 max-w-7xl mx-auto" id="live-courses">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-4">Choose Your Learning Path</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Whether you thrive in a live classroom environment or prefer learning at your own pace, we have the perfect ecosystem for you.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Card 1: Live Interactive Batches */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          whileHover={{ y: -10 }}
          className="relative group bg-white/90 backdrop-blur-sm rounded-3xl p-8 lg:p-10 border border-red-100 hover:border-red-400 shadow-xl shadow-red-500/5 hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300 flex flex-col h-full overflow-hidden"
        >
          {/* Subtle mesh gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-orange-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
          <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-bl-2xl animate-pulse">
            🔴 Live Enrollment Open
          </div>
          
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mb-8 text-red-600 group-hover:scale-110 group-hover:bg-red-500 group-hover:text-white transition-all duration-300">
            <RadioReceiver className="w-8 h-8" />
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-4">Live Interactive Batches</h3>
          <p className="text-gray-600 mb-8 flex-grow">
            Join the principal in real-time. Experience the discipline and rigorous structure of an offline classroom, entirely online.
          </p>

          <ul className="space-y-4 mb-8">
            {['Real-time doubt clearing directly with the Principal', 'Strict, scheduled routines for discipline', 'Interactive peer discussions', 'Live examinations and assessments'].map((feature, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>

          <Link href="/courses?type=live" className="inline-flex items-center justify-center gap-2 w-full py-4 bg-red-50 text-red-600 font-bold rounded-xl group-hover:bg-red-500 group-hover:text-white transition-colors">
            View Upcoming Batches <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>

        {/* Card 2: Self-Paced Video Courses */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          whileHover={{ y: -10 }}
          className="relative group bg-white/90 backdrop-blur-sm rounded-3xl p-8 lg:p-10 border border-indigo-100 hover:border-indigo-400 shadow-xl shadow-indigo-500/5 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 flex flex-col h-full overflow-hidden"
        >
          {/* Subtle mesh gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
          <div className="absolute top-0 right-0 bg-indigo-100 text-indigo-700 text-xs font-bold px-4 py-2 rounded-bl-2xl">
            ⚡ Instant Access
          </div>

          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mb-8 text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
            <MonitorPlay className="w-8 h-8" />
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-4">Self-Paced Video Courses</h3>
          <p className="text-gray-600 mb-8 flex-grow">
            Learn anytime, anywhere. Master English at your own speed with high-definition, step-by-step recorded modules.
          </p>

          <ul className="space-y-4 mb-8">
            {['Lifetime access to premium video lectures', 'Learn at your own pace, on any device', 'Downloadable premium lecture sheets', 'Pause, rewind, and re-watch concepts'].map((feature, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>

          <Link href="/courses?type=recorded" className="inline-flex items-center justify-center gap-2 w-full py-4 bg-indigo-50 text-indigo-700 font-bold rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            Browse Video Courses <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
