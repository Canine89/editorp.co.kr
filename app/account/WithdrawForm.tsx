"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import styles from "./account.module.css";

/** 회원 탈퇴: 안내에 동의해야 버튼이 켜지고, 끝나면 로그아웃해 첫 화면으로 */
export function WithdrawForm() {
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const withdraw = async () => {
    if (!confirm("정말 탈퇴할까요? 되돌릴 수 없습니다.")) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "탈퇴를 처리하지 못했습니다.");
        setBusy(false);
        return;
      }
      await signOut({ callbackUrl: "/" });
    } catch {
      setError("네트워크 오류로 탈퇴하지 못했습니다.");
      setBusy(false);
    }
  };

  return (
    <div className={styles.withdraw}>
      <label>
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <span>위 내용을 확인했고, 탈퇴하면 되돌릴 수 없다는 데 동의합니다.</span>
      </label>
      <button type="button" className={`btn ${styles.danger}`} disabled={!agreed || busy} onClick={withdraw}>
        {busy ? "처리 중…" : "탈퇴하기"}
      </button>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
