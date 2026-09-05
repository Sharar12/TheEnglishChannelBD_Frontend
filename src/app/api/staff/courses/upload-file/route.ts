import { NextRequest, NextResponse } from 'next/server';

const LARAVEL_API = 'http://127.0.0.1:8000/api';

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie') || '';

  // Reconstruct FormData for forwarding
  const formDataToSend = new FormData();
  for (const [key, value] of formData.entries()) {
    formDataToSend.append(key, value);
  }

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };
  if (authHeader) headers['Authorization'] = authHeader;
  if (cookieHeader) headers['Cookie'] = cookieHeader;

  try {
    const res = await fetch(`${LARAVEL_API}/staff/courses/upload-file`, {
      method: 'POST',
      headers,
      body: formDataToSend,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Laravel API error (upload-file):', res.status, errorText);
      return NextResponse.json({ error: 'Failed to upload file', details: errorText }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}