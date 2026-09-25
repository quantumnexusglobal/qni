"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Linkedin,
  Twitter,
  Mail,
  Sparkles,
  UserPlus,
  X,
  CheckCircle2,
  Send,
} from "lucide-react";
import { saveJoin } from "@/lib/submissions-store";
import { getTeamMembers, TeamMember } from "@/lib/team-store";

export default function TeamPageClient() {
  const [isVisible, setIsVisible] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState<{
    name: string;
    src: string;
    role: string;
    bio: string;
    linkedin: string;
    twitter?: string;
  } | null>(null);

  // Modal State for "Join Team" Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    position: "Quantum Developer / Engineer",
    expertise: "quantum-algorithms",
    experience: "Intermediate",
    country: "India",
    linkedin: "",
    message: "",
  });

  useEffect(() => {
    setIsVisible(true);
    const localMembers = getTeamMembers();
    setTeamMembers(localMembers);

    // Merge in any admin-edited members synced to MongoDB so changes made
    // through the admin dashboard are visible to every visitor.
    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => {
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
          setTeamMembers(merged.sort((a, b) => a.order - b.order));
        }
      })
      .catch(() => {
        // MongoDB not configured / offline — keep local defaults
      });
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Save to Client Local/Session Store for immediate Admin Dashboard reflection
      saveJoin({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone || "N/A",
        company: formData.company || "Independent",
        position: formData.position,
        expertise: formData.expertise,
        experience: formData.experience,
        country: formData.country,
        message: `${formData.message} ${
          formData.linkedin ? `[LinkedIn: ${formData.linkedin}]` : ""
        }`,
      });

      // 2. Submit to MongoDB / API backend
      await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.fullName,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          position: formData.position,
          expertise: formData.expertise,
          experience: formData.experience,
          country: formData.country,
          linkedin: formData.linkedin,
          message: formData.message,
        }),
      }).catch((err) =>
        console.warn("API POST warn (fallback to local store):", err)
      );

      setIsSubmitted(true);
    } catch (err) {
      console.error("Error submitting team application:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFormModal = () => {
    setIsModalOpen(false);
    setIsSubmitted(false);
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      company: "",
      position: "Quantum Developer / Engineer",
      expertise: "quantum-algorithms",
      experience: "Intermediate",
      country: "India",
      linkedin: "",
      message: "",
    });
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      {/* Hero Banner with Gallery Image Background */}
      <section className="relative h-[55vh] min-h-[440px] flex items-end overflow-hidden">
        {/* Background image from gallery */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1600&auto=format&fit=crop&q=80"
          alt="QNG Team Gallery"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12 pb-10 w-full">
          <div
            className={`transition-all duration-700 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-foreground/70 hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>

              {/* Join Team Button */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-2.5 rounded-full bg-foreground text-background font-medium text-sm flex items-center gap-2 hover:bg-foreground/90 transition-all shadow-lg hover:shadow-xl group"
              >
                <UserPlus className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
                <span>Join Our Team</span>
              </button>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-mono tracking-[0.25em] uppercase text-muted-foreground">
                QNexus Team
              </span>
            </div>

            <h1 className="text-4xl lg:text-7xl font-display tracking-tight leading-none mb-4">
              The People Behind <br />
              <span className="text-muted-foreground">the Community</span>
            </h1>

            <p className="text-base lg:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Students and early quantum enthusiasts building a free, student-first community — open to students everywhere.
            </p>
          </div>
        </div>
      </section>

      {/* Team Grid Section — Exactly 4 cards displayed */}
      <section className="max-w-[1400px] mx-auto px-6 lg:px-12 py-12 lg:py-16">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-foreground/10">
          <div>
            <h2 className="text-2xl font-display font-semibold">Core Leadership & Team</h2>
            <p className="text-xs font-mono text-muted-foreground mt-1">
              Showing key leadership profiles ({teamMembers.length} members)
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="text-xs font-mono text-foreground hover:underline flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" /> Apply to join our team →
          </button>
        </div>

        {teamMembers.length === 0 ? (
          <p className="text-muted-foreground text-center py-20 font-mono text-sm">
            No team members found.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
            {teamMembers.map((member, index) => {
              const isRevealed = activeCard === member.id;

              return (
                <div
                  key={member.id}
                  className={`group relative rounded-2xl overflow-hidden border border-foreground/10 bg-foreground/5 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-foreground/30 ${
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${index * 80}ms` }}
                  onClick={() =>
                    setSelectedTeamMember({
                      name: member.name,
                      src: member.imageUrl,
                      role: member.role,
                      bio: member.bio,
                      linkedin: member.linkedin,
                      twitter: member.twitter,
                    })
                  }
                >
                  {/* Image Container */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden">
                    <Image
                      src={member.imageUrl}
                      alt={member.name}
                      fill
                      className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80 group-hover:opacity-20 transition-opacity duration-300" />

                    {/* Glassmorphism Hover / Click Revealing Overlay */}
                    <div
                      className={`absolute inset-0 bg-black/80 backdrop-blur-xl border border-white/10 text-white p-6 flex flex-col justify-between transition-all duration-500 shadow-2xl ${
                        isRevealed
                          ? "opacity-100 pointer-events-auto"
                          : "opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
                      }`}
                    >
                      <div>
                        {member.role && (
                          <span className="inline-block px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider rounded-full bg-white/10 text-white mb-3 border border-white/15">
                            {member.role}
                          </span>
                        )}
                        <h4 className="text-xl font-display font-medium text-white mb-2 leading-tight">
                          {member.name}
                        </h4>
                        <p className="text-xs text-white/80 leading-relaxed font-sans">
                          {member.bio}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-white/15">
                        <p className="text-[10px] font-mono uppercase text-white/60 tracking-widest mb-3">
                          Click to view profile →
                        </p>
                        <div className="flex items-center gap-3">
                          {member.linkedin && (
                            <a
                              href={member.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2.5 rounded-full bg-white text-black hover:bg-white/90 transition-colors shadow-md flex items-center gap-1.5 font-medium text-xs px-3"
                              aria-label="LinkedIn"
                              title="LinkedIn Profile"
                            >
                              <Linkedin className="w-4 h-4 fill-current" />
                              <span>LinkedIn</span>
                            </a>
                          )}
                          {member.twitter && (
                            <a
                              href={member.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2.5 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors border border-white/10"
                              aria-label="Twitter"
                              title="Twitter / X"
                            >
                              <Twitter className="w-4 h-4" />
                            </a>
                          )}
                          <a
                            href={`mailto:rajan.quantumnexusgobal@gmail.com`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2.5 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors border border-white/10"
                            aria-label="Email"
                            title="Send Email"
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-4 bg-background border-t border-foreground/5 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-display font-medium text-foreground leading-tight">
                        {member.name}
                      </h3>
                      {member.role && (
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">
                          {member.role}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {member.linkedin && (
                        <a
                          href={member.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 rounded-full bg-foreground/10 hover:bg-foreground/20 text-foreground transition-colors"
                          title={`LinkedIn profile for ${member.name}`}
                        >
                          <Linkedin className="w-3.5 h-3.5 fill-current" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* TEAM APPLICATION MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={resetFormModal}
        >
          <div
            className="bg-card text-card-foreground border border-foreground/20 w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={resetFormModal}
              className="absolute top-5 right-5 w-9 h-9 rounded-full bg-foreground/10 hover:bg-foreground/20 flex items-center justify-center text-foreground transition-colors"
              aria-label="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>

            {isSubmitted ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-display font-bold">
                  Application Submitted!
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                  Thank you for applying to join the QNexus team. Your application has been saved and sent to our team for review.
                </p>
                <button
                  onClick={resetFormModal}
                  className="px-6 py-2.5 rounded-full bg-foreground text-background font-medium text-sm hover:bg-foreground/90 transition-all mt-4"
                >
                  Close & Back to Team
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <span className="text-xs font-mono tracking-widest text-amber-500 uppercase">
                    Volunteer With Us
                  </span>
                  <h3 className="text-2xl lg:text-3xl font-display font-bold text-foreground mt-1">
                    Join the QNexus Team
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Fill in your details below. Your submission will be stored and reviewed directly by the admin team.
                  </p>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleInputChange}
                        placeholder="Dr. Sarah Chen"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground focus:outline-none focus:border-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="sarah@institution.edu"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground focus:outline-none focus:border-foreground"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+1 555 123 4567"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground focus:outline-none focus:border-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                        Company / Institution
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        placeholder="IISc / Stanford / TCS"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground focus:outline-none focus:border-foreground"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                        Target Role / Position *
                      </label>
                      <input
                        type="text"
                        name="position"
                        required
                        value={formData.position}
                        onChange={handleInputChange}
                        placeholder="Quantum Engineer / Researcher"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground focus:outline-none focus:border-foreground"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                        Primary Expertise
                      </label>
                      <select
                        name="expertise"
                        value={formData.expertise}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground focus:outline-none focus:border-foreground"
                      >
                        <option value="quantum-algorithms">
                          Quantum Algorithms & VQE
                        </option>
                        <option value="quantum-ml">Quantum ML & AI</option>
                        <option value="quantum-hardware">
                          Hardware & QPU Simulation
                        </option>
                        <option value="software-dev">
                          Software Engineering & Cloud
                        </option>
                        <option value="student-chapter">
                          Student Chapter Leader
                        </option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                      LinkedIn or Portfolio URL
                    </label>
                    <input
                      type="url"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      placeholder="https://linkedin.com/in/yourprofile"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground focus:outline-none focus:border-foreground text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono uppercase text-muted-foreground mb-1">
                      Statement of Interest / Bio *
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={3}
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Briefly describe your quantum background, research interests, or contribution goals..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-foreground/15 bg-background text-sm text-foreground focus:outline-none focus:border-foreground"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={resetFormModal}
                      className="px-5 py-2.5 rounded-full border border-foreground/20 hover:bg-foreground/5 text-xs font-medium text-foreground transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-full bg-foreground text-background font-medium text-xs flex items-center gap-2 hover:bg-foreground/90 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span>Submitting...</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Application</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TEAM MEMBER PROFILE POPUP MODAL (Testimonial Style) */}
      {selectedTeamMember && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedTeamMember(null)}
        >
          <div
            className="bg-card text-card-foreground border border-border w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedTeamMember(null)}
              className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-background/80 hover:bg-background border border-border text-foreground flex items-center justify-center transition-transform hover:scale-105"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header Banner */}
            <div className="relative h-60 sm:h-72 overflow-hidden">
              <img
                src={selectedTeamMember.src}
                alt={selectedTeamMember.name}
                className="w-full h-full object-cover object-top filter brightness-95"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              <div className="absolute bottom-4 left-6 sm:left-8 flex items-center gap-2">
                <span className="bg-foreground text-background font-mono text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md uppercase">
                  CORE TEAM MEMBER
                </span>
                {selectedTeamMember.role && (
                  <span className="bg-background/90 backdrop-blur-md text-foreground font-mono text-xs font-bold px-3 py-1 rounded-full border border-border shadow-md">
                    {selectedTeamMember.role}
                  </span>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Profile Details */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                    {selectedTeamMember.name}
                  </h3>
                  {selectedTeamMember.role && (
                    <p className="text-sm font-medium text-muted-foreground mt-0.5">
                      {selectedTeamMember.role}
                    </p>
                  )}
                  <p className="text-xs font-mono text-foreground/80 mt-1">
                    QNexus
                  </p>
                </div>

                {/* Social Links Buttons */}
                <div className="flex items-center gap-2.5">
                  {selectedTeamMember.linkedin && (
                    <a
                      href={selectedTeamMember.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs font-semibold shadow-md transition-transform hover:scale-105"
                    >
                      <Linkedin className="w-4 h-4" />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {selectedTeamMember.twitter && (
                    <a
                      href={selectedTeamMember.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-full bg-foreground/10 hover:bg-foreground/20 text-foreground transition-transform hover:scale-105"
                      title="Twitter / X Profile"
                    >
                      <Twitter className="w-4 h-4" />
                    </a>
                  )}
                  <a
                    href="mailto:rajan.quantumnexusgobal@gmail.com"
                    className="p-2.5 rounded-full bg-foreground/10 hover:bg-foreground/20 text-foreground transition-transform hover:scale-105"
                    title="Email"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Bio & Overview */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase tracking-widest text-muted-foreground">About & Profile</h4>
                <p className="text-base leading-relaxed text-foreground font-sans">
                  {selectedTeamMember.bio}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="h-12" />
    </main>
  );
}
