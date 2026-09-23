'use client';

import { Linkedin, MapPin, Calendar, Clock } from 'lucide-react';

export interface EventPassData {
  eventId: string;
  eventTitle: string;
  attendeeName: string;
  date?: string;
  time?: string;
  location?: string;
  calendarLink?: string;
  token: string;
}

export const SITE_URL = 'https://www.quantumnexusglobal.org';

export function getEventShareUrl(eventId: string): string {
  return `${SITE_URL}/events/${eventId}`;
}

export function getLinkedInShareUrl(eventId: string): string {
  const url = encodeURIComponent(getEventShareUrl(eventId));
  return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
}

export function EventPass({ data }: { data: EventPassData }) {
  return (
    <div className="relative rounded-3xl border border-foreground/15 bg-background overflow-hidden shadow-xl w-full max-w-md mx-auto">
      {/* Header strip */}
      <div className="px-6 py-3 bg-foreground text-background flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest">Quantum Nexus · Event Pass</span>
        <span className="font-mono text-[10px] font-bold">QNI</span>
      </div>

      <div className="p-6 space-y-5">
        <div>
          <p className="text-lg font-display font-bold text-foreground leading-tight">{data.attendeeName}</p>
          <p className="text-sm text-foreground/60 mt-0.5">{data.eventTitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-2 text-xs">
          {data.date && (
            <div className="flex items-center gap-1.5 text-foreground/70">
              <Calendar className="w-3.5 h-3.5 shrink-0" /> {data.date}
            </div>
          )}
          {data.time && (
            <div className="flex items-center gap-1.5 text-foreground/70">
              <Clock className="w-3.5 h-3.5 shrink-0" /> {data.time}
            </div>
          )}
          {data.location && (
            <div className="flex items-center gap-1.5 text-foreground/70">
              <MapPin className="w-3.5 h-3.5 shrink-0" /> {data.location}
            </div>
          )}
        </div>

        {/* Perforation */}
        <div className="border-t border-dashed border-foreground/20 pt-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-foreground/40 mb-1">Pass ID</p>
          <p className="text-sm font-mono font-semibold text-foreground/80">{data.token}</p>
        </div>

        {data.calendarLink && (
          <a
            href={data.calendarLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-foreground/15 text-foreground text-sm font-semibold hover:bg-foreground/5 transition-colors"
          >
            <Calendar className="w-4 h-4" /> Add to Google Calendar
          </a>
        )}

        <a
          href={getLinkedInShareUrl(data.eventId)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0A66C2] text-white text-sm font-semibold hover:bg-[#004182] transition-colors"
        >
          <Linkedin className="w-4 h-4" /> Share on LinkedIn
        </a>
      </div>
    </div>
  );
}
