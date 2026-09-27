import { FieldValue } from 'firebase-admin/firestore';
import { getDb, isFirebaseConfigured } from './firebase-admin';
import { deleteMemoryCommentsByAuthor } from './book-comments';

/**
 * 회원 탈퇴 (개인정보처리방침 6항과 같은 동작).
 *  - userActivity/{email}(작성 횟수 기록): 삭제
 *  - 문단 댓글(bookComments/…/comments): 삭제
 *  - 질문 게시판 글(questions)과 댓글(questions/…/comments): 작성자를 '탈퇴한 회원'으로 바꿔 익명화
 * 로그인은 구글 계정 JWT라 따로 지울 회원 문서는 없다.
 * Firestore 모드의 댓글 검색은 collectionGroup('comments').authorEmail 단일 필드 색인(컬렉션 그룹 범위)이 필요하다.
 */
export const WITHDRAWN_NAME = '탈퇴한 회원';

export async function deleteAccountData(email: string): Promise<{ bookComments: number; posts: number; postComments: number }> {
  if (!isFirebaseConfigured()) {
    return { bookComments: deleteMemoryCommentsByAuthor(email), posts: 0, postComments: 0 };
  }
  const db = getDb();
  const anonymized = { authorEmail: '', authorName: WITHDRAWN_NAME };
  const [posts, comments] = await Promise.all([
    db.collection('questions').where('authorEmail', '==', email).get(),
    db.collectionGroup('comments').where('authorEmail', '==', email).get(),
  ]);

  const writes: ((batch: FirebaseFirestore.WriteBatch) => void)[] = [];
  let bookComments = 0;
  let postComments = 0;
  for (const doc of comments.docs) {
    // 문단 댓글: bookComments/{책}/sections/{절}/comments/{id} → 삭제, 그 밖(질문 게시판 댓글)은 익명화
    const isBookComment = doc.ref.path.startsWith('bookComments/');
    if (isBookComment) {
      bookComments++;
      const bookRef = doc.ref.parent.parent!.parent.parent!;
      writes.push((b) => {
        b.delete(doc.ref);
        b.set(bookRef, { count: FieldValue.increment(-1) }, { merge: true });
      });
    } else {
      postComments++;
      writes.push((b) => b.update(doc.ref, anonymized));
    }
  }
  for (const doc of posts.docs) writes.push((b) => b.update(doc.ref, anonymized));
  writes.push((b) => b.delete(db.collection('userActivity').doc(email)));

  // 배치 한 번에 500개 쓰기 제한 → 작업(최대 2쓰기)을 200개씩
  for (let i = 0; i < writes.length; i += 200) {
    const batch = db.batch();
    writes.slice(i, i + 200).forEach((w) => w(batch));
    await batch.commit();
  }
  return { bookComments, posts: posts.size, postComments };
}
