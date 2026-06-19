항상 한글로만 답해!

## 데이터 저장 구조

- 운영 환경의 로드맵 데이터는 GitHub이 아니라 **Firestore**에 저장된다. 관리자 패널의 저장(`/api/admin/save-roadmap`)은 Firestore에 쓰며, 재배포 없이 즉시 반영된다.
- 로컬 개발에서 Firebase 환경 변수가 없을 때만 `data/roadmap.json` 파일에 저장된다. 이 파일은 초기/폴백 데이터일 뿐 운영 데이터의 원본이 아니다.
- 관리자 식별은 `lib/admin.ts`의 `ADMIN_EMAIL`(환경 변수 `ADMIN_EMAIL`로 교체 가능)을 단일 출처로 사용한다. 관리자 이메일을 코드에 직접 하드코딩하지 말 것.

## Git 운영 규칙

- 푸시 절차:
  1. `git status --short --branch`로 현재 상태를 확인한다.
  2. 필요한 변경사항을 커밋한다.
  3. `git pull --rebase origin main`을 실행한다.
  4. 충돌이 없으면 `git push origin main`을 실행한다.
- 원격에 새 커밋이 있어도 merge commit을 만들지 말고 rebase로 내 커밋을 최신 `origin/main` 위에 올린다.
