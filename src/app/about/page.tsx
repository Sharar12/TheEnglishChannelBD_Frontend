'use client';

import { motion } from 'motion/react';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, Phone, BookOpen, GraduationCap, Users, Trophy, ChevronRight, Quote, Calendar, Award, BookText, Briefcase, FileText } from 'lucide-react';
import principalImg from '@/assets/images/principal.png';
import { useEffect, useState } from 'react';

// Simple counter hook for animated numbers
function useCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // easeOutExpo
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      
      setCount(Math.floor(easeProgress * end));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [end, duration]);

  return count;
}

export default function About() {
  const studentsCount = useCounter(10000);
  const yearsCount = useCounter(33);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 overflow-hidden relative selection:bg-amber-500/30">
      
      {/* 1. High-Impact Hero Section (Dark Theme) */}
      <section className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 bg-gray-950 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-amber-500/10 rounded-full blur-[120px] transform translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] transform -translate-x-1/3 translate-y-1/3" />
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#f59e0b 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 max-w-7xl mx-auto">
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="flex-1 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-amber-400 text-sm font-bold tracking-widest uppercase mb-8 border border-white/10">
                <Trophy className="w-4 h-4" /> Academic Leadership
              </div>
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-white leading-tight mb-6">
                A Legacy of <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
                  Excellence.
                </span>
              </h1>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-10">
                Over 33 years of strong leadership in education administration, curriculum innovation, and passionate English Language Teaching (ELT) across Bangladesh.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex-1 w-full max-w-md lg:max-w-none relative"
            >
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-gray-900">
                <Image 
                  src={principalImg}
                  alt="Principal Md. Tafazzal Hussain"
                  className="w-full h-full object-cover object-top"
                  placeholder="blur"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/20 to-transparent opacity-90" />
                <div className="absolute bottom-8 left-8 right-8">
                  <p className="text-3xl font-serif font-bold text-white mb-2">Md. Tafazzal Hussain</p>
                  <p className="text-amber-400 font-medium tracking-wide uppercase text-sm">Former Principal & Academic Visionary</p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 2. Biography Section (Glassmorphic Light Theme) */}
      <section className="py-24 relative z-20 -mt-10">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="bg-white/80 backdrop-blur-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8 md:p-16 relative overflow-hidden"
          >
            {/* Decorative quote mark */}
            <Quote className="absolute top-10 right-10 w-40 h-40 text-gray-50 opacity-50 -z-10 rotate-12" />

            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-gray-900 mb-8">The Legend Behind The Channel</h2>
              
              <div className="prose prose-lg prose-gray max-w-none">
                <p className="text-xl text-gray-600 leading-relaxed mb-6 font-medium">
                  Principal Md. Tafazzal Hussain's remarkable journey began at the prestigious <strong>University of Dhaka</strong>, where he graduated with a <strong>B.A. with English Language (1st Division, 3rd Position)</strong> and completed his <strong>M.A. in English (Lang)</strong>.
                </p>
                <p className="text-gray-600 leading-relaxed mb-6">
                  With over 33 years of experience in teaching, training, and education administration, he has proven records of student and institutional development. He is deeply passionate about English Language Teaching (ELT) and has compiled extensive workbooks aligned with the CLT curriculum to improve English skills through interactive and learner-focused approaches.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Realizing the need to democratize premium education, he founded <em>The English Channel BD</em>. His goal is to break geographical barriers and bring the rigorous, disciplined environment of his legendary physical classrooms directly to students' screens across the nation.
                </p>
              </div>

              <div className="mt-12 p-8 bg-amber-50 rounded-2xl border border-amber-100 relative">
                <Quote className="absolute -top-4 -left-4 w-10 h-10 text-amber-300" />
                <p className="text-2xl font-serif text-gray-800 italic text-center">
                  "Learning English to achieve the dreams of a developed Bangladesh."
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3. Legacy & Achievements Grid */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">Pillars of Excellence</h2>
            <p className="text-lg text-gray-600">A testament to a lifetime dedicated to empowering students and institutions.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Years of Experience', value: yearsCount, suffix: '+', icon: GraduationCap, color: 'text-amber-500', bg: 'bg-amber-100/50', border: 'border-amber-200' },
              { label: 'Published Books', value: 4, suffix: '+', icon: BookOpen, color: 'text-indigo-500', bg: 'bg-indigo-100/50', border: 'border-indigo-200' },
              { label: 'Students Mentored', value: studentsCount, suffix: '+', icon: Users, color: 'text-rose-500', bg: 'bg-rose-100/50', border: 'border-rose-200' },
              { label: 'Dhaka University', value: '1st', suffix: ' Div', icon: Trophy, color: 'text-emerald-500', bg: 'bg-emerald-100/50', border: 'border-emerald-200' }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className={`p-8 rounded-3xl bg-white border ${stat.border} shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center group`}
              >
                <div className={`w-16 h-16 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-8 h-8" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {stat.value}{stat.suffix}
                </div>
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Professional Journey (Timeline) */}
      <section className="py-24 bg-white relative">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-bold text-gray-900 mb-4">Professional Journey</h2>
            <p className="text-lg text-gray-600">A career defined by leadership and academic excellence.</p>
          </div>

          <div className="relative border-l-2 border-amber-200 pl-8 ml-4 md:ml-0 md:pl-0 md:border-l-0">
            {/* Desktop Center Line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-amber-200 -translate-x-1/2" />
            
            {[
              { 
                date: 'June 2007 – February 2025', 
                title: 'Principal', 
                institution: 'Bormi Degree College, Sreepur, Gazipur',
                details: 'Led a college of 1800+ students, 53 teachers, and 16 staff. Oversaw exams, evaluations, staff management, and infrastructure.'
              },
              { 
                date: 'Nov 1997 – June 2007', 
                title: 'Assistant Professor and Head of English', 
                institution: 'Bikrampur Adarsha Degree College, Munshiganj',
                details: 'Steered the English department, developed curriculums, and focused on learner-centric teaching methodologies.'
              },
              { 
                date: 'May 1994 – Nov 1997', 
                title: 'Senior Lecturer in English', 
                institution: 'Karimganj Degree Mohabiddyalaya, Kishoreganj',
                details: 'Delivered advanced English lectures and organized academic development initiatives.'
              },
              { 
                date: 'June 1992 – April 1994', 
                title: 'Principal', 
                institution: 'Kawraid Goyeshpur College, Mymensingh',
                details: 'Early career leadership establishing robust administrative and educational policies.'
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={`relative mb-12 md:mb-24 md:w-1/2 ${i % 2 === 0 ? 'md:pr-16 md:ml-0' : 'md:pl-16 md:ml-auto'}`}
              >
                {/* Timeline Dot */}
                <div className={`absolute top-0 w-6 h-6 rounded-full bg-amber-500 border-4 border-white shadow-md z-10 
                  ${i % 2 === 0 ? '-left-[41px] md:left-auto md:-right-[11px]' : '-left-[41px] md:-left-[11px]'}`} 
                />
                
                <div className="bg-gray-50 border border-gray-100 p-8 rounded-3xl shadow-sm hover:shadow-lg transition-shadow group">
                  <div className="flex items-center gap-2 text-amber-600 font-bold mb-2">
                    <Calendar className="w-4 h-4" /> {item.date}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-600 font-medium mb-4">{item.institution}</p>
                  <p className="text-gray-500 leading-relaxed">{item.details}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Publications & Research */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-serif font-bold text-gray-900 mb-6">Publications & Research</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                A passionate advocate for English Language Teaching (ELT), Principal Hussain has authored extensive academic materials aligned with the CLT curriculum.
              </p>
              
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <BookText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg mb-2">The English Channel BD Series</h4>
                    <ul className="text-gray-600 space-y-1 list-disc list-inside">
                      <li>Workbook 1: Verbs and Tenses (Class 11–12)</li>
                      <li>Workbook A (Class 6), B (Class 7), C (Class 8)</li>
                      <li>Learning English through Actual Practice (LEAP)</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg mb-2">Academic Research</h4>
                    <p className="text-gray-600">
                      Supervised by Dr. M. Maniruzzaman (Jahangirnagar University), his research focused on the <em>"Implementation of Skill-Based English Syllabus at Secondary Level in Bangladesh"</em> and surveys on English Proficiency.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-blue-500/20 rounded-3xl transform rotate-3 scale-105 -z-10 blur-xl" />
              <div className="bg-gray-900 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
                 <h3 className="text-2xl font-serif font-bold mb-8">Key Skills & Expertise</h3>
                 <ul className="space-y-6">
                   {[
                     { title: "Educational Leadership", desc: "Administration, policy development, and team building." },
                     { title: "Curriculum Design", desc: "Compiling workbooks and modernizing English courses." },
                     { title: "English Language Teaching", desc: "Listening, Speaking, Reading, Writing, and Phonetics." },
                     { title: "Academic Consultancy", desc: "Project planning, implementation, and management support." }
                   ].map((skill, i) => (
                     <li key={i} className="flex gap-4">
                       <Award className="w-6 h-6 text-amber-400 shrink-0" />
                       <div>
                         <p className="font-bold text-white">{skill.title}</p>
                         <p className="text-gray-400 text-sm">{skill.desc}</p>
                       </div>
                     </li>
                   ))}
                 </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. Awards & Memberships */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-6xl text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-12">Accolades & Professional Affiliations</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 border border-gray-100 rounded-3xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all">
              <Award className="w-10 h-10 text-amber-500 mx-auto mb-4" />
              <h4 className="font-bold text-gray-900 mb-2">Government Scholarships</h4>
              <p className="text-gray-600 text-sm">Awarded Government Merit Scholarship for Bachelor Degree results and General Scholarship for HSC.</p>
            </div>
            <div className="p-8 border border-gray-100 rounded-3xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all">
              <Users className="w-10 h-10 text-blue-500 mx-auto mb-4" />
              <h4 className="font-bold text-gray-900 mb-2">BELTA Life Member</h4>
              <p className="text-gray-600 text-sm">A proud Life Member of the Bangladesh English Language Teachers’ Association (BELTA).</p>
            </div>
            <div className="p-8 border border-gray-100 rounded-3xl bg-gray-50 hover:bg-white hover:shadow-xl transition-all">
              <Briefcase className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
              <h4 className="font-bold text-gray-900 mb-2">Head Examiner</h4>
              <p className="text-gray-600 text-sm">Served as Head Examiner for Degree and HSC level exams under National University and Dhaka Board.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Mission & Vision Statement Banner */}
      <section className="py-24 relative overflow-hidden bg-gray-900">
        <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1600&q=80')] bg-cover bg-center bg-fixed mix-blend-luminosity" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/90 to-transparent" />
        
        <div className="container mx-auto px-6 max-w-6xl relative z-10">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-serif font-bold text-white mb-6">Our Mission</h2>
            <p className="text-xl text-gray-300 leading-relaxed mb-12">
              To dismantle the barriers to elite language education. We believe that mastering English should not be a privilege reserved for the few, but an accessible tool for every ambitious student in Bangladesh aiming to excel globally.
            </p>
            
            <h2 className="text-4xl font-serif font-bold text-white mb-6">Our Vision</h2>
            <p className="text-xl text-gray-300 leading-relaxed">
              To be the premier digital institution where rigorous academic discipline meets modern technology, shaping the next generation of confident, articulate, and successful leaders.
            </p>
          </div>
        </div>
      </section>

      {/* 8. Connect & Learn CTA */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6 max-w-5xl text-center">
          <h2 className="text-4xl font-serif font-bold text-gray-900 mb-6">Ready to Transform Your Future?</h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Whether you have a question about our books, or you are ready to enroll in the next live batch, we are here to guide you.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-6 mb-16">
            <a href="tel:+8801871666866" className="group flex items-center justify-center gap-4 px-8 py-5 bg-gray-50 hover:bg-white border border-gray-200 hover:border-amber-200 rounded-2xl shadow-sm hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                <Phone className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-500">Call Us</p>
                <p className="font-bold text-gray-900 text-lg">01871-666866</p>
              </div>
            </a>
            
            <a href="mailto:mdtafazzalhussain1965@gmail.com" className="group flex items-center justify-center gap-4 px-8 py-5 bg-gray-50 hover:bg-white border border-gray-200 hover:border-amber-200 rounded-2xl shadow-sm hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                <Mail className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-500">Email Us</p>
                <p className="font-bold text-gray-900 text-lg">mdtafazzalhussain1965@gmail.com</p>
              </div>
            </a>
          </div>

          <Link 
            href="/courses" 
            className="group relative inline-flex items-center gap-3 px-12 py-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xl font-bold rounded-full hover:shadow-2xl hover:shadow-amber-500/40 transition-all transform hover:-translate-y-1 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-3">
              Explore Our Courses <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </span>
            {/* Animated shine effect */}
            <div className="absolute inset-0 -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg]" />
          </Link>
        </div>
      </section>

    </div>
  );
}
