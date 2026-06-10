import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/**
 * Firestore는 서버(API 라우트, 서버 컴포넌트)에서만 접근한다.
 * 클라이언트에는 Firebase SDK를 싣지 않고, 권한은 NextAuth 세션으로 검사한다.
 */
export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
  );
}

let app: App | null = null;

export function getDb(): Firestore {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase 환경 변수(FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)가 설정되지 않았습니다.'
    );
  }
  if (!app) {
    app =
      getApps()[0] ??
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Vercel 등에서 개행이 \n 문자열로 들어오는 경우 복원
          privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        }),
      });
  }
  return getFirestore(app);
}
