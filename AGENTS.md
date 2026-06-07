항상 한글로만 답해!

## Git 운영 규칙

- 이 저장소의 관리자 패널은 운영 환경에서 `data/roadmap.json` 변경을 GitHub `main` 브랜치에 직접 커밋할 수 있다.
- 따라서 로컬 변경사항을 푸시하기 전에는 항상 원격 변경을 먼저 리베이스한다.
- 푸시 절차:
  1. `git status --short --branch`로 현재 상태를 확인한다.
  2. 필요한 변경사항을 커밋한다.
  3. `git pull --rebase origin main`을 실행한다.
  4. 충돌이 없으면 `git push origin main`을 실행한다.
- 원격에 관리자 패널 커밋이 있어도 merge commit을 만들지 말고 rebase로 내 커밋을 최신 `origin/main` 위에 올린다.
