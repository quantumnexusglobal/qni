import { NextResponse } from 'next/server';
import { getMongoDbDatabase } from '@/lib/mongodb';
import { sendBlogWriterInviteEmail } from '@/lib/email';
import { hasAdminSession } from '@/lib/blog-auth';

/**
 * Blog writer invite schema (MongoDB document)
 * {
 *   id: string,
 *   name: string,
 *   email: string,
 *   password: string,   // auto-generated, emailed to the invitee
 *   role: string,
 *   invitedAt: Date,
 *   status: 'Active' | 'Revoked',
 * }
 */

const PASSWORD_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
function generateSimplePassword(length = 8): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += PASSWORD_CHARS[Math.floor(Math.random() * PASSWORD_CHARS.length)];
  }
  return out;
}

export async function GET() {
  try {
    if (!(await hasAdminSession())) {
      return NextResponse.json({ success: false, message: 'Admin authentication required.' }, { status: 401 });
    }
    const db = await getMongoDbDatabase();
    if (!db) return NextResponse.json({ success: false, message: 'MongoDB not configured' }, { status: 400 });
    const writers = await db.collection('blog_writers').find({}).sort({ invitedAt: -1 }).project({ password: 0 }).toArray();
    return NextResponse.json({ success: true, data: writers });
  } catch (error: any) {
    console.error('Error fetching blog writers:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await hasAdminSession())) {
      return NextResponse.json({ success: false, message: 'Admin authentication required.' }, { status: 401 });
    }
    const body = await request.json();
    const name = (body.name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const role = (body.role || 'Guest Contributor').trim();

    if (!name || !email) {
      return NextResponse.json({ success: false, message: 'Name and email are required' }, { status: 400 });
    }

    const password = generateSimplePassword();
    const writer = {
      id: `bw-${Date.now()}`,
      name,
      email,
      password,
      role,
      invitedAt: new Date(),
      status: 'Active',
    };

    const db = await getMongoDbDatabase();
    if (db) {
      await db.collection('blog_writers').updateOne(
        { email },
        { $set: writer },
        { upsert: true }
      );
    }

    const emailSent = await sendBlogWriterInviteEmail(email, name, password).catch((err) => {
      console.warn('[Email] Blog writer invite error:', err);
      return false;
    });

    return NextResponse.json(
      { success: true, data: writer, emailSent, dbConfigured: !!db },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating blog writer invite:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await hasAdminSession())) {
      return NextResponse.json({ success: false, message: 'Admin authentication required.' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');
    if (!id && !email) {
      return NextResponse.json({ success: false, message: 'Missing id or email' }, { status: 400 });
    }
    const db = await getMongoDbDatabase();
    if (!db) return NextResponse.json({ success: false, message: 'MongoDB not configured' }, { status: 400 });
    await db.collection('blog_writers').deleteOne(id ? { id } : { email });
    return NextResponse.json({ success: true, message: 'Blog writer access revoked' });
  } catch (error: any) {
    console.error('Error revoking blog writer:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
