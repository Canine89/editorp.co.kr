import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { pageShareMetadata } from "@/lib/share";
import { BUSINESS } from "@/lib/business";
import { LoginButton } from "./LoginButton";
import { WithdrawForm } from "./WithdrawForm";
import styles from "./account.module.css";

export const metadata = { ...pageShareMetadata({ title: "내 정보 | 편집자P의 AI 서재", description: "가입 정보와 탈퇴", path: "/account" }), robots: { index: false } };

export default async function AccountPage() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.email) {
    return (
      <div className={`container ${styles.page}`}>
        <h1>내 정보</h1>
        <section className={styles.section}>
          <p>구글 계정으로 로그인하면 가입 정보와 구매 내역을 볼 수 있습니다.</p>
          <p className={styles.muted}>
            로그인하면 <Link href="/terms">이용약관</Link>과 <Link href="/privacy">개인정보처리방침</Link>에 동의하게 됩니다.
          </p>
          <LoginButton />
        </section>
      </div>
    );
  }

  return (
    <div className={`container ${styles.page}`}>
      <h1>내 정보</h1>

      <section className={styles.section}>
        <h2>가입 정보</h2>
        <dl className={styles.info}>
          <dt>이름</dt>
          <dd>{user.name || "(이름 없음)"}</dd>
          <dt>이메일</dt>
          <dd>{user.email}</dd>
          <dt>로그인</dt>
          <dd>구글 계정</dd>
        </dl>
        <p className={styles.muted}>이름과 사진은 구글 계정 정보를 그대로 씁니다. 바꾸려면 구글 계정에서 바꾼 뒤 다시 로그인하세요.</p>
      </section>

      <section className={styles.section}>
        <h2>구매 내역</h2>
        <p className={styles.muted}>구매한 상품이 없습니다.</p>
      </section>

      <section className={styles.section}>
        <h2>탈퇴</h2>
        {user.isAdmin ? (
          <p className={styles.muted}>관리자 계정은 탈퇴할 수 없습니다.</p>
        ) : (
          <>
            <ul className={styles.list}>
              <li>이름·이메일·프로필 사진과 글 작성 기록을 지웁니다.</li>
              <li>작성한 문단 댓글을 모두 지웁니다.</li>
              <li>질문 게시판의 글과 댓글은 남기되, 작성자를 &lsquo;탈퇴한 회원&rsquo;으로 바꿉니다. 지우고 싶은 글은 탈퇴 전에 직접 지워 주세요.</li>
              <li>구매한 유료 상품을 더 이상 이용할 수 없습니다. 결제·환불 기록은 전자상거래법에 따라 5년 동안 따로 보관한 뒤 파기합니다.</li>
            </ul>
            <WithdrawForm />
          </>
        )}
      </section>

      <p className={`${styles.section} ${styles.muted}`}>
        개인정보 문의: {BUSINESS.email} · <Link href="/privacy">개인정보처리방침</Link>
      </p>
    </div>
  );
}
