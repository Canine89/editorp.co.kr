/**
 * 판매자(개인사업자) 정보 단일 출처. 사이트 하단·약관·개인정보처리방침·환불 규정이 모두 여기서 읽는다.
 * 전자상거래법 제10조(사업자 신원 표시) 항목이며, PG(토스페이먼츠) 카드사 심사에서도 하단 노출을 확인한다.
 * 값이 null이면 하단에 그 줄을 표시하지 않는다 — 결제 심사 전에 모두 채워야 한다.
 */
export const BUSINESS = {
  /** 상호 (사업자등록증 기준) */
  name: '아이기스',
  /** 서비스 이름 (사이트 이름) */
  serviceName: '편집자P의 AI 서재',
  owner: '박현규',
  registrationNo: '890-53-01145',
  /** 통신판매업 신고번호 (예: 제2026-서울송파-0000호) */
  mailOrderNo: null as string | null,
  address: '서울특별시 송파구 올림픽로 435, 104동 402호(신천동, 파크리오)',
  /** 고객센터 전화 */
  phone: null as string | null,
  email: 'hgpark@goldenrabbit.co.kr',
  /** 고객 문의 응대 시간 */
  hours: '평일 10:00~18:00 (주말·공휴일 휴무, 이메일은 언제든 접수)',
  /** 개인정보 보호책임자 */
  privacyOfficer: '박현규',
  site: 'https://editorp.co.kr',
} as const;

/** 공정거래위원회 사업자정보 공개 페이지 (하단 '사업자정보 확인' 링크) */
export const BUSINESS_LOOKUP_URL = `https://www.ftc.go.kr/bizCommPop.do?wrkr_no=${BUSINESS.registrationNo.replace(/-/g, '')}`;

/** 약관·방침 시행일 (내용을 바꾸면 새 날짜로 바꾸고, 중요한 변경은 7일 전에 공지한다) */
export const POLICY_EFFECTIVE_DATE = '2026-10-01';
