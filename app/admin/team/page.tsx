"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  Trash2,
  Sparkles,
  RefreshCw,
  Pencil,
  X,
  Upload,
  Loader2,
  Linkedin,
  Twitter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getTeamMembers,
  saveTeamMember,
  deleteTeamMember,
  createBlankTeamMember,
  TeamMember,
} from "@/lib/team-store";

function emptyForm() {
  return {
    name: "",
    role: "",
    bio: "",
    imageUrl: "",
    linkedin: "",
    twitter: "",
    order: 0,
  };
}

export default function AdminTeamPage() {
  const router = useRouter();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState(emptyForm());

  useEffect(() => {
    let active = true;
    const verifyAdminSession = async () => {
      if (typeof window === "undefined" || localStorage.getItem("qni_admin_authenticated") !== "true") {
        router.push("/admin");
        return;
      }

      try {
        const response = await fetch("/api/admin/session", { credentials: "include", cache: "no-store" });
        const data = await response.json();
        if (active && !data.authenticated) {
          localStorage.removeItem("qni_admin_authenticated");
          alert("Admin session expired. Please log in again.");
          router.push("/admin");
        }
      } catch {
        if (active) router.push("/admin");
      }
    };

    verifyAdminSession();
    return () => {
      active = false;
    };
  }, [router]);

  const loadMembers = async () => {
    const localMembers = getTeamMembers();
    setMembers(localMembers);
    try {
      const res = await fetch("/api/team");
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const remote: TeamMember[] = data.data.map((m: any) => ({
          id: m.id || (m._id ? String(m._id) : Date.now().toString()),
          name: m.name || "",
          role: m.role || "",
          bio: m.bio || "",
          imageUrl: m.imageUrl || "",
          linkedin: m.linkedin || "",
          twitter: m.twitter || "",
          order: typeof m.order === "number" ? m.order : 99,
          createdAt: m.createdAt || new Date().toISOString(),
        }));
        const merged = [...localMembers];
        remote.forEach((member) => {
          const index = merged.findIndex((existing) => existing.id === member.id);
          if (index >= 0) merged[index] = member;
          else merged.push(member);
        });
        setMembers(merged.sort((a, b) => a.order - b.order));
      }
    } catch {
      // fall back to local store silently
    }
  };

  useEffect(() => {
    loadMembers();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError("");
    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: data,
      });
      const result = await res.json();
      if (result.success && result.url) {
        setFormData((prev) => ({ ...prev, imageUrl: result.url }));
      } else {
        setUploadError(result.error || "Upload failed");
      }
    } catch (err) {
      console.error("Error uploading file:", err);
      setUploadError("Failed to upload image. Please try again or paste an image URL.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (member: TeamMember) => {
    setEditingId(member.id);
    setFormData({
      name: member.name,
      role: member.role,
      bio: member.bio,
      imageUrl: member.imageUrl,
      linkedin: member.linkedin,
      twitter: member.twitter || "",
      order: member.order,
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

    const memberPayload: TeamMember = {
      id: editingId || Date.now().toString(),
      name: formData.name,
      role: formData.role,
      bio: formData.bio,
      imageUrl: formData.imageUrl,
      linkedin: formData.linkedin,
      twitter: formData.twitter,
      order: Number(formData.order) || 0,
      createdAt: new Date().toISOString(),
    };

    saveTeamMember(memberPayload);

    try {
      if (editingId) {
        await fetch("/api/team", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(memberPayload),
        }).catch(() => {});
      } else {
        await fetch("/api/team", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(memberPayload),
        }).catch(() => {});
      }
    } catch {}

    await loadMembers();
    setSuccessMessage(editingId ? "Team member updated successfully!" : "Team member added successfully!");
    setEditingId(null);
    setFormData(emptyForm());
    setShowForm(false);
    setIsSubmitting(false);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Permanently remove this team member?")) return;
    deleteTeamMember(id);
    fetch(`/api/team?id=${id}`, { method: "DELETE" }).catch(() => {});
    loadMembers();
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
                Team Management Portal
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Admin
                </span>
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                Add, edit, and manage the QNexus team page
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/team" target="_blank">
              <Button size="sm" variant="outline" className="rounded-full text-xs gap-1.5">
                View Public Team Page →
              </Button>
            </Link>
            <Button
              size="sm"
              onClick={() => { setShowForm(true); setEditingId(null); setFormData(emptyForm()); }}
              className="rounded-full text-xs gap-1.5 bg-foreground text-background"
            >
              <Plus className="w-3.5 h-3.5" /> New Member
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
                  {editingId ? "Edit Team Member" : "Add New Team Member"}
                </h2>
              </div>
              <button onClick={handleCancel} className="p-2 rounded-full hover:bg-foreground/10 transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            {uploadError && (
              <p className="text-sm text-rose-400" role="alert">{uploadError}</p>
            )}

            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Full Name *</label>
                <input
                  type="text" name="name" required value={formData.name} onChange={handleChange}
                  placeholder="e.g. Sharvan Kumar Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground focus:outline-none focus:border-foreground/50 transition-colors"
                />
              </div>

              {/* Role / Position */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                  Position / Title <span className="text-foreground/40 normal-case">(leave blank for regular team members — only the founder should carry a title)</span>
                </label>
                <input
                  type="text" name="role" value={formData.role} onChange={handleChange}
                  placeholder="Founder & President (leave blank for other members)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground focus:outline-none focus:border-foreground/50"
                />
              </div>

              {/* LinkedIn + Twitter */}
              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">LinkedIn URL</label>
                <input
                  type="url" name="linkedin" value={formData.linkedin} onChange={handleChange}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-xs font-mono text-foreground focus:outline-none focus:border-foreground/50"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Twitter / X URL</label>
                <input
                  type="url" name="twitter" value={formData.twitter} onChange={handleChange}
                  placeholder="https://twitter.com/username"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-xs font-mono text-foreground focus:outline-none focus:border-foreground/50"
                />
              </div>

              {/* Display order */}
              <div className="sm:col-span-2 sm:w-48">
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Display Order</label>
                <input
                  type="number" name="order" value={formData.order} onChange={handleChange}
                  placeholder="1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground focus:outline-none focus:border-foreground/50"
                />
              </div>

              {/* Photo with Cloudinary Upload */}
              <div className="sm:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono uppercase text-muted-foreground">
                    Photo (Cloudinary Upload or URL)
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
                  placeholder="https://res.cloudinary.com/... or /team/photo.jpg"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-xs font-mono text-foreground focus:outline-none focus:border-foreground/50"
                />

                {formData.imageUrl && (
                  <div className="relative mt-2 w-24 h-32 rounded-xl overflow-hidden border border-foreground/15 bg-foreground/5">
                    <img
                      src={formData.imageUrl}
                      alt="Photo Preview"
                      className="w-full h-full object-cover object-top"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                      title="Remove Image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Bio */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">Bio</label>
                <textarea name="bio" rows={3} value={formData.bio} onChange={handleChange}
                  placeholder="Short description shown on the team member's profile card..."
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
                      <span>{editingId ? "Update Member" : "Add Member"}</span>
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

        {/* Team List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold">All Team Members</h2>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">
                {members.length} member{members.length !== 1 ? "s" : ""} in store
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={loadMembers} className="rounded-full text-xs gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>

          {members.length === 0 && (
            <div className="text-center py-16 text-muted-foreground font-mono text-sm">
              No team members yet — add your first one above.
            </div>
          )}

          <div className="grid gap-4">
            {members.map((m) => (
              <div
                key={m.id}
                className="p-5 rounded-2xl border border-foreground/15 bg-background flex flex-col sm:flex-row gap-4 shadow-sm hover:border-foreground/30 transition-all group"
              >
                {/* Image thumbnail */}
                {m.imageUrl && (
                  <div className="w-full sm:w-20 h-28 sm:h-24 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={m.imageUrl} alt={m.name} className="w-full h-full object-cover object-top" />
                  </div>
                )}

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">#{m.order}</span>
                    {m.role ? (
                      <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {m.role}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full font-semibold bg-foreground/10 text-muted-foreground">
                        No title
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-lg font-bold text-foreground leading-tight line-clamp-1">
                    {m.name}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {m.bio}
                  </p>

                  <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground pt-0.5">
                    {m.linkedin && (
                      <span className="flex items-center gap-1">
                        <Linkedin className="w-3 h-3 text-foreground/50" /> LinkedIn
                      </span>
                    )}
                    {m.twitter && (
                      <span className="flex items-center gap-1">
                        <Twitter className="w-3 h-3 text-foreground/50" /> Twitter
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col items-center gap-2 flex-shrink-0">
                  <Button
                    size="sm" variant="outline"
                    onClick={() => handleEdit(m)}
                    className="rounded-full h-9 px-3 gap-1 text-xs hover:border-amber-500/30 hover:text-amber-400"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => handleDelete(m.id)}
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
