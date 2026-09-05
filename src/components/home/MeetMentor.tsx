import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Quote } from 'lucide-react';
import { motion } from 'motion/react';
import principalImg from '@/assets/images/principal.png';

export default function MeetMentor() {
  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white overflow-hidden relative">
      {/* Subtle background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-amber-50/50 -skew-x-12 transform origin-top-right -z-10" />
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Image Side */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-1 w-full relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 rounded-3xl transform -rotate-3 scale-105 -z-10" />
            <div className="relative aspect-[4/5] md:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-white/50 bg-gray-100">
              <Image 
                src={principalImg}
                alt="Principal Md. Tafazzal Hussain teaching"
                className="w-full h-full object-cover object-top"
                placeholder="blur"
              />
            </div>
            
            <div className="absolute -bottom-6 -right-6 md:-right-12 bg-white p-6 rounded-2xl shadow-xl max-w-xs hidden sm:block border border-gray-100">
              <Quote className="w-8 h-8 text-amber-500 mb-3" />
              <p className="text-gray-700 italic text-sm font-medium leading-relaxed">
                "Language is not just rules and grammar; it is the ultimate tool for expression and success."
              </p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="font-serif font-bold text-gray-900">- Principal Hussain</p>
              </div>
            </div>
          </motion.div>

          {/* Content Side */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-1 space-y-8"
          >
            <div>
              <p className="text-amber-600 font-bold tracking-wider uppercase text-sm mb-2">Meet Your Mentor</p>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-6">
                A Legacy of Academic Excellence.
              </h2>
            </div>
            
            <div className="space-y-4 text-lg text-gray-600 leading-relaxed">
              <p>
                From ranking 3rd in Dhaka University's prestigious English department to shaping the minds of thousands of students, Principal Md. Tafazzal Hussain has dedicated his life to language education.
              </p>
              <p>
                Having authored 4 best-selling English guidebooks, he founded <strong>The English Channel</strong> with a singular vision: to make premium, elite-level language education accessible to every ambitious learner across Bangladesh, regardless of their location.
              </p>
            </div>

            <div className="pt-4">
              <Link 
                href="/about" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white font-bold rounded-full hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/30 transition-all transform hover:-translate-y-1"
              >
                Read Full Biography & Publications <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
