'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation } from '@/components/landing/navigation';
import {
  Search,
  BookOpen,
  Calendar,
  Clock,
  User,
  Tag,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';
import { getBlogs, BlogPost } from '@/lib/blogs-store';

export default function BlogPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from local store
    const loaded = getBlogs();
    setBlogs(loaded);
    setIsLoading(false);
  }, []);

  const categories = [
    'All',
    'Quantum Algorithms',
    'Quantum Infrastructure',
    'Quantum AI',
    'NISQ Error Mitigation',
    'Quantum Tech',
  ];

  // Filter published posts
  const publishedBlogs = blogs.filter((b) => b.status === 'Published');

  const filteredBlogs = publishedBlogs.filter((blog) => {
    const matchesSearch =
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'All' || blog.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const featuredPost = publishedBlogs.find((b) => b.featured) || publishedBlogs[0];

  return (
    <main className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navigation />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 px-6 lg:px-12 overflow-hidden border-b border-foreground/10">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-foreground/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-20 right-10 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-[1400px] mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground/5 border border-foreground/10 text-xs font-mono tracking-wider uppercase text-foreground/70 mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                Quantum Nexus Global Insights
              </div>
              <h1 className="text-4xl sm:text-6xl font-display tracking-tight leading-tight mb-4">
                QNG Tech Blog & Insights
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl">
                Explore deep dives into quantum algorithms, NISQ error mitigation, quantum neural networks, and scalable cloud architecture written by our team members and researchers.
              </p>
            </div>

          </div>

          {/* Search & Category Filter Bar */}
          <div className="bg-background/60 backdrop-blur-xl border border-foreground/10 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search articles, topics, or authors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-foreground/5 border border-foreground/10 rounded-xl text-sm focus:outline-none focus:border-foreground/30 transition-all text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Categories Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-foreground text-background font-semibold shadow-sm'
                      : 'bg-foreground/5 text-muted-foreground hover:bg-foreground/10 hover:text-foreground'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Blog Banner (Show if no search query & Featured exists) */}
      {!searchQuery && selectedCategory === 'All' && featuredPost && (
        <section className="px-6 lg:px-12 py-12 border-b border-foreground/10">
          <div className="max-w-[1400px] mx-auto">
            <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Featured Deep Dive
            </div>

            <div className="grid md:grid-cols-12 gap-8 bg-foreground/5 border border-foreground/10 rounded-3xl overflow-hidden hover:border-foreground/20 transition-all group">
              {/* Cover Image */}
              <div className="md:col-span-7 relative min-h-[320px] md:min-h-[420px] overflow-hidden bg-foreground/5 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={featuredPost.coverImage}
                  alt={featuredPost.title}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent md:hidden pointer-events-none" />
              </div>

              {/* Text Content */}
              <div className="md:col-span-5 p-8 lg:p-10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 rounded-full bg-foreground/10 border border-foreground/10 text-xs font-mono font-medium text-foreground">
                      {featuredPost.category}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {featuredPost.readTime}
                    </span>
                  </div>

                  <h2 className="text-2xl lg:text-4xl font-display mb-4 group-hover:text-foreground/90 transition-colors leading-snug">
                    <Link href={`/blog/${featuredPost.slug}`}>
                      {featuredPost.title}
                    </Link>
                  </h2>

                  <p className="text-muted-foreground text-sm lg:text-base mb-6 line-clamp-3 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-6 pt-4 border-t border-foreground/10">
                    <div className="w-10 h-10 rounded-full bg-foreground/10 border border-foreground/10 flex items-center justify-center font-display text-sm uppercase">
                      {featuredPost.author.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{featuredPost.author.name}</div>
                      <div className="text-xs text-muted-foreground">{featuredPost.author.role}</div>
                    </div>
                  </div>

                  <Link
                    href={`/blog/${featuredPost.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold hover:gap-3 transition-all"
                  >
                    Read Full Article
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Blog Grid */}
      <section className="px-6 lg:px-12 py-16">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl lg:text-3xl font-display">
              {selectedCategory === 'All' ? 'All Articles' : `${selectedCategory} Articles`}
            </h2>
            <span className="text-xs font-mono text-muted-foreground">
              Showing {filteredBlogs.length} articles
            </span>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 rounded-2xl bg-foreground/5 animate-pulse" />
              ))}
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="text-center py-20 bg-foreground/5 rounded-3xl border border-foreground/10">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-display mb-2">No articles found</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
                Try adjusting your search terms or selecting a different category filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="px-5 py-2.5 rounded-full border border-foreground/20 text-xs font-medium hover:bg-foreground/10 transition-all"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBlogs.map((post) => (
                <article
                  key={post.id}
                  className="bg-foreground/[0.02] border border-foreground/10 rounded-2xl overflow-hidden hover:border-foreground/25 hover:bg-foreground/[0.04] transition-all flex flex-col group"
                >
                  {/* Cover */}
                  <Link href={`/blog/${post.slug}`} className="relative h-52 overflow-hidden flex items-center justify-center bg-foreground/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-background/80 backdrop-blur-md text-[11px] font-mono font-medium border border-foreground/10">
                      {post.category}
                    </div>
                  </Link>

                  {/* Body */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(post.publishedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {post.readTime}
                        </span>
                      </div>

                      <h3 className="text-xl font-display mb-3 leading-snug group-hover:text-foreground/90 transition-colors">
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h3>

                      <p className="text-xs lg:text-sm text-muted-foreground line-clamp-3 mb-6 leading-relaxed">
                        {post.excerpt}
                      </p>
                    </div>

                    {/* Author & Read Link */}
                    <div className="pt-4 border-t border-foreground/10 flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-foreground/10 border border-foreground/10 flex items-center justify-center text-xs font-display">
                          {post.author.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-medium">{post.author.name}</div>
                        </div>
                      </div>

                      <Link
                        href={`/blog/${post.slug}`}
                        className="text-xs font-semibold hover:underline inline-flex items-center gap-1"
                      >
                        Read
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

    </main>
  );
}
