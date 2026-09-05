'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, BookOpen, Clock, GraduationCap, FileText, 
  ClipboardList, CheckCircle, Download, Award, RotateCcw, 
  Play, Video, ChevronDown, ChevronUp, Lock, Sparkles, ShieldCheck 
} from 'lucide-react';
import CustomVideoPlayer from '@/components/CustomVideoPlayer';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useAuth } from '@/context/AuthContext';
import { videoStreamUrl } from '@/lib/config';

// ================= INTERFACES (Keep unchanged) =================
interface Course {
  id: number;
  title: string;
  slug: string;
  instructor: string;
  description: string;
  price: string;
  duration_hours: number;
  lessons_count: number;
  level: string;
  preview_video: string | null;
  is_featured: boolean;
  is_active: boolean;
  category: string;
  sections?: CourseSection[];
  quizzes?: CourseQuiz[];
}

interface CourseSection {
  id: number;
  course_id: number;
  title: string;
  order: number;
  lessons?: CourseLesson[];
}

interface CourseLesson {
  id: number;
  section_id: number;
  title: string;
  type: string;
  video_url: string | null;
  duration_minutes: number | null;
  is_free_preview: boolean;
  order: number;
  resources?: CourseResource[];
  quizzes?: CourseQuiz[];
}

interface CourseResource {
  id: number;
  lesson_id: number;
  title: string;
  file_path: string;
  file_type: string;
  file_size: number;
}

interface CourseQuiz {
  id: number;
  course_id: number;
  title: string;
  lesson_id?: number | null;
  questions?: QuizQuestion[];
}

interface QuizQuestion {
  id: number;
  quiz_id: number;
  question: string;
  options: string[];
  correct_answer: number;
  order: number;
}

const levelColors: Record<string, string> = {
  beginner: 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/50',
  intermediate: 'bg-amber-950/60 text-amber-300 border border-amber-700/50',
  advanced: 'bg-rose-950/60 text-rose-300 border border-rose-700/50',
};

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
    ytPlayer: any;
  }
}

