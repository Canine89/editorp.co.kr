자, Claude Code에 mods라는 게 새로 들어왔어요. 한마디로 Claude Code를 <strong>내 입맛대로 개조하는 기능</strong>입니다.

지금까지 바이브 코딩이라고 하면 웹 애플리케이션 같은 걸 만들었잖아요. 이제는 Claude Code 세션 안에서 도는 프로그램 자체도 바이브 코딩으로 만드는 시대가 온 거예요. 뭔 말인지는 직접 만들어 보면 바로 감이 오실 거고요. 오늘은 이론을 가볍게 훑고, 실제로 Claude Code 안에 파일 탐색기를 하나 만들어 보겠습니다. 순서는 이렇습니다.

1. mod가 뭔지
2. 훅이랑 뭐가 다른지
3. mod는 어디에 담기고, 어디에 두는지
4. 파일 탐색기를 말로 만들기
5. 남이 만든 mod를 깔기 전에 꼭 볼 것

## mod가 뭐냐면: 게임 모드랑 같은 얘기예요

자, 게임 모드 아시죠? 원래 게임은 게임 회사가 만들어 준 그대로잖아요. 근데 여기에 귀염뽀짝한 스킨을 뒤집어씌워서 나만 그렇게 보면서 즐기거나, 없던 기능을 붙여서 노는 걸 모드라고 해요. 이걸 하는 걸 모딩이라고 하고요. 유명한 예를 하나 들면, 카운터스트라이크도 원래는 하프라이프라는 게임의 모드였어요.

Claude Code에도 이런 모드가 생긴 겁니다. 공식 문서는 한 줄로 이렇게 정의해요.

> "A mod is a plugin that changes how Claude Code looks and behaves."

생김새도 바꾸고, 하는 일도 바꾼다는 거죠. 그럼 어떻게 바꾸냐? Claude Code는 일할 때마다 "나 지금 이거 한다" 하고 신호를 내요. 도구를 부를 때, 프롬프트를 받을 때, 화면을 그릴 때, 모델한테 요청을 보내기 직전에요. 이 신호를 이벤트라고 합니다. mod는 이 이벤트가 올 때마다 <strong>중간에 끼어드는 내 코드</strong>예요. 자바스크립트나 타입스크립트로 쓴 함수인데, Claude Code 안에서 바로 돌아요.

> "It's made of JavaScript or TypeScript event handlers: Claude Code calls one when an event happens, such as a tool call, a submitted prompt, or a part of the interface being drawn, and the handler can watch the event, change it, or take it over."

그래서 할 수 있는 건 크게 두 가지예요.

- <strong>생김새 바꾸기</strong>: Claude Code 세션에는 원래 파일 탐색기가 없잖아요. 이런 창을 새로 그려 붙일 수 있어요. 오늘 만들 게 바로 이거예요.
- <strong>하는 일 바꾸기</strong>: 예를 들어서 내가 입력한 프롬프트 맞춤법이 마음에 안 든다? 엔터 친 순간 맞춤법을 고쳐서 Claude한테 넘기게 할 수 있어요. 아예 영어 프롬프트로 바꿔서 보내게 할 수도 있고요.

코드라니까 겁나시죠? 걱정 마세요. 코드는 Claude가 대신 짜 줍니다. 다만 Claude Code가 v2.1.287 이상이어야 하니까, `claude --version`으로 버전만 한 번 보시고 낮으면 업데이트부터 하세요.

> "Mods require Claude Code v2.1.287 or later, and they're on by default."

> <strong>정리</strong>
>
> mod는 Claude Code가 일할 때마다 내는 신호(이벤트)에 끼어드는 내 코드예요. 생김새도 바꾸고 하는 일도 바꿉니다. 코드는 Claude가 짜 줘요.

