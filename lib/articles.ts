import fs from 'fs/promises';
import path from 'path';
import { renderReaderMarkdown, type ReaderSection } from './reader-render';

/**
 * 아티클: 한 편으로 끝나는 글. 강의 준비 도구(oh-my-slide)의 발행본을 옮겨 온다.
 * 원본은 `content/articles/<id>/article.json`(메타) + `article.md`(본문). 그림은 `public/articles/<id>/`.
 * 도서와 달리 Firestore 오버레이가 없다. 고칠 때는 파일을 고쳐 다시 배포한다.
 * 본문은 리더와 같은 렌더러(lib/reader-render.ts)로 그린다. 형식은 content/articles/README.md
 */

export interface ArticleImageSize {
  width: number;
  height: number;
}

export interface Article {
  id: string;
  title: string;
  /** 목록과 공유 미리보기에 쓰는 한두 문장 */
  description: string;
  /** 이런 분께 */
  audience?: string;
  publishedAt: string;
  updatedAt?: string;
  cover?: { src: string; alt: string } & ArticleImageSize;
  /** 본문 그림 경로 → 크기 */
  images?: Record<string, ArticleImageSize>;
}

const ARTICLES_DIR = path.join(process.cwd(), 'content', 'articles');
const SAFE_ID = /^[a-z0-9][a-z0-9-]*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** 정리: 한 줄 요약 코너 (리더의 "바로 핵심 요약"과 같은 모양) */
const ARTICLE_CORNERS: [RegExp, string][] = [[/^정리$/, 'summary']];

async function readArticle(id: string): Promise<Article | null> {
  if (!SAFE_ID.test(id)) return null;
  try {
    const meta = JSON.parse(await fs.readFile(path.join(ARTICLES_DIR, id, 'article.json'), 'utf-8'));
    if (typeof meta.title !== 'string' || typeof meta.description !== 'string' || !DATE.test(meta.publishedAt ?? '')) {
      console.warn(`[articles] ${id}/article.json: title, description, publishedAt(YYYY-MM-DD)이 필요합니다`);
      return null;
    }
    return { ...meta, id };
  } catch {
    return null;
  }
}

/** 새 글이 위로 */
export async function listArticles(): Promise<Article[]> {
  let ids: string[] = [];
  try {
    ids = (await fs.readdir(ARTICLES_DIR, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
  } catch {
    return [];
  }
  const articles = (await Promise.all(ids.map(readArticle))).filter((a): a is Article => a !== null);
  return articles.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title, 'ko'));
}

export function getArticle(id: string) {
  return readArticle(id);
}

/** 본문 HTML. 출처 문단(과 바로 아래 목록)에는 작게 보이도록 refs 클래스를 붙인다 */
export async function renderArticle(article: Article): Promise<ReaderSection | null> {
  let raw: string;
  try {
    raw = await fs.readFile(path.join(ARTICLES_DIR, article.id, 'article.md'), 'utf-8');
  } catch {
    return null;
  }
  const rendered = await renderReaderMarkdown(raw, { sizes: article.images ?? {}, corners: ARTICLE_CORNERS });
  const html = rendered.html
    .replace(/<p((?: data-[a-z]+="[^"]*")*)>출처/g, '<p class="refs"$1>출처')
    .replace(/(<p class="refs"[^>]*>출처<\/p>)<(ul|ol)/g, '$1<$2 class="refs"');
  return { ...rendered, html };
}

export function formatArticleDate(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return `${y}년 ${m}월 ${d}일`;
}
