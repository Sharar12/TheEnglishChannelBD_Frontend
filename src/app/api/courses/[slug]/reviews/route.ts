import { NextRequest, NextResponse } from 'next/server';
import { LARAVEL_API } from '@/lib/config';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  try {
    const res = await fetch(`${LARAVEL_API}/courses/${slug}/reviews`, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Laravel API error (reviews GET):', res.status, errorText);
      return NextResponse.json({ error: 'Failed to fetch reviews', details: errorText }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('Reviews GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await request.json();
  
  try {
    const res = await fetch(`${LARAVEL_API}/courses/${slug}/reviews`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Laravel API error (reviews POST):', res.status, errorText);
      return NextResponse.json({ error: 'Failed to submit review', details: errorText }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('Reviews POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await request.json();
  const id = body.id || request.nextUrl.searchParams.get('id');
  
  try {
    const res = await fetch(`${LARAVEL_API}/reviews/${id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Laravel API error (reviews PUT):', res.status, errorText);
      return NextResponse.json({ error: 'Failed to update review', details: errorText }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('Reviews PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
