import Link from "next/link";
import { pageShareMetadata } from "@/lib/share";
import { formatArticleDate, listArticles } from "@/lib/articles";
import { Character } from "@/components/Character";
import styles from "./articles.module.css";

export const metadata = pageShareMetadata({
  title: "아티클 | 편집자P의 AI 서재",
  description: "강의를 준비하며 조사하고 검토한 내용을 한 편의 글로 정리해 공개합니다.",
  path: "/articles",
});

export default async function ArticlesPage() {
  const articles = await listArticles();
  return (
    <div className={`container ${styles.page}`}>
      <header className={styles.head}>
        <div>
          <h1>아티클</h1>
          <p>강의를 준비하며 조사하고 검토한 내용을 한 편의 글로 정리했습니다. 출처는 글마다 밝혀 두었습니다.</p>
        </div>
        <Character id="qna-question" height={96} />
      </header>
      {articles.length === 0 ? (
        <p className={styles.empty}>아직 공개한 글이 없습니다.</p>
      ) : (
        <ol className={styles.list}>
          {articles.map((article) => (
            <li key={article.id}>
              <Link href={`/articles/${article.id}`}>
                <b>{article.title}</b>
                <span className={styles.desc}>{article.description}</span>
                <span className={styles.meta}>
                  <span>{formatArticleDate(article.publishedAt)}</span>
                  {article.audience && <span>{article.audience}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
