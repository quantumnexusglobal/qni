import { NextResponse } from 'next/server';
import { getMongoDbDatabase } from '@/lib/mongodb';
import { INITIAL_BLOG_POSTS } from '@/lib/blogs-store';
import { getBlogSession, hasAdminSession } from '@/lib/blog-auth';

async function canManageBlogs() {
  return Boolean((await getBlogSession()) || (await hasAdminSession()));
}

const LEGACY_SEEDED_BLOG_IDS = ['blog-1', 'blog-2', 'blog-3', 'blog-4'];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const db = await getMongoDbDatabase();

    if (!db) {
      // Return initial fallback data if Mongo is not connected
      if (slug) {
        const found = INITIAL_BLOG_POSTS.find((b) => b.slug === slug || b.id === slug);
        return NextResponse.json({ success: true, data: found || null, source: 'fallback' });
      }
      return NextResponse.json({ success: true, data: INITIAL_BLOG_POSTS, source: 'fallback' });
    }

    const collection = db.collection('blogs');

    if (slug) {
      const blog = await collection.findOne({
        $and: [
          { $or: [{ slug }, { id: slug }] },
          { id: { $nin: LEGACY_SEEDED_BLOG_IDS } },
        ],
      });
      return NextResponse.json({ success: true, data: blog });
    }

    const blogs = await collection
      .find({ id: { $nin: LEGACY_SEEDED_BLOG_IDS } })
      .sort({ publishedAt: -1 })
      .toArray();
    return NextResponse.json({ success: true, data: blogs });
  } catch (error: any) {
    console.error('Error in GET /api/blogs:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!(await canManageBlogs())) {
      return NextResponse.json({ success: false, message: 'Writer or admin authentication required.' }, { status: 401 });
    }
    const body = await request.json();
    const db = await getMongoDbDatabase();

    const newBlog = {
      id: body.id || `blog-${Date.now()}`,
      slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      title: body.title,
      excerpt: body.excerpt,
      content: body.content,
      category: body.category || 'Quantum Tech',
      coverImage: body.coverImage || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80',
      author: body.author || { name: 'QNG Team Member', role: 'Quantum Researcher' },
      readTime: body.readTime || '4 min read',
      publishedAt: body.publishedAt || new Date().toISOString(),
      status: body.status || 'Published',
      featured: body.featured ?? false,
      tags: body.tags || ['Quantum'],
      createdAt: new Date(),
    };

    if (db) {
      await db.collection('blogs').updateOne(
        { id: newBlog.id },
        { $set: newBlog },
        { upsert: true }
      );
    }

    return NextResponse.json({ success: true, data: newBlog }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/blogs:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!(await canManageBlogs())) {
      return NextResponse.json({ success: false, message: 'Writer or admin authentication required.' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing blog ID' }, { status: 400 });
    }

    const db = await getMongoDbDatabase();
    if (db) {
      await db.collection('blogs').deleteOne({ $or: [{ id }, { slug: id }] });
    }

    return NextResponse.json({ success: true, message: 'Blog deleted' });
  } catch (error: any) {
    console.error('Error in DELETE /api/blogs:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
