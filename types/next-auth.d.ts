import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      /** 서버(session 콜백)에서 계산되는 관리자 여부 플래그 */
      isAdmin?: boolean;
    };
  }
}
