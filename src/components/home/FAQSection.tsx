'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'How do I access the live classes?',
      answer: 'Once you enroll in a live batch, you will get access to a student dashboard. There, you will find the Zoom/Google Meet links, class schedules, and recorded backups of all live classes.'
    },
    {
      question: 'Will I get the lecture sheets or books with the course?',
      answer: 'Yes! High-quality PDF lecture sheets are included with every course. Physical books can be ordered separately from our Shop section.'
    },
    {
      question: 'What happens if I miss a live class?',
      answer: 'Don\'t worry. Every live class is recorded and uploaded to your dashboard within 24 hours. You can watch it anytime during your course validity period.'
    },
    {
      question: 'What are the payment methods accepted?',
      answer: 'We accept all major payment methods in Bangladesh, including bKash, Nagad, Rocket, and Visa/Mastercard debit/credit cards.'
    }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600">
            Everything you need to know about our courses, platform, and billing.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            
            return (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={cn(
                  "border rounded-2xl overflow-hidden transition-all duration-300",
                  isOpen ? "bg-white border-amber-200 shadow-lg shadow-amber-500/5" : "bg-white border-gray-200 hover:border-gray-300"
                )}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <span className={cn(
                    "text-lg font-bold pr-8",
                    isOpen ? "text-amber-600" : "text-gray-900"
                  )}>
                    {faq.question}
                  </span>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300",
                    isOpen ? "bg-amber-100 rotate-180" : "bg-gray-100"
                  )}>
                    <ChevronDown className={cn(
                      "w-5 h-5",
                      isOpen ? "text-amber-600" : "text-gray-500"
                    )} />
                  </div>
                </button>
                
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-6 pt-0 text-gray-600 leading-relaxed border-t border-gray-100 mt-2 pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
