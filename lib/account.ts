import { FieldValue } from 'firebase-admin/firestore';
import { getDb, isFirebaseConfigured } from './firebase-admin';
import { deleteMemoryCommentsByAuthor } from './book-comments';

/**
 * 회원 탈퇴 (개인정보처리방침 6항과 같은 동작).
 *  - userActivity/{email}(작성 횟수 기록): 삭제
 *  - 문단 댓글(bookComments/…/comments): 삭제
 * 로그인은 구글 계정 JWT라 따로 지울 회원 문서는 없다.
 * Firestore 모드의 댓글 검색은 collectionGroup('comments').authorEmail 단일 필드 색인(컬렉션 그룹 범위)이 필요하다.
 */
export async function deleteAccountData(email: string): Promise<{ bookComments: number }> {
  if (!isFirebaseConfigured()) {
    return { bookComments: deleteMemoryCommentsByAuthor(email) };
  }
  const db = getDb();
  const comments = await db.collectionGroup('comments').where('authorEmail', '==', email).get();

  const writes: ((batch: FirebaseFirestore.WriteBatch) => void)[] = [];
  let bookComments = 0;
  for (const doc of comments.docs) {
    // 문단 댓글만: bookComments/{책}/sections/{절}/comments/{id}
    if (!doc.ref.path.startsWith('bookComments/')) continue;
    bookComments++;
    const bookRef = doc.ref.parent.parent!.parent.parent!;
    writes.push((b) => {
      b.delete(doc.ref);
      b.set(bookRef, { count: FieldValue.increment(-1) }, { merge: true });
    });
  }
  writes.push((b) => b.delete(db.collection('userActivity').doc(email)));

  // 배치 한 번에 500개 쓰기 제한 → 작업(최대 2쓰기)을 200개씩
  for (let i = 0; i < writes.length; i += 200) {
    const batch = db.batch();
    writes.slice(i, i + 200).forEach((w) => w(batch));
    await batch.commit();
  }
  return { bookComments };
}
