import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { pageShareMetadata } from "@/lib/share";
import { formatArticleDate, getArticle, listArticles, renderArticle } from "@/lib/articles";
import { ArticleClient } from "@/components/ArticleClient";
import "../../books/reader.css";
import styles from "./article.module.css";

export async function generateStaticParams() {
  return (await listArticles()).map((article) => ({ articleId: article.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ articleId: string }> }) {
  const { articleId } = await params;
  const article = await getArticle(articleId);
  if (!article) return {};
  return pageShareMetadata({
    title: `${article.title} | 편집자P의 AI 서재`,
    description: article.description,
    path: `/articles/${article.id}`,
  });
}

export default async function ArticlePage({ params }: { params: Promise<{ articleId: string }> }) {
  const { articleId } = await params;
  const article = await getArticle(articleId);
  if (!article) notFound();
  const rendered = await renderArticle(article);
  if (!rendered) notFound();

  // 목록 순서(새 글이 위)에서 앞뒤 글
  const all = await listArticles();
  const index = all.findIndex((a) => a.id === article.id);
  const newer = index > 0 ? all[index - 1] : null;
  const older = index >= 0 && index < all.length - 1 ? all[index + 1] : null;

  return (
    <>
      <div className="rd-progress" aria-hidden="true">
        <i />
      </div>
      <div className={`container ${styles.reader}`}>
        <article className="rd-main">
          <p className="rd-crumb">
            <Link href="/articles">아티클</Link>
          </p>
          <h1>{article.title}</h1>
          <p className="rd-meta">
            <span>{formatArticleDate(article.publishedAt)}</span>
            <span>읽는 시간 약 {rendered.readMinutes}분</span>
            {rendered.codeCount > 0 && <span>코드 {rendered.codeCount}개</span>}
            {article.audience && <span>대상 {article.audience}</span>}
          </p>

          {article.cover && (
            <figure className={styles.cover}>
              <Image
                src={article.cover.src}
                alt={article.cover.alt}
                width={article.cover.width}
                height={article.cover.height}
                sizes="(max-width: 960px) 100vw, 748px"
                priority
              />
            </figure>
          )}

          <div className={`rd-prose ${styles.prose}`} dangerouslySetInnerHTML={{ __html: rendered.html }} />

          <footer className="rd-end">
            <nav className="rd-pager" aria-label="다른 아티클">
              {older ? (
                <Link href={`/articles/${older.id}`}>
                  <small>← 이전 글</small>
                  <b>{older.title}</b>
                </Link>
              ) : (
                <span />
              )}
              {newer ? (
                <Link href={`/articles/${newer.id}`}>
                  <small>다음 글 →</small>
                  <b>{newer.title}</b>
                </Link>
              ) : (
                <Link href="/articles">
                  <small>아티클</small>
                  <b>전체 글 보기</b>
                </Link>
              )}
            </nav>
          </footer>
        </article>

        {rendered.headings.length > 0 && (
          <aside className="rd-aside" aria-label="이 글의 소제목">
            <h2>이 글에서</h2>
            <ol>
              {rendered.headings.map((h) => (
                <li key={h.id}>
                  <a href={`#${h.id}`}>{h.text}</a>
                </li>
              ))}
            </ol>
          </aside>
        )}
      </div>

      {/* 확대 이미지는 누를 때 ArticleClient가 넣는다 */}
      <dialog className="rd-zoom" aria-label="이미지 확대" />
      <ArticleClient />
    </>
  );
}
