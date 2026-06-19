import { NextResponse } from 'next/server';

export const revalidate = 0; // Prevent caching

// YouTube 영상 ID는 11자의 [A-Za-z0-9_-]만 허용 — URL 조작/SSRF 방지
const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');

    if (!videoId || !YOUTUBE_ID_REGEX.test(videoId)) {
      return NextResponse.json({ error: '유효한 YouTube 영상 ID가 아닙니다.' }, { status: 400 });
    }

    // Fetch YouTube page html
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch YouTube page' }, { status: 500 });
    }

    const html = await res.text();
    let description = '';

    // Approach 1: Parse ytInitialPlayerResponse JSON embed
    const jsonMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
    if (jsonMatch) {
      try {
        const json = JSON.parse(jsonMatch[1]);
        description = json.videoDetails?.shortDescription || '';
      } catch (err) {
        console.error('Failed to parse ytInitialPlayerResponse', err);
      }
    }

    // Approach 2: Fallback to description metadata tag
    if (!description) {
      const metaMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
      if (metaMatch) {
        description = metaMatch[1];
      }
    }

    if (!description) {
      // Approach 3: Search the raw HTML for description objects
      const descObjMatch = html.match(/"description"\s*:\s*\{\s*"simpleText"\s*:\s*"([^"]+)"/);
      if (descObjMatch) {
        description = descObjMatch[1].replace(/\\n/g, '\n');
      }
    }

    const timeline: { time: string; title: string }[] = [];
    const lines = description.split('\n');

    // Parse time marks. Match format like:
    // 00:00
    // 01:23
    // 1:23:45
    // 10:15 - Title
    const timeRegex = /(\d{1,2}:\d{2}(?::\d{2})?)/;

    for (const line of lines) {
      const match = line.match(timeRegex);
      if (match) {
        const time = match[1];
        // Strip the time stamp and any leading punctuations from the rest of the line to get the title
        let title = line.replace(time, '').trim();
        title = title.replace(/^[-–—:|~#\s]+/, '').trim(); // Remove leading delimiters
        
        if (title) {
          timeline.push({ time, title });
        }
      }
    }

    return NextResponse.json(timeline);
  } catch (error: any) {
    console.error('Error in youtube-timeline API:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
