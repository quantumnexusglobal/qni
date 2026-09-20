"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Send, Users, Mail, CalendarCheck, MessageSquare, GraduationCap,
  Eye, Loader2, CheckCircle2, AlertTriangle, ImagePlus, Sparkles, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEvents, EventItem } from "@/lib/events-store";

const AUDIENCES = [
  { key: "newsletter", label: "Newsletter Subscribers", icon: Mail, color: "emerald" },
  { key: "joins", label: "Join Applicants", icon: Users, color: "amber" },
  { key: "registrations", label: "Event Registrants", icon: CalendarCheck, color: "cyan" },
  { key: "pastEventAttendees", label: "Past Event Attendees", icon: Users, color: "amber" },
  { key: "contacts", label: "Contact Inquiries", icon: MessageSquare, color: "purple" },
  { key: "research", label: "Research Applicants", icon: GraduationCap, color: "sky" },
] as const;

type AudienceKey = (typeof AUDIENCES)[number]["key"];

interface PreviewResult {
  count: number;
  sample: string[];
}

interface SendResult {
  total: number;
  sent: number;
  failed: number;
  errors: string[];
}

export default function AdminBroadcastPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedAudiences, setSelectedAudiences] = useState<AudienceKey[]>([]);
  const [eventId, setEventId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [posterUrl, setPosterUrl] = useState("");
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);

  const [isPreviewing, setIsPreviewing] = useState(false);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<SendResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const prefillSubject = params.get("subject");
      const prefillMessage = params.get("message");
      if (prefillSubject) setSubject(prefillSubject);
      if (prefillMessage) setMessage(prefillMessage);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = localStorage.getItem("qni_admin_authenticated");
      if (auth !== "true") {
        router.push("/admin");
      }
    }
  }, [router]);

  useEffect(() => {
    getEvents().then(setEvents);
  }, []);

  const toggleAudience = (key: AudienceKey) => {
    setPreview(null);
    setResult(null);
    setSelectedAudiences((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
    );
  };

  const applyRecommendationTemplate = () => {
    const event = events.find((item) => item.id === eventId);
    if (!event) return;
    setSubject(`You're invited: ${event.title}`);
    setMessage(`Hi {{name}},\n\nBecause you joined one of our past events, we thought this upcoming session would be a great fit for you.\n\n${event.title}\nDate: ${event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : `${event.month} ${event.day}`}\nTime: ${event.time || 'To be confirmed'}\nLocation: ${event.location || 'Online'}\n\nWe would love to see you there. Register here: https://www.quantumnexusglobal.org/events/${event.id}\n\nWarmly,\nThe Quantum Nexus Global Team`);
    setPreview(null);
    setResult(null);
  };

  const loadSeptemberRecommendationDraft = () => {
    const targetEvent = events.find((item) => item.eventDate?.startsWith("2026-09-22"));
    if (!targetEvent) {
      setErrorMsg("The September 22 online event could not be found.");
      return;
    }

    const previousEvent = events
      .filter((item) => item.eventDate && new Date(item.eventDate).getTime() < new Date(targetEvent.eventDate!).getTime())
      .sort((a, b) => new Date(b.eventDate!).getTime() - new Date(a.eventDate!).getTime())[0];

    setSelectedAudiences(["registrations"]);
    setEventId(previousEvent?.id || "");
    setSubject("You may like this upcoming quantum computing session");
    setMessage(`Hi {{name}},\n\nYou registered for our previous talk, so we thought you may like to attend this upcoming online session as well.\n\n${targetEvent.title}\n\nDate: 22 September 2026\nFormat: Online session\n\nRegister here:\nhttps://www.quantumnexusglobal.org/events/${targetEvent.id}\n\nWe hope to see you there!\n\nWarmly,\nThe Quantum Nexus Global Team`);
    setPreview(null);
    setResult(null);
    setErrorMsg("");
  };

  const handlePosterUpload = async (file: File | undefined) => {
    if (!file) return;
    setIsUploadingPoster(true);
    setErrorMsg("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok || !data.success || !data.url || !/^https?:\/\//i.test(data.url)) {
        throw new Error("Poster upload needs a public image URL. Configure Cloudinary or paste the URL below.");
      }
      setPosterUrl(data.url);
      setPreview(null);
    } catch (error: any) {
      setErrorMsg(error.message || "Poster upload failed.");
    } finally {
      setIsUploadingPoster(false);
    }
  };

  const runPreview = async () => {
    if (selectedAudiences.length === 0) return;
    setIsPreviewing(true);
    setErrorMsg("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audiences: selectedAudiences,
          eventId: (selectedAudiences.includes("registrations") || selectedAudiences.includes("pastEventAttendees")) ? eventId || undefined : undefined,
          posterUrl: posterUrl || undefined,
          dryRun: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPreview({ count: data.count, sample: data.sample });
      } else {
        setErrorMsg(data.message || "Failed to preview recipients.");
      }
    } catch {
      setErrorMsg("Error connecting to the server.");
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSend = async () => {
    if (!preview || preview.count === 0) return;
    const confirmed = confirm(
      `Send this email to ${preview.count} recipient${preview.count !== 1 ? "s" : ""}? This cannot be undone.`
    );
    if (!confirmed) return;

    setIsSending(true);
    setErrorMsg("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          message,
          audiences: selectedAudiences,
          eventId: (selectedAudiences.includes("registrations") || selectedAudiences.includes("pastEventAttendees")) ? eventId || undefined : undefined,
          posterUrl: posterUrl || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult({ total: data.total, sent: data.sent, failed: data.failed, errors: data.errors || [] });
      } else {
        setErrorMsg(data.message || "Failed to send broadcast.");
      }
    } catch {
      setErrorMsg("Error connecting to the server.");
    } finally {
      setIsSending(false);
    }
  };

  const needsTargetEvent = selectedAudiences.includes("pastEventAttendees");
  const canSend = selectedAudiences.length > 0 && (!needsTargetEvent || Boolean(eventId)) && subject.trim() && message.trim() && preview && preview.count > 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-foreground/10 px-6 lg:px-12 py-4">
        <div className="max-w-[900px] mx-auto flex items-center gap-4">
          <Link
            href="/admin"
            className="p-2 rounded-full border border-foreground/15 hover:bg-foreground/10 text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold flex items-center gap-2">
              Email Broadcast
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                Admin
              </span>
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              Compose one email and send it to any combination of audiences at once
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-6 lg:px-12 py-8 space-y-6">
        <div className="border border-cyan-500/25 bg-cyan-500/[0.06] rounded-3xl p-6 lg:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-display font-bold mb-1">Saved Draft</h2>
            <p className="text-xs text-muted-foreground">Recommendation email for previous event registrants and the 22 September online session.</p>
          </div>
          <Button type="button" onClick={loadSeptemberRecommendationDraft} className="shrink-0">
            <PenSquare className="w-4 h-4 mr-2" /> Load Draft
          </Button>
        </div>

        {/* Audience selection */}
        <div className="border border-foreground/15 bg-foreground/[0.03] rounded-3xl p-6 lg:p-8 space-y-5">
          <div>
            <h2 className="text-lg font-display font-bold mb-1">1. Choose Audience</h2>
            <p className="text-xs text-muted-foreground">Select one or more groups — duplicates across groups are sent to only once.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {AUDIENCES.map(({ key, label, icon: Icon }) => {
              const isSelected = selectedAudiences.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleAudience(key)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-foreground bg-foreground text-background"
                      : "border-foreground/15 hover:border-foreground/30 text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              );
            })}
          </div>

          {(selectedAudiences.includes("registrations") || selectedAudiences.includes("pastEventAttendees")) && (
            <div>
              <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">
                {selectedAudiences.includes("pastEventAttendees") ? "Upcoming event to recommend" : "Limit to a specific event (optional)"}
              </label>
              <select
                value={eventId}
                onChange={(e) => { setEventId(e.target.value); setPreview(null); }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground focus:outline-none focus:border-foreground/50"
              >
                <option value="">{selectedAudiences.includes("pastEventAttendees") ? "Select the event to recommend" : "All events (every registrant)"}</option>
                {events.filter((ev) => !ev.eventDate || new Date(ev.eventDate).getTime() > Date.now()).map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
              {selectedAudiences.includes("pastEventAttendees") && eventId && (
                <button type="button" onClick={applyRecommendationTemplate} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-cyan-500/30 px-3 py-2 text-xs font-semibold text-cyan-700 hover:bg-cyan-500/10">
                  <Sparkles className="h-3.5 w-3.5" /> Use recommendation template
                </button>
              )}
            </div>
          )}
        </div>

        {/* Compose */}
        <div className="border border-foreground/15 bg-foreground/[0.03] rounded-3xl p-6 lg:p-8 space-y-5">
          <div>
            <h2 className="text-lg font-display font-bold mb-1">2. Compose</h2>
            <p className="text-xs text-muted-foreground">
              Use <code className="px-1 py-0.5 rounded bg-foreground/10 font-mono">{"{{name}}"}</code> anywhere to personalize with each recipient's name.
            </p>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => { setSubject(e.target.value); setResult(null); }}
              placeholder="e.g. New quantum session announced!"
              className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/25 bg-background text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-foreground/60 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">Message *</label>
            <textarea
              rows={8}
              value={message}
              onChange={(e) => { setMessage(e.target.value); setResult(null); }}
              placeholder={`Hi {{name}},\n\nWe just added a new session you might like...`}
              className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/25 bg-background text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-foreground/60 transition-colors resize-none"
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">Separate paragraphs with a blank line — each will render as its own paragraph in the email.</p>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-muted-foreground mb-1.5">Event poster (optional)</label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-foreground/20 px-3.5 py-2.5 text-sm font-medium hover:bg-foreground/5">
                {isUploadingPoster ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                {isUploadingPoster ? "Uploading..." : "Upload poster"}
                <input type="file" accept="image/*" className="sr-only" disabled={isUploadingPoster} onChange={(e) => handlePosterUpload(e.target.files?.[0])} />
              </label>
              <input type="url" value={posterUrl} onChange={(e) => { setPosterUrl(e.target.value); setPreview(null); }} placeholder="Or paste a public image URL" className="min-w-0 flex-1 rounded-xl border border-foreground/20 bg-background px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:border-foreground/60" />
              {posterUrl && <button type="button" aria-label="Remove poster" onClick={() => setPosterUrl("")} className="rounded-full p-2 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"><X className="h-4 w-4" /></button>}
            </div>
            {posterUrl && <img src={posterUrl} alt="Poster preview" className="mt-3 max-h-48 w-auto rounded-xl border border-foreground/10 object-contain" />}
            <p className="mt-1.5 text-[11px] text-muted-foreground">Email images need a public HTTPS URL. Uploaded images work when Cloudinary is configured.</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Preview + Send */}
        <div className="border border-foreground/15 bg-foreground/[0.03] rounded-3xl p-6 lg:p-8 space-y-5">
          <div>
            <h2 className="text-lg font-display font-bold mb-1">3. Preview & Send</h2>
            <p className="text-xs text-muted-foreground">Always preview the recipient count before sending — this action can't be undone.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={runPreview}
              disabled={selectedAudiences.length === 0 || isPreviewing}
              className="rounded-xl gap-2"
            >
              {isPreviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              Preview Recipients
            </Button>

            <Button
              type="button"
              onClick={handleSend}
              disabled={!canSend || isSending}
              className="rounded-xl gap-2 bg-foreground text-background hover:bg-foreground/90"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isSending ? "Sending..." : "Send Broadcast"}
            </Button>
          </div>

          {preview && !result && (
            <div className="p-4 rounded-xl border border-foreground/15 bg-foreground/[0.02] text-sm">
              <p className="font-semibold text-foreground mb-1.5">
                {preview.count} recipient{preview.count !== 1 ? "s" : ""} will receive this email.
              </p>
              {preview.sample.length > 0 && (
                <p className="text-xs text-muted-foreground font-mono">
                  e.g. {preview.sample.join(", ")}{preview.count > preview.sample.length ? ", …" : ""}
                </p>
              )}
              {preview.count === 0 && (
                <p className="text-xs text-muted-foreground">No matching recipients — try a different audience.</p>
              )}
            </div>
          )}

          {result && (
            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-sm space-y-2">
              <p className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Sent {result.sent} of {result.total} emails.
              </p>
              {result.failed > 0 && (
                <div className="text-xs text-rose-600 dark:text-rose-400">
                  <p className="font-medium mb-1">{result.failed} failed:</p>
                  <ul className="space-y-0.5 font-mono">
                    {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
