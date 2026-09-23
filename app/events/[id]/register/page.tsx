'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, User, Mail, Phone, Building2, GraduationCap, ArrowRight, MessageCircle } from 'lucide-react';

import { getEvents, EventItem, isRegistrationOpen, resolveEventStatus } from '@/lib/events-store';
import { saveRegistration } from '@/lib/submissions-store';
import { saveUserIdentity, generateToken } from '@/lib/user-identity';
import { getSettings, SiteSettings } from '@/lib/settings-store';
import { EventPass } from '@/components/events/event-pass';

export default function EventRegisterPage({ params }: { params: Promise<{ id: string }> }) {
  const [eventId, setEventId] = useState<string | null>(null);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [regToken, setRegToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', organization: '', role: '', background: 'Beginner', teamName: '', message: '',
  });

  useEffect(() => {
    params.then(async (p) => {
      setEventId(p.id);
      const all = await getEvents();
      const found = all.find((e) => e.id === p.id);
      if (found) {
        setEvent(found);
      }
    });
    setIsVisible(true);
    getSettings().then(setSettings);
  }, [params]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (event && !isRegistrationOpen(event)) return;
    setIsSubmitting(true);
    const title = event?.title || 'Quantum Event';

    const token = generateToken('QNI-EVT');

    const regData = {
      eventId: eventId || '1',
      eventTitle: title,
      name: form.name,
      email: form.email,
      phone: form.phone || 'N/A',
      organization: form.organization || 'Independent',
      role: form.role || 'Attendee',
      background: form.background,
      teamName: form.teamName || undefined,
      token,
      eventDate: event?.eventDate,
      time: event?.time,
      location: event?.location,
    };

    // Save to local store
    saveRegistration(regData);

    // Save to MongoDB API + trigger confirmation email
    try {
      await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData),
      });
    } catch (err) {
      console.warn('MongoDB register API warn:', err);
    }

    // Identify this visitor on their own device — replaces the "Join Us" nav
    // button with their name and persists across future visits.
    saveUserIdentity({
      name: form.name,
      email: form.email,
      token,
      source: 'event-register',
      eventTitle: title,
      createdAt: new Date().toISOString(),
    });
    setRegToken(token);

    setIsSubmitting(false);
    setSubmitted(true);

    // Auto-join: send them straight into the WhatsApp community —
    // no link to hunt for, WhatsApp just opens with the group ready to join.
    if (settings?.whatsappGroupLink) {
      window.open(settings.whatsappGroupLink, '_blank', 'noopener,noreferrer');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-display mb-2">You're Registered!</h1>
          <p className="text-sm text-foreground/50 mb-8">
            A confirmation email with your pass was sent to <strong>{form.email}</strong>.
          </p>

          {regToken && (
            <div className="mb-8">
              <EventPass
                data={{
                  eventId: eventId || '',
                  eventTitle: event?.title || 'Quantum Event',
                  attendeeName: form.name,
                  date: event?.month && event?.day ? `${event.month} ${event.day}, 2026` : undefined,
                  time: event?.time,
                  location: event?.location,
                  calendarLink: event?.calendarLink,
                  token: regToken,
                }}
              />
            </div>
          )}

          {settings?.whatsappGroupLink && (
            <div className="mb-8 p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-3 text-center">
              <p className="text-sm text-foreground font-medium flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-500" />
                Opening our WhatsApp community for you...
              </p>
              <p className="text-xs text-foreground/50">
                If it didn't open automatically, tap below to join.
              </p>
              <a
                href={settings.whatsappGroupLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors"
              >
                Join WhatsApp Community <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Link href="/dashboard" className="px-8 py-3 bg-foreground text-background rounded-xl font-medium hover:bg-foreground/90 transition-colors text-center">
              View My Dashboard
            </Link>
            <Link href="/events" className="px-8 py-3 border border-foreground/15 rounded-xl text-foreground/60 hover:text-foreground transition-colors text-center text-sm">
              Browse More Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (event && !isRegistrationOpen(event)) {
    const isPast = resolveEventStatus(event) === 'past';
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 py-16">
        <div className="max-w-md w-full text-center">
          <h1 className="text-3xl font-display mb-2">Registration Closed</h1>
          <p className="text-sm text-foreground/50 mb-8">
            {isPast
              ? `${event.title} has already taken place.`
              : `Registration for ${event.title} has closed ahead of the event start.`}
          </p>
          <div className="flex flex-col gap-3">
            <Link href={`/events/${event.id}`} className="px-8 py-3 bg-foreground text-background rounded-xl font-medium hover:bg-foreground/90 transition-colors text-center">
              View Event Details
            </Link>
            <Link href="/events" className="px-8 py-3 border border-foreground/15 rounded-xl text-foreground/60 hover:text-foreground transition-colors text-center text-sm">
              Browse Other Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-foreground/10 bg-background/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/events" className="flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> All Events
          </Link>
          <span className="font-mono text-xs text-foreground/40 uppercase tracking-widest">Event Registration</span>
        </div>
      </div>

      <div className={`pt-28 pb-20 max-w-5xl mx-auto px-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="grid lg:grid-cols-5 gap-12 items-start">

          {/* Left: Event Summary Card */}
          <div className="lg:col-span-2">
            <div className="sticky top-28 rounded-3xl border border-foreground/15 bg-foreground/[0.02] p-8">
              <div className="font-mono text-xs text-foreground/60 uppercase tracking-widest mb-1">{event?.category}</div>
              <h2 className="font-display text-2xl text-foreground leading-tight mb-6">{event?.title}</h2>
              <div className="space-y-3 text-sm border-t border-foreground/10 pt-6">
                <div className="flex items-center gap-3 text-foreground/60">
                  <span className="font-mono text-xs w-20 shrink-0">Date</span>
                  <span className="text-foreground font-medium">{event?.month ? `${event.month} ${event.day}` : 'Upcoming 2026'}</span>
                </div>
                <div className="flex items-center gap-3 text-foreground/60">
                  <span className="font-mono text-xs w-20 shrink-0">Location</span>
                  <span className="text-foreground font-medium">{event?.location}</span>
                </div>
                <div className="flex items-center gap-3 text-foreground/60">
                  <span className="font-mono text-xs w-20 shrink-0">Price</span>
                  <span className="text-foreground font-semibold">{event?.price}</span>
                </div>
              </div>

              {/* What you get */}
              <div className="mt-8 pt-6 border-t border-foreground/10">
                <p className="text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider mb-4">Included with Registration</p>
                <div className="space-y-2">
                  {['Event access & recording', 'Certificate of participation', 'QNexus community membership', 'Networking with researchers'].map((item) => (
                    <div key={item} className="flex items-center gap-2.5 text-sm text-foreground/70">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Registration Form */}
          <div className="lg:col-span-3">
            <div className="mb-8">
              <h1 className="text-4xl lg:text-5xl font-display tracking-tight mb-2">Register for Event</h1>
              <p className="text-foreground/55">Fill in your details below to secure your spot.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Personal Info */}
              <div className="p-6 rounded-2xl border border-foreground/15 bg-foreground/[0.03] space-y-4">
                <p className="text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Personal Information
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-medium text-foreground/75 mb-1.5">Full Name *</label>
                    <input
                      type="text" required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Your full name"
                      className="w-full px-4 py-3 rounded-xl border border-foreground/25 bg-background text-foreground placeholder:text-foreground/40 text-sm focus:outline-none focus:border-foreground/60 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-medium text-foreground/75 mb-1.5">Email Address *</label>
                    <input
                      type="email" required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-foreground/25 bg-background text-foreground placeholder:text-foreground/40 text-sm focus:outline-none focus:border-foreground/60 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono font-medium text-foreground/75 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1 555 123 4567"
                    className="w-full px-4 py-3 rounded-xl border border-foreground/25 bg-background text-foreground placeholder:text-foreground/40 text-sm focus:outline-none focus:border-foreground/60 transition-colors"
                  />
                </div>
              </div>

              {/* Professional Info */}
              <div className="p-6 rounded-2xl border border-foreground/15 bg-foreground/[0.03] space-y-4">
                <p className="text-xs font-mono font-semibold text-foreground/60 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" /> Professional Details
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono font-medium text-foreground/75 mb-1.5">Organization / Institution</label>
                    <input
                      type="text"
                      value={form.organization}
                      onChange={(e) => setForm({ ...form, organization: e.target.value })}
                      placeholder="IIT, C-DAC, TCS, etc."
                      className="w-full px-4 py-3 rounded-xl border border-foreground/25 bg-background text-foreground placeholder:text-foreground/40 text-sm focus:outline-none focus:border-foreground/60 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono font-medium text-foreground/75 mb-1.5">Your Role</label>
                    <input
                      type="text"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      placeholder="Student / Researcher / Engineer"
                      className="w-full px-4 py-3 rounded-xl border border-foreground/25 bg-background text-foreground placeholder:text-foreground/40 text-sm focus:outline-none focus:border-foreground/60 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono font-medium text-foreground/75 mb-1.5">Quantum Background</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                      <button
                        key={level} type="button"
                        onClick={() => setForm({ ...form, background: level })}
                        className={`py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${
                          form.background === level
                            ? 'bg-foreground text-background border-foreground'
                            : 'border-foreground/25 text-foreground/70 hover:border-foreground/40 hover:text-foreground'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Hackathon-specific: Team name */}
              {eventId === '3' && (
                <div className="p-6 rounded-2xl border border-amber-400/20 bg-amber-50/5 space-y-4">
                  <p className="text-xs font-mono text-amber-600/70 dark:text-amber-400/70 uppercase tracking-wider flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5" /> Hackathon Team Info
                  </p>
                  <div>
                    <label className="block text-xs font-mono font-medium text-foreground/75 mb-1.5">Team Name *</label>
                    <input
                      type="text" required={eventId === '3'}
                      value={form.teamName}
                      onChange={(e) => setForm({ ...form, teamName: e.target.value })}
                      placeholder="Your team name"
                      className="w-full px-4 py-3 rounded-xl border border-foreground/25 bg-background text-foreground placeholder:text-foreground/40 text-sm focus:outline-none focus:border-foreground/60 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Message */}
              <div>
                <label className="block text-xs font-mono font-medium text-foreground/75 mb-1.5">Additional Message (Optional)</label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Any specific questions or accessibility requirements..."
                  className="w-full px-4 py-3 rounded-xl border border-foreground/25 bg-background text-foreground placeholder:text-foreground/40 text-sm focus:outline-none focus:border-foreground/60 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-foreground text-background rounded-2xl font-semibold text-base hover:bg-foreground/90 transition-all duration-200 group"
              >
                Confirm Registration
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>

              <p className="text-xs text-center text-foreground/40 font-mono">
                By registering, you agree to QNexus's community guidelines and privacy policy.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
