"use client";
import Link from "next/link";
export function ListingError({ reset }: { reset: () => void }) {
  return (
    <div className="container listing-error">
      <h1>목록을 불러오지 못했습니다.</h1>
      <p>
        잠시 후 다시 시도해 주세요. 학습 로드맵으로 돌아가 다른 강의를 고를 수도
        있습니다.
      </p>
      <div>
        <button type="button" className="btn btn-primary" onClick={reset}>
          다시 불러오기
        </button>
        <Link href="/#roadmap-list" className="btn btn-secondary">
          학습 로드맵으로
        </Link>
      </div>
    </div>
  );
}
