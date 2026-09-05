'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, BookOpen, GraduationCap, ArrowLeft, CheckCircle, Play, X, ChevronDown, ChevronUp, Lock, Video, FileText, HelpCircle, AlertCircle, Star, MessageSquare, Send } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { CourseCartItem } from '@/types';
import CustomVideoPlayer from '@/components/CustomVideoPlayer';
import { videoStreamUrl } from '@/lib/config';

interface Course {
  id: number;
  title: string;
  slug: string;
  instructor: string;
  description: string;
  syllabus: string | null;
  price: string;
  duration_hours: number;
  lessons_count: number;
  level: string;
  image: string | null;
  preview_video: string | null;
  is_featured: boolean;
  is_active: boolean;
  category: string;
  created_at: string;
  updated_at: string;
}

interface CourseLesson {
  id: number;
  section_id: number;
  title: string;
  type: string;
  content: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  is_free_preview: boolean;
  order: number;
  resources?: any[];
  quizzes?: any[];
}

interface CourseSection {
  id: number;
  course_id: number;
  title: string;
  description: string | null;
  order: number;
  lessons?: CourseLesson[];
}

interface CourseQuiz {
  id: number;
  course_id: number;
  section_id: number;
  title: string;
  description: string | null;
  passing_score: number;
  order: number;
}

interface CourseDetailResponse extends Course {
  sections?: CourseSection[];
  quizzes?: CourseQuiz[];
}

interface ApiCourseReview {
  id: number;
  course_id: number;
  user_id: number | null;
  user_name: string;
  user_email: string | null;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
}

interface ApiCourseQuestion {
  id: number;
  course_id: number;
  user_id: number | null;
  user_name: string;
  user_email: string | null;
  question: string;
  answer: string | null;
  is_answered: boolean;
  is_approved: boolean;
  created_at: string;
}

const levelColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-yellow-100 text-yellow-700',
  advanced: 'bg-red-100 text-red-700',
};

