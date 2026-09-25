import { NextResponse } from 'next/server';
import { getMongoDbDatabase } from '@/lib/mongodb';
import { getServerSubmissions } from '@/lib/server-storage';

export async function GET(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get('token');
    if (!token) {
      return NextResponse.json({ success: false, message: 'Certificate token is required' }, { status: 400 });
    }

    let registration = getServerSubmissions('registrations').find(
      (item: any) => (item.token || item.id) === token
    );

    const db = await getMongoDbDatabase();
    if (db) {
      const remote = await db.collection('registrations').findOne({
        $or: [{ token }, { id: token }],
      });
      if (remote) registration = remote;
    }

    if (!registration || registration.status !== 'Attended') {
      return NextResponse.json({ success: false, message: 'Certificate is not available yet' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        attendeeName: registration.name || 'Attendee',
        eventTitle: registration.eventTitle || 'Quantum Event',
        eventDate: registration.eventDate || null,
        certificateId: token,
        issuedAt: registration.updatedAt || new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Error fetching certificate:', error);
    return NextResponse.json({ success: false, message: 'Unable to load certificate' }, { status: 500 });
  }
}