// ================= MAIN COMPONENT =================
export default function CourseWatchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  
  // ✅ STATE DECLARATIONS (These were missing in the partial snippet)
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number | string>>(new Set());

  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());
  const [lessonQuizScores, setLessonQuizScores] = useState<Record<number, number>>({});
  const [finalQuizScores, setFinalQuizScores] = useState<Record<number, number>>({});
  const [watchedLessons, setWatchedLessons] = useState<Set<number>>(new Set());
  const [videoProgress, setVideoProgress] = useState<Record<number, number>>({});
  const [videoEnded, setVideoEnded] = useState(false);

  const [activeLessonQuiz, setActiveLessonQuiz] = useState<number | null>(null);
  const [activeFinalQuiz, setActiveFinalQuiz] = useState<number | null>(null);
  const [lessonQuizAnswers, setLessonQuizAnswers] = useState<Record<number, number>>({});
  const [finalQuizAnswers, setFinalQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [hasScored100Before, setHasScored100Before] = useState<Record<number, boolean>>({});

  const [showFinalQuiz, setShowFinalQuiz] = useState(false);

  // Derived values
  const allLessons = course?.sections?.flatMap(s => s.lessons || []) || [];
  const currentLesson = allLessons.find(l => l.id === activeLesson);

  // ================= FUNCTIONS =================
  const fetchCourse = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/courses/${slug}`);
      if (res.ok) {
        const data: Course = await res.json();
        setCourse(data);
        
        if (data.sections && data.sections.length > 0) {
          setExpandedSections(new Set([data.sections[0].id]));
          if (data.sections[0].lessons && data.sections[0].lessons.length > 0) {
            setActiveLesson(data.sections[0].lessons[0].id);
          }
        }
      } else {
        router.push('/profile');
      }
    } catch (error) {
      console.error('Failed to fetch course:', error);
      router.push('/profile');
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = (newCompleted: Set<number>, newLessonScores: Record<number, number>, newFinalScores: Record<number, number>, newWatched: Set<number>, newVideoProgress: Record<number, number>) => {
    if (!course || !user) return;
    const key = `course_progress_${user.uid}_${course.id}`;
    localStorage.setItem(key, JSON.stringify({
      completedLessons: Array.from(newCompleted),
      lessonQuizScores: newLessonScores,
      finalQuizScores: newFinalScores,
      watchedLessons: Array.from(newWatched),
      videoProgress: newVideoProgress,
    }));
  };

  useEffect(() => {
    fetchCourse();
  }, [slug]);

  useEffect(() => {
    if (course && user) {
      const key = `course_progress_${user.uid}_${course.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        setCompletedLessons(new Set(parsed.completedLessons || []));
        setLessonQuizScores(parsed.lessonQuizScores || {});
        setFinalQuizScores(parsed.finalQuizScores || {});
        setWatchedLessons(new Set(parsed.watchedLessons || []));
        setVideoProgress(parsed.videoProgress || {});
        
        const scored100: Record<number, boolean> = {};
        Object.entries(parsed.lessonQuizScores || {}).forEach(([quizId, score]) => {
          if (score === 100) scored100[parseInt(quizId)] = true;
        });
        Object.entries(parsed.finalQuizScores || {}).forEach(([quizId, score]) => {
          if (score === 100) scored100[parseInt(quizId)] = true;
        });
        setHasScored100Before(scored100);
      }
    }
  }, [course, user]);

  const isLessonWatched = (lessonId: number) => watchedLessons.has(lessonId);

  const canAccessLesson = (lessonId: number, lessonsArr: CourseLesson[]) => {
    const lessonIndex = lessonsArr.findIndex(l => l.id === lessonId);
    if (lessonIndex === 0) return true;
    const prevLesson = lessonsArr[lessonIndex - 1];
    if (!prevLesson) return true;
    return watchedLessons.has(prevLesson.id);
  };

  const handleVideoReady = () => {
    if (!activeLesson) return;
    const progress = videoProgress[activeLesson] || 0;
    if (progress > 0 && window.ytPlayer) {
      window.ytPlayer.seekTo(progress);
    }
  };

  const handleVideoStateChange = (event: any) => {
    if (event.data === 0 && activeLesson) {
      setVideoEnded(true);
      const newWatched = new Set(watchedLessons);
      newWatched.add(activeLesson);
      setWatchedLessons(newWatched);
      saveProgress(completedLessons, lessonQuizScores, finalQuizScores, newWatched, videoProgress);
    }
  };

  const toggleLessonComplete = (lessonId: number) => {
    if (!watchedLessons.has(lessonId)) return;
    const next = new Set(completedLessons);
    if (next.has(lessonId)) next.delete(lessonId);
    else next.add(lessonId);
    setCompletedLessons(next);
    saveProgress(next, lessonQuizScores, finalQuizScores, watchedLessons, videoProgress);
  };

  const toggleSection = (sectionId: number | string) => {
    const next = new Set(expandedSections);
    if (next.has(sectionId)) next.delete(sectionId);
    else next.add(sectionId);
    setExpandedSections(next);
  };

  const handleQuizAnswer = (questionIdx: number, optionIdx: number, type: 'lesson' | 'final') => {
    if (quizSubmitted) return;
    if (type === 'lesson') {
      setLessonQuizAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }));
    } else {
      setFinalQuizAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }));
    }
  };

  const submitQuiz = (quizIdx: number, isFinal: boolean) => {
    const quizzes = isFinal ? (course?.quizzes || []) : [];
    const quiz = quizzes[quizIdx];
    if (!quiz?.questions) return;

    const answers = isFinal ? finalQuizAnswers : lessonQuizAnswers;
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correct_answer) correct++;
    });

    const score = Math.round((correct / quiz.questions.length) * 100);
    
    if (isFinal) {
      const newScores = { ...finalQuizScores, [quiz.id]: score };
      setFinalQuizScores(newScores);
      if (score === 100) setHasScored100Before(prev => ({ ...prev, [quiz.id]: true }));
      saveProgress(completedLessons, lessonQuizScores, newScores, watchedLessons, videoProgress);
    } else {
      const newScores = { ...lessonQuizScores, [quiz.id]: score };
      setLessonQuizScores(newScores);
      saveProgress(completedLessons, newScores, finalQuizScores, watchedLessons, videoProgress);
    }
    setQuizSubmitted(true);
  };

  const submitLessonQuiz = (quizIdx: number) => {
    const currentLesson = allLessons.find(l => l.id === activeLesson);
    if (!currentLesson?.quizzes) return;
    const lessonQuizzes = currentLesson.quizzes.filter(q => q.lesson_id === currentLesson.id);
    const quiz = lessonQuizzes[quizIdx];
    if (!quiz?.questions) return;

    let correct = 0;
    quiz.questions.forEach((q, i) => {
      if (lessonQuizAnswers[i] === q.correct_answer) correct++;
    });

    const score = Math.round((correct / quiz.questions.length) * 100);
    const newScores = { ...lessonQuizScores, [quiz.id]: score };
    setLessonQuizScores(newScores);
    
    if (score === 100) setHasScored100Before(prev => ({ ...prev, [quiz.id]: true }));
    
    setQuizSubmitted(true);
    saveProgress(completedLessons, newScores, finalQuizScores, watchedLessons, videoProgress);
  };

  const resetQuiz = () => {
    setLessonQuizAnswers({});
    setFinalQuizAnswers({});
    setQuizSubmitted(false);
  };

  useEffect(() => {
    if (activeLesson) setVideoEnded(false);
  }, [activeLesson]);

  useEffect(() => {
    const videoId = extractYouTubeId(currentLesson?.video_url ?? null);
    if (videoId) loadYouTubeAPI(videoId);
    return () => {
      if (window.ytPlayer) {
        window.ytPlayer.destroy();
        window.ytPlayer = null;
      }
    };
  }, [currentLesson?.video_url]);

  const extractYouTubeId = (url: string | null) => {
    if (!url) return null;
    const match = url.match(/(?:embed\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const isYouTubeUrl = (url: string | null) => extractYouTubeId(url) !== null;

  const getVideoSrc = (url: string | null) => {
    if (!url) return '';
    if (url.startsWith('http')) {
      if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com')) return url;
      const match = url.match(/\/storage\/(.+)/);
      if (match) {
        return videoStreamUrl(url);
      }
      return url;
    }
    return videoStreamUrl(url);
  };

  const loadYouTubeAPI = (videoId: string) => {
    if (window.YT && window.YT.Player) {
      initPlayer(videoId);
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => initPlayer(videoId);
  };

  const downloadCertificate = async () => {
    const element = document.getElementById('certificate-template');
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, logging: false, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`${course?.slug}-certificate.pdf`);
    } catch (error) {
      console.error('Error generating certificate PDF:', error);
    }
  };

  const initPlayer = (videoId: string) => {
    if (window.ytPlayer) window.ytPlayer.destroy();
    window.ytPlayer = new window.YT.Player('yt-player', {
      videoId,
      playerVars: { rel: 0, modestbranding: 1 },
      events: { onReady: handleVideoReady, onStateChange: handleVideoStateChange },
    });
  };

  // ================= RENDER =================
  
  // ✅ Loading state check (now works because loading is declared above)
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="relative">
          <div className="w-14 h-14 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-orange-400 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) return null;

  const finalQuizzes = course.quizzes || [];
  const allLessonQuizzes = allLessons.flatMap(l => l.quizzes || []);
  const totalQuizzes = allLessonQuizzes.length;
  const completedQuizzes = allLessonQuizzes.filter(q => lessonQuizScores[q.id] !== undefined).length;
  const totalItems = allLessons.length + totalQuizzes;
  const completedCount = completedLessons.size + completedQuizzes;
  const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Premium Top Nav */}
      <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-xl border-b border-gray-800/60 px-4 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <Link href="/profile" className="group flex items-center gap-2.5 text-gray-400 hover:text-white transition-all duration-200">
            <div className="p-1.5 rounded-lg bg-gray-800/60 group-hover:bg-gray-700/60 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium tracking-wide">Back to Profile</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href={`/courses/${course.slug}`} className="text-sm text-orange-400/90 hover:text-orange-300 transition-colors font-medium">
              Course Details
            </Link>
            {progressPercent === 100 && finalQuizzes.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-900/40 to-emerald-800/20 border border-emerald-700/30 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-medium text-emerald-300">Ready for Certificate</span>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: Video + Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Premium Video Player */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-600/30 via-amber-500/20 to-orange-600/30 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500" />
              <div className="relative aspect-video bg-gray-950 rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-gray-800/60">
                {isYouTubeUrl(currentLesson?.video_url ?? null) ? (
                  <div id="yt-player" className="w-full h-full" />
                ) : currentLesson?.video_url ? (
                  <CustomVideoPlayer
                    src={getVideoSrc(currentLesson.video_url)}
                    autoPlay
                    onEnded={() => {
                      if (activeLesson) {
                        setVideoEnded(true);
                        const newWatched = new Set(watchedLessons);
                        newWatched.add(activeLesson);
                        setWatchedLessons(newWatched);
                        saveProgress(completedLessons, lessonQuizScores, finalQuizScores, newWatched, videoProgress);
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-800/60 flex items-center justify-center">
                        <Video className="w-8 h-8 opacity-60" />
                      </div>
                      <p className="text-sm text-gray-400">No video available for this lesson</p>
                    </div>
                  </div>
                )}
                
                {videoEnded && (
                  <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center z-20">
                    <div className="text-center p-8 bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-3xl border border-orange-500/30 shadow-2xl shadow-orange-900/20 animate-in zoom-in-95 duration-300">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center border border-emerald-500/30">
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Lesson Completed!</h3>
                      <p className="text-gray-400 text-sm mb-6 max-w-xs mx-auto">
                        You've watched the entire video. Mark this lesson as complete to continue your journey.
                      </p>
                      <button 
                        onClick={() => activeLesson && toggleLessonComplete(activeLesson)}
                        className="px-8 py-3 bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-xl font-semibold hover:from-orange-500 hover:to-amber-400 transition-all shadow-lg shadow-orange-900/30 hover:shadow-orange-800/40 active:scale-[0.98]"
                      >
                        Mark as Complete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Premium Course Info */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/60 rounded-2xl p-6 border border-gray-700/50 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-3">
                  <h1 className="text-2xl font-bold text-white leading-tight">{currentLesson?.title || course.title}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700/40 rounded-lg">
                      <GraduationCap className="w-4 h-4 text-orange-400" />
                      {course.instructor}
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700/40 rounded-lg">
                      <Clock className="w-4 h-4 text-orange-400" />
                      {currentLesson?.duration_minutes ? `${currentLesson.duration_minutes}m` : `${course.duration_hours}h total`}
                    </span>
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${levelColors[course.level] || 'bg-gray-700/40 text-gray-400'}`}>
                      {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => activeLesson && toggleLessonComplete(activeLesson)}
                  disabled={!activeLesson || (!watchedLessons.has(activeLesson) && !completedLessons.has(activeLesson))}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shrink-0 ${
                    activeLesson && completedLessons.has(activeLesson)
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-900/30'
                      : 'bg-gray-700/60 text-gray-300 hover:bg-gray-600/60 border border-gray-600/40'
                  } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <CheckCircle className="w-4 h-4" />
                  {activeLesson && completedLessons.has(activeLesson) ? 'Completed' : 'Mark Complete'}
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mt-6 space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-sm text-gray-400">Course Progress</span>
                    <p className="text-2xl font-bold text-white mt-0.5">{progressPercent}%</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500">{completedCount} of {totalItems} items</span>
                  </div>
                </div>
                <div className="relative h-3 bg-gray-800/80 rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 rounded-full transition-all duration-700 ease-out shadow-lg shadow-orange-900/20"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              
              {progressPercent < 100 && finalQuizzes.length > 0 && (
                <div className="mt-5 p-4 bg-gradient-to-r from-gray-800/40 to-gray-900/40 rounded-xl border border-gray-700/40">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-orange-900/30 border border-orange-700/40">
                      <Lock className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-300">Final Assessment Locked</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Complete all lessons and quizzes to unlock the final assessment 
                        <span className="text-orange-400 font-medium"> ({100 - progressPercent}% remaining)</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Grid: Quiz + Files */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Lesson Quiz Section */}
              {(() => {
                const lessonQuizzes = currentLesson?.quizzes?.filter(q => q.lesson_id === currentLesson.id) || [];
                if (lessonQuizzes.length === 0) return null;
                return (
                  <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/60 rounded-2xl p-6 border border-gray-700/50 shadow-xl">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="p-2 rounded-xl bg-purple-900/30 border border-purple-700/40">
                        <ClipboardList className="w-5 h-5 text-purple-400" />
                      </div>
                      <h3 className="text-lg font-bold text-white">Lesson Quiz</h3>
                    </div>
                    
                    {activeLessonQuiz === null ? (
                      <div className="space-y-3">
                        {lessonQuizzes.map((quiz) => (
                          <button
                            key={quiz.id}
                            onClick={() => { setActiveLessonQuiz(lessonQuizzes.indexOf(quiz)); setLessonQuizAnswers({}); setQuizSubmitted(false); }}
                            className="w-full group flex items-center gap-4 p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 border border-gray-700/40 hover:border-gray-600/60 transition-all duration-200 text-left"
                          >
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-600/20 to-purple-700/10 rounded-xl flex items-center justify-center border border-purple-700/40">
                              <ClipboardList className="w-4.5 h-4.5 text-purple-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-200 truncate">{quiz.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{quiz.questions?.length || 0} questions</p>
                            </div>
                            {lessonQuizScores[quiz.id] !== undefined && (
                              <div className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
                                lessonQuizScores[quiz.id] >= 70 ? 'bg-emerald-900/30 text-emerald-300 border-emerald-700/40' : 'bg-rose-900/30 text-rose-300 border-rose-700/40'
                              }`}>{lessonQuizScores[quiz.id]}%</div>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <button onClick={() => { setActiveLessonQuiz(null); setLessonQuizAnswers({}); setQuizSubmitted(false); }} className="text-sm text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors group">
                          <div className="p-1 rounded-lg bg-gray-700/40"><ArrowLeft className="w-3.5 h-3.5" /></div>
                          Back to Quizzes
                        </button>
                        <h4 className="text-base font-bold text-white">{lessonQuizzes[activeLessonQuiz].title}</h4>
                        
                        {lessonQuizzes[activeLessonQuiz].questions?.map((question, qIdx) => {
                          const options = Array.isArray(question.options) ? question.options : JSON.parse(question.options || '[]');
                          return (
                            <div key={qIdx} className="p-4 bg-gray-700/25 rounded-xl border border-gray-700/40 space-y-3">
                              <p className="text-sm font-medium text-gray-200"><span className="text-orange-400 font-bold mr-2">Q{qIdx + 1}.</span>{question.question}</p>
                              <div className="space-y-2">
                                {options.map((option: string, oIdx: number) => {
                                  const isSelected = lessonQuizAnswers[qIdx] === oIdx;
                                  const isCorrect = oIdx === question.correct_answer;
                                  const quiz = lessonQuizzes[activeLessonQuiz];
                                  const showResult = quizSubmitted && hasScored100Before[quiz?.id];
                                  let optionClass = 'border-gray-600/60 hover:border-gray-500/80 bg-gray-700/40';
                                  if (showResult) {
                                    if (isCorrect) optionClass = 'border-emerald-500/60 bg-emerald-900/20';
                                    else if (isSelected && !isCorrect) optionClass = 'border-rose-500/60 bg-rose-900/20';
                                  } else if (isSelected) optionClass = 'border-orange-500/60 bg-orange-900/20';
                                  return (
                                    <button key={oIdx} onClick={() => handleQuizAnswer(qIdx, oIdx, 'lesson')} disabled={quizSubmitted} className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all ${optionClass}`}>
                                      <div className="flex items-center gap-3">
                                        <span className={`w-6 h-6 rounded-lg border flex items-center justify-center text-[10px] font-bold ${showResult && isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : showResult && isSelected && !isCorrect ? 'border-rose-500 bg-rose-500 text-white' : isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-gray-500/60 text-gray-400'}`}>{String.fromCharCode(65 + oIdx)}</span>
                                        <span className={showResult && isCorrect ? 'text-emerald-300' : showResult && isSelected && !isCorrect ? 'text-rose-300' : 'text-gray-300'}>{option}</span>
                                        {showResult && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto" />}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}

                        {quizSubmitted ? (
                          <div className="p-5 bg-gradient-to-br from-gray-700/40 to-gray-800/30 rounded-xl border border-gray-600/40 text-center space-y-3">
                            {(() => {
                              let correct = 0;
                              lessonQuizzes[activeLessonQuiz].questions?.forEach((q, i) => { if (lessonQuizAnswers[i] === q.correct_answer) correct++; });
                              const score = Math.round((correct / (lessonQuizzes[activeLessonQuiz].questions?.length || 1)) * 100);
                              const quiz = lessonQuizzes[activeLessonQuiz];
                              const showCorrectAnswers = hasScored100Before[quiz?.id];
                              return (<>
                                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-orange-600/20 to-amber-500/10 flex items-center justify-center border border-orange-700/40"><Award className="w-7 h-7 text-orange-400" /></div>
                                <p className="text-2xl font-bold text-white">{score}%</p>
                                <p className="text-xs text-gray-400">{correct} out of {lessonQuizzes[activeLessonQuiz].questions?.length || 0} correct</p>
                                {!showCorrectAnswers && score < 100 && <p className="text-xs text-amber-400/90 bg-amber-900/20 px-3 py-1.5 rounded-lg inline-block">Score 100% to unlock answer review</p>}
                                <p className={`text-sm font-semibold ${score >= 70 ? 'text-emerald-400' : 'text-orange-400'}`}>{score >= 70 ? 'Excellent work!' : 'Keep pushing forward!'}</p>
                                <button onClick={resetQuiz} className="flex items-center gap-2 mx-auto px-4 py-2 bg-gray-600/60 text-white rounded-xl text-sm font-medium hover:bg-gray-500/60 transition-colors border border-gray-500/40"><RotateCcw className="w-3.5 h-3.5" />{showCorrectAnswers ? 'Retake Quiz' : 'Try Again'}</button>
                              </>);
                            })()}
                          </div>
                        ) : (
                          <button onClick={() => submitLessonQuiz(activeLessonQuiz)} disabled={Object.keys(lessonQuizAnswers).length < (lessonQuizzes[activeLessonQuiz].questions?.length || 0)} className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-xl font-semibold hover:from-orange-500 hover:to-amber-400 transition-all shadow-lg shadow-orange-900/20 disabled:opacity-40">
                            Submit Quiz ({Object.keys(lessonQuizAnswers).length}/{lessonQuizzes[activeLessonQuiz].questions?.length || 0} answered)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Lesson Files */}
              {currentLesson?.resources && currentLesson.resources.length > 0 && (
                <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/60 rounded-2xl p-6 border border-gray-700/50 shadow-xl">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-xl bg-orange-900/30 border border-orange-700/40"><FileText className="w-5 h-5 text-orange-400" /></div>
                    <h3 className="text-lg font-bold text-white">Lesson Files</h3>
                  </div>
                  <div className="space-y-3">
                    {currentLesson.resources.map((doc) => (
                      <div key={doc.id} className="group flex items-center gap-4 p-4 bg-gray-700/25 rounded-xl hover:bg-gray-700/40 border border-gray-700/40 transition-all cursor-pointer">
                        <div className="w-11 h-11 bg-gradient-to-br from-orange-600/20 to-amber-500/10 rounded-xl flex items-center justify-center border border-orange-700/40"><FileText className="w-4.5 h-4.5 text-orange-400" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-200 truncate">{doc.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 uppercase">{doc.file_type} · {Math.round(doc.file_size / 1024)}KB</p>
                        </div>
                        <Download className="w-4 h-4 text-gray-400 group-hover:text-orange-400 transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ✅ FINAL ASSESSMENT - Main Section Only (No Duplicate!) */}
            {progressPercent === 100 && finalQuizzes.length > 0 && (
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/60 rounded-2xl p-7 border-2 border-orange-600/30 shadow-2xl shadow-orange-900/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-2xl bg-gradient-to-br from-orange-600/20 to-amber-500/10 border border-orange-700/40"><Award className="w-6 h-6 text-orange-400" /></div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Final Assessment</h3>
                    <p className="text-sm text-gray-400 mt-0.5">Test your mastery of the course content</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-6 p-4 bg-gray-700/20 rounded-xl border border-gray-600/30">
                  🎉 Congratulations! You've completed all lessons and quizzes. Take the final assessment to demonstrate your expertise and earn your certificate.
                </p>

                {activeFinalQuiz === null ? (
                  <div className="space-y-4">
                    {finalQuizzes.map((quiz, index) => (
                      <button key={quiz.id} onClick={() => { setActiveFinalQuiz(index); setFinalQuizAnswers({}); setQuizSubmitted(false); }} className="w-full group flex items-center gap-4 p-5 bg-gray-700/25 rounded-xl hover:bg-gray-700/40 border border-gray-700/40 hover:border-orange-600/40 transition-all text-left">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-600/20 to-amber-500/10 rounded-xl flex items-center justify-center border border-orange-700/40"><Award className="w-5.5 h-5.5 text-orange-400" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-200 truncate">{quiz.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{quiz.questions?.length || 0} questions</p>
                        </div>
                        {finalQuizScores[quiz.id] !== undefined && (<div className={`text-xs font-bold px-3.5 py-2 rounded-xl border ${Number(finalQuizScores[quiz.id]) >= 70 ? 'bg-emerald-900/30 text-emerald-300 border-emerald-700/40' : 'bg-rose-900/30 text-rose-300 border-rose-700/40'}`}>{finalQuizScores[quiz.id]}%</div>)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-5">
                    <button onClick={() => { setActiveFinalQuiz(null); setFinalQuizAnswers({}); setQuizSubmitted(false); }} className="text-sm text-gray-400 hover:text-white flex items-center gap-2 transition-colors group"><div className="p-1.5 rounded-lg bg-gray-700/40"><ArrowLeft className="w-4 h-4" /></div>Back to Assessments</button>
                    <h4 className="text-lg font-bold text-white">{finalQuizzes[activeFinalQuiz].title}</h4>
                    {finalQuizzes[activeFinalQuiz].questions?.map((question, qIdx) => {
                      const opts = Array.isArray(question.options) ? question.options : JSON.parse(question.options || '[]');
                      const quiz = finalQuizzes[activeFinalQuiz];
                      const showResult = quizSubmitted && hasScored100Before[quiz?.id];
                      return (
                        <div key={qIdx} className="p-5 bg-gray-700/25 rounded-xl border border-gray-700/40 space-y-4">
                          <p className="text-sm font-medium text-gray-200"><span className="text-orange-400 font-bold mr-2.5">Q{qIdx + 1}.</span>{question.question}</p>
                          <div className="space-y-2.5">
                            {opts.map((option: string, oIdx: number) => {
                              const isSelected = finalQuizAnswers[qIdx] === oIdx;
                              const isCorrect = oIdx === question.correct_answer;
                              let optionClass = 'border-gray-600/60 hover:border-gray-500/80 bg-gray-700/40';
                              if (showResult) { if (isCorrect) optionClass = 'border-emerald-500/60 bg-emerald-900/20'; else if (isSelected && !isCorrect) optionClass = 'border-rose-500/60 bg-rose-900/20'; } 
                              else if (isSelected) optionClass = 'border-orange-500/60 bg-orange-900/20';
                              return (
                                <button key={oIdx} onClick={() => handleQuizAnswer(qIdx, oIdx, 'final')} disabled={quizSubmitted} className={`w-full text-left p-4 rounded-xl border text-sm transition-all ${optionClass}`}>
                                  <div className="flex items-center gap-3.5">
                                    <span className={`w-7 h-7 rounded-xl border flex items-center justify-center text-[11px] font-bold ${showResult && isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : showResult && isSelected && !isCorrect ? 'border-rose-500 bg-rose-500 text-white' : isSelected ? 'border-orange-500 bg-orange-500 text-white' : 'border-gray-500/60 text-gray-400'}`}>{String.fromCharCode(65 + oIdx)}</span>
                                    <span className={showResult && isCorrect ? 'text-emerald-300' : showResult && isSelected && !isCorrect ? 'text-rose-300' : 'text-gray-300'}>{option}</span>
                                    {showResult && isCorrect && <CheckCircle className="w-4.5 h-4.5 text-emerald-400 ml-auto" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {quizSubmitted ? (
                      <div className="p-7 bg-gradient-to-br from-gray-700/40 to-gray-800/30 rounded-xl border border-gray-600/40 text-center space-y-4">
                        {(() => {
                          let correct = 0;
                          finalQuizzes[activeFinalQuiz].questions?.forEach((q, i) => { if (finalQuizAnswers[i] === q.correct_answer) correct++; });
                          const score = Math.round((correct / (finalQuizzes[activeFinalQuiz].questions?.length || 1)) * 100);
                          const quiz = finalQuizzes[activeFinalQuiz];
                          const showCorrectAnswers = hasScored100Before[quiz?.id];
                          return (<>
                            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-orange-600/20 to-amber-500/10 flex items-center justify-center border border-orange-700/40"><Award className="w-10 h-10 text-orange-400" /></div>
                            <p className="text-3xl font-bold text-white">{score}%</p>
                            <p className="text-sm text-gray-400">{correct} out of {finalQuizzes[activeFinalQuiz].questions?.length || 0} correct</p>
                            {!showCorrectAnswers && score < 100 && <p className="text-xs text-amber-400/90 bg-amber-900/20 px-4 py-2 rounded-xl inline-block">Achieve 100% to unlock detailed answer review</p>}
                            <p className={`text-base font-semibold ${score >= 70 ? 'text-emerald-400' : 'text-orange-400'}`}>{score >= 70 ? '🎉 Outstanding! You passed!' : '💪 Keep studying and try again!'}</p>
                            {score === 100 && !finalQuizzes.every(q => Number(finalQuizScores[q.id]) === 100) && <p className="text-xs text-blue-400/90 bg-blue-900/20 px-4 py-2 rounded-xl inline-block mt-2">Complete all final assessments with 100% to unlock your certificate</p>}
                            <button onClick={resetQuiz} className="flex items-center gap-2.5 mx-auto px-5 py-2.5 bg-gray-600/60 text-white rounded-xl text-sm font-medium hover:bg-gray-500/60 transition-colors border border-gray-500/40"><RotateCcw className="w-4 h-4" />{showCorrectAnswers ? 'Retake Assessment' : 'Try Again'}</button>
                          </>);
                        })()}
                      </div>
                    ) : (
                      <button onClick={() => submitQuiz(activeFinalQuiz, true)} disabled={Object.keys(finalQuizAnswers).length < (finalQuizzes[activeFinalQuiz].questions?.length || 0)} className="w-full py-4 bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-xl font-semibold hover:from-orange-500 hover:to-amber-400 transition-all shadow-lg shadow-orange-900/20 disabled:opacity-40">
                        Submit Final Assessment ({Object.keys(finalQuizAnswers).length}/{finalQuizzes[activeFinalQuiz].questions?.length || 0} answered)
                      </button>
                    )}
                  </div>
                )}
                
                {/* Certificate Download - Only Here, Not Duplicated */}
                {(() => {
                  const allCompleted100 = finalQuizzes.length > 0 && finalQuizzes.every(q => Number(finalQuizScores[q.id]) === 100);
                  return allCompleted100 ? (
                    <div className="mt-8 pt-6 border-t border-gray-700/50">
                      <button onClick={downloadCertificate} className="w-full group flex items-center justify-center gap-3 p-4 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 text-white rounded-xl font-bold hover:from-orange-500 hover:via-amber-400 hover:to-orange-500 transition-all shadow-2xl shadow-orange-900/30">
                        <Award className="w-5 h-5" />
                        Download Your Certificate
                        <Download className="w-4 h-4 ml-1 opacity-80" />
                      </button>
                      <p className="text-xs text-center text-gray-500 mt-3">Your certificate will be generated as a high-quality PDF</p>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>

          {/* RIGHT: Playlist */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/60 rounded-2xl overflow-hidden border border-gray-700/50 shadow-xl sticky top-28">
              <div className="p-5 border-b border-gray-700/50 bg-gray-800/40">
                <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-orange-900/30 border border-orange-700/40"><BookOpen className="w-4.5 h-4.5 text-orange-400" /></div>
                  Course Playlist
                </h3>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <span className="px-2 py-0.5 bg-gray-700/40 rounded">{allLessons.length} lessons</span>
                  <span className="px-2 py-0.5 bg-gray-700/40 rounded">{totalQuizzes} quizzes</span>
                </div>
              </div>
              <div className="max-h-[calc(100vh-14rem)] overflow-y-auto custom-scrollbar">
                {course.sections?.map((section) => {
                  const isExpanded = expandedSections.has(section.id);
                  const sectionLessons = section.lessons || [];
                  return (
                    <div key={section.id} className="border-b border-gray-700/40 last:border-b-0">
                      <button onClick={() => toggleSection(section.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-700/20 transition-colors text-left group">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-1 rounded-lg transition-colors ${isExpanded ? 'bg-gray-600/40' : 'bg-gray-700/30 group-hover:bg-gray-600/40'}`}>{isExpanded ? <ChevronUp className="w-4 h-4 text-gray-300" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}</div>
                          <h4 className="text-sm font-semibold text-gray-200 truncate group-hover:text-white transition-colors">{section.title}</h4>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-700/40 px-2 py-0.5 rounded-lg">{sectionLessons.length}</span>
                      </button>
                      {isExpanded && (
                        <div className="bg-gray-800/30">
                          {sectionLessons.map((lesson, idx) => {
                            const isActive = activeLesson === lesson.id;
                            const isCompleted = completedLessons.has(lesson.id);
                            return (
                              <button key={lesson.id} onClick={() => { if (!canAccessLesson(lesson.id, allLessons)) return; setActiveLesson(lesson.id); setActiveLessonQuiz(null); setActiveFinalQuiz(null); setLessonQuizAnswers({}); setFinalQuizAnswers({}); setQuizSubmitted(false); }} disabled={!canAccessLesson(lesson.id, allLessons)} className={`w-full flex items-center gap-3.5 p-4 text-left transition-all duration-200 border-t border-gray-700/30 ${isActive ? 'bg-gradient-to-r from-orange-600/15 to-amber-500/10 border-l-2 border-l-orange-500' : !canAccessLesson(lesson.id, allLessons) ? 'opacity-40 cursor-not-allowed bg-gray-800/20' : 'hover:bg-gray-700/20'}`}>
                                <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${!canAccessLesson(lesson.id, allLessons) ? 'bg-gray-700/40 text-gray-500 border border-gray-600/40' : isCompleted ? 'bg-gradient-to-br from-emerald-600 to-emerald-500 text-white' : isActive ? 'bg-gradient-to-br from-orange-600 to-amber-500 text-white' : 'bg-gray-700/40 text-gray-400 border border-gray-600/40'}`}>
                                  {!canAccessLesson(lesson.id, allLessons) ? <Lock className="w-3.5 h-3.5" /> : isCompleted ? <CheckCircle className="w-4 h-4" /> : <span>{idx + 1}</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium truncate transition-colors ${isActive ? 'text-orange-300' : 'text-gray-300 group-hover:text-white'}`}>{lesson.title}</p>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    {lesson.type === 'video' && <span className="flex items-center gap-1 text-[10px] text-gray-500"><Video className="w-3 h-3" />{lesson.duration_minutes ? `${lesson.duration_minutes}m` : 'Video'}</span>}
                                    {lesson.quizzes && lesson.quizzes.filter(q => q.lesson_id === lesson.id).length > 0 && (() => {
                                      const lq = lesson.quizzes.filter(q => q.lesson_id === lesson.id);
                                      const all100 = lq.every(q => lessonQuizScores[q.id] === 100);
                                      const anyAttempted = lq.some(q => lessonQuizScores[q.id] !== undefined);
                                      return (<span className={`text-[10px] px-2 py-0.5 rounded-lg border ${all100 ? 'bg-emerald-900/30 text-emerald-300 border-emerald-700/40' : anyAttempted ? 'bg-amber-900/30 text-amber-300 border-amber-700/40' : 'bg-purple-900/30 text-purple-300 border-purple-700/40'}`}>{lq.length} quiz{lq.length > 1 ? 'zes' : ''}{all100 && ' ✓'}</span>);
                                    })()}
                                    {lesson.resources && lesson.resources.length > 0 && <span className="text-[10px] bg-orange-900/30 text-orange-300 px-2 py-0.5 rounded-lg border border-orange-700/40">{lesson.resources.length} files</span>}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden Certificate Template */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div id="certificate-template" style={{ width: '800px', height: '600px', backgroundColor: '#ffffff', padding: '48px', border: '20px double #ea580c', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#111827', fontFamily: 'serif' }}>
          <Award style={{ width: '96px', height: '96px', color: '#ea580c', marginBottom: '24px' }} />
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '16px' }}>Certificate of Completion</h1>
          <p style={{ fontSize: '20px', marginBottom: '32px' }}>This is to certify that</p>
          <p style={{ fontSize: '36px', fontWeight: 'bold', borderBottom: '2px solid #9ca3af', paddingLeft: '32px', paddingRight: '32px', paddingBottom: '8px', marginBottom: '32px' }}>{user?.displayName || 'Our Student'}</p>
          <p style={{ fontSize: '20px', marginBottom: '32px' }}>has successfully completed the course</p>
          <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#ea580c', marginBottom: '48px' }}>{course?.title}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', paddingLeft: '48px', paddingRight: '48px', marginTop: 'auto' }}>
            <div style={{ textAlign: 'center' }}><div style={{ borderTop: '1px solid #9ca3af', paddingTop: '8px', width: '192px' }}><p style={{ fontWeight: 'bold' }}>Instructor</p><p style={{ fontSize: '14px' }}>{course?.instructor}</p></div></div>
            <div style={{ textAlign: 'center' }}><div style={{ borderTop: '1px solid #9ca3af', paddingTop: '8px', width: '192px' }}><p style={{ fontWeight: 'bold' }}>Date</p><p style={{ fontSize: '14px' }}>{new Date().toLocaleDateString()}</p></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}