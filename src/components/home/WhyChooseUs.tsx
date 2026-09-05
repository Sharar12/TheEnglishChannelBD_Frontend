import { BookOpen, GraduationCap, LayoutTemplate } from 'lucide-react';
import { motion } from 'motion/react';

export default function WhyChooseUs() {
  const features = [
    {
      icon: <GraduationCap className="w-8 h-8 text-amber-500" />,
      title: 'Dhaka University Methodology',
      description: 'Experience structured, scientifically proven language acquisition techniques honed over decades at the highest academic level.'
    },
    {
      icon: <BookOpen className="w-8 h-8 text-amber-500" />,
      title: 'Comprehensive Resource Material',
      description: 'All courses are meticulously designed around the Principal’s 4 published, best-selling English guidebooks.'
    },
    {
      icon: <LayoutTemplate className="w-8 h-8 text-amber-500" />,
      title: 'Seamless Learning Platform',
      description: 'Enjoy a lag-free video player, interactive doubt-clearing sessions, and an intuitive student dashboard built on modern tech.'
    }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-6">
            Why Choose The English Channel?
          </h2>
          <p className="text-lg text-gray-600">
            We don't just teach English; we engineer your success through proven academic frameworks and modern technology.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
