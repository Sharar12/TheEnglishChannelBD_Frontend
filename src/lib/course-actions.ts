import { LARAVEL_API } from '@/lib/config';

export async function submitCourseReview(slug: string, data: { user_name: string; user_email: string | null; rating: number; comment: string }) {
  const res = await fetch(`${LARAVEL_API}/courses/${slug}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Server error: ${res.status}`);
  }

  return res.json();
}

export async function submitCourseQuestion(slug: string, data: { user_name: string; user_email: string | null; question: string }) {
  const res = await fetch(`${LARAVEL_API}/courses/${slug}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Server error: ${res.status}`);
  }

  return res.json();
}
