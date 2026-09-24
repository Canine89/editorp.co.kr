import type { Book } from "@/lib/books";
import { Character } from "./Character";

/** 구매처 버튼. 첫 구매처를 주 버튼으로 둔다 */
function PurchaseButtons({ book }: { book: Book }) {
  return (
    <div className="rd-buy">
      {book.purchase!.map((p, i) => (
        <a
          key={p.url}
          className={`btn ${i === 0 ? "btn-primary" : "btn-secondary"} ext`}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {p.label}에서 보기
        </a>
      ))}
    </div>
  );
}

/** 마지막 공개 절 끝: 여기까지가 무료 공개 범위이고, 나머지는 책에서 이어진다 */
export function PreviewEnd({ book }: { book: Book }) {
  if (!book.purchase?.length) return null;
  return (
    <section className="rd-more" aria-label="책에서 이어지는 내용">
      <div>
        <h2>여기까지 무료로 공개한 부분입니다</h2>
        {book.preview && <p>{book.preview.note} 이어지는 내용은 책에서 만날 수 있습니다.</p>}
        {book.preview && (
          <ul>
            {book.preview.rest.map((r) => (
              <li key={r.title}>{r.title}</li>
            ))}
          </ul>
        )}
        <PurchaseButtons book={book} />
      </div>
      <Character id="library-books" height={112} />
    </section>
  );
}

/** 책 소개 목차 아래: 책에서 이어지는 목차(링크 없음)와 구매처 */
export function PreviewRest({ book }: { book: Book }) {
  if (!book.preview && !book.purchase?.length) return null;
  return (
    <section className="rd-rest" aria-label="책에서 이어지는 목차">
      <h2>책에서 이어지는 내용</h2>
      {book.preview && <p className="rd-rest-note">{book.preview.note}</p>}
      {book.preview?.rest.map((r) => (
        <div key={r.title} className="rd-chapter rd-chapter-locked">
          <h3>{r.title}</h3>
          <ul>
            {r.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
      {book.purchase?.length ? <PurchaseButtons book={book} /> : null}
    </section>
  );
}