const categoryLabels: Record<string, string> = {
  writing: 'Writing',
  literature: 'Literature',
  language: 'Language',
  general: 'General',
};

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCartCourse, cart } = useCart();
  const { user } = useAuth();
  const isStaff = user?.role === 'staff';
  const [course, setCourse] = useState<CourseDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [syllabus, setSyllabus] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'qanda'>('overview');
  const [reviews, setReviews] = useState<ApiCourseReview[]>([]);
  const [questions, setQuestions] = useState<ApiCourseQuestion[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [guestReviewName, setGuestReviewName] = useState('');
  const [guestReviewEmail, setGuestReviewEmail] = useState('');
  const [newQuestion, setNewQuestion] = useState('');
  const [guestQuestionName, setGuestQuestionName] = useState('');
  const [guestQuestionEmail, setGuestQuestionEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasEnrolled, setHasEnrolled] = useState(false);
  const [userReview, setUserReview] = useState<ApiCourseReview | null>(null);
  const [editingReview, setEditingReview] = useState(false);

  useEffect(() => {
    console.log('useEffect triggered, params.slug:', params.slug);
    if (params.slug) {
      fetchCourse();
    }
  }, [params.slug]);

  useEffect(() => {
    console.log('useEffect for expandedSections, course:', course?.id, 'sections:', course?.sections?.length);
    if (course && course.sections && course.sections.length > 0) {
      setExpandedSections(new Set([course.sections[0].id]));
    }
  }, [course]);

  const fetchCourse = async () => {
    setLoading(true);
    console.log('Fetching course:', params.slug);
    try {
      const res = await fetch(`/api/courses/${params.slug}`);
      console.log('API response status:', res.status, 'ok:', res.ok);
      if (res.ok) {
        const data: CourseDetailResponse = await res.json();
        console.log('Course data received, sections:', data.sections?.length, 'lessons:', data.sections?.[0]?.lessons?.length);
        setCourse(data);
        if (data.syllabus) {
          try {
            setSyllabus(JSON.parse(data.syllabus));
          } catch {
            setSyllabus([]);
          }
        }
        if (data.sections && data.sections.length > 0) {
          for (const section of data.sections) {
            if (section.lessons) {
              for (const lesson of section.lessons) {
                if (lesson.is_free_preview && lesson.video_url) {
                  setPreviewVideoUrl(lesson.video_url);
                  break;
                }
              }
            }
            if (previewVideoUrl) break;
          }
        }
      } else {
        console.error(`API Error: ${res.status} for slug ${params.slug}`);
        setErrorMessage(`Course not found (Error ${res.status}). Please check the slug.`);
      }
    } catch (error) {
      console.error('Failed to fetch course:', error);
      setErrorMessage('A network error occurred while fetching the course.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!course?.id) return;

      Promise.all([
        fetch(`/api/courses/${course.slug}/reviews`).then(res => res.ok ? res.json() : Promise.reject(`Reviews API error: ${res.status}`)),
        fetch(`/api/courses/${course.slug}/questions`).then(res => res.ok ? res.json() : Promise.reject(`Questions API error: ${res.status}`)),
      ])
      .then(([reviewsRes, questionsRes]) => {
        setReviews(reviewsRes.reviews || []);
        setAverageRating(reviewsRes.average_rating || 0);
        setQuestions(questionsRes.questions || []);
      })
      .catch(err => {
        console.error('Error fetching reviews/questions:', err);
      });
  }, [course?.id, course?.slug]);

  useEffect(() => {
    if (!user || !course?.id) {
      setHasEnrolled(false);
      return;
    }

    console.log('[CourseDetail] ========== ENROLLMENT CHECK ==========');
    console.log('[CourseDetail] Current User:', user.uid, user.email);
    console.log('[CourseDetail] Course ID:', course.id, 'Slug:', course.slug);

    // Check enrollment from both localStorage AND API
    const checkEnrollment = async () => {
      let enrolled = false;

      // 1. Check localStorage orders
      const localOrders = JSON.parse(localStorage.getItem('lumina_orders') || '[]');
      console.log('[CourseDetail] LocalStorage orders:', localOrders.length);

      for (const order of localOrders) {
        if (!order || !order.items) continue;
        if (order.userId && order.userId !== user.uid) continue;
        if (!['delivered', 'completed'].includes(order.status)) continue;

        for (const item of (order.items || [])) {
          if (item?.type === 'course' && String(item.courseId || item.bookId) === String(course.id)) {
            console.log('[CourseDetail] ✓ Found in localStorage');
            enrolled = true;
            break;
          }
        }
        if (enrolled) break;
      }

      // 2. If not found in localStorage, check API orders
      if (!enrolled) {
        try {
          const token = localStorage.getItem('auth_token');
          const response = await fetch('/api/orders', {
            headers: { 'Authorization': `Bearer ${token}` },
          });

          if (response.ok) {
            const apiOrders = await response.json();
            console.log('[CourseDetail] API orders:', apiOrders.length);

            for (const order of apiOrders) {
              if (!['delivered', 'completed'].includes(order.status)) continue;

              for (const item of (order.items || [])) {
                const courseId = item.course_id || item.courseId;
                if (courseId && String(courseId) === String(course.id)) {
                  console.log('[CourseDetail] ✓ Found in API orders');
                  enrolled = true;
                  break;
                }
              }
              if (enrolled) break;
            }
          }
        } catch (error) {
          console.error('[CourseDetail] Error fetching API orders:', error);
        }
      }

      console.log('[CourseDetail] Final enrollment result:', enrolled ? '✓ ENROLLED' : '✗ NOT ENROLLED');
      console.log('[CourseDetail] =======================================\n');
      setHasEnrolled(enrolled);
    };

    checkEnrollment();

    const storedReviews = localStorage.getItem(`course_reviews_${user.email}_${course.id}`);
    if (storedReviews) {
      try {
        const parsed = JSON.parse(storedReviews);
        setUserReview(parsed);
      } catch (e) {
        console.error('Error parsing stored review:', e);
      }
    }
  }, [user, course?.id]);

  const handleReviewSubmit = async () => {
    if (!course) return;
    if (!user) {
      alert('Please sign in to write a review');
      return;
    }
    if (!hasEnrolled) {
      alert('Please enroll in this course to write a review');
      return;
    }
    if (!newReview.comment) {
      alert('Please enter a review comment');
      return;
    }
    if (userReview && !editingReview) {
      alert('You have already submitted a review for this course');
      return;
    }

    setSubmitting(true);
    try {
      let res;
      
      if (editingReview && userReview) {
        // Update existing review
        const payload = {
          rating: newReview.rating,
          comment: newReview.comment,
        };
        
        res = await fetch(`/api/reviews/${userReview.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        // Create new review
        const payload = {
          user_name: user.displayName,
          user_email: user.email,
          rating: newReview.rating,
          comment: newReview.comment,
        };
        
        res = await fetch(`/api/courses/${course.slug}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Review submit error:', res.status, errorText);
        throw new Error(`Failed to submit review: ${res.status}`);
      }

      const result = await res.json();
      const newReviewData = result.review;

      if (user) {
        localStorage.setItem(`course_reviews_${user.email}_${course.id}`, JSON.stringify(newReviewData));
      }

      setReviews(prev => prev.map(r => r.id === newReviewData.id ? newReviewData : newReviewData).concat(prev.filter(r => r.id !== newReviewData.id)));
      setNewReview({ rating: 5, comment: '' });
      setUserReview(newReviewData);
      setEditingReview(false);
      alert(editingReview ? 'Review updated successfully!' : 'Review submitted successfully!');
    } catch (error: any) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuestionSubmit = async () => {
    if (!course) return;
    if (!user) {
      alert('Please sign in to ask a question');
      return;
    }
    if (!hasEnrolled) {
      alert('Please enroll in this course to ask a question');
      return;
    }
    if (!newQuestion) {
      alert('Please enter a question');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        user_name: user.displayName,
        user_email: user.email,
        question: newQuestion,
      };

      const res = await fetch(`/api/courses/${course.slug}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('Question submit error:', res.status, errorText);
        throw new Error(`Failed to submit question: ${res.status}`);
      }

      const result = await res.json();
      
      setQuestions(prev => [result.question, ...prev]);
      setNewQuestion('');
      setGuestQuestionName('');
      setGuestQuestionEmail('');
      alert('Question submitted successfully!');
    } catch (error: any) {
      console.error('Error submitting question:', error);
      alert('Failed to submit question: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${star <= rating ? 'fill-orange-500 text-orange-500' : 'text-gray-300'} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={() => interactive && onRate?.(star)}
          />
        ))}
      </div>
    );
  };

  const handleEnroll = () => {
    if (!course) return;
    const courseItem: CourseCartItem = {
      id: course.id,
      title: course.title,
      slug: course.slug,
      instructor: course.instructor,
      description: course.description,
      price: parseFloat(course.price),
      duration_hours: course.duration_hours,
      lessons_count: course.lessons_count,
      level: course.level,
      category: course.category,
      preview_video: course.preview_video,
      is_featured: course.is_featured,
      image: course.image,
    };
    addToCartCourse(courseItem);
  };

  const toggleSection = (sectionId: number) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  };

  const isYouTubeUrl = (url: string | null) => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
  };

  const getPreviewVideoSrc = (url: string | null) => {
    if (!url) return '';
    if (url.startsWith('http')) {
      // Handle storage URLs - convert to streaming endpoint
      const match = url.match(/\/storage\/(.+)/);
      if (match) {
        return videoStreamUrl(url);
      }
      return url;
    }
    return videoStreamUrl(url);
  };

  const isInCart = cart.some(item => item.courseId === String(course?.id));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-8" />
          <div className="h-80 bg-gray-200 rounded-2xl mb-8" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) return null;

  console.log('Rendering course:', course.title, 'sections:', course.sections?.length);

  const totalLessons = course.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 0;
  const totalFiles = course.sections?.reduce((acc, s) => {
    return acc + (s.lessons?.reduce((a, l) => a + (l.resources?.length || 0), 0) || 0);
  }, 0) || 0;
  const totalDuration = course.sections?.reduce((acc, s) => {
    return acc + (s.lessons?.reduce((a, l) => a + (l.duration_minutes || 0), 0) || 0);
  }, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Preview Modal */}
      {showPreview && previewVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowPreview(false)}>
          <div className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="aspect-video">
              {isYouTubeUrl(previewVideoUrl) ? (
                <iframe
                  src={`${previewVideoUrl}?autoplay=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <CustomVideoPlayer
                  src={getPreviewVideoSrc(previewVideoUrl)}
                  autoPlay
                />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link href="/courses" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </Link>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-500 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/20 text-white">
              {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
            </span>
            <span className="text-xs text-orange-100">
              {categoryLabels[course.category] || course.category}
            </span>
          </div>
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="w-full md:w-1/2 aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 bg-black relative group">
                {course.preview_video ? (
                  course.preview_video.includes('youtube.com') || course.preview_video.includes('vimeo.com') ? (
                    <iframe
                      src={`${course.preview_video}?autoplay=0`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                   <CustomVideoPlayer
                      key={`preview-${course.slug}-${course.preview_video}`}
                      src={getPreviewVideoSrc(course.preview_video)}
                    />
                  )
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white space-y-4">
                    <Play className="w-16 h-16 text-orange-500 animate-pulse" />
                    <p className="font-medium text-gray-300">No Promo Video Available</p>
                  </div>
                )}
             </div>
             <div className="w-full md:w-1/2 space-y-4">
               <h1 className="text-3xl md:text-4xl font-serif font-bold mb-4">{course.title}</h1>
               <p className="text-lg text-orange-100 max-w-3xl">{course.description}</p>
             </div>
           </div>
        </div>
      </div>

       <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
         {errorMessage ? (
           <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
             <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
               <AlertCircle className="w-8 h-8" />
             </div>
             <div>
               <h3 className="text-xl font-bold text-gray-900">Oops! Something went wrong</h3>
               <p className="text-gray-500 max-w-md mx-auto mt-2">{errorMessage}</p>
             </div>
             <button 
               onClick={() => router.push('/courses')}
               className="px-6 py-2 bg-orange-600 text-white rounded-full font-semibold hover:bg-orange-700 transition-colors"
             >
               Back to Courses
             </button>
           </div>
         ) : (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* What You'll Learn */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">What You'll Learn</h2>
              <p className="text-gray-600 leading-relaxed">{course.description}</p>
            </div>

            {/* Syllabus (fallback if no sections) */}
            {syllabus.length > 0 && (!course.sections || course.sections.length === 0) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Course Syllabus</h2>
                <div className="space-y-3">
                  {syllabus.map((item, index) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-orange-50 transition-colors">
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item}</p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    </div>
                  ))}
                </div>
              </div>
            )}

              {/* Course Content / Playlist Preview */}
              {course.sections && course.sections.length > 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">Course Content</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {course.sections.length} sections · {totalLessons} lessons · {totalFiles} files · {totalDuration > 0 ? `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m` : `${course.duration_hours}h total`}
                    </p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {course.sections.map((section) => {
                      const isExpanded = expandedSections.has(section.id);
                      const sectionLessons = section.lessons || [];
                      const sectionDuration = sectionLessons.reduce((acc, l) => acc + (l.duration_minutes || 0), 0);
                      const freePreviewCount = sectionLessons.filter(l => l.is_free_preview).length;
                      const sectionQuizzes = sectionLessons.reduce((acc, l) => acc + (l.quizzes?.length || 0), 0);
                      const sectionFiles = sectionLessons.reduce((acc, l) => acc + (l.resources?.length || 0), 0);

                      return (
                        <div key={section.id}>
                          <button
                            onClick={() => toggleSection(section.id)}
                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                <h3 className="font-semibold text-gray-900 truncate">{section.title}</h3>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 ml-6 flex flex-wrap gap-1">
                                <span>{sectionLessons.length} Lesson{sectionLessons.length !== 1 ? 's' : ''}</span>
                                {sectionFiles > 0 && <span>· {sectionFiles} File{sectionFiles !== 1 ? 's' : ''}</span>}
                                {sectionQuizzes > 0 && <span>· {sectionQuizzes} Quiz{sectionQuizzes !== 1 ? 'zes' : ''}</span>}
                                {sectionDuration > 0 && <span>· {sectionDuration}m</span>}
                                {freePreviewCount > 0 && <span>· {freePreviewCount} Free Preview{freePreviewCount !== 1 ? 's' : ''}</span>}
                              </p>
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="bg-gray-50">
                              {sectionLessons.map((lesson) => {
                                const lessonQuizzes = lesson.quizzes?.length || 0;
                                const lessonResources = lesson.resources?.length || 0;
                                const hasVideo = lesson.type === 'video' || lesson.video_url;

                                return (
                                  <div
                                    key={lesson.id}
                                    className={`px-6 py-3 border-t border-gray-100 ${
                                      lesson.is_free_preview && hasVideo ? 'cursor-pointer hover:bg-orange-50 transition-colors' : ''
                                    }`}
                                    onClick={() => {
                                      if (lesson.is_free_preview && lesson.video_url) {
                                        setPreviewVideoUrl(lesson.video_url);
                                        setShowPreview(true);
                                      }
                                    }}
                                  >
                                    <div className="flex items-center gap-3">
                                      {/* Video Thumbnail or Icon */}
                                      <div className="relative w-20 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                        {hasVideo && lesson.video_url ? (
                                          <>
                                            <img 
                                              src={`https://img.youtube.com/vi/${lesson.video_url.includes('youtu.be/') ? lesson.video_url.split('/').pop()?.split('?')[0] : lesson.video_url.includes('v=') ? lesson.video_url.split('v=')[1]?.split('&')[0] : ''}/mqdefault.jpg`}
                                              alt=""
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                                              }}
                                            />
                                            <div className="fallback-icon hidden w-full h-full flex items-center justify-center bg-gray-700">
                                              <Video className="w-5 h-5 text-gray-400" />
                                            </div>
                                            {/* Overlay Icon */}
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                              {lesson.is_free_preview ? (
                                                <Play className="w-5 h-5 text-white fill-white" />
                                              ) : (
                                                <Lock className="w-4 h-4 text-white" />
                                              )}
                                            </div>
                                          </>
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center bg-gray-700">
                                            {lesson.type === 'document' ? (
                                              <FileText className="w-5 h-5 text-gray-400" />
                                            ) : lesson.type === 'quiz' ? (
                                              <HelpCircle className="w-5 h-5 text-gray-400" />
                                            ) : (
                                              <Video className="w-5 h-5 text-gray-400" />
                                            )}
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Lesson Info */}
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm truncate ${lesson.is_free_preview ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                                          {lesson.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          {lessonQuizzes > 0 && (
                                            <span className="text-[10px] text-purple-600 font-medium bg-purple-50 px-1.5 py-0.5 rounded">
                                              {lessonQuizzes} Quiz{lessonQuizzes !== 1 ? 'zes' : ''}
                                            </span>
                                          )}
                                          {lessonResources > 0 && (
                                            <span className="text-[10px] text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded">
                                              {lessonResources} File{lessonResources !== 1 ? 's' : ''}
                                            </span>
                                          )}
                                          {lesson.duration_minutes && (
                                            <span className="text-[10px] text-gray-400">{lesson.duration_minutes}m</span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Right Side Status */}
                                      <div className="flex-shrink-0">
                                        {lesson.is_free_preview && hasVideo ? (
                                          <Play className="w-4 h-4 text-orange-500" />
                                        ) : (
                                          <Lock className="w-4 h-4 text-gray-300" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                 <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                   <BookOpen className="w-8 h-8 text-gray-400" />
                 </div>
                 <h3 className="text-lg font-bold text-gray-900">No Content Available</h3>
                 <p className="text-gray-500 max-w-xs mx-auto mt-2">
                   The curriculum for this course is currently being updated. Please check back soon!
                 </p>
               </div>
              )}

             {/* Instructor */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Your Instructor</h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-amber-50 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-8 h-8 text-orange-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{course.instructor}</p>
                </div>
              </div>
            </div>

            {/* Reviews and Q&A Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Tab Headers */}
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex-1 py-4 px-6 text-sm font-semibold transition-colors ${
                    activeTab === 'overview'
                      ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`flex-1 py-4 px-6 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'reviews'
                      ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Star className="w-4 h-4" />
                  Reviews ({reviews.length})
                </button>
                <button
                  onClick={() => setActiveTab('qanda')}
                  className={`flex-1 py-4 px-6 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                    activeTab === 'qanda'
                      ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Q&A ({questions.length})
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Course overview content</p>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    {/* Average Rating Summary */}
                    {reviews.length > 0 && (
                      <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl">
                        <div className="text-4xl font-bold text-orange-600">{averageRating.toFixed(1)}</div>
                        <div>
                          {renderStars(Math.round(averageRating))}
                          <p className="text-sm text-gray-600 mt-1">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                    )}

                    {/* Review Form */}
                    {user ? (
                      hasEnrolled ? (
                        !userReview || editingReview ? (
                          <div className="border border-gray-200 rounded-xl p-4">
                            <h3 className="text-lg font-semibold mb-3">Write a Review</h3>
                            <div className="mb-3">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                              {renderStars(newReview.rating, true, (rating) => setNewReview(prev => ({ ...prev, rating })))}
                            </div>
                            <div className="mb-3">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Review</label>
                              <textarea
                                value={newReview.comment}
                                onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                rows={4}
                                placeholder="Share your experience with this course..."
                              />
                            </div>
                            <button
                              onClick={handleReviewSubmit}
                              disabled={submitting}
                              className="w-full py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50"
                            >
                              {submitting ? 'Submitting...' : editingReview ? 'Update Review' : 'Submit Review'}
                            </button>
                            {editingReview && (
                              <button
                                onClick={() => {
                                  setNewReview({ rating: 5, comment: '' });
                                  setEditingReview(false);
                                }}
                                className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                            <p className="text-sm text-green-700">You have already submitted a review for this course.</p>
                            <button
                              onClick={() => {
                                setNewReview({ rating: userReview.rating, comment: userReview.comment });
                                setEditingReview(true);
                              }}
                              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                            >
                              Edit Review
                            </button>
                          </div>
                        )
                      ) : (
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                          <p className="text-sm text-gray-600">Please enroll in this course to write a review.</p>
                        </div>
                      )
                    ) : (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                        <p className="text-sm text-gray-600">Please <Link href="/auth" className="text-orange-600 hover:underline">sign in</Link> to write a review.</p>
                      </div>
                    )}

                    {/* Reviews List */}
                    {reviews.length > 0 ? (
                      <div className="space-y-4">
                        {reviews.map((review) => (
                          <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold text-gray-900">{review.user_name}</p>
                                <p className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</p>
                              </div>
                              {renderStars(review.rating)}
                            </div>
                            <p className="text-gray-700">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Star className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No reviews yet. Be the first to review this course!</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'qanda' && (
                  <div className="space-y-6">
                    {/* Question Form - Only for enrolled users */}
                    {user && hasEnrolled ? (
                      <div className="border border-gray-200 rounded-xl p-4">
                        <h3 className="text-lg font-semibold mb-3">Ask a Question</h3>
                        <textarea
                          value={newQuestion}
                          onChange={(e) => setNewQuestion(e.target.value)}
                          className="w-full p-3 border border-gray-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          rows={3}
                          placeholder="What would you like to know about this course?"
                        />
                        <button
                          onClick={handleQuestionSubmit}
                          disabled={submitting || !newQuestion}
                          className="w-full py-2 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <Send className="w-4 h-4" />
                          {submitting ? 'Submitting...' : 'Submit Question'}
                        </button>
                      </div>
                    ) : user ? (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                        <p className="text-sm text-gray-600">Please enroll in this course to ask a question.</p>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-center">
                        <p className="text-sm text-gray-600">Please <Link href="/auth" className="text-orange-600 hover:underline">sign in</Link> and enroll to ask a question.</p>
                      </div>
                    )}

                    {/* Questions List */}
                    {questions.length > 0 ? (
                      <div className="space-y-4">
                        {questions.map((q) => (
                          <div key={q.id} className="border border-gray-200 rounded-xl p-4">
                            <div className="mb-3">
                              <div className="flex items-start gap-2 mb-2">
                                <div className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold">Q</div>
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{q.question}</p>
                                  <p className="text-xs text-gray-500 mt-1">{q.user_name} · {new Date(q.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                            </div>
                            {q.answer && (
                              <div className="ml-8 pl-4 border-l-2 border-green-500">
                                <div className="flex items-start gap-2 mb-2">
                                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">A</div>
                                  <p className="text-gray-700">{q.answer}</p>
                                </div>
                                {q.is_answered && (
                                  <p className="text-xs text-green-600 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Answered
                                  </p>
                                )}
                              </div>
                            )}
                            {!q.answer && (
                              <div className="ml-8 pl-4 border-l-2 border-gray-300">
                                <p className="text-sm text-gray-500 italic">Awaiting answer...</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500">No questions yet. Be the first to ask!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-orange-600">৳{course.price}</p>
              </div>

              <button
                onClick={() => {
                  console.log('[CourseDetail] Button clicked:', {
                    isStaff,
                    hasEnrolled,
                    isInCart,
                    courseSlug: course?.slug,
                    courseId: course?.id,
                    redirectUrl: `/courses/${course?.slug}/watch`
                  });
                  
                  if (!course?.slug) {
                    console.error('[CourseDetail] Course slug is missing!');
                    return;
                  }
                  
                  if (isStaff) {
                    router.push(`/courses/${course.slug}/watch`);
                  } else if (hasEnrolled) {
                    router.push(`/courses/${course.slug}/watch`);
                  } else {
                    handleEnroll();
                  }
                }}
                disabled={!isStaff && isInCart}
                className={`w-full py-3 font-semibold rounded-xl transition-colors mb-4 flex items-center justify-center gap-2 ${
                  isStaff
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : hasEnrolled
                      ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                      : isInCart
                        ? 'bg-green-100 text-green-700 cursor-default'
                        : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                <Play className="w-5 h-5" />
                {isStaff ? 'Course Preview' : (hasEnrolled ? 'Access Course' : (isInCart ? 'In Cart' : 'Enroll Now'))}
              </button>

              <div className="space-y-4 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Duration</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{course.duration_hours} hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BookOpen className="w-4 h-4" />
                    <span>Lessons</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{course.lessons_count}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <GraduationCap className="w-4 h-4" />
                    <span>Level</span>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${levelColors[course.level] || 'bg-gray-100 text-gray-700'}`}>
                    {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                  </span>
                </div>
              </div>
            </div>
           </div>
         </div>
       )}
       </div>
     </div>
   );
 }
