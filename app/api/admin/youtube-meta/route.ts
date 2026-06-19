import { NextResponse } from 'next/server';

export const revalidate = 0; // Prevent caching

// YouTube 영상 ID는 11자의 [A-Za-z0-9_-]만 허용 — URL 조작/SSRF 방지
const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

// Returns title/author/thumbnail for a YouTube video via the public oEmbed endpoint.
// Auth is enforced by middleware (matcher covers /api/admin/*).
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId || !YOUTUBE_ID_REGEX.test(videoId)) {
      return NextResponse.json({ error: '유효한 YouTube 영상 ID가 아닙니다.' }, { status: 400 });
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
