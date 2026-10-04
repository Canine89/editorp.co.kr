자, 고객 문의가 하루에 수백 건씩 쏟아진다고 해 볼게요. "이건 결제 문제, 이건 기술 문제" 하고 나누는 것만 해도 일이잖아요. 요걸 AI한테 맡기려면 무엇을 알아야 하는지, Laya라는 모델을 기준으로 정리해 봤습니다.

제목은 거창하게 "분류 모델"이라고 붙였는데, 입문하시는 분들이 감을 잡을 수 있게 쉽게 풀어 쓴 완전 입문 가이드라고 보시면 됩니다. 순서는 이렇습니다.

1. System One 모델이 뭔지
2. CHOICE로 묻는 법과 confidence(확신)
3. calibration(보정)과 threshold(문턱)
4. Laya가 배우는 방식, RLCD
5. 데이터를 8:1:1로 나누는 이유

용어만 보면 꽤 전문적인 얘기 같은데, 하나씩 뜯어 보면 사실 상식적인 얘기들이에요. 천천히 따라오시면 충분히 이해가 되실 겁니다. 다 읽고 나면 "Laya는 이런 식으로 쓰면 되는구나" 하는 감이 잡히는 게 이 글의 목표예요.

## System 1과 System 2: 답장을 쓰는 AI, 판단만 하는 AI

자, 먼저 System 1과 System 2의 차이부터 볼게요.

<strong>System 2</strong>는 우리가 매일 쓰는 LLM들입니다. Claude, ChatGPT, Codex 같은 녀석들이요. 얘네는 정성스럽게 답장을 써 줘요. 그런데 글을 한 글자씩 만들어 내야 하니까 시간이 걸리고, 토큰도 쓰고, 그만큼 비쌉니다.

<strong>System 1</strong>은 Jev, Laya 같은 모델이에요. 얘네는 답장을 안 써요. 고객센터 접수 창구 직원처럼 문의를 쓱 보고 "결제팀이요" 하고 분류만 탁 해 줍니다. 글을 만들 필요가 없으니까 싸고 빠르죠. Laya는 공식 수치 기준으로 GPU 한 장에서 질문 하나에 32.8ms, 0.03초 정도면 답이 나와요.

이름은 심리학에서 왔어요. 사람의 생각을 빠르고 직관적인 System 1, 느리고 신중한 System 2로 나누는 구분인데, 심리학자 카너먼이 『생각에 관한 생각』으로 널리 알렸죠. Jev를 만든 TypeSafe도 카너먼에게서 영감을 받았다고 밝혔고, 이 종류를 이렇게 소개합니다.

> "a new class of frontier models built to make fast, structured decisions that software can use directly."

여기서 하나 오해하면 안 되는 게 있어요. System 1이라고 대충 판단한다는 뜻은 아닙니다. TypeSafe는 답의 모양이 정해져 있어서 오히려 자동화에 쓰기 좋고, 다른 방식보다 더 믿을 만하게 만들 수 있다고 말해요. 물론 만든 회사의 주장이니 그 점은 감안해서 보시면 됩니다.

그리고 "결제팀으로 보낸다"라고 딱 잘라 말해 주면 좋겠지만, 실제로는 그렇게 간단하게 끝나지 않아요. 그 사이에 무슨 일이 있는지 아는 게 이 글의 진짜 이야기입니다.

> <strong>정리</strong>
>
> LLM이 "답장을 쓰는 직원"이라면 System One 모델은 "접수 창구 직원"이에요. 글은 안 쓰고, 보자마자 어느 칸인지 판단만 빠르게 합니다.

