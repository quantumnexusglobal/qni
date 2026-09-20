import { NextResponse } from 'next/server';
import { getMongoDbDatabase } from '@/lib/mongodb';
import { sendTeamApplicationEmail } from '@/lib/email';

/**
 * Applications to join the QNexus team (not the general community —
 * see /api/join for that). Reviewed from /admin/team-applications.
 */

export async function GET() {
  try {
    const db = await getMongoDbDatabase();
    if (!db) return NextResponse.json({ success: false, message: 'MongoDB not configured' }, { status: 400 });
    const docs = await db.collection('team_applications').find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ success: true, data: docs });
  } catch (error: any) {
    console.error('Error fetching team applications:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = await getMongoDbDatabase();
    if (!db) return NextResponse.json({ success: false, message: 'MongoDB not configured' }, { status: 400 });

    const body = await request.json();
    if (!body.fullName?.trim() || !body.email?.trim() || (!body.currentStatus?.trim() && !body.role?.trim())) {
      return NextResponse.json({ success: false, message: 'Full name, email, and current status are required.' }, { status: 400 });
    }

    const contributionAreas = Array.isArray(body.contributionAreas)
      ? body.contributionAreas.map((area: unknown) => String(area).trim()).filter(Boolean)
      : body.role?.trim() ? [String(body.role).trim()] : [];
    if (contributionAreas.length === 0 || contributionAreas.length > 2) {
      return NextResponse.json({ success: false, message: 'Select one or two contribution areas.' }, { status: 400 });
    }
    if (!body.consent) {
      return NextResponse.json({ success: false, message: 'Contributor consent is required.' }, { status: 400 });
    }

    const doc = {
      id: `ta-${Date.now()}`,
      fullName: String(body.fullName).trim(),
      email: String(body.email).trim(),
      phone: body.phone ? String(body.phone).trim() : '',
      role: contributionAreas.join(', '),
      currentStatus: body.currentStatus ? String(body.currentStatus).trim() : 'Not specified',
      contributionAreas,
      countryCity: body.countryCity ? String(body.countryCity).trim() : '',
      institution: body.institution ? String(body.institution).trim() : '',
      discipline: body.discipline ? String(body.discipline).trim() : '',
      linkedinUrl: body.linkedinUrl ? String(body.linkedinUrl).trim() : '',
      skills: body.skills ? String(body.skills).trim() : '',
      primaryArea: body.primaryArea ? String(body.primaryArea).trim() : '',
      ownershipIdea: body.ownershipIdea ? String(body.ownershipIdea).trim() : '',
      completedWork: body.completedWork ? String(body.completedWork).trim() : '',
      evidence: body.evidence ? String(body.evidence).trim() : '',
      quantumExperience: body.quantumExperience ? String(body.quantumExperience).trim() : '',
      quantumAreas: Array.isArray(body.quantumAreas) ? body.quantumAreas.map((area: unknown) => String(area).trim()).filter(Boolean) : [],
      availability: body.availability ? String(body.availability).trim() : '',
      duration: body.duration ? String(body.duration).trim() : '',
      workStyle: body.workStyle ? String(body.workStyle).trim() : '',
      checkIns: body.checkIns ? String(body.checkIns).trim() : '',
      timezone: body.timezone ? String(body.timezone).trim() : '',
      whyQng: body.whyQng ? String(body.whyQng).trim() : '',
      qngStrength: body.qngStrength ? String(body.qngStrength).trim() : '',
      newInitiative: body.newInitiative ? String(body.newInitiative).trim() : '',
      greaterResponsibility: body.greaterResponsibility ? String(body.greaterResponsibility).trim() : '',
      mentoring: body.mentoring ? String(body.mentoring).trim() : '',
      anythingElse: body.anythingElse ? String(body.anythingElse).trim() : '',
      consent: true,
      contactConsent: Boolean(body.contactConsent),
      portfolioUrl: body.portfolioUrl ? String(body.portfolioUrl).trim() : '',
      message: body.skills ? String(body.skills).trim() : '',
      status: 'Pending' as const,
      createdAt: new Date(),
    };

    await db.collection('team_applications').insertOne(doc);
    await sendTeamApplicationEmail(doc.email, doc.fullName).catch((emailError) => {
      console.warn('[Email] Team application confirmation error:', emailError);
    });
    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (error: any) {
    console.error('Error saving team application:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const db = await getMongoDbDatabase();
    if (!db) return NextResponse.json({ success: false, message: 'MongoDB not configured' }, { status: 400 });

    const body = await request.json();
    const { id, status } = body;
    if (!id || !['Pending', 'Shortlisted', 'Rejected', 'Hired'].includes(status)) {
      return NextResponse.json({ success: false, message: 'Missing or invalid id/status.' }, { status: 400 });
    }

    const result = await db.collection('team_applications').updateOne({ id }, { $set: { status } });
    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating team application:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const db = await getMongoDbDatabase();
    if (!db) return NextResponse.json({ success: false, message: 'MongoDB not configured' }, { status: 400 });
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 });
    await db.collection('team_applications').deleteOne({ id });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting team application:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
