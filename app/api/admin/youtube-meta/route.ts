import { NextResponse } from 'next/server';

export const revalidate = 0; // Prevent caching

// Returns title/author/thumbnail for a YouTube video via the public oEmbed endpoint.
// Auth is enforced by middleware (matcher covers /api/admin/*).
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: '영상 정보를 찾을 수 없습니다. 링크를 확인해주세요.' },
        { status: 404 }
      );
    }

    const meta = await res.json();
    return NextResponse.json({
      title: meta.title || '',
      author: meta.author_name || '',
      thumbnailUrl: meta.thumbnail_url || '',
    });
  } catch (error) {
    console.error('Error in youtube-meta API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
