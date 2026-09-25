import { NextResponse } from 'next/server';
import { clearBlogSession } from '@/lib/blog-auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearBlogSession(response);
  return response;
}
