'use server';

import { LARAVEL_API } from '@/lib/config';

export async function fetchCourseReviews(slug: string) {
  try {
    const res = await fetch(`${LARAVEL_API}/courses/${slug}/reviews`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch reviews');
  }
}

export async function fetchCourseQuestions(slug: string) {
  try {
    const res = await fetch(`${LARAVEL_API}/courses/${slug}/questions`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch questions');
  }
}

export async function submitCourseReview(slug: string, data: { user_name: string; user_email: string | null; rating: number; comment: string }) {
  try {
    const res = await fetch(`${LARAVEL_API}/courses/${slug}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Server error: ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to submit review');
  }
}

export async function submitCourseQuestion(slug: string, data: { user_name: string; user_email: string | null; question: string }) {
  try {
    const res = await fetch(`${LARAVEL_API}/courses/${slug}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Server error: ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    throw new Error(error.message || 'Failed to submit question');
  }
}
