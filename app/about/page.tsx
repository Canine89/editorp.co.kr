import Link from 'next/link';
import { countEditedBooks, getEditedBooksData } from '@/lib/edited-books';

export const metadata = {
  title: '편집자P 소개 & 강의 문의 | 편집자P 로드맵',
  description: 'IT Book Editor & Developer 편집자P의 프로필, 집필 도서, 강의 이력 및 비즈니스/강의 문의 안내 페이지입니다.',
};

export default function AboutPage() {
  const totalBooks = countEditedBooks(getEditedBooksData());

  return (
    <div style={{ backgroundColor: 'var(--colors-canvas)', minHeight: '100vh', padding: '60px 0' }}>
      {/* Embedded CSS for styling and animations */}
      <style>{`
        .profile-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 var(--spacing-lg);
        }
        .profile-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-xl);
          margin-bottom: var(--spacing-xl);
        }
        @media (max-width: 640px) {
          .profile-header {
            flex-direction: column;
            text-align: center;
            gap: var(--spacing-md);
          }
        }
        .profile-avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: 3px solid var(--colors-hairline);
          object-fit: cover;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }
        .profile-badge {
          display: inline-block;
          font-size: 12px;
          font-weight: 600;
          color: var(--colors-primary);
          background-color: var(--colors-surface-soft);
          border: 1px solid var(--colors-hairline);
          padding: 4px 12px;
          border-radius: var(--rounded-pill);
          margin-bottom: var(--spacing-xs);
          letter-spacing: 0.05em;
        }
        .profile-name {
          font-size: 36px;
          font-weight: 700;
          color: var(--colors-ink);
          margin-bottom: var(--spacing-xxs);
          letter-spacing: -0.03em;
        }
        .profile-title {
          font-size: 18px;
          color: var(--colors-muted);
          font-weight: 500;
        }
        .profile-bio {
          font-size: 16px;
          line-height: 1.8;
          color: var(--colors-body);
          margin-bottom: var(--spacing-xl);
          word-break: keep-all;
        }
        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: var(--colors-ink);
          border-bottom: 2px solid var(--colors-primary);
          display: inline-block;
          padding-bottom: 4px;
          margin-bottom: var(--spacing-md);
        }
        .info-card {
          background-color: var(--colors-surface-card);
          border: 1px solid var(--colors-hairline);
          border-radius: var(--rounded-lg);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
          box-shadow: 0 4px 12px rgba(20, 20, 19, 0.01);
          transition: all var(--transition-normal);
        }
        .info-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(204, 120, 92, 0.04);
        }
        .list-item {
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-xs);
          margin-bottom: var(--spacing-sm);
          font-size: 15px;
          color: var(--colors-body-strong);
        }
        .list-item::before {
          content: "•";
          color: var(--colors-primary);
          font-weight: bold;
          font-size: 18px;
          line-height: 1;
        }
        .book-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          text-decoration: none;
          color: var(--colors-body-strong);
          padding: 8px 12px;
          border-radius: var(--rounded-sm);
          transition: all var(--transition-fast);
        }
        .book-link:hover {
          background-color: var(--colors-surface-soft);
          color: var(--colors-primary);
        }
        .lecture-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
          margin-bottom: var(--spacing-sm);
        }
        .lecture-row {
          border-bottom: 1px solid var(--colors-hairline-soft);
          transition: background-color var(--transition-fast);
        }
        .lecture-row:hover {
          background-color: var(--colors-surface-soft);
        }
        .lecture-cell {
          padding: 10px 8px;
          text-align: left;
          vertical-align: middle;
        }
        .lecture-date {
          color: var(--colors-muted);
          font-family: var(--font-mono);
          font-size: 12.5px;
          white-space: nowrap;
          width: 90px;
        }
        .lecture-title {
          font-weight: 500;
          color: var(--colors-ink);
        }
        .lecture-org {
          color: var(--colors-muted);
          font-size: 13px;
          text-align: right;
          width: 220px;
        }
        @media (max-width: 640px) {
          .lecture-row {
            display: flex;
            flex-direction: column;
            padding: 10px 4px;
          }
          .lecture-cell {
            padding: 2px 0;
            width: 100% !important;
            text-align: left !important;
          }
          .lecture-date {
            font-size: 11.5px;
          }
          .lecture-org {
            font-size: 12px;
            margin-top: 2px;
          }
        }
        .profile-details {
          display: grid;
          grid-template-columns: 120px 1fr;
          row-gap: 12px;
          column-gap: 16px;
          font-size: 15px;
          margin-bottom: var(--spacing-xl);
          padding: var(--spacing-md);
          background-color: var(--colors-surface-soft);
          border: 1px solid var(--colors-hairline);
          border-radius: var(--rounded-lg);
        }
        @media (max-width: 640px) {
          .profile-details {
            grid-template-columns: 1fr;
            row-gap: 8px;
          }
        }
        .profile-label {
          font-weight: 600;
          color: var(--colors-muted);
        }
        .profile-value {
          color: var(--colors-body-strong);
        }
        .contact-box {
          background-color: var(--colors-surface-dark);
          color: var(--colors-on-dark);
          border-radius: var(--rounded-lg);
          padding: var(--spacing-xl);
          text-align: center;
          margin-top: var(--spacing-xxl);
        }
        .contact-email {
          font-size: 20px;
          font-weight: 600;
          color: var(--colors-on-dark);
          margin: var(--spacing-sm) 0;
          letter-spacing: 0.02em;
        }
        .btn-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 500;
          padding: 10px 24px;
          border-radius: var(--rounded-md);
          text-decoration: none;
          transition: all var(--transition-fast);
          cursor: pointer;
        }
        .btn-link-primary {
          background-color: var(--colors-primary);
          color: var(--colors-on-primary);
        }
        .btn-link-primary:hover {
          background-color: var(--colors-primary-active);
        }
        .btn-link-secondary {
          background-color: transparent;
          color: var(--colors-on-dark-soft);
          border: 1px solid var(--colors-surface-dark-soft);
          margin-top: var(--spacing-xs);
        }
        .btn-link-secondary:hover {
          color: var(--colors-on-dark);
          border-color: var(--colors-on-dark-soft);
        }
        .links-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: var(--spacing-sm);
          margin-top: var(--spacing-md);
        }
        .social-link {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px;
          border-radius: var(--rounded-md);
          border: 1px solid var(--colors-hairline);
          background-color: var(--colors-canvas);
          font-size: 13.5px;
          color: var(--colors-muted);
          transition: all var(--transition-fast);
        }
        .social-link:hover {
          color: var(--colors-primary);
          border-color: var(--colors-primary);
          background-color: var(--colors-surface-soft);
        }
      `}</style>

      <div className="profile-container">
        {/* Profile Header */}
        <div className="profile-header">
          <img
            src="/p.png"
            alt="편집자P 프로필 이미지"
            className="profile-avatar"
          />
          <div>
            <span className="profile-badge">CURSOR OFFICIAL AMBASSADOR</span>
            <h1 className="profile-name">편집자P</h1>
            <p className="profile-title">IT Book Editor & Developer</p>
          </div>
        </div>

        {/* Bio Description */}
        <p className="profile-bio" style={{ marginBottom: 'var(--spacing-md)' }}>
          개발이 취미인 컴공과 출신 IT 도서 기획/편집자이자 IT 애호가입니다. 활동명 <strong>편집자P</strong>로 더 많이 알려져 있습니다. 
          사내 자동화 앱을 파이썬, 자바스크립트로 개발해 활용하고, IT 지식을 쉽게 나누기 위해 책과 영상, 그리고 ai100.co.kr을 운영합니다.
        </p>

        {/* Profile Grid Details */}
        <div className="profile-details">
          <div className="profile-label">성명 / 나이</div>
          <div className="profile-value">박현규 / 만 36세</div>

          <div className="profile-label">이메일</div>
          <div className="profile-value">
            <a href="mailto:hgpark@goldenrabbit.co.kr" style={{ color: 'var(--colors-primary)', textDecoration: 'underline' }}>
              hgpark@goldenrabbit.co.kr
            </a>
          </div>

          <div className="profile-label">학력</div>
          <div className="profile-value">건국대학교 컴퓨터공학 졸업 (소프트웨어 공학 전공)</div>

          <div className="profile-label">소속 / 직책</div>
          <div className="profile-value">골든래빗 / 팀장</div>

          <div className="profile-label">주요 경력</div>
          <div className="profile-value">
            <div style={{ marginBottom: '4px' }}>2023 ~ 현재 : 골든래빗 팀장</div>
            <div>2017 ~ 2023 : 이지스퍼블리싱 팀장</div>
          </div>

          <div className="profile-label">SNS / 유튜브</div>
          <div className="profile-value">
            <a href="https://www.youtube.com/@editorp89" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--colors-primary)', textDecoration: 'underline' }}>
              www.youtube.com/@editorp89
            </a>
          </div>

          <div className="profile-label">기타 사항</div>
          <div className="profile-value">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
              <span>커서(Cursor) 공식 앰배서더</span>
              <img
                src="/cursor-ambassador.png"
                alt="커서 앰배서더 이미지"
                style={{
                  maxWidth: '240px',
                  height: 'auto',
                  borderRadius: 'var(--rounded-md)',
                  border: '1px solid var(--colors-hairline)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  marginTop: '4px'
                }}
              />
            </div>
          </div>
        </div>

        {/* Books Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', borderBottom: '2px solid var(--colors-primary)', paddingBottom: '4px', marginBottom: 'var(--spacing-md)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--colors-ink)', margin: 0 }}>집필 및 편저서</h2>
            <Link
              href="/edited-books"
              className="badge badge-coral"
              style={{ textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              전체 {totalBooks}권 보기 →
            </Link>
          </div>
          <div className="info-card" style={{ padding: '12px' }}>
            <a href="https://www.yes24.com/product/goods/191479539" target="_blank" rel="noopener noreferrer" className="book-link">
              <div className="list-item" style={{ margin: 0 }}><strong>바로바로 챗GPT X 덕테이프 X 코덱스</strong></div>
              <span style={{ fontSize: '12px', color: 'var(--colors-muted)' }}>예스24 ↗</span>
            </a>
            <a href="https://www.yes24.com/product/goods/183530330" target="_blank" rel="noopener noreferrer" className="book-link">
              <div className="list-item" style={{ margin: 0 }}><strong>바로바로 바이브 코딩 with 커서 AI</strong></div>
              <span style={{ fontSize: '12px', color: 'var(--colors-muted)' }}>예스24 ↗</span>
            </a>
            <a href="https://www.yes24.com/product/goods/190210781" target="_blank" rel="noopener noreferrer" className="book-link">
              <div className="list-item" style={{ margin: 0 }}><strong>이게 되네? 클로드 MCP 커넥터 미친 활용법 31제</strong></div>
              <span style={{ fontSize: '12px', color: 'var(--colors-muted)' }}>예스24 ↗</span>
            </a>
            <a href="https://www.yes24.com/product/goods/153029475" target="_blank" rel="noopener noreferrer" className="book-link">
              <div className="list-item" style={{ margin: 0 }}><strong>요즘 바이브 코딩 커서 AI 30가지 프로그램 만들기</strong></div>
              <span style={{ fontSize: '12px', color: 'var(--colors-muted)' }}>예스24 ↗</span>
            </a>
            <a href="https://www.yes24.com/product/goods/167428992" target="_blank" rel="noopener noreferrer" className="book-link">
              <div className="list-item" style={{ margin: 0 }}><strong>요즘 바이브 코딩 깃허브 코파일럿 31가지 프로그램 만들기</strong></div>
              <span style={{ fontSize: '12px', color: 'var(--colors-muted)' }}>예스24 ↗</span>
            </a>
            <a href="https://www.yes24.com/product/goods/147957269" target="_blank" rel="noopener noreferrer" className="book-link">
              <div className="list-item" style={{ margin: 0 }}><strong>이게 되네? 클로드 MCP 미친 활용법 27제</strong></div>
              <span style={{ fontSize: '12px', color: 'var(--colors-muted)' }}>예스24 ↗</span>
            </a>
            <a href="https://www.yes24.com/product/goods/144868498" target="_blank" rel="noopener noreferrer" className="book-link">
              <div className="list-item" style={{ margin: 0 }}><strong>이게 되네? 챗GPT 미친 크롤링 24제</strong></div>
              <span style={{ fontSize: '12px', color: 'var(--colors-muted)' }}>예스24 ↗</span>
            </a>
          </div>
        </div>

        {/* Lectures Section */}
        <div style={{ marginTop: 'var(--spacing-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', borderBottom: '2px solid var(--colors-primary)', paddingBottom: '4px', marginBottom: 'var(--spacing-md)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--colors-ink)', margin: 0 }}>최근 주요 강의 이력</h2>
            <a
              href="https://docs.google.com/document/d/1bZ1TlO8acV-tytns-vXeQ_EP_RXNXvG2kYiKZQzku8g/edit?tab=t.0"
              target="_blank"
              rel="noopener noreferrer"
              className="badge badge-coral"
              aria-label="Google Docs에서 전체 강의 이력 보기"
              style={{ cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              전체 강의 이력 보기 ↗
            </a>
          </div>
          <div className="info-card" style={{ padding: '8px 16px' }}>
            <table className="lecture-table">
              <tbody>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2026-08-10 예정</td>
                  <td className="lecture-cell lecture-title">교사 대상 AI 특강: 클로드 코드 개념과 실습</td>
                  <td className="lecture-cell lecture-org">부천공업고등학교 (오프라인)</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2026-07-24</td>
                  <td className="lecture-cell lecture-title">경기 AI디지털배움터 「요즘 바이브코딩」 저자 특강</td>
                  <td className="lecture-cell lecture-org">티엠디교육그룹 / 한양대 에리카캠퍼스</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2026-07 ~ 진행 중</td>
                  <td className="lecture-cell lecture-title">AX 교육: 업무 자동화를 위한 AI 활용 — 3개 팀 단위로 매주 화·수·목 순차 진행</td>
                  <td className="lecture-cell lecture-org">풀리오 (오프라인)</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2026-07-10</td>
                  <td className="lecture-cell lecture-title">[알라딘X골든래빗] 코덱스 CLI로 바이브 코딩하기</td>
                  <td className="lecture-cell lecture-org">알라딘 (유튜브 라이브)</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2026-07-08</td>
                  <td className="lecture-cell lecture-title">내부 학습조직 초청 강의: 클로드 코워크·코드와 하네스 엔지니어링 입문</td>
                  <td className="lecture-cell lecture-org">중소벤처기업진흥공단 서울남부지부</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2026-07-03</td>
                  <td className="lecture-cell lecture-title">[교보문고X골든래빗] 코덱스 앱으로 업무 자동화하기 + 하네스 입문하기</td>
                  <td className="lecture-cell lecture-org">교보문고 (유튜브 라이브)</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2026-06-26</td>
                  <td className="lecture-cell lecture-title">[예스24X골든래빗] 챗GPT + 덕테이프 + 코덱스 앱 입문 가이드</td>
                  <td className="lecture-cell lecture-org">예스24 (유튜브 라이브)</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2026-06-18</td>
                  <td className="lecture-cell lecture-title">유아 놀이 기록·관찰 일지 기반 가정 통신문 제작 연수</td>
                  <td className="lecture-cell lecture-org">십시일반교육연구회 / 시화유치원</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2026-06</td>
                  <td className="lecture-cell lecture-title">《바로바로 AI 바이브코딩》 입문 프로그램 (전 10회차)</td>
                  <td className="lecture-cell lecture-org">금천구립독산도서관 (온라인 Zoom)</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2026-05-28</td>
                  <td className="lecture-cell lecture-title">십시일반교육연구회 전문가 초청 강의: AI·코덱스 활용 유아교육 자료 제작 실습</td>
                  <td className="lecture-cell lecture-org">십시일반교육연구회</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2026-05-19</td>
                  <td className="lecture-cell lecture-title">클로드 코드 + 하네스 엔지니어링 강의</td>
                  <td className="lecture-cell lecture-org">경기도의회</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2026-05-15</td>
                  <td className="lecture-cell lecture-title">처인초 교사 연수: 클로드 코드·코덱스 CLI 기반 실습</td>
                  <td className="lecture-cell lecture-org">처인초등학교 교사</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2026-05-12</td>
                  <td className="lecture-cell lecture-title">저자와의 만남: 바이브 코딩 특강</td>
                  <td className="lecture-cell lecture-org">은평메디텍고등학교 (오프라인)</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2026-05-11</td>
                  <td className="lecture-cell lecture-title">커서 AI 바이브 코딩</td>
                  <td className="lecture-cell lecture-org">멀티캠퍼스 (오프라인)</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2026-04-17</td>
                  <td className="lecture-cell lecture-title">커서와 펜슬로 다양한 디자인 작업해보고 메모앱 만들기</td>
                  <td className="lecture-cell lecture-org">유튜브 라이브 (온라인)</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2026-04-10</td>
                  <td className="lecture-cell lecture-title">커서로 나만의 사이트 만들고 배포해보기</td>
                  <td className="lecture-cell lecture-org">유튜브 라이브 (온라인)</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2026-04-03</td>
                  <td className="lecture-cell lecture-title">커서 기초 익히고 문서 작업 자동화해보기</td>
                  <td className="lecture-cell lecture-org">유튜브 라이브 (온라인)</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2026-01-14</td>
                  <td className="lecture-cell lecture-title">교보 단독 온라인 특강</td>
                  <td className="lecture-cell lecture-org">교보문고 (온라인)</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2025-12-10</td>
                  <td className="lecture-cell lecture-title">《요즘 바이브 코딩 v0 + 커서 입문》 관련 온라인 특강</td>
                  <td className="lecture-cell lecture-org">예스24 (온라인)</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2025-12-10</td>
                  <td className="lecture-cell lecture-title">MCP 기반 AI 에이전트 구축·활용 실습 워크숍: “좋은 입력에 좋은 출력이 나오는 시대”</td>
                  <td className="lecture-cell lecture-org">한국생산기술연구원 (KITECH)</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2025-12-06</td>
                  <td className="lecture-cell lecture-title">《요즘 바이브 코딩 v0 + 커서 입문》 관련 온라인 특강</td>
                  <td className="lecture-cell lecture-org">알라딘 (온라인)</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2025-12</td>
                  <td className="lecture-cell lecture-title">클로드 MCP</td>
                  <td className="lecture-cell lecture-org">멀티캠퍼스</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2025-12</td>
                  <td className="lecture-cell lecture-title">클로드 기초</td>
                  <td className="lecture-cell lecture-org">휴넷</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2025-12</td>
                  <td className="lecture-cell lecture-title">커서 AI 바이브 코딩</td>
                  <td className="lecture-cell lecture-org">휴넷</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2025-11-22</td>
                  <td className="lecture-cell lecture-title">AI Lunch Seminar: “좋은 질문에 좋은 답이 나오는 시대”</td>
                  <td className="lecture-cell lecture-org">단국대학교</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2025-11</td>
                  <td className="lecture-cell lecture-title">커서 AI 바이브 코딩</td>
                  <td className="lecture-cell lecture-org">멀티캠퍼스</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2025-11</td>
                  <td className="lecture-cell lecture-title">깃허브 코파일럿 바이브 코딩</td>
                  <td className="lecture-cell lecture-org">멀티캠퍼스</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2025-10-15</td>
                  <td className="lecture-cell lecture-title">교원 연수 2차: VS Code·GitHub Copilot 기반 바이브 코딩, Python, Git/GitHub, MCP 활용</td>
                  <td className="lecture-cell lecture-org">보인고등학교</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2025-09-17</td>
                  <td className="lecture-cell lecture-title">바이브 코딩 입문, 캔바 AI, Gemini·Apps Script 웹앱</td>
                  <td className="lecture-cell lecture-org">보인고등학교</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2025-07</td>
                  <td className="lecture-cell lecture-title">제조로봇본부 MAX 세미나: MCP 활용 방안, “MCP란 무엇일까”</td>
                  <td className="lecture-cell lecture-org">한국로봇산업진흥원 (KIRIA)</td>
                </tr>
                <tr className="lecture-row">
                  <td className="lecture-cell lecture-date">2025-06</td>
                  <td className="lecture-cell lecture-title">MCP의 AI 적용·활용 사례, MCP 개념과 업무 효율화 사례</td>
                  <td className="lecture-cell lecture-org">한국지능정보사회진흥원 (NIA)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Contact/Inquiry Section */}
        <div className="contact-box">
          <h3 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--colors-on-dark)' }}>강의 문의 & 연락처</h3>
          <p style={{ fontSize: '13.5px', color: 'var(--colors-on-dark-soft)', marginTop: '8px', marginBottom: '20px' }}>
            강의 문의나 궁금하신 점이 있다면 편하게 이메일 남겨주세요.
          </p>
          <div>
            <a href="mailto:hgpark@goldenrabbit.co.kr" className="btn-link btn-link-primary">
              이메일 보내기 (hgpark@goldenrabbit.co.kr)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
