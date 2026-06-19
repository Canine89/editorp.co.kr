/**
 * 관리자 식별 단일 출처(single source of truth).
 * 운영에서는 ADMIN_EMAIL 환경 변수로 교체할 수 있고, 미설정 시 기본 계정을 사용한다.
 * middleware(edge 런타임)에서도 import하므로 Node 전용 모듈을 여기에 추가하지 말 것.
 */
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'hgpark@goldenrabbit.co.kr';

export function isAdminEmail(email: string | null | undefined): boolean {
  return Boolean(email) && email === ADMIN_EMAIL;
}
