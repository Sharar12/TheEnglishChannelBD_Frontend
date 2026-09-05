import { NextRequest, NextResponse } from 'next/server';
import { LARAVEL_API } from '@/lib/config';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  try {
    const res = await fetch(`${LARAVEL_API}/courses/${slug}/questions`, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Laravel API error (questions GET):', res.status, errorText);
      return NextResponse.json({ error: 'Failed to fetch questions', details: errorText }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('Questions GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await request.json();
  
  try {
    const res = await fetch(`${LARAVEL_API}/courses/${slug}/questions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Laravel API error (questions POST):', res.status, errorText);
      return NextResponse.json({ error: 'Failed to submit question', details: errorText }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('Questions POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
