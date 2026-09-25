import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getBlogSession, hasAdminSession } from '@/lib/blog-auth';

export async function POST(request: Request) {
  try {
    if (!(await getBlogSession()) && !(await hasAdminSession())) {
      return NextResponse.json({ success: false, error: 'Writer or admin authentication required.' }, { status: 401 });
    }
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // If Cloudinary credentials are configured
    if (cloudName && ((apiKey && apiSecret) || uploadPreset)) {
      const cloudinaryFormData = new FormData();
      const blob = new Blob([buffer], { type: file.type });
      cloudinaryFormData.append('file', blob, file.name);

      if (apiKey && apiSecret) {
        const timestamp = Math.round(new Date().getTime() / 1000).toString();
        const folder = 'qnexus';
        
        // Generate SHA-1 signature
        const strToSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
        const signature = crypto.createHash('sha1').update(strToSign).digest('hex');

        cloudinaryFormData.append('api_key', apiKey);
        cloudinaryFormData.append('timestamp', timestamp);
        cloudinaryFormData.append('folder', folder);
        cloudinaryFormData.append('signature', signature);
      } else if (uploadPreset) {
        cloudinaryFormData.append('upload_preset', uploadPreset);
      }

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: cloudinaryFormData,
      });

      const data = await res.json();

      if (data.secure_url) {
        return NextResponse.json({
          success: true,
          url: data.secure_url,
          public_id: data.public_id,
        });
      } else {
        console.error('Cloudinary upload error response:', data);
        // If Cloudinary returned an error, fallback to data URL
        const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;
        return NextResponse.json({
          success: true,
          url: base64,
          warning: data.error?.message || 'Cloudinary error, fallback to data URL',
        });
      }
    }

    // Fallback if Cloudinary credentials are not set yet
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;
    return NextResponse.json({
      success: true,
      url: base64,
      note: 'Cloudinary not configured yet, image encoded as base64. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to .env.local',
    });
  } catch (error: any) {
    console.error('Error in upload API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal upload error' },
      { status: 500 }
    );
  }
}