출처
- Anthropic, *Customize Claude Code with mods* (2026-10-01), [claude.com/blog/claude-code-mods](https://claude.com/blog/claude-code-mods)
- Claude Code Docs, *Mods overview*, [code.claude.com/docs/en/plugins/mods/overview](https://code.claude.com/docs/en/plugins/mods/overview)
- Wikipedia, *Video game modding*, [en.wikipedia.org/wiki/Video_game_modding](https://en.wikipedia.org/wiki/Video_game_modding)

## 훅이랑 같은 거냐? 원리는 같고, 물건은 달라요

자, 훅 써 보신 분들은 여기서 무조건 이 생각 하실 거예요. "중간에 끼어든다고? 그거 훅 아냐?" 훅은 설정 파일에 적어 두면 정해진 순간에 명령을 돌려 주는, 원래 있던 기능이죠.

결론부터 말하면, <strong>원리는 같아요.</strong> "Claude Code가 뭘 하기 직전에 신호를 낸다"는 아이디어는 똑같습니다. 근데 원래 훅이 mod로 바뀐 게 아니라, 같은 아이디어로 하나가 새로 생긴 거예요. 원래 훅은 그대로 있고, 둘을 같이 걸 수도 있어요. 공식 문서도 헷갈릴까 봐 이름을 갈라 놨어요. mods 문서에서 그냥 hook이라고 하면 mod 안의 함수고, 원래 있던 건 settings hook이라고 부릅니다.

> "Claude Code's existing hooks also run on events, as a shell command, HTTP request, or prompt you configure in a settings file. A mod's handlers are functions that run inside Claude Code instead."

이름은 달라도 자리가 비슷한 짝이 있어요.

| 훅 이벤트 (설정 파일) | 자리가 비슷한 mod 이벤트 | 언제 |
| :- | :- | :- |
| `PreToolUse` | `tool.call` | 도구 쓰기 직전 |
| `UserPromptSubmit` | `prompt.submit` | 프롬프트 보낼 때 |
| `Stop` | `turn.complete` | 답변 끝날 때 |
| 없음 | `ui.render`, `turn.step` | 화면 한 부분 그리기 직전, 모델한테 요청 보내기 직전 |

그럼 결정적인 차이는 뭐냐? <strong>어디서 도느냐</strong>예요. 훅은 Claude Code가 셸 명령 같은 스크립트를 밖에 따로 띄워 돌리고 결과만 받아 와요. 그 결과로 정할 수 있는 건 진행할지 말지, 도구에 넘길 값, Claude한테 덧붙일 말 정도예요. mod는 Claude Code 안에서 함수로 바로 돌아서, 프롬프트 글 자체를 바꾸고 화면까지 그립니다. 오늘 만들 파일 탐색기 같은 창은 훅으로는 절대 못 그려요.

예를 들어서 집으로 치면요, 훅은 집 밖에 달린 초인종이에요. 누가 오면 "딩동" 하고 알려 주고, 문을 열지 말지, 들여보낼 때 쪽지를 하나 붙일지 정도를 정하죠. mod는 집 안에 들어와서 <strong>인테리어를 바꾸는 쪽</strong>이에요. 벽지를 바꾸고(화면), 들어온 편지를 고쳐 쓰고(프롬프트), 방을 하나 새로 들이고(새 기능). 근데 집 안을 바꿀 수 있다는 건 집 안에 있는 걸 다 만질 수 있다는 뜻이기도 해요. 이건 뒤에 안전 얘기에서 다시 나옵니다.

참고로 둘 다 걸려 있으면, 도구 쓰기 직전에 mod가 먼저 보고 내 설정 파일의 훅이 그다음에 돌아요. 회사가 관리 설정에 넣은 훅만 mod보다 앞이고요.

> <strong>정리</strong>
>
> 훅이랑 mod는 원리가 같아요. 근데 훅은 Claude Code 밖에서 스크립트로 돌고, mod는 안에서 함수로 돌아요. 그래서 mod는 글을 바꾸고 화면까지 그립니다.

출처
- Claude Code Docs, *Mods overview: Compare mods, settings hooks, skills, and MCP servers*, [code.claude.com/docs/en/plugins/mods/overview](https://code.claude.com/docs/en/plugins/mods/overview)
- Claude Code Docs, *React to events with a mod: The order mods run in*, [code.claude.com/docs/en/plugins/mods/events](https://code.claude.com/docs/en/plugins/mods/events)
- Claude Code Docs, *Mods reference: Events*, [code.claude.com/docs/en/plugins/mods/reference](https://code.claude.com/docs/en/plugins/mods/reference)

## mod는 플러그인 안에 들어 있어요

자, 그럼 mod는 어디에 있냐? <strong>플러그인 안에</strong> 있습니다. 플러그인 아시죠? `/plugin` 쳐서 마켓플레이스에서 깔던 그거요. 스킬이나 MCP 같은 걸 한데 묶어서 짜부시켜 주는 게 플러그인인데, 그 안에 이제 mod가 추가된 거예요.

여기서 "플러그인? 또 새로운 게 나왔어?" 하실 수 있는데요, 아니에요. 원래 있던 그 플러그인이에요. 새 상자가 생긴 게 아니라 원래 상자에 칸이 하나 늘어난 거죠. 그래서 깔 때도 `/plugin`, 끌 때도 `/plugin`입니다.

> "A mod installs as a plugin, from a marketplace. ... [Install plugins] covers marketplaces, scopes, the VS Code extension and the Desktop app, and keeping plugins updated, all of which apply to a plugin that contains a mod without changes."

> "A plugin can hold all of them, so a mod can ship in the same plugin as a skill and an MCP server."

다른 점이 하나 있어요. 스킬이나 MCP는 플러그인 없이 따로도 써요. 근데 mod는 <strong>항상 플러그인에 담겨서</strong> 옵니다.

### 약간 아이러니한 위치, skills 폴더

근데 여기서 좀 아이러니한 게 나와요. Claude한테 mod를 만들어 달라고 하면, 만든 세션에서는 그냥 바로 돌아요. 문제는 그다음이에요. 다른 세션에서도 계속 쓰려면 이 mod를 **`.claude/skills` 폴더**에 넣어야 하거든요.

"어? 플러그인 안에 스킬이 있다면서, 스킬 폴더 안에 플러그인을 넣어? 거꾸로 아냐?" 맞아요, 이거 진짜 헷갈립니다. skills라는 이름이 두 군데 나와서 그래요.

- **플러그인 안의 `skills/`**: 플러그인이 담고 있는 스킬 칸이에요.
- **`~/.claude/skills/`**: Claude Code가 켤 때마다 열어 보는 서랍이에요. 원래는 스킬만 넣던 곳인데, 지금은 플러그인 폴더를 넣어도 알아서 켜 줘요.

이게 정식 자리라는 증거도 있어요. Claude Code가 새 플러그인 뼈대를 만들어 주는 `claude plugin init` 명령이 바로 이 서랍에 만들거든요. 플러그인 배포 문서에도 이렇게 적혀 있고요.

> "Your personal skills directory is `~/.claude/skills/`. Claude Code loads any folder there that contains a `.claude-plugin/plugin.json` as a plugin in every session, with no flag and no install step."

> "For every session: they move the plugin directory, with its `.claude-plugin/plugin.json`, under `~/.claude/skills/` so Claude Code loads it in every session."

솔직히 구조를 몰라도 쓰는 데 지장은 없어요. 구조가 궁금하셨던 분들은 이 난해한 위치 선정을 그냥 받아들이시면 됩니다. 저는 이름은 신경 쓰지 말고 <strong>"자동으로 켜 주는 서랍"</strong>이라고 기억하시는 게 제일 편하다고 생각해요.

> <strong>정리</strong>
>
> mod는 원래 있던 플러그인에 담겨요. 만든 세션에서는 바로 돌고, 계속 쓰려면 mod 폴더를 `.claude/skills`라는 "자동으로 켜 주는 서랍"에 넣으면 됩니다.

출처
- Claude Code Docs, *Mods overview: Install or update a mod*, [code.claude.com/docs/en/plugins/mods/overview](https://code.claude.com/docs/en/plugins/mods/overview)
- Claude Code Docs, *Create a mod: Use the mod in other sessions*, [code.claude.com/docs/en/plugins/mods/create](https://code.claude.com/docs/en/plugins/mods/create)
- Claude Code Docs, *Create plugins: Make a plugin load in every session*, [code.claude.com/docs/en/plugins/create](https://code.claude.com/docs/en/plugins/create)
- Claude Code Docs, *Publish and distribute a plugin: Share a plugin without a marketplace*, [code.claude.com/docs/en/plugins/publish](https://code.claude.com/docs/en/plugins/publish)

## 전역으로 쓸까, 이 프로젝트에서만 쓸까

자, 그럼 그 서랍은 어디 있냐? 두 군데예요.

- <strong>전역</strong>: 내 홈의 `~/.claude/skills`. 여기 넣으면 내 모든 프로젝트에서 켜져요.
- <strong>지역</strong>: 프로젝트 폴더 안의 `.claude/skills`. 여기 넣으면 그 프로젝트에서만 켜져요.

> "To make a plugin load for everyone in one repository, create the same layout yourself at `<project>/.claude/skills/<name>/`, including its `.claude-plugin/plugin.json`."

어느 쪽이든 안의 구조는 똑같아요. 서랍 안에 <strong>mod 하나당 폴더 하나</strong>를 만들고, 그 폴더 안에 이름표(`plugin.json`)와 코드를 둡니다.

```
내 프로젝트/
└── .claude/
    └── skills/
        └── file-explorer/          ← mod 하나 = 폴더 하나
            ├── .claude-plugin/
            │   └── plugin.json     ← 이름표
            └── hooks/
                ├── hooks.json      ← 코드 파일 위치
                └── register.js     ← mod 코드
```

여기서 많이들 헷갈리시는 게, `skills` 폴더 바로 밑에 `plugin.json`을 두는 게 아니에요. 꼭 mod 이름 폴더를 하나 만들고 그 안에 둬야 합니다. `plugin.json`이 상자에 붙은 이름표라서, 이게 있어야 Claude Code가 "아, 플러그인이구나" 하고 켜 줘요. 어려우면 이것도 말로 시키세요. "이 mod, 이 프로젝트의 `.claude/skills`로 복사해 줘." Claude가 폴더째 옮겨 줍니다.

프로젝트 쪽은 조건이 몇 개 있어요.

> "A project-scope skills-directory plugin loads only from the `.claude/skills/` of the session's primary working directory, and only after you accept the workspace trust dialog for that folder."

- <strong>프로젝트 맨 위 폴더에서 켜야 해요.</strong> 하위 폴더에서 Claude Code를 켜면 위쪽 `.claude/skills`를 안 찾아봐서 mod가 안 켜집니다.
- <strong>"이 폴더 믿어요?"를 승인해야 해요.</strong> 처음 여는 폴더면 이 창에서 승인해야 켜져요.
- <strong>같은 이름이 전역에도 있으면 전역 쪽이 켜져요.</strong>
- <strong>git에 올리면 팀원한테도 켜져요.</strong> 팀원 컴퓨터에서 그 사람 권한으로 돌아요. 나만 쓸 거면 `.gitignore`에 넣어 두세요.

제가 직접 넣어 보니까, 맨 위 폴더에서 켰을 때는 `claude plugin list`에 `@skills-dir`, Scope는 `project`로 잡혔고, 하위 폴더에서 켰을 때는 안 잡혔어요. 문서랑 똑같이 움직입니다.

> <strong>정리</strong>
>
> 전역은 `~/.claude/skills`, 지역은 프로젝트의 `.claude/skills`. 둘 다 mod 이름 폴더를 통째로 넣는 건 똑같아요. 프로젝트 쪽은 맨 위 폴더에서 켜야 한다는 것만 기억하세요.

출처
- Claude Code Docs, *Plugin loading reference: Find where a plugin came from, Plugins shared through a repository*, [code.claude.com/docs/en/plugins/loading](https://code.claude.com/docs/en/plugins/loading)
- Claude Code Docs, *Create plugins: Share the plugin through a repository*, [code.claude.com/docs/en/plugins/create](https://code.claude.com/docs/en/plugins/create)

## 만드는 법: 그냥 바이브 코딩하듯이

자, 만드는 법은 진짜 간단해요. 바이브 코딩하시듯이 그냥 말하시면 됩니다. Claude가 mod 만드는 법이 적힌 내장 스킬(`plugin-authoring`)을 꺼내 읽고 알아서 짜요. 코드는 자바스크립트나 타입스크립트로 짜는데, 바로 이 특징 때문에 뒤에서 보안 얘기를 하나 드릴 거예요.

> "Describe the mod you want in an interactive Claude Code session, and Claude writes it."

### 1. 폴더 만들고 Claude Code 켜기

저는 연습용으로 `CC_MOD_STUDY`라는 빈 폴더를 하나 만들고, 거기로 이동해서 Claude Code를 켰어요. 모델은 Opus 5.5, effort는 high로 했고요. `/model`을 치고 모델을 고른 다음, 키보드 좌우로 effort를 정하면 됩니다.

### 2. 말로 부탁하기

이렇게 말했어요.

> 이 프로젝트 폴더에 모드를 하나 추가할 거야. 기능은 파일 탐색기 기능인데, 오른쪽에 파일 탐색기를 추가해서 내 프로젝트 폴더에 뭐가 있는지 볼 수 있게 해 주면 돼. 그리고 파일을 멘션하기 편하도록 멘션할 수 있는 버튼 기능도 추가해서 파일 탐색기를 만들어 줘.

왜 멘션 버튼이냐? Claude한테 "이 파일 봐 줘" 하고 파일을 멘션할 때마다 경로를 타이핑하면 불편하잖아요. 탐색기에서 버튼 하나로 넣으면 편하니까요.

### 3. "이 세션에서 켤까요?"에 승인

Claude가 순식간에 mod를 완성하고 나면 "핫 리로드 켤까요?" 하고 물어요. <strong>Enable for this session</strong>을 고르면 그 턴이 끝날 때 mod가 바로 켜지고, 이후에 고칠 때마다 다시 켜져요. 여기서 세션은 지금 Claude Code가 떠 있는 이 화면을 말하는 거예요. 중간에 "파일 만들어도 돼요?"도 물어보는데, mod가 저장되는 `~/.claude`가 보호된 폴더라서 그래요. 승인만 눌러 주시면 됩니다.

### 4. 옆에 안 붙으면? `/tui fullscreen`

근데 처음엔 탐색기가 오른쪽이 아니라 프롬프트 위에 떴어요. 그래서 "채팅이랑 파일 탐색기가 2열로 보여야 한다고!" 하고 고쳐 달라고 했죠. 그랬더니 Claude가 "창을 어디에 둘지는 Claude Code가 정하는 거라서, mod 코드만으로는 못 바꾼다. `/tui fullscreen`을 하라"고 답하더라고요. 이거 맞는 말이에요.

> "A pane is a sidebar beside the transcript in a wide fullscreen terminal, or a framed region above the prompt otherwise."

여기서 fullscreen은 터미널 창을 최대화하라는 말이 아니에요. Claude Code의 화면 모드 이름이에요.

> "The term fullscreen describes how Claude Code takes over the terminal's drawing surface, the way `vim` does. It has nothing to do with maximizing your terminal window, and works at any window size."

`/tui fullscreen`으로 바꾸고 터미널을 넓게 띄웠더니 오른쪽에 탐색기가 딱 붙었어요. 정말 놀랍지 않습니까? 창은 Ctrl+X 다음 X로 닫고, Ctrl+X 다음 화살표로 넓혔다 줄였다 할 수 있어요.

### 5. 써 보고, 또 말로 고치기

빈 폴더라 처음엔 아무것도 안 보여요. 그래서 "이 폴더에 일기 하나만 써 봐" 했더니 일기 파일이 바로 탐색기에 뜨더라고요. 예전엔 일기 쓰라고 시켜 놓고 파일 탐색기 따로 열어서 확인하고, 아주 의미 없어 보이는 작업들을 했어야 했잖아요. 이제는 바로 보여요. 폴더도 만들어 보라고 했더니 폴더가 생기고, 접었다 폈다도 당연히 돼요.

근데 메모 파일을 눌렀더니 내용이 안 보이고 멘션만 되더라고요. 마음에 안 들면? 또 말하면 돼요. "간단한 md 파일은 누르면 현재 세션에서 슬쩍 들여다볼(peek) 수 있게 해 줘." 그러니까 파일을 누르면 미리보기가 뜨고, 목록으로 돌아갈 수도 있고, 골뱅이(`@`) 버튼을 누르면 멘션이 뿅 들어가요. 이렇게 고칠 때마다 턴이 끝나면 다시 켜지니까 바로 확인할 수 있어요.

이게 mod의 장점이에요. 밋밋한 터미널에 나만의 기능이 쏙 들어간, 마개조한 Claude Code를 쓸 수 있는 거죠. 저는 이걸로 유용한 거 몇 개 더 만들어서 써 보려고 해요.

### 6. 다음에도 쓰려면, 꼭 옮겨 두세요

여기서 하나 놓치기 쉬운 게 있어요. 이렇게 Claude가 만들어 준 mod는 `~/.claude/dev-mods/` 아래 그 세션 전용 폴더에 들어 있어요. 그래서 <strong>그 세션에서만</strong> 돌고, 이 폴더는 시간이 지나면 자동으로 지워집니다.

> "A mod Claude wrote loads only in the session that made it, and Claude Code deletes that session's mods folder once it's older than `cleanupPeriodDays`."

그러니까 같은 폴더라도 Claude Code를 새 세션으로 켜면, 그대로 두면 탐색기가 안 떠요. (그 세션을 이어 하기로 다시 열 때만 다시 켜져요.) 계속 쓰시려면 마지막에 이것까지 시키세요. 이 프로젝트에서만 쓸 거면 "이 mod, 이 프로젝트의 `.claude/skills`로 복사해 줘", 어디서든 쓸 거면 "`~/.claude/skills`로 복사해 줘". 이거 모르고 "어제 만든 거 어디 갔어?" 하시는 분들 분명히 나옵니다.

오늘 만든 파일 탐색기는 제 GitHub에도 올려 뒀어요. 따라 만들기 귀찮으시면 이걸 받아서 쓰셔도 되는데, 아래 안전 얘기를 먼저 읽고 판단하세요.

```bash
claude plugin marketplace add Canine89/cc-mod-file-explorer
claude plugin install file-explorer@cc-mod-file-explorer
```

> <strong>정리</strong>
>
> 만드는 법은 그냥 말로 부탁하기예요. 승인하고, 써 보고, 마음에 안 들면 또 말로 고치기. 창이 옆에 안 붙으면 `/tui fullscreen`. 다음에도 쓰려면 `.claude/skills`로 옮겨 두기.

출처
- Claude Code Docs, *Create a mod: Ask Claude for a mod, Use the mod in other sessions*, [code.claude.com/docs/en/plugins/mods/create](https://code.claude.com/docs/en/plugins/mods/create)
- Claude Code Docs, *Draw in the interface with a mod: Keyboard focus and hotkeys*, [code.claude.com/docs/en/plugins/mods/interface](https://code.claude.com/docs/en/plugins/mods/interface)
- Claude Code Docs, *Fullscreen rendering*, [code.claude.com/docs/en/fullscreen](https://code.claude.com/docs/en/fullscreen)
- Canine89/cc-mod-file-explorer (GitHub), [github.com/Canine89/cc-mod-file-explorer](https://github.com/Canine89/cc-mod-file-explorer)

## 남이 만든 mod, 깔기 전에 꼭 볼 것

자, 아까 mod는 코드를 포함하고 있다고 말씀드렸죠. 자바스크립트나 타입스크립트로 도는 코드가 들어 있는데, 이게 <strong>내 권한 그대로</strong> 돌아요. 따로 가둬 두는 방(샌드박스)도 없어요.

> "A mod is code that runs with your permissions. It can read and write your files, start processes, and make network requests."

그러니까 그 코드 안에 예를 들어서 "프로젝트 폴더의 `.env` 파일을 읽어서 외부 서버로 보내라"가 숨어 있으면? 여러분 API 키가 털리는 거예요. 그 키로 누가 내 돈으로 AI를 막 쓰면, 이게 다 돈이에요, 여러분. 그리고 범위가 프로젝트 폴더만도 아니에요. 공식 문서에 적힌 걸 보면 생각보다 넓습니다.

- 내 계정이 읽을 수 있는 파일은 어디든 읽고 써요.
- 환경 변수와 설정 파일, 거기 넣어 둔 API 키도 봐요.
- 내가 보내는 프롬프트와 Claude가 부르는 도구도 다 봐요.
- 허락 창이 뜨기도 전에 "네"를 대신 누를 수 있어요.
- 내 요금제로 모델을 불러서 사용량을 쓸 수 있어요.

여기서 많이들 착각하시는 게 있어요. "나 설정에서 `.env` 읽기 막아 놨는데?" 그 막아 두는 규칙은 Claude가 쓰는 도구에만 걸려요. mod가 직접 읽는 건 못 막습니다. 공식 문서에 `.env`를 콕 집어서 적혀 있어요.

> "with `Read(.env)` denied, a mod can still read that file with `$.fs.read` or start a program that does."

샌드박스를 켜 놨어도 마찬가지예요. 샌드박스는 Claude가 돌리는 명령만 가두거든요.

> "If you turn on sandboxing, the sandbox isolates the Bash commands Claude runs, and a process that a mod starts runs outside it."

### validate는 "판정"이 아니라 "목록"이에요

그럼 어떻게 하냐? 깔기 전에 `claude plugin validate`를 돌려 보세요. 근데 이게 "이 mod 안전합니다" 하고 판정해 주는 기능은 아니에요. 이 mod가 어떤 이벤트에 끼어들고(`hooks:` 줄), 어떤 기능을 부르는지(`calls:` 줄) <strong>목록을 보여 주는</strong> 거예요. 판단은 그 목록을 보고 내가 해야 합니다.

예를 들어서 제가 만든 파일 탐색기를 돌려 보면 이렇게 나와요.

```text
❯ ./register.tsx hooks: session.start, command.run{command=files}, tool.call, ui.render{component=Pane, requestId=file-explorer}
❯ ./register.tsx calls: $.command.register, $.fs.list (via collectRows), $.fs.read, $.prompt.fill (via mention), $.prompt.read (via mention), $.session.cwd, $.state.get, $.state.set, $.ui.open, $.ui.resolve, $.ui.toast (via mention)
```

파일 탐색기니까 파일 목록 읽기(`$.fs.list`), 파일 읽기(`$.fs.read`)는 원래 하는 일이 맞죠. 근데 여기에 인터넷으로 보내는 `$.http.fetch`가 같이 있다? "파일 탐색기가 인터넷엔 왜 나가?" 이걸 따져 보셔야 합니다. 다만 어떤 파일을 어디로 보내는지까지는 안 나와요. 그래서 결국 제일 확실한 건 따로 있어요.

### 모르면 그냥 직접 만드세요

깔기 전에 딱 하나만 물어보세요. "이거 누가 만들었지?" Anthropic이 넣어 둔 기본 mod, 회사에서 깔아 준 것, 확실히 아는 사람이 만든 거면 validate로 한 번 보고 쓰셔도 돼요. 마켓플레이스에 올라와 있다고 보증된 건 아니라는 것만 기억하시고요.

근데 잘 모르는 사람 거다? 그럼 그냥 깔지 마세요. 아까 봤잖아요, 말로 시키면 끝이에요. 탐나는 mod가 있으면 그 설명을 보고 "이런 기능 mod 만들어 줘" 하시면 됩니다. 굳이 모르는 사람을 집에 들일 이유가 없어요.

그리고 뭐가 됐든 이상하면 바로 끄세요.

- <strong>하나만 끄기</strong>: `/plugin`의 Installed 탭에서 끄거나 지우기
- <strong>이번 세션만 전부 끄기</strong>: `claude --safe-mode`로 켜기
- <strong>늘 끄기</strong>: 설정에 `"disableAllHooks": true`. 단, 설정 훅과 상태 표시줄까지 같이 꺼지니까 꼭 필요할 때만

> <strong>정리</strong>
>
> mod는 내 권한 그대로 도는 코드라서, 남이 만든 걸 깔면 모르는 사람을 집 안에 들이는 거예요. validate는 판정이 아니라 목록이니 calls 줄을 직접 보고, 모르는 사람 거면 깔지 말고 직접 만드세요.

출처
- Claude Code Docs, *Mods overview: Decide whether to trust a mod, Turn mods on or off*, [code.claude.com/docs/en/plugins/mods/overview](https://code.claude.com/docs/en/plugins/mods/overview)
- Claude Code Docs, *Manage mods for your organization: Know what happens by default, Review what a mod can do*, [code.claude.com/docs/en/plugins/mods/admin](https://code.claude.com/docs/en/plugins/mods/admin)
- Claude Code Docs, *Create a mod: Check what Claude Code reads from your mod*, [code.claude.com/docs/en/plugins/mods/create](https://code.claude.com/docs/en/plugins/mods/create)
- Claude Code Docs, *Configure permissions: Extend permissions with hooks*, [code.claude.com/docs/en/permissions](https://code.claude.com/docs/en/permissions)

## 정리: mod를 쓸 때의 순서

자, 오늘 내용을 정리하면 이렇습니다.

1. <strong>mod는 Claude Code를 개조하는 코드예요.</strong> 일할 때마다 나오는 신호에 끼어들어서 생김새와 하는 일을 바꿉니다.
2. <strong>훅이랑 원리는 같지만, mod는 안에서 돌아요.</strong> 그래서 화면도 그리고 글도 바꿔요.
3. <strong>mod는 원래 있던 플러그인에 담겨요.</strong> 계속 쓰려면 `.claude/skills`라는 "자동으로 켜 주는 서랍"에 넣어요. 전역은 홈, 지역은 프로젝트.
4. <strong>남이 만든 mod는 의심부터.</strong> validate로 calls 줄을 보고, 모르면 직접 만들어요.

실제로 쓰실 때의 순서로 바꿔 말하면 이래요. 원하는 걸 말로 부탁하고, 승인하고, 써 보면서 또 말로 고치고, 마음에 들면 `.claude/skills`로 옮겨 두기. 이 순서만 기억하셔도 mod 하나 만들어서 안전하게 쓰시는 데까지는 무조건 가십니다.

바이브 코딩하듯이 만들면 되니까 누구나 쉽게 만들 수 있을 거예요. 여러분의 창의적인 아이디어로 재미있는 모딩 한번 해 보시고요, 좋은 mod가 있으면 저한테도 알려 주세요. 저도 들어가서 확인해 보고, 직접 만들어 보든 소개를 하든 해 보겠습니다.

## 더 알아볼 거리

- <strong>이미 들어 있는 mod</strong>: `/diff` 화면처럼 Claude Code 자체 기능 중에도 mod로 만든 게 있어요. `/plugin`의 Installed 탭에서 Built-in 아래 목록을 보실 수 있고, 일부는 소스도 공개돼 있어요.
- <strong>샘플 mod</strong>: Anthropic이 컨텍스트 창을 날씨 예보처럼 보여 주는 `token-weather`, 위험한 셸 명령을 붙잡아 두는 `blast-radius` 같은 샘플을 공개해 뒀어요.
- <strong>화면 그리기 심화</strong>: 창, 프롬프트 위 띠, 버튼, 입력칸을 직접 다루는 방법은 화면 그리기 문서에 따로 있어요.
- <strong>mod 테스트</strong>: `claude plugin test`로 세션 없이 mod를 자동으로 시험해 볼 수 있어요.

출처
- Claude Code Docs, *Mods overview: Mods built into Claude Code, Try a sample mod*, [code.claude.com/docs/en/plugins/mods/overview](https://code.claude.com/docs/en/plugins/mods/overview)
- anthropics/claude-code-playground, *claude-code/mods*, [github.com/anthropics/claude-code-playground/tree/main/claude-code/mods](https://github.com/anthropics/claude-code-playground/tree/main/claude-code/mods)
- Claude Code Docs, *Draw in the interface with a mod*, [code.claude.com/docs/en/plugins/mods/interface](https://code.claude.com/docs/en/plugins/mods/interface)
- Claude Code Docs, *Test a mod*, [code.claude.com/docs/en/plugins/mods/test](https://code.claude.com/docs/en/plugins/mods/test)