출처
- TypeSafe, *Introducing System One Models & Jev* (2026-09-15), [typesafe.ai/blog/introducing-system-one-models-and-jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev)
- Laya 공식 사이트, [laya.convaiinnovations.com](https://laya.convaiinnovations.com/)

## Jev와 Laya: 같은 종류, 다른 회사

자, Jev랑 Laya가 뭐가 다른지 궁금하신 분들 많을 것 같아요. 결론부터 말하면 <strong>같은 종류의 모델을 서로 다른 회사가 만든 거예요.</strong> 둘 다 System One 모델이고, 묻고 답하는 형식도 같습니다. 질문은 choice, score, noul 세 종류로 하고, Laya 서버는 Jev API랑 같은 주소 형식(`POST /v1/systemone`)으로 묻고 같은 모양으로 답해요. 그래서 Jev용으로 짠 프로그램은 주소만 바꾸면 Laya에 붙는다고 README에 적혀 있습니다.

> "POST /v1/systemone wire protocol as TypeSafe's hosted Jev API. Laya's answer payload is already schema-identical to what Jev returns"

현실적으로 제일 크게 다른 건 두 가지예요.

- <strong>돈</strong>: Jev는 TypeSafe 서버에 API로 요청을 보내고 돈을 냅니다. 입력 토큰 100만 개당 0.042달러, 출력은 무료예요. Laya는 Convai Innovations가 공개한 오픈소스(Apache 2.0)라 사용료가 없습니다.
- <strong>데이터가 어디를 다녀오나</strong>: Jev는 고객 문의가 TypeSafe 서버에 갔다 와요. Laya는 모델 파일을 받아서 우리 컴퓨터나 회사 서버 안에서만 돌립니다. 대신 GPU 같은 장비와 설치는 직접 챙겨야 하죠.

Laya를 쓰려는 분들은 아마 이 두 가지 장점 때문일 거예요.

다만 "완전히 똑같은 모델"은 아니에요. 같은 형식으로 묻고 답할 뿐 속은 다른 모델이라 잘하는 일도 달라요. 예를 들어 보기가 아주 많은 질문에서는 Jev가 낫다고 Laya README에 스스로 적어 뒀습니다(뒤의 '분류' 섹션에서 다시 나와요). 저번에 Jev가 뭔지 다룬 [Jev란 무엇인가](https://www.youtube.com/watch?v=mDnbjbjosFY) 영상과 같이 보시면 더 잘 들어오실 거예요.

> <strong>정리</strong>
>
> Jev와 Laya는 같은 종류, 같은 형식의 System One 모델이에요. Jev는 돈 내고 API로 빌려 쓰고, Laya는 무료로 내 서버에 직접 깝니다.

출처
- TypeSafe, *Introducing System One Models & Jev* (2026-09-15), [typesafe.ai/blog/introducing-system-one-models-and-jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev)
- NandhaKishorM/laya (GitHub README), [github.com/NandhaKishorM/laya](https://github.com/NandhaKishorM/laya)

## Laya가 하는 일: choice, score, noul

자, Laya가 실제로 뭘 하는지 볼게요. 고객 문의 메시지가 하나 왔다고 해 보겠습니다. Laya는 이걸 받아서 정해 둔 질문에 이런 식으로 답해요.

- <strong>choice</strong> (보기 중 하나 고르기): "결제팀으로 보내자"
- <strong>score</strong> (단계로 점수 매기기): "긴급도는 '곧 처리' 정도"
- <strong>noul</strong> (예/아니오를 확률로): "해지할 위험은 낮다"

이 세 가지가 질문의 전부예요. 글을 한 글자씩 써 내려가는 게 아니라 <strong>한 번의 계산(single forward pass)</strong>으로 답을 내니까 빠르고, 100개가 넘는 언어를 다룹니다. 한국어 문의는 Laya가 알아서 다국어 모델(`laya-multilingual`)로 보내 줘요. README에 "영어가 아닌 글은 다국어 모델로 보낸다"고 적혀 있습니다.

> "Non-autoregressive System 1 decision engine. Typed choice, score and yes/no decisions over any text in a single forward pass, in 100+ languages, with a router that picks the right checkpoint per request."

이 글에서는 이 중 <strong>choice</strong> 하나만 깊게 파 보겠습니다. 고객 문의를 부서별로 나누는 게 딱 choice거든요.

> <strong>정리</strong>
>
> Laya는 정해진 질문 세 종류(choice, score, noul)에 빠르게 답하는 모델이에요. 그중 분류가 choice입니다.

출처
- NandhaKishorM/laya (GitHub README), [github.com/NandhaKishorM/laya](https://github.com/NandhaKishorM/laya)
- convaiinnovations/laya (Hugging Face 모델 카드), [huggingface.co/convaiinnovations/laya](https://huggingface.co/convaiinnovations/laya)

## 분류: 박스를 미리 정해 두고 담기

자, 분류한다는 건 뭐냐면요. <strong>박스를 미리 정해 놓고, 들어오는 걸 맞는 박스에 싹 담는 거예요.</strong> 우체국 분류함을 떠올리시면 됩니다. 고객 문의라면 결제·환불 / 기술 문제 / 배송 / 기타처럼 박스를 나눠 둘 수 있겠죠.

박스를 정할 때 지킬 게 몇 가지 있어요.

- <strong>빠짐없이, 서로 겹치지 않게</strong> 나눕니다.
- <strong>'기타' 박스는 꼭 둡니다.</strong> 어디에도 딱 맞지 않는 애매한 문의를 받아 줄 곳이 있어야 해요.
- <strong>박스는 20개쯤 아래로 둡니다.</strong> Laya는 보기 이름들이 정해진 글자 수 예산을 나눠 쓰는 구조라서, 기본 설정에서는 보기가 20개쯤을 넘어가면 이름이 잘려서 서로 구분이 안 돼요. 77개짜리 보기에서는 정확도가 0.425까지 떨어졌다고 모델 카드에 적혀 있습니다. 박스가 아주 많아야 하는 일이면 Jev 쪽이 낫다고 README도 인정하고요.

박스를 잘 정하는 게 분류의 절반이에요. Laya를 쓰실 분들은 이 부분부터 꼭 참고하세요.

> <strong>정리</strong>
>
> 분류는 "미리 정한 박스 중 하나에 담기"예요. 박스는 빠짐없이, 겹치지 않게, '기타'를 두고, 20개쯤 아래로.

출처
- Google, Machine Learning Glossary, [developers.google.com/machine-learning/glossary](https://developers.google.com/machine-learning/glossary)
- convaiinnovations/laya (Hugging Face 모델 카드), [huggingface.co/convaiinnovations/laya](https://huggingface.co/convaiinnovations/laya)

## CHOICE로 물어보기: state, instructions, criteria

자, 그럼 Laya한테 실제로 어떻게 물어보냐. 세 가지만 넣으면 됩니다.

1. <strong>state</strong>: 판단할 글. 우리 경우엔 고객 문의 메시지예요. 문의마다 매번 바뀌는 부분이죠.
2. <strong>instructions</strong>: 무엇을 묻는지. "이 문의는 어느 부서가 처리해야 하나?" 같은 질문 한 줄이면 됩니다. 우리는 부서 나누기만 할 거니까 이 문장은 고정해 두면 돼요.
3. <strong>criteria</strong>: 아까 정한 박스들과 박스마다의 설명. 결제·환불이면 "청구서, 결제, 환불"처럼 설명을 붙여요. 설명이 구체적일수록 잘 고릅니다.

instructions와 criteria는 다 우리가 정하는 거예요. 막막하면 Claude Opus 같은 LLM한테 "이런 문의 데이터가 있는데 instructions랑 criteria를 어떻게 쓰면 좋을까?" 하고 물어보셔도 됩니다. 꽤 알아서 잘 잡아 줘요.

Laya 공식 예제가 마침 고객 문의 부서 분류예요.

```python
state = {"body": "Hi, we were billed twice for March. Please refund..."}
questions = {
    "department": {
        "type": "choice",
        "instructions": "Which department should handle this?",
        "criteria": {
            "billing": "invoices, payments, refunds",
            "technical": "bugs, outages, system errors",
            "other": "everything else"
        }
    }
}
result = router.predict(state, questions)
```

돌아오는 답은 이렇게 생겼어요.

```json
{
  "choice": "billing",
  "confidence": 0.94,
  "probabilities": {"billing": 0.94, "technical": 0.04, "other": 0.02},
  "answer_confidence": 0.94
}
```

`choice`가 고른 박스, `probabilities`가 박스마다의 확률이에요. 확률을 다 더하면 1입니다. 그러니까 Laya는 답을 하나 딱 주는 것만이 아니라, <strong>고른 답과 박스마다의 확률을 같이</strong> 줘요. 이 확률이 다음 이야기의 주인공입니다.

> <strong>정리</strong>
>
> CHOICE 질문은 "글(state) + 무엇을 묻는지(instructions) + 박스와 설명(criteria)" 세 개면 끝이에요. 답은 고른 박스와 박스마다의 확률로 옵니다.

출처: NandhaKishorM/laya (GitHub README), [github.com/NandhaKishorM/laya](https://github.com/NandhaKishorM/laya)

## confidence: AI가 얼마나 자신 있는지

자, 여기서부터가 진짜 중요해요. 메시지가 하나 왔다고 해 볼게요(숫자는 이해를 돕는 예시예요).

- "3월 요금이 두 번 결제됐어요. 환불해 주세요" → 결제·환불 91%, 기술 5%, 배송 2%, 기타 2%

이렇게 박스마다 확률이 붙어서 와요. 그중 <strong>1등 박스의 확률을 confidence</strong>, 우리말로 확신이라고 부릅니다. 이 문의는 결제·환불이 91%로 1등이니까 "결제·환불로 분류하면 되겠네, confidence는 91%구나" 하고 읽으면 돼요. 이 confidence라는 걸 꼭 이해하셔야 합니다.

그런데 이런 메시지도 와요.

- "결제하려는데 앱이 자꾸 꺼져요" → 결제·환불 46%, 기술 41%, 기타 10%, 배송 3%

모호하죠. 결제 얘기도 나오고, 앱이 꺼진다는 얘기도 나오고요. 확률이 둘로 갈리니까 confidence도 46%로 낮습니다. "이거 어떻게 처리하지?" 하는 고민이 여기서 생겨요.

여기서 오해하면 안 되는 게, <strong>확률이 낮다고 나쁜 모델이라는 얘기가 아니에요.</strong> 오히려 반대예요. AI가 "이건 좀 애매해요"를 숫자로 알려 주니까, 우리가 "그럼 이건 사람이 한 번 보자" 하고 처리를 정할 수 있는 거죠. 이런 문의를 아무 데나 자동으로 보내 버리면 고객은 부서를 두 번 옮겨 다니게 되니까요. confidence가 유용한 이유가 바로 이거예요.

참고로 Laya 응답에서 이 값의 이름은 `answer_confidence`예요. 이름이 그냥 confidence인 필드는 확률이 한쪽에 얼마나 몰렸는지를 따로 계산한 다른 값이라서, 직접 코드를 짜실 때는 `answer_confidence`를 보시면 됩니다.

> <strong>정리</strong>
>
> confidence는 "1등 박스의 확률", 그러니까 AI가 이 답에 얼마나 자신 있는지예요. 확률이 갈리면 낮게 나오고, 그게 바로 사람이 볼 문의를 골라내는 신호가 됩니다.

출처: NandhaKishorM/laya (GitHub README), [github.com/NandhaKishorM/laya](https://github.com/NandhaKishorM/laya)

## 정직한 모델과 과신한 모델

자, 그런데 AI가 "95% 확신해요"라고 하면 믿어도 될까요? 여기서 정직한 모델과 과신한 모델 얘기를 해야 합니다.

먼저 짚고 갈 게 있어요. confidence는 문의 한 건마다 따로 나와요. 예를 들어서 같은 고객 문의 10건을 두 모델한테 보여 줬다고 해 볼게요. 두 모델 다 10건 모두 "결제팀"이라고 답했는데, 건마다 말한 confidence가 이렇습니다(예시 숫자예요).

- <strong>모델 A</strong>: 90, 90, 85, 85, 82, 82, 82, 82, 65, 63%. 평균 내면 약 80%예요.
- <strong>모델 B</strong>: 99, 99, 98, 98, 97, 97, 97, 97, 87, 85%. 평균 내면 약 95%예요.

말만 들으면 B가 훨씬 똑똑해 보이죠. 그런데 실제 고객 데이터를 까 봤더니 결제팀이 맞았던 건 <strong>10건 중 8건, 80%</strong>였어요. 둘 다 똑같이 8건을 맞혔습니다. 실력은 같아요.

- <strong>A는 정직한 모델</strong>이에요. 평균 80%라고 말했고, 실제로도 80% 맞았어요. 말한 confidence와 실제가 같으니까, 이 모델이 하는 말은 그대로 믿어도 됩니다.
- <strong>B는 과신한 모델</strong>이에요. 똑같이 맞혔는데 confidence를 15%p 부풀려 말했어요. 못 맞혀서가 아니라, 아는 것보다 더 자신 있게 말해서 문제인 모델이죠.

그러니까 과신이냐 정직이냐의 기준은 이거예요. <strong>실제 데이터를 까 봤을 때, confidence의 평균과 실제로 맞힌 비율이 비슷한가.</strong> "84%"라고 한 답 100개를 모아 보면 84개쯤 맞아야 정직한 거예요. 이렇게 정직하게 말하는 모델이 좋은 모델이고, 이걸 만드는 게 목표입니다.

이게 왜 문제냐면요. B는 틀린 2건에도 87%, 85%를 말해요. 맞힌 것보다 조금 낮을 뿐이라, 숫자만 보고는 "이건 좀 위험하다"는 느낌이 안 와요. 맞혔냐 틀렸냐가 실제로 어떤 차이를 만드는지는 뒤의 threshold 얘기에서 바로 보실 수 있어요.

요즘 신경망이 이렇게 과신하는 경향이 있다는 게 2017년 논문으로 알려졌어요.

> "Confidence calibration -- the problem of predicting probability estimates representative of the true correctness likelihood"

그리고 Laya도 공개된 모델을 받은 그대로 쓰면 과신해요. 모델 카드에 대놓고 "Ships over-confident"라고 적혀 있습니다. 그래서 이 과신을 조정해 주는 과정이 따로 필요하고, 그걸 calibration이라고 불러요.

> <strong>정리</strong>
>
> 정직한 모델은 말한 confidence의 평균이 실제 정답률과 같은 모델이에요. 실력이 같아도 confidence를 부풀려 말하면 과신이고, Laya도 받은 그대로는 과신합니다.

출처
- Guo, Pleiss, Sun 외, *On Calibration of Modern Neural Networks* (arXiv 1706.04599, 2017), [arxiv.org/abs/1706.04599](https://arxiv.org/abs/1706.04599)
- convaiinnovations/laya (Hugging Face 모델 카드), [huggingface.co/convaiinnovations/laya](https://huggingface.co/convaiinnovations/laya)

## calibration: temperature로 확신을 실제에 맞추기

자, calibration(보정)이 뭐냐면요. <strong>과신한 모델의 confidence를 실제 정답률에 맞춰 낮추는 과정</strong>이에요.

제일 간단하고 잘 듣는 방법이 temperature scaling, 온도 스케일링입니다. 숫자 하나, temperature를 손잡이처럼 돌려서 확률 전체를 덜 뾰족하게 만들어요. temperature를 올리면 confidence가 전반적으로 내려옵니다.

앞의 과신한 모델 B로 해 볼게요(보기 4개짜리 질문으로 실제 계산한 예시예요).

- <strong>temperature 1</strong> (받은 그대로): 99, 99, 98 … 87, 85%. 평균 95%, 실제 80%보다 15%p 과신.
- <strong>temperature 1.3</strong>: 96, 96, 94 … 77, 75%. 평균 90%, 아직 10%p 과신.
- <strong>temperature 1.75</strong>: 90, 90, 85 … 65, 63%. 평균 80%, 실제와 같아요.

마지막 숫자, 어디서 본 것 같죠? 앞에서 본 정직한 모델 A 숫자가 바로 이거예요. 이렇게 confidence의 평균이 실제 80%와 맞아지는 temperature를 찾는 게 calibration입니다.

잘 보시면 똑같은 폭으로 내려오지 않아요. 원래 확실하던 99는 90으로 조금만, 원래 덜 확실하던 87, 85는 65, 63으로 많이 내려왔죠. 그리고 1등 박스는 그대로 결제팀이에요. temperature는 순서는 안 바꾸고 크기만 실제에 맞게 줄여 줍니다.

여기서 두 가지 짚고 갈게요.

- <strong>calibration은 틀린 답을 맞는 답으로 바꿔 주지 않아요.</strong> 1등 박스가 그대로니까요. 해 주는 건 "이건 좀 애매해요"를 숫자로 솔직하게 말하게 만드는 것까지입니다.
- <strong>저절로 되는 게 아니에요.</strong> 계산 자체는 도구가 해 줍니다. Laya 공식 미세조정 노트북도 학습이 끝나면 temperature를 알아서 맞춰 줘요. 하지만 그걸 직접 돌려야 하고, 특히 한국어 문의가 가는 다국어 모델은 기본으로는 온도가 아예 맞춰져 있지 않습니다. 실제 temperature는 검증용 데이터로 재서 찾아요(뒤의 8:1:1에서 나와요).

Laya 모델 카드에 따르면 질문 종류와 보기 개수마다 온도를 다시 맞췄더니 평균 보정 오차(ECE)가 영어 모델은 <strong>0.466 → 0.081</strong>, 다국어 모델은 <strong>0.314 → 0.106</strong>으로 줄었다고 해요. 그러니까 정직한 모델은 데이터를 많이 때려 넣어서만 만들어지는 게 아니라, <strong>학습시킨 다음에 calibration 단계를 한 번 더 거쳐서</strong> 만들어진다고 보시면 됩니다.

> <strong>정리</strong>
>
> calibration은 confidence의 평균을 실제 정답률에 맞추는 과정이에요. temperature를 올려 confidence를 낮추되 순서와 답은 그대로 둡니다. 도구가 계산해 주지만 직접 돌려야 해요.

출처
- Guo, Pleiss, Sun 외, *On Calibration of Modern Neural Networks* (arXiv 1706.04599, 2017), [arxiv.org/abs/1706.04599](https://arxiv.org/abs/1706.04599)
- convaiinnovations/laya (Hugging Face 모델 카드), [huggingface.co/convaiinnovations/laya](https://huggingface.co/convaiinnovations/laya)
- NandhaKishorM/laya (GitHub README), [github.com/NandhaKishorM/laya](https://github.com/NandhaKishorM/laya)

## threshold: 문턱은 우리가 정한다

자, 정직한 confidence를 얻었으면 이제 써먹을 차례예요. confidence는 <strong>문턱을 정해서</strong> 씁니다. 이 문턱을 threshold, 임계값이라고 해요.

상식적으로 생각해 볼게요. "3월 요금이 두 번 결제됐어요" 문의가 왔고, Laya가 결제팀일 확률이 91%라고 했어요. 그럼 이렇게 정해 두면 되겠죠(0.8은 예시예요).

- confidence가 <strong>0.8 이상이면</strong> 자동으로 결제팀에 배정
- <strong>0.8 아래면</strong> 상담원이 한 번 확인

91%는 문턱을 넘으니까 사람 손 안 거치고 자동으로 가요. 아까 그 애매한 "결제하려는데 앱이 자꾸 꺼져요"는 46%라 문턱을 못 넘으니 상담원한테 갑니다. 이렇게 confidence에 따라 자동으로 처리할지, 사람이 볼지를 나누는 것, 이게 우리가 진짜로 하고 싶은 일이에요.

```python
if conf >= THRESHOLD:
    route_automatically(dept)
else:
    escalate_to_human_agent(dept, reason=f"Low confidence ({conf:.2f})")
```

그런데 confidence가 과신한 모델의 숫자라면 어떨까요? 틀린 것까지 다 높게 나오니까 전부 자동으로 넘어가 버리겠죠. 그래서 앞에서 정직한 모델을 만드는 게 중요하다고 한 거예요. threshold로 라우팅을 할 거니까, 그 앞에 정직한 confidence가 있어야 합니다. 이해되시죠?

그리고 threshold는 <strong>AI가 아니라 우리가 정하는 거예요.</strong> Laya README에도 그렇게 적혀 있어요.

> "A threshold is a policy you choose from measured accuracy at that coverage on your data, not a property of the model."

모델에 들어 있는 값이 아니라 우리가 정하는 운영 정책이라는 거죠. 우리 데이터를 보면서 "이 문턱이면 자동으로 보낸 것 중에 몇 개나 틀리나"를 재 보고, 우리가 감당할 수 있는 선에 둡니다. Claude Opus한테 데이터를 보여 주면서 "threshold를 얼마로 하는 게 좋을까?" 하고 같이 고민해도 돼요. 보기 개수가 다른 질문끼리는 확률이 퍼지는 정도가 달라서, threshold도 따로 정해야 한다는 점만 기억해 두세요.

> <strong>정리</strong>
>
> threshold는 "몇 이상이면 자동으로 맡길까"의 기준이에요. 넘으면 자동, 못 넘으면 사람. 이 기준은 AI가 아니라 우리가 데이터를 보고 정합니다.

출처: NandhaKishorM/laya (GitHub README), [github.com/NandhaKishorM/laya](https://github.com/NandhaKishorM/laya)

## calibration 전후로 걸러 보면

자, 그럼 이게 실제로 어떤 효과를 내는지 볼게요. 앞의 그 10건이고, threshold는 0.8로 두겠습니다.

<strong>calibration 전 (과신한 모델 B)</strong>: 맞힌 8건은 97~99%, 틀린 2건도 87%, 85%예요. 전부 0.8을 넘으니까 10건이 다 자동으로 결제팀에 가 버립니다. 틀린 2건은 결제팀으로 가면 안 되는 문의인데 그대로 엉뚱한 팀으로 간 거예요. 문턱을 세워 놨는데 하나도 못 걸렀죠.

<strong>calibration 후 (정직해진 모델)</strong>: temperature로 맞추면 맞힌 8건은 82~90%로 조금만 내려오고, 틀린 2건은 65%, 63%로 크게 내려와요. "87%로 결제팀인 것 같습니다"가 "65%로 결제팀인 것 같습니다"로 바뀐 거죠. 그러면 이 2건만 문턱에 걸려서 자동 처리가 안 되고, 상담원이 한 번 보고 맞는 팀으로 바로잡아 보냅니다. 맞힌 8건은 그대로 자동이고요. 엉뚱한 팀으로 바로 가는 문의가 <strong>2건에서 0건</strong>이 됐어요.

이게 우리가 원하는 그림이에요. 물론 예시라서 아주 이상적으로 딱 떨어진 거고요.

"그럼 calibration 안 하고 threshold만 0.9로 올리면 되지 않아?" 하실 수 있어요. 이 예시에서는 숫자만 보면 그래도 걸러지긴 해요. 그런데 과신한 모델의 0.9는 "실제로 90% 맞는다"는 뜻이 아니라서, 몇으로 해야 할지 매번 감으로 찾아야 하고 데이터가 바뀌면 또 어긋나요. 저는 threshold를 만지작거리는 것보다 정직한 모델을 먼저 만드는 게 훨씬 중요하다고 생각합니다. 모델이 정직하면 "80% 넘게 맞을 것 같은 것만 자동으로" 같은 기준을 그대로 숫자로 걸면 되거든요.

결국 다 종합적인 거예요. 학습을 잘 시켜서 좋은 모델을 만들고, 과신하면 calibration으로 정직하게 만들고, 그다음에 적절한 threshold를 잡는 것. 이 세 가지가 맞물려야 합니다. 그래서 결과가 이상할 때 어디를 손볼지도 증상마다 달라요.

- <strong>분류 자체가 자주 틀린다</strong> → 데이터를 더 모아서 다시 가르쳐야 해요. calibration과 threshold는 틀린 답을 맞게 고쳐 주지 않습니다.
- <strong>틀린 것도 confidence가 높게 나온다</strong> → 과신이에요. temperature로 calibration을 다시 해서 정직하게 만듭니다.
- <strong>자동으로 넘어가는 게 너무 많거나 너무 적다</strong> → threshold를 조정해요. 문턱을 올리면 사람이 볼 문의가 늘고, 내리면 자동 처리가 늘어요.

데이터를 보면서 이걸 직접 확인해 보셔야 하는데, 그러려면 이 개념들을 알고 있어야 하죠. 그게 지금 이걸 배우는 이유예요.

> <strong>정리</strong>
>
> threshold는 confidence 숫자를 보고 거르는 장치라서, 그 숫자가 부풀려져 있으면 아무것도 못 걸러요. calibration을 먼저 하고 threshold를 정하는 순서가 중요한 이유가 이거예요.

## RLCD: 정직하게 말하면 점수를 더 주는 학습

자, 이제 Laya가 어떻게 배우는지 얘기할 차례예요. 우리 문의에 맞게 쓰려면 결국 데이터를 준비해서 가르쳐야 하거든요. 솔직히 기본 Laya는 우리 업무를 잘 몰라요. 처음 보는 업무 판단(typed-decisions 벤치마크)에서 기본 모델의 정확도는 <strong>0.362</strong>로, 제일 많은 답만 찍는 기준선(0.461)보다도 낮아요. 같은 판단으로 가르친 모델은 <strong>0.766</strong>까지 올라갑니다. 우리 데이터로 가르쳐야 제값을 하는 거죠.

Laya는 <strong>RLCD</strong>라는 방식으로 배워요. Reinforcement Learning for Calibrated Decisions의 줄임말인데, 이름은 길어도 하는 일은 앞에서 얘기한 거랑 똑같아요. <strong>문제를 풀면 점수를 주는데, 확률을 정직하게 말할수록 점수를 더 줘요.</strong> 부풀려 말하면 점수를 깎고요. 모델은 점수가 오르는 쪽으로 계속 고쳐 가면서 배웁니다.

일기예보로 볼게요. 실제로 열 번 중 일곱 번 비가 오는 날씨가 있다고 해 볼게요.

- "70%"라고 예보하면 점수가 제일 좋아요.
- "99%"라고 부풀리면 점수가 깎여요.
- "50%"라고 소심하게 줄여도 점수가 깎여요.

숫자로 보면, Laya 채점에 들어가는 로그 점수로 매겼을 때 벌점이 70% 예보는 약 0.61, 99% 예보는 약 1.39, 50% 예보는 약 0.69예요. 적을수록 좋은 거니까 실제 그대로 말하는 게 제일 유리하죠. 이런 채점법을 '엄격하게 적절한 채점 규칙(strictly proper scoring rule)'이라고 해요.

> "The policy reports a distribution; exploration adds zero-mean Gaussian noise to the logits; the reward is a strictly proper scoring rule (log + spherical, plus ranked probability score for ordinal questions)."

여기서 오해하기 쉬운 게 하나 있어요. 맞히는 건 상관없고 확률만 정직하면 된다는 얘기가 아니에요. 이 채점은 정답 박스에 확률을 많이 줄수록 점수가 좋아서, <strong>맞히는 것도 점수에 그대로 들어가요.</strong> 거기에 더해서 <strong>확률까지 정직하게</strong> 말해야 점수가 제일 높게 나오는 거예요. 그래서 Laya는 답을 맞히는 것뿐 아니라 confidence까지 정직하게 말하도록 배웁니다. 그래야 나중에 threshold로 걸렀을 때 효과가 제대로 나니까요.

> <strong>정리</strong>
>
> RLCD는 "정직하게 말하면 점수를 더 주는" 학습이에요. 맞히는 것도 점수에 들어가고, 거기에 확률까지 실제대로 말해야 점수가 제일 좋아요.

출처
- convaiinnovations/laya (Hugging Face 모델 카드), [huggingface.co/convaiinnovations/laya](https://huggingface.co/convaiinnovations/laya)
- NandhaKishorM/laya (GitHub README), [github.com/NandhaKishorM/laya](https://github.com/NandhaKishorM/laya)

## 8:1:1로 나누기: 공부, 모의고사, 수능

자, 그럼 데이터를 실제로 준비하시면 어떻게 써야 할까요? 정답 부서가 달린 문의가 1,000건 있다고 해 볼게요. 이걸 몽땅 학습에 넣으면 안 되고, <strong>800 : 100 : 100, 그러니까 8:1:1로 나눠요.</strong>

- <strong>800건, train(학습)</strong>: 교과서예요. 이걸로 모델을 실제로 가르쳐서 하나 만들어 둡니다.
- <strong>100건, validation(검증)</strong>: 모의고사예요. 학습에 안 쓴 새 문제로 방금 만든 모델을 검증해요. 과신하는지 보고, 과신하면 여기서 calibration을 하고, 그다음 threshold도 여기서 재 보고 정합니다. 여기까지 하면 모델이 진짜 완성되는 거죠.
- <strong>100건, test(시험)</strong>: 수능이에요. 다 끝난 뒤에 딱 한 번만 봅니다. 모델이 한 번도 못 본 문제여야 진짜 실력이 나오거든요.

8:1:1은 흔히 쓰는 비율이라 거의 국룰처럼 말하지만, 꼭 이렇게 할 필요는 없어요. 구글 머신러닝 강의도 학습 데이터가 보통 제일 크다고만 하고, 정해진 비율은 없다고 해요. 중요한 건 비율이 아니라 세 덩어리로 나눈다는 거예요.

> "A training set that the model trains on."

> "A validation set performs the initial testing on the model as it is being trained."

> "A test set for evaluation of the trained model."

왜 나누냐면요. 교과서 문제를 그대로 시험에 내면 외워서 다 맞히잖아요. 그러면 점수가 높아도 실력으로 푼 건지 외워서 맞힌 건지 알 수가 없어요. calibration도 마찬가지예요. Laya 공식 노트북 주석에 이유가 적혀 있는데요.

> "Temperatures fitted on items the run has already trained on measure the fit rather than the calibration"

이미 학습한 문제로 temperature를 맞추면, confidence가 정직한지가 아니라 그 문제에 얼마나 익숙해졌는지만 보게 된다는 뜻이에요. 그래서 노트북도 calibration용 데이터를 학습 전에 따로 떼어 둡니다.

마지막 test에서 결과가 영 만족스럽지 않으면요? 같은 test로 이리저리 맞춰 보는 게 아니라, 새 데이터를 구해서 다시 하셔야 해요. 같은 데이터를 자꾸 들여다볼수록 거기에 맞춰져 버리거든요.

> "The more you use the same data to make decisions about hyperparameter settings or other model improvements, the less confidence that the model will make good predictions on new data."

> <strong>정리</strong>
>
> 데이터는 공부용(8), 모의고사용(1), 수능용(1)으로 나눠요. 모의고사로 calibration과 threshold를 정하고, 수능은 마지막에 딱 한 번. 전부 학습 데이터로 넣으면 안 됩니다.

출처
- Google, *Datasets: Dividing the original dataset* (Machine Learning Crash Course), [developers.google.com/machine-learning/crash-course/overfitting/dividing-datasets](https://developers.google.com/machine-learning/crash-course/overfitting/dividing-datasets)
- Laya 미세조정 노트북 (Kaggle 2×T4), [github.com/NandhaKishorM/laya/blob/main/notebooks/laya_finetune_typed_decisions_2xT4_kaggle.ipynb](https://github.com/NandhaKishorM/laya/blob/main/notebooks/laya_finetune_typed_decisions_2xT4_kaggle.ipynb)

## 정리: Laya를 쓸 때의 순서

자, 실습 가이드라기보다는 "이런 식으로 쓰면 되겠구나" 하는 감을 드리는 글이었는데요. 정리하면 이렇습니다.

1. <strong>System One은 판단해 주는 녀석이에요.</strong> 글을 쓰는 게 아니라 보기 중 하나를 고르고, 얼마나 자신 있는지 confidence를 같이 줍니다.
2. <strong>calibration은 confidence의 평균을 실제에 맞추는 과정이에요.</strong> 그래서 정직한 모델을 만듭니다.
3. <strong>calibration을 먼저 하고, threshold는 그다음이에요.</strong> 모델이 정직하게 말해야 threshold로 걸렀을 때 효과적으로 나눌 수 있어요.
4. <strong>threshold는 우리가 정하는 거예요.</strong> Claude Opus 같은 LLM과 같이 고민할 수는 있지만, 우리 데이터를 보고 우리가 정합니다.

실제로 쓰실 때의 순서로 바꿔 말하면 이래요. 정답 달린 우리 문의를 모아 8:1:1로 나누고, 먼저 가르치고, 그다음 calibration, 마지막에 threshold. 이 순서만 기억하셔도 Laya 같은 분류 모델을 어디에 붙이든 헤매지 않으실 거예요.

이번 글은 실습이 아니라 개념 위주였어요. 제가 대신 공부해서 정리해 드렸다고 보시면 되고, 혹시 틀린 내용이 보이면 알려 주세요. 저도 이 감을 가지고 직접 써 보면서, 고칠 게 생기거나 실습을 준비할 수 있게 되면 그때 또 정리해서 올리겠습니다.

## 더 알아볼 거리

실제로 써 보다 보면 궁금해질 만한 것들을 모아 둡니다.

- <strong>score와 noul 같이 쓰기</strong>: 같은 문의에서 긴급도(score)와 해지 위험(noul)을 한 번에 물어볼 수 있어요.
- <strong>언어별 성능 차이</strong>: 다국어 모델은 영어 모델보다 영어에서는 조금 약하고, 다른 언어에서는 훨씬 낫다는 벤치마크가 README에 있어요.
- <strong>Jev와 비교</strong>: Laya 공식 사이트는 Jev보다 6~8배 빠르고 보정이 3배 낫다고 주장합니다. 그런데 Jev 쪽 숫자는 Laya가 직접 잰 게 아니라 다른 사람이 잰 값이고, 인터넷 너머 API 응답 시간을 내 GPU에서 잰 시간과 비교한 거예요. 보정 3배도 Laya를 온도로 보정한 뒤 숫자고, 보정 전에는 Jev 쪽이 낫다고 README에 같이 적혀 있습니다. 직접 재 보기 전에는 참고만 하세요.
- <strong>긴 문서</strong>: 4,000토큰 정도까지는 잘 답하고 그 이상은 들쭉날쭉하다고 README에 적혀 있어요.

출처
- NandhaKishorM/laya (GitHub README), [github.com/NandhaKishorM/laya](https://github.com/NandhaKishorM/laya)
- Laya 공식 사이트, [laya.convaiinnovations.com](https://laya.convaiinnovations.com/)
