'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/landing/navigation';
import {
  PenSquare,
  Lock,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  BookOpen,
  ArrowLeft,
  Search,
  User,
  FileText,
  AlertTriangle,
  Globe,
  Upload,
  Loader2,
  X,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlogPost } from '@/lib/blogs-store';

export default function TeamPortalPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [teamEmail, setTeamEmail] = useState('');
  const [teamPassword, setTeamPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorRole, setAuthorRole] = useState('Guest Contributor');

  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [activeTab, setActiveTab] = useState<'my-blogs' | 'create' | 'resources'>('my-blogs');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form State for Write / Edit Blog
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    category: 'Quantum Algorithms',
    coverImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80',
    content: '',
    readTime: '5 min read',
    status: 'Published' as 'Published' | 'Draft',
    tags: 'Quantum, Algorithms, Qiskit',
  });

  const [notification, setNotification] = useState<string | null>(null);

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
        setFormData((prev) => ({ ...prev, coverImage: result.url }));
      } else {
        alert(result.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Error uploading blog image:', err);
      alert('Failed to upload image. Please try again or use direct URL.');
    } finally {
      setIsUploading(false);
    }
  };

  // Check login on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const auth = sessionStorage.getItem('qni_team_authenticated');
      const savedAuthor = sessionStorage.getItem('qni_team_author_name');
      const savedRole = sessionStorage.getItem('qni_team_author_role');
      if (auth === 'true') {
        setIsAuthenticated(true);
        if (savedAuthor) setAuthorName(savedAuthor);
        if (savedRole) setAuthorRole(savedRole);
      }
    }
  }, []);

  // Load blogs
  const refreshBlogs = async () => {
    const response = await fetch('/api/blogs', { cache: 'no-store' });
    if (response.status === 401) {
      handleLogout();
      return;
    }
    const data = await response.json();
    if (data.success && Array.isArray(data.data)) setBlogs(data.data);
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshBlogs().catch(() => setLoginError('Unable to load blogs from the server.'));
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const response = await fetch('/api/blog-writers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: teamEmail, password: teamPassword }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setAuthorName(data.writer.name);
        setAuthorRole(data.writer.role);
        setIsAuthenticated(true);
        sessionStorage.setItem('qni_team_authenticated', 'true');
        sessionStorage.setItem('qni_team_author_name', data.writer.name);
        sessionStorage.setItem('qni_team_author_role', data.writer.role);
        return;
      }
      setLoginError(data.message || 'Invalid writer email or password.');
    } catch {
      setLoginError('Unable to connect to the writer portal.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/blog-writers/logout', { method: 'POST' }).catch(() => {});
    setIsAuthenticated(false);
    sessionStorage.removeItem('qni_team_authenticated');
    sessionStorage.removeItem('qni_team_author_name');
    sessionStorage.removeItem('qni_team_author_role');
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      alert('Please fill out title and content fields.');
      return;
    }

    const tagList = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const blogPayload = {
      id: editingPostId || undefined,
      title: formData.title,
      slug: formData.slug,
      excerpt: formData.excerpt,
      category: formData.category,
      coverImage: formData.coverImage,
      content: formData.content,
      readTime: formData.readTime,
      status: formData.status,
      tags: tagList,
      author: {
        name: authorName,
        role: authorRole,
        email: teamEmail,
      },
    };
    const response = await fetch('/api/blogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(blogPayload),
    });
    if (!response.ok) {
      alert('Unable to save this blog on the server.');
      return;
    }

    setNotification(editingPostId ? 'Article updated successfully!' : 'New article published successfully!');
    setTimeout(() => setNotification(null), 4000);

    // Reset Form & Switch Tab
    setEditingPostId(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      category: 'Quantum Algorithms',
      coverImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80',
      content: '',
      readTime: '5 min read',
      status: 'Published',
      tags: 'Quantum, Algorithms',
    });
    setActiveTab('my-blogs');
    await refreshBlogs();
  };

  const handleEditClick = (post: BlogPost) => {
    setEditingPostId(post.id);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      category: post.category,
      coverImage: post.coverImage,
      content: post.content,
      readTime: post.readTime,
      status: post.status === 'Archived' ? 'Draft' : post.status,
      tags: post.tags.join(', '),
    });
    setActiveTab('create');
  };

  const handleDeleteClick = async (id: string) => {
    if (confirm('Are you sure you want to delete this article?')) {
      const response = await fetch(`/api/blogs?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!response.ok) {
        alert('Unable to delete this blog on the server.');
        return;
      }
      await refreshBlogs();
      setNotification('Article deleted.');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // If not logged in
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-background text-foreground relative flex items-center justify-center p-6">
        <Navigation />

        <div className="w-full max-w-md bg-foreground/[0.03] border border-foreground/10 rounded-3xl p-8 shadow-2xl relative z-10 my-28">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-foreground/10 border border-foreground/10 flex items-center justify-center mx-auto mb-4 text-foreground">
              <PenSquare className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-display mb-2">Team Writer Portal</h1>
            <p className="text-xs text-muted-foreground">
              Log in to publish & manage research blogs for Quantum Nexus Global.
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase block mb-1.5">
                Invited writer email
              </label>
              <p className="text-[11px] text-muted-foreground mb-1">
                Use the email address that received the admin invitation.
              </p>
            </div>

            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase block mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={teamEmail}
                onChange={(e) => setTeamEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-foreground/5 border border-foreground/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-foreground/30 placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-muted-foreground uppercase block mb-1.5">Invite password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={teamPassword}
                onChange={(e) => setTeamPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 bg-foreground/5 border border-foreground/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-foreground/30"
              />
              <span className="text-[11px] text-muted-foreground mt-1 block">
                Use the generated password from the admin invitation email.
              </span>
            </div>

            <Button
              type="submit"
              className="w-full py-3 bg-foreground text-background hover:bg-foreground/90 rounded-xl font-medium text-sm transition-all"
            >
              Sign In to Writer Portal
            </Button>
          </form>

          {/* Role separation notice */}
          <div className="mt-6 pt-6 border-t border-foreground/10 text-center">
            <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5">
              <Lock className="w-3 h-3" />
              Note: Team Portal does not grant access to <code className="text-foreground">/admin</code>.
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Logged-in Team Portal Dashboard
  return (
    <main className="min-h-screen bg-background text-foreground pt-28 pb-20 px-6 lg:px-12">
      <Navigation />

      <div className="max-w-[1400px] mx-auto">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 mb-8 border-b border-foreground/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Team Writer Portal
            </div>
            <h1 className="text-3xl font-display">Welcome, {authorName}</h1>
            <p className="text-xs text-muted-foreground">{authorRole} • Quantum Nexus Global</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/blog"
              target="_blank"
              className="px-4 py-2 rounded-xl border border-foreground/20 hover:bg-foreground/10 text-xs font-medium inline-flex items-center gap-1.5 transition-all"
            >
              <Globe className="w-3.5 h-3.5" />
              View Live Public Blog
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-medium inline-flex items-center gap-1.5 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log Out
            </button>
          </div>
        </div>

        {/* Security Info Banner */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-8 flex items-center justify-between text-xs text-amber-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>Role Access Status:</strong> You are logged in as a Team Member. You can write, edit, and publish blogs, and you have Resources access. Admin Dashboard (<code className="text-amber-200">/admin</code>) is strictly restricted to Admin credentials.
            </span>
          </div>
        </div>

        {/* Success Notification Banner */}
        {notification && (
          <div className="p-4 mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notification}</span>
          </div>
        )}

        {/* Tabs Header */}
        <div className="flex items-center gap-4 mb-8 border-b border-foreground/10 pb-4">
          <button
            onClick={() => setActiveTab('my-blogs')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all inline-flex items-center gap-2 ${
              activeTab === 'my-blogs'
                ? 'bg-foreground text-background font-semibold'
                : 'bg-foreground/5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground'
            }`}
          >
            <FileText className="w-4 h-4" />
            All Articles ({blogs.length})
          </button>
          <button
            onClick={() => {
              setEditingPostId(null);
              setFormData({
                title: '',
                slug: '',
                excerpt: '',
                category: 'Quantum Algorithms',
                coverImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80',
                content: '',
                readTime: '5 min read',
                status: 'Published',
                tags: 'Quantum, Algorithms',
              });
              setActiveTab('create');
            }}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all inline-flex items-center gap-2 ${
              activeTab === 'create'
                ? 'bg-foreground text-background font-semibold'
                : 'bg-foreground/5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground'
            }`}
          >
            <Plus className="w-4 h-4" />
            {editingPostId ? 'Edit Article' : 'Write New Article'}
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all inline-flex items-center gap-2 ${
              activeTab === 'resources'
                ? 'bg-foreground text-background font-semibold'
                : 'bg-foreground/5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            Resources
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[9px] font-mono uppercase tracking-wider border border-amber-500/20">
              Soon
            </span>
          </button>
        </div>

        {/* Tab 1: Articles List */}
        {activeTab === 'my-blogs' && (
          <div>
            {blogs.length === 0 ? (
              <div className="text-center py-16 bg-foreground/5 rounded-3xl border border-foreground/10">
                <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-display mb-1">No Articles Published Yet</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Start by writing your first quantum research article.
                </p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-4 py-2 rounded-xl bg-foreground text-background text-xs font-medium"
                >
                  Write Article Now
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {blogs.map((post) => (
                  <div
                    key={post.id}
                    className="p-5 rounded-2xl bg-foreground/[0.02] border border-foreground/10 hover:border-foreground/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-20 h-20 rounded-xl object-cover shrink-0 hidden sm:block"
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-foreground/10 text-[10px] font-mono">
                            {post.category}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono ${
                              post.status === 'Published'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {post.status}
                          </span>
                        </div>
                        <h3 className="text-base font-display mb-1">{post.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{post.excerpt}</p>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          By {post.author.name} • {new Date(post.publishedAt).toLocaleDateString()} • {post.readTime}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center">
                      <Link
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="p-2 rounded-xl hover:bg-foreground/10 border border-foreground/10 text-xs text-muted-foreground hover:text-foreground transition-all"
                        title="Preview Public Page"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleEditClick(post)}
                        className="p-2 rounded-xl hover:bg-foreground/10 border border-foreground/10 text-xs text-muted-foreground hover:text-foreground transition-all"
                        title="Edit Article"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(post.id)}
                        className="p-2 rounded-xl hover:bg-red-500/10 border border-red-500/20 text-xs text-red-400 transition-all"
                        title="Delete Article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Create / Edit Article Form */}
        {activeTab === 'create' && (
          <form onSubmit={handleSaveArticle} className="bg-foreground/[0.02] border border-foreground/10 rounded-3xl p-6 lg:p-8 space-y-6">
            <h2 className="text-xl font-display border-b border-foreground/10 pb-4">
              {editingPostId ? 'Edit Article' : 'Write New Article'}
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-mono uppercase text-muted-foreground block mb-2">
                  Article Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Pulse-Level Optimization in Qiskit"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-foreground/5 border border-foreground/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-foreground/30"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-muted-foreground block mb-2">
                  Custom URL Slug (Optional)
                </label>
                <input
                  type="text"
                  placeholder="pulse-level-optimization-qiskit"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2.5 bg-foreground/5 border border-foreground/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-foreground/30"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs font-mono uppercase text-muted-foreground block mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-foreground/5 border border-foreground/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-foreground/30"
                >
                  <option value="Quantum Algorithms">Quantum Algorithms</option>
                  <option value="Quantum Infrastructure">Quantum Infrastructure</option>
                  <option value="Quantum AI">Quantum AI</option>
                  <option value="NISQ Error Mitigation">NISQ Error Mitigation</option>
                  <option value="Quantum Tech">Quantum Tech</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-muted-foreground block mb-2">
                  Read Time Estimate
                </label>
                <input
                  type="text"
                  placeholder="e.g., 6 min read"
                  value={formData.readTime}
                  onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                  className="w-full px-4 py-2.5 bg-foreground/5 border border-foreground/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-foreground/30"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase text-muted-foreground block mb-2">
                  Publishing Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-4 py-2.5 bg-foreground/5 border border-foreground/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-foreground/30"
                >
                  <option value="Published">Published (Public)</option>
                  <option value="Draft">Draft (Private)</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase text-muted-foreground">
                  Cover Image (Cloudinary Upload or URL)
                </label>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-foreground/10 hover:bg-foreground/15 text-foreground text-xs font-mono transition-colors">
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-purple-400" />
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
                type="text"
                placeholder="https://res.cloudinary.com/... or https://images.unsplash.com/..."
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                className="w-full px-4 py-2.5 bg-foreground/5 border border-foreground/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-foreground/30"
              />

              {formData.coverImage && (
                <div className="relative mt-2 w-full h-36 rounded-xl overflow-hidden border border-foreground/15 bg-foreground/5">
                  <img
                    src={formData.coverImage}
                    alt="Cover Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, coverImage: '' }))}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    title="Remove Image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-mono uppercase text-muted-foreground block mb-2">
                Short Excerpt / Abstract *
              </label>
              <textarea
                rows={2}
                placeholder="Brief summary of the article..."
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                required
                className="w-full px-4 py-2.5 bg-foreground/5 border border-foreground/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-foreground/30"
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase text-muted-foreground block mb-2">
                Article Body Content (Markdown supported) *
              </label>
              <textarea
                rows={12}
                placeholder="Write your article content here... Use ### for headings, > for quotes, and ``` for code blocks."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
                className="w-full p-4 bg-foreground/5 border border-foreground/10 rounded-xl text-sm font-mono text-foreground focus:outline-none focus:border-foreground/30 leading-relaxed"
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase text-muted-foreground block mb-2">
                Tags (Comma Separated)
              </label>
              <input
                type="text"
                placeholder="VQE, Superconducting Qubits, Qiskit"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2.5 bg-foreground/5 border border-foreground/10 rounded-xl text-sm text-foreground focus:outline-none focus:border-foreground/30"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-foreground/10">
              <button
                type="button"
                onClick={() => setActiveTab('my-blogs')}
                className="px-5 py-2.5 rounded-xl border border-foreground/20 text-xs font-medium hover:bg-foreground/10 transition-all"
              >
                Cancel
              </button>
              <Button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium text-xs transition-all"
              >
                {editingPostId ? 'Save Changes' : 'Publish Article'}
              </Button>
            </div>
          </form>
        )}

        {/* Tab 3: Resources (Upcoming Feature) */}
        {activeTab === 'resources' && (
          <div className="text-center py-20 bg-foreground/5 rounded-3xl border border-foreground/10">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-amber-400 opacity-80" />
            <h3 className="text-xl font-display mb-2">Team Resources — Coming Soon</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              A shared library of research papers, templates, and internal docs for approved QNG team
              members is on the way. As a logged-in team member, you'll get access here automatically
              once it launches — no extra approval needed.
            </p>
            <div className="inline-flex items-center gap-1.5 mt-6 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              Access reserved for {authorName}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
