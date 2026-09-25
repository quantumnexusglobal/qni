import { NextResponse } from 'next/server';
import { getMongoDbDatabase } from '@/lib/mongodb';
import { createBlogSession, setBlogSession } from '@/lib/blog-auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return NextResponse.json({ success: false, message: 'Email and password are required.' }, { status: 400 });
    }

    const db = await getMongoDbDatabase();
    if (!db) {
      return NextResponse.json({ success: false, message: 'Writer login is unavailable until MongoDB is configured.' }, { status: 503 });
    }

    const writer = await db.collection('blog_writers').findOne({ email: normalizedEmail, status: 'Active' });
    if (!writer || writer.password !== password) {
      return NextResponse.json({ success: false, message: 'Invalid writer email or password.' }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      writer: { name: writer.name, email: writer.email, role: writer.role || 'Guest Contributor' },
    });
    setBlogSession(response, createBlogSession({
      id: writer.id || String(writer._id),
      email: writer.email,
      name: writer.name,
      role: writer.role || 'Guest Contributor',
    }));
    return response;
  } catch (error: any) {
    console.error('Error in writer login:', error);
    return NextResponse.json({ success: false, message: 'Unable to sign in.' }, { status: 500 });
  }
}
