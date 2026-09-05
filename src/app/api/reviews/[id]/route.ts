import { NextRequest, NextResponse } from 'next/server';
import { LARAVEL_API } from '@/lib/config';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  
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
