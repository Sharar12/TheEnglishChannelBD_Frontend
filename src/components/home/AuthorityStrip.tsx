import { Award, BookOpen, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

export default function AuthorityStrip() {
  const credentials = [
    {
      icon: <GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-amber-500 group-hover:text-amber-400 transition-colors" />,
      text: "B.A. (1st Class, 3rd Position) | M.A. in English (Lang), DU"
    },
    {
      icon: <BookOpen className="w-5 h-5 md:w-6 md:h-6 text-amber-500 group-hover:text-amber-400 transition-colors" />,
      text: "Author of 4 Published English Language Books"
    },
    {
      icon: <Award className="w-5 h-5 md:w-6 md:h-6 text-amber-500 group-hover:text-amber-400 transition-colors" />,
      text: "Ex-Principal & Academic Visionary"
    }
  ];

  return (
    <div className="w-full relative z-20 -mt-8 px-4">
      <div className="container mx-auto">
        <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-xl shadow-black/5 rounded-2xl py-6 px-4 md:px-8 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-6 md:gap-4">
            {credentials.map((cred, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-4 group cursor-default"
              >
                <div className="p-3 bg-amber-100/50 rounded-xl group-hover:bg-amber-500/10 transition-colors border border-amber-200/50 group-hover:border-amber-400/50 shadow-sm">
                  {cred.icon}
                </div>
                <p className="text-sm md:text-base font-semibold text-gray-800 tracking-wide group-hover:text-amber-700 transition-colors">
                  {cred.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
