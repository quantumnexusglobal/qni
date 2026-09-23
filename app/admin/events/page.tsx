"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  MapPin,
  Clock,
  User,
  CheckCircle2,
  Trash2,
  Sparkles,
  RefreshCw,
  Pencil,
  X,
  Calendar,
  Image as ImageIcon,
  Tag,
  ChevronDown,
  Users,
  Upload,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEvents, saveEvent, deleteEvent, createBlankEvent, EventItem, resolveEventStatus, isRegistrationOpen } from "@/lib/events-store";

const CATEGORIES = ["Workshop", "Hackathon", "Seminar", "Panel", "Conference", "Webinar", "Reading Group"];
const BADGES = ["In person", "Online", "Flagship", "Enterprise", "Hybrid"];
const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

function emptyForm() {
  return {
    title: "",
    category: "Workshop",
    badge: "In person",
    month: "AUG",
    day: "",
    dayLabel: "",
    eventDate: "",
    time: "",
    location: "",
    price: "Free",
    attendees: "",
    speakers: "",
    description: "",
    fullDescription: "",
    imageUrl: "",
    meetingLink: "https://us06web.zoom.us/j/88122633436?pwd=P9gCe6qpKaXIfmhRmgjWrMrNMQ0CnI.1",
    calendarLink: "https://calendar.app.google/v5w4Jrh5e4AfGyzF8",
    status: "upcoming" as "upcoming" | "past",
  };
}

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState(emptyForm());

  useEffect(() => {
    if (typeof window !== "undefined") {
      const auth = localStorage.getItem("qni_admin_authenticated");
      if (auth !== "true") {
        router.push("/admin");
      }
    }
  }, [router]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = new FormData();
      data.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });
      const result = await res.json();
      if (result.success && result.url) {
        setFormData((prev) => ({ ...prev, imageUrl: result.url }));
      } else {
        alert(result.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Failed to upload image. Please try again or use direct URL.');
    } finally {
      setIsUploading(false);
    }
  };

  const loadEvents = async () => {
    setEvents(await getEvents());
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (event: EventItem) => {
    setEditingId(event.id);
    setFormData({
      title: event.title,
      category: event.category,
      badge: event.badge,
      month: event.month,
      day: event.day,
      dayLabel: event.dayLabel,
      eventDate: event.eventDate || "",
      time: event.time,
      location: event.location,
      price: event.price,
      attendees: event.attendees,
      speakers: event.speakers.join(", "),
      description: event.description,
      fullDescription: event.fullDescription,
      imageUrl: event.imageUrl || "",
      meetingLink: event.meetingLink || "",
      calendarLink: event.calendarLink || "",
      status: event.status || "upcoming",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData(emptyForm());
    setShowForm(false);
    setSuccessMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");

    const speakersArray = formData.speakers
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const eventPayload: EventItem = {
      id: editingId || Date.now().toString(),
      title: formData.title,
      category: formData.category,
      badge: formData.badge,
      month: formData.month,
      day: formData.day,
      dayLabel: formData.dayLabel,
      eventDate: formData.eventDate,
      time: formData.time,
      location: formData.location,
      price: formData.price,
      attendees: formData.attendees,
      speakers: speakersArray,
      description: formData.description,
      fullDescription: formData.fullDescription,
      imageUrl: formData.imageUrl,
      meetingLink: formData.meetingLink,
      calendarLink: formData.calendarLink,
      status: formData.status,
      schedule: [],
      createdAt: new Date().toISOString(),
    };

    // Persist to local store
    saveEvent(eventPayload);

    // Try API persistence
    try {
      if (editingId) {
        await fetch("/api/events", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventPayload),
        }).catch(() => {});
      } else {
        await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventPayload),
        }).catch(() => {});
      }
    } catch {}

    loadEvents();
    setSuccessMessage(editingId ? "Event updated successfully!" : "Event created & published!");
    setEditingId(null);
    setFormData(emptyForm());
    setShowForm(false);
    setIsSubmitting(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Permanently delete this event?")) return;
    deleteEvent(id);
    fetch(`/api/events?id=${id}`, { method: "DELETE" }).catch(() => {});
    loadEvents();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-foreground/10 px-6 lg:px-12 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 rounded-full border border-foreground/15 hover:bg-foreground/10 text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold flex items-center gap-2">
                Event Management Portal
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Admin
                </span>
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                Create, edit, and manage Quantum Nexus Global events
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/events" target="_blank">
              <Button size="sm" variant="outline" className="rounded-full text-xs gap-1.5">
                View Public Events →
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => { setShowForm(true); setEditingId(null); setFormData(emptyForm()); }}
              className="rounded-full text-xs gap-1.5 bg-foreground text-background"
            >
              <Plus className="w-3.5 h-3.5" /> New Event
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 lg:px-12 py-8 space-y-8">
        {/* Success Banner */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Create / Edit Form */}
        {showForm && (
          <div className="border border-foreground/15 bg-foreground/[0.03] rounded-3xl p-6 lg:p-8 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-foreground/10 pb-4">
              <div className="flex items-center gap-2">
                {editingId ? <Pencil className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-emerald-400" />}
                <h2 className="font-display text-xl font-bold">
                  {editingId ? "Edit Event" : "Create New Event"}
                </h2>
              </div>
              <button onClick={handleCancel} className="p-2 rounded-full hover:bg-foreground/10 transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
              {/* Title */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Event Title *</label>
                <input
                  type="text" name="title" required value={formData.title} onChange={handleChange}
                  placeholder="e.g. QNG National Hackathon 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground focus:outline-none focus:border-foreground/50 transition-colors"
                />
              </div>

              {/* Category + Badge */}
              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Category *</label>
                <select name="category" value={formData.category} onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground focus:outline-none focus:border-foreground/50">
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Badge Type</label>
                <select name="badge" value={formData.badge} onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground focus:outline-none focus:border-foreground/50">
                  {BADGES.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>

              {/* Date fields */}
              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Event Date (ISO) *</label>
                <input type="datetime-local" name="eventDate" required value={formData.eventDate} onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-xs font-mono text-foreground focus:outline-none focus:border-foreground/50"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Display Time *</label>
                <input type="text" name="time" required value={formData.time} onChange={handleChange}
                  placeholder="10:00 AM – 2:00 PM IST"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground focus:outline-none focus:border-foreground/50"
                />
              </div>

              {/* Month / Day / DayLabel */}
              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Month (Display)</label>
                <select name="month" value={formData.month} onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground focus:outline-none focus:border-foreground/50">
                  {MONTHS.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Day(s)</label>
                  <input type="text" name="day" value={formData.day} onChange={handleChange}
                    placeholder="05 or 05–06"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground focus:outline-none focus:border-foreground/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Day Label</label>
                  <input type="text" name="dayLabel" value={formData.dayLabel} onChange={handleChange}
                    placeholder="Sat or Sat–Sun"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground focus:outline-none focus:border-foreground/50"
                  />
                </div>
              </div>

              {/* Location + Price */}
              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Location *</label>
                <input type="text" name="location" required value={formData.location} onChange={handleChange}
                  placeholder="T-Hub, Hyderabad / Online (Zoom)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground focus:outline-none focus:border-foreground/50"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Ticket / Price</label>
                <input type="text" name="price" value={formData.price} onChange={handleChange}
                  placeholder="Free or $500/team"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground focus:outline-none focus:border-foreground/50"
                />
              </div>

              {/* Attendees + Status */}
              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Attendees</label>
                <input type="text" name="attendees" value={formData.attendees} onChange={handleChange}
                  placeholder="120 or 500+"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground focus:outline-none focus:border-foreground/50"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Status</label>
                <select name="status" value={formData.status} onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground focus:outline-none focus:border-foreground/50">
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                </select>
              </div>

              {/* Speakers */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Speakers (comma-separated)</label>
                <input type="text" name="speakers" value={formData.speakers} onChange={handleChange}
                  placeholder="Dr. Ramesh Nair, Rajan Jha"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground focus:outline-none focus:border-foreground/50"
                />
              </div>

              {/* Banner Image with Cloudinary Upload */}
              <div className="sm:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono uppercase text-muted-foreground">
                    Banner Image (Cloudinary Upload or URL)
                  </label>
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-foreground/10 hover:bg-foreground/15 text-foreground text-xs font-mono transition-colors">
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-500" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5 text-sky-500" />
                        <span>Upload File (Cloudinary)</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploading}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  placeholder="https://res.cloudinary.com/... or https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-xs font-mono text-foreground focus:outline-none focus:border-foreground/50"
                />

                {formData.imageUrl && (
                  <div className="relative mt-2 w-full h-32 rounded-xl overflow-hidden border border-foreground/15 bg-foreground/5">
                    <img
                      src={formData.imageUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                      title="Remove Image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Short description */}
              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Zoom Meeting Link</label>
                <input type="url" name="meetingLink" value={formData.meetingLink} onChange={handleChange}
                  placeholder="https://us06web.zoom.us/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-xs font-mono text-foreground focus:outline-none focus:border-foreground/50"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Google Calendar Link</label>
                <input type="url" name="calendarLink" value={formData.calendarLink} onChange={handleChange}
                  placeholder="https://calendar.app.google/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-xs font-mono text-foreground focus:outline-none focus:border-foreground/50"
                />
              </div>

              {/* Short description */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Short Description (card preview) *</label>
                <textarea name="description" required rows={2} value={formData.description} onChange={handleChange}
                  placeholder="Brief one-liner shown on the card..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground focus:outline-none focus:border-foreground/50"
                />
              </div>

              {/* Full description */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Full Description (detail panel)</label>
                <textarea name="fullDescription" rows={4} value={formData.fullDescription} onChange={handleChange}
                  placeholder="Detailed event description shown in the slide-in panel..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground focus:outline-none focus:border-foreground/50"
                />
              </div>

              {/* Submit */}
              <div className="sm:col-span-2 flex gap-3">
                <Button
                  type="submit" disabled={isSubmitting}
                  className="flex-1 h-11 rounded-xl bg-foreground text-background font-semibold text-sm flex items-center justify-center gap-2 hover:bg-foreground/90 transition-all shadow-md"
                >
                  {isSubmitting ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>{editingId ? "Update Event" : "Publish Event"}</span>
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel} className="h-11 px-5 rounded-xl">
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Events List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold">All Events</h2>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">
                {events.length} event{events.length !== 1 ? "s" : ""} in store
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={loadEvents} className="rounded-full text-xs gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>

          {events.length === 0 && (
            <div className="text-center py-16 text-muted-foreground font-mono text-sm">
              No events yet — create your first one above.
            </div>
          )}

          <div className="grid gap-4">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="p-5 rounded-2xl border border-foreground/15 bg-background flex flex-col sm:flex-row gap-4 shadow-sm hover:border-foreground/30 transition-all group"
              >
                {/* Image thumbnail */}
                {ev.imageUrl && (
                  <div className="w-full sm:w-28 h-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={ev.imageUrl} alt={ev.title} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-semibold ${
                      resolveEventStatus(ev) === 'upcoming'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-foreground/10 text-muted-foreground'
                    }`}>
                      {resolveEventStatus(ev)}
                    </span>
                    {resolveEventStatus(ev) === 'upcoming' && (
                      <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-semibold ${
                        isRegistrationOpen(ev)
                          ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20'
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {isRegistrationOpen(ev) ? 'reg open' : 'reg closed'}
                      </span>
                    )}
                    <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-foreground/10 text-foreground font-semibold">
                      {ev.category}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {ev.month} {ev.day} {ev.eventDate ? `— ${new Date(ev.eventDate).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}` : ''}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-foreground leading-tight line-clamp-1">
                    {ev.title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                    {ev.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground pt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-foreground/50" />
                      {ev.location}
                    </span>
                    {ev.attendees && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-foreground/50" />
                        {ev.attendees}
                      </span>
                    )}
                    {ev.price && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Tag className="w-3 h-3" />
                        {ev.price}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm" variant="outline"
                    onClick={() => handleEdit(ev)}
                    className="rounded-full h-9 px-3 gap-1 text-xs hover:border-amber-500/30 hover:text-amber-400"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => handleDelete(ev.id)}
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-full h-9 px-3 gap-1 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
