'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Users, Clock, Linkedin, User, Video } from 'lucide-react';

import { EventItem, resolveEventStatus, isRegistrationOpen } from '@/lib/events-store';
import { getLinkedInShareUrl } from '@/components/events/event-pass';
import { getSpeakerPhoto } from '@/lib/speaker-photos';

export function EventDetailClient({ event }: { event: EventItem | null }) {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-display mb-4">Event not found</h1>
          <p className="text-muted-foreground text-sm mb-6">The event you are looking for might have moved or is not yet scheduled.</p>
          <Link href="/events" className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-xl font-medium hover:bg-foreground/90 transition-all">
            <ArrowLeft className="w-4 h-4" /> Return to Events
          </Link>
        </div>
      </div>
    );
  }

  const isUpcoming = resolveEventStatus(event) === 'upcoming';
  const registrationOpen = isRegistrationOpen(event);
  const attendeeCount = parseInt(event.attendees?.replace(/\D/g, '') || '0', 10);

  return (
    <main className="min-h-screen bg-background">
      {/* Header Navigation */}
      <div className="border-b border-foreground/10 sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-4 flex items-center gap-4">
          <Link href="/" className="inline-flex items-center gap-2 hover:text-foreground/70 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to events
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div
        ref={sectionRef}
        className={`relative py-16 lg:py-24 border-b border-foreground/10 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 mb-6">
            <div className={`w-2 h-2 rounded-full ${isUpcoming ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-400'}`} />
            <span className="text-sm font-mono text-foreground/60">{isUpcoming ? 'Upcoming Event' : 'Archived Event'}</span>
            <span className="text-xs font-mono px-3 py-0.5 rounded-full border border-cyan-300 text-cyan-700 bg-cyan-100">
              {event.badge}
            </span>
          </div>

          <h1 className="text-4xl lg:text-6xl font-display tracking-tight mb-8">
            {event.title}
          </h1>

          {/* Quick Info Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="flex items-start gap-4">
              <Calendar className="w-5 h-5 text-cyan-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs font-mono text-foreground/40 uppercase tracking-wider mb-1">Date</p>
                <p className="text-foreground font-medium">{event.month} {event.day}, 2026</p>
                <p className="text-sm text-foreground/60">{event.dayLabel}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <MapPin className="w-5 h-5 text-cyan-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs font-mono text-foreground/40 uppercase tracking-wider mb-1">Location</p>
                <p className="text-foreground font-medium">{event.location}</p>
                <p className="text-sm text-foreground/60">{event.time}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Users className="w-5 h-5 text-cyan-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs font-mono text-foreground/40 uppercase tracking-wider mb-1">Attendees</p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center -space-x-1.5" aria-hidden="true">
                    {Array.from({ length: Math.min(Math.max(attendeeCount, 1), 3) }).map((_, i) => (
                      <div
                        key={i}
                        className="w-5 h-5 rounded-full flex items-center justify-center border-2 border-background bg-cyan-500"
                        style={{ opacity: 1 - i * 0.18 }}
                      >
                        <User className="w-2.5 h-2.5 text-white" />
                      </div>
                    ))}
                  </div>
                  <p className="text-foreground font-medium">{attendeeCount} attending</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Clock className="w-5 h-5 text-cyan-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-xs font-mono text-foreground/40 uppercase tracking-wider mb-1">Pricing / Access</p>
                <p className="text-foreground text-sm font-medium">{event.price}</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4">
            {registrationOpen ? (
              <Link href={`/events/${event.id}/register`}>
                <button className="px-8 py-3.5 bg-foreground text-background rounded-xl font-medium hover:bg-foreground/90 transition-all duration-300 shadow-lg">
                  Register for Free
                </button>
              </Link>
            ) : (
              <button
                className="px-8 py-3.5 bg-foreground/30 text-background rounded-xl font-medium cursor-not-allowed"
                disabled
                aria-label="Registration closed"
              >
                Registration Closed
              </button>
            )}
            <Link href="/events" className="px-8 py-3.5 border border-foreground/20 text-foreground rounded-xl font-medium hover:border-foreground/40 transition-all duration-300">
              Browse All Events
            </Link>
            {event.meetingLink && (
              <a
                href={event.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3.5 border border-cyan-500/40 text-cyan-700 rounded-xl font-medium hover:bg-cyan-50 transition-all duration-300 inline-flex items-center gap-2"
              >
                <Video className="w-4 h-4" /> Join on Zoom
              </a>
            )}
            {event.calendarLink && (
              <a
                href={event.calendarLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3.5 border border-foreground/20 text-foreground rounded-xl font-medium hover:border-foreground/40 transition-all duration-300 inline-flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" /> Add to Google Calendar
              </a>
            )}
            <a
              href={getLinkedInShareUrl(event.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 bg-[#0A66C2] text-white rounded-xl font-medium hover:bg-[#004182] transition-all duration-300 inline-flex items-center gap-2"
            >
              <Linkedin className="w-4 h-4" /> Share
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Content Column */}
          <div className="lg:col-span-2 space-y-12">
            {/* Description */}
            <section>
              <h2 className="text-3xl font-display mb-6">About This Session</h2>
              <p className="text-lg text-foreground/70 leading-relaxed whitespace-pre-line">
                {event.fullDescription || event.description}
              </p>
            </section>

            {/* Schedule */}
            {event.schedule && event.schedule.length > 0 && (
              <section>
                <h2 className="text-3xl font-display mb-8">Session Agenda & Syllabus</h2>
                <div className="border-l-2 border-cyan-500/30 pl-6 space-y-6">
                  {event.schedule.map((item: any, index: number) => (
                    <div key={index} className="relative">
                      <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-cyan-500 border-2 border-background" />
                      <div className="text-xs font-mono text-cyan-700 uppercase tracking-wider mb-1">{item.time}</div>
                      <h3 className="text-foreground text-lg font-medium">{item.title}</h3>
                      {item.speaker && <p className="text-sm text-foreground/50 mt-0.5">{item.speaker}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Speakers */}
            {event.speakers && event.speakers.length > 0 && (
              <section>
                <h2 className="text-3xl font-display mb-6">Speakers & Mentors</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {event.speakers.map((speaker: string, index: number) => {
                    const photo = getSpeakerPhoto(speaker);
                    return (
                      <div key={index} className="border border-foreground/10 rounded-2xl bg-foreground/[0.02] overflow-hidden">
                        {photo ? (
                          <img src={photo} alt={speaker} className="w-full h-44 object-cover object-top" />
                        ) : (
                          <div className="w-full h-44 bg-foreground/5 flex items-center justify-center">
                            <span className="text-4xl font-display font-bold text-foreground/20">{speaker.charAt(0)}</span>
                          </div>
                        )}
                        <div className="p-5">
                          <p className="text-foreground font-semibold text-lg">{speaker}</p>
                          <p className="text-xs font-mono text-cyan-700 mt-1">Quantum Research Scientist</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Registration Card */}
              <div className="border border-foreground/10 rounded-2xl p-8 bg-foreground/[0.02] backdrop-blur">
                <h3 className="text-xl font-display mb-3">Ready to Join?</h3>
                <p className="text-foreground/70 text-sm mb-6">
                  Access live interactive notebook environments, cloud QPU hardware execution, and receive a verified certification upon completion.
                </p>
                {registrationOpen ? (
                  <Link href={`/events/${event.id}/register`} className="block">
                    <button className="w-full px-6 py-3.5 bg-foreground text-background rounded-xl font-semibold hover:bg-foreground/90 transition-all duration-300 mb-3 shadow-lg">
                      Register for This Session
                    </button>
                  </Link>
                ) : (
                  <button
                    className="w-full px-6 py-3.5 bg-foreground/30 text-background rounded-xl font-semibold cursor-not-allowed mb-3"
                    disabled
                    aria-label="Registration closed"
                  >
                    Registration Closed
                  </button>
                )}
                <Link href="/events" className="block text-center text-xs font-mono text-muted-foreground hover:text-foreground transition-colors">
                  Explore other sessions →
                </Link>
              </div>

              {/* Event Details Card */}
              <div className="border border-foreground/10 rounded-2xl p-6 bg-foreground/[0.02]">
                <h4 className="font-display mb-4 text-lg">Event Specifications</h4>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="text-xs font-mono text-foreground/40 uppercase mb-0.5">Format</p>
                    <p className="text-foreground font-medium">{event.badge}</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-foreground/40 uppercase mb-0.5">Location</p>
                    <p className="text-foreground font-medium">{event.location}</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-foreground/40 uppercase mb-0.5">Category</p>
                    <p className="text-foreground font-medium">{event.category}</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono text-foreground/40 uppercase mb-0.5">Target Audience</p>
                    <p className="text-foreground font-medium">Students, Researchers, Quantum Developers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
