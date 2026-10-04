자, 고객 문의가 하루에 수백 건씩 들어오면 "이건 결제 문제, 이건 기술 문제" 하고 나누는 것만 해도 일이잖아요. 요걸 AI한테 맡기려면 무엇을 알아야 하는지, Laya라는 모델을 기준으로 처음부터 짚어 봤습니다. 학습시키는 원리, 확신(confidence)이라는 개념, 그리고 데이터를 80/10/10으로 나누는 이유까지요.

## Laya는 뭔가

자, Laya가 뭐냐면요. 글을 써 주는 AI가 아니라 <strong>판단만 하는 AI</strong>입니다. Convai Innovations가 공개한 오픈소스 모델이고(라이선스 Apache 2.0), 고객 문의나 이메일 같은 글을 넣고 정해진 형식의 질문을 던지면 답을 <strong>확률과 같이</strong> 돌려줘요.

- 질문은 세 종류예요.
  - <strong>choice</strong>: 보기 중 하나 고르기 (예: 어느 부서로 보낼까?)
  - <strong>score</strong>: 단계로 점수 매기기 (예: 안 급함 / 곧 / 긴급)
  - <strong>noul</strong>: 예/아니오를 확률로 (예: 해지하겠다는 말이 있나?)
- 글자를 한 글자씩 만들어 내지 않고 <strong>한 번의 계산(single forward pass)</strong>으로 답을 냅니다. 그래서 빨라요. 공식 사이트 기준 단일 GPU에서 질문 1개에 32.8ms(다국어 모델)입니다.
- 속은 이렇게 생겼어요. 영어용 `laya`는 ModernBERT-large(395M)에 판단용 머리(decision head)를 붙인 421M 모델이고, 다국어용 `laya-multilingual`은 mmBERT-base 기반 322M 모델이에요. 100개가 넘는 언어를 다룹니다.
- TypeSafe의 Jev가 처음 내놓은 'System One 모델'이라는 개념을 오픈소스로 구현한 녀석이라고 보시면 됩니다.

> "Non-autoregressive System 1 decision engine. Typed choice, score and yes/no decisions over any text in a single forward pass, in 100+ languages, with a router that picks the right checkpoint per request."

> <strong>정리</strong>
>
> Laya는 글을 쓰는 AI가 아니에요. 정해진 질문에 "어느 쪽인지"랑 "얼마나 확신하는지"만 빠르게 답하는 AI입니다. 고객 문의 분류처럼 답이 정해져 있는 일에 딱 맞아요.

출처
- NandhaKishorM/laya (GitHub), [github.com/NandhaKishorM/laya](https://github.com/NandhaKishorM/laya)
- convaiinnovations/laya (Hugging Face 모델 카드), [huggingface.co/convaiinnovations/laya](https://huggingface.co/convaiinnovations/laya)
- Laya 공식 사이트, [laya.convaiinnovations.com](https://laya.convaiinnovations.com/)

## System One 모델: 생각 말고 반사신경

자, 'System One'은 어디서 온 말이냐면요. 심리학자 카너먼이 사람의 생각을 빠르고 직관적인 <strong>System 1</strong>, 느리고 신중한 <strong>System 2</strong>로 나눈 데서 따온 이름입니다. TypeSafe는 이 개념으로 새로운 모델 분류를 만들었어요.

> "a new class of frontier models built to make fast, structured decisions that software can use directly."

- 우리가 아는 LLM(ChatGPT, Claude 같은 것)은 자유로운 문장을 써요. 그러면 프로그램이 그 문장을 다시 읽어서 해석해야 하고, 형식이 틀리거나 없는 말을 지어낼 위험이 있습니다.
- System One 모델은 <strong>답의 모양이 미리 정해져 있어요.</strong> 보기 중 하나, 점수, 확률. 그래서 프로그램이 그 값을 바로 가져다 쓸 수 있습니다. TypeSafe는 이걸 "Type-safe structured values"라고 불러요.
- 예를 들어서 고객센터 접수 창구를 떠올려 보세요. 문의를 쓱 보고 "결제팀이요" 하고 바로 넘기는 게 System 1이고, 고객한테 정성껏 답장을 쓰는 게 System 2예요. 둘 다 필요한데 하는 일이 다릅니다.
- 오해하기 쉬운 게 하나 있어요. System 1이라고 대충 판단한다는 뜻은 아닙니다. TypeSafe는 오히려 답의 형식이 고정돼 있어서 자동화에는 더 믿을 만하다고 말해요. 다만 이건 만든 회사의 주장이라는 점은 감안하고 보시면 됩니다.

> <strong>정리</strong>
>
> LLM이 "답장을 쓰는 직원"이라면 System One 모델은 "접수 창구 직원"이에요. 보자마자 어느 칸인지 고르고, 얼마나 확실한지도 같이 말해 줍니다.

출처: TypeSafe, *Introducing System One Models & Jev* (2026-09-15), [typesafe.ai/blog/introducing-system-one-models-and-jev](https://typesafe.ai/blog/introducing-system-one-models-and-jev)

## 분류 모델: 정해진 칸 중 하나 고르기

자, 분류 모델은 뭐냐면요. 입력을 보고 <strong>미리 정해 둔 칸(클래스) 중 하나</strong>를 고르는 모델입니다. 구글 머신러닝 용어집도 아주 짧게 정의해요.

> "A model whose prediction is a class."

> "A category that a label can belong to."

- 우체국 분류함을 떠올리시면 쉬워요. 편지를 보고 서울함, 부산함, 기타함 중 하나에 넣죠. 분류 모델이 하는 일이 딱 요거예요.
- 중요한 건 두 가지입니다.
  - <strong>칸을 먼저 정해야 해요.</strong> 빠짐없이, 서로 겹치지 않게. 애매한 건 '기타' 칸으로 받을 수 있게요. 고객 문의라면 결제·환불 / 기술 문제 / 배송 / 기타처럼 나눠 볼 수 있겠죠.
  - <strong>답이 확률로 나와요.</strong> "결제 91%, 기술 5%, 배송 2%, 기타 2%"처럼 칸마다 '여기일 가능성'이 붙고, 그중 제일 높은 칸이 답이 됩니다. (숫자는 이해를 돕는 예시예요.)
- Laya에서는 `choice` 질문이 바로 이 분류예요. 다만 보기가 50개를 넘어가면 설정을 손보지 않는 한 성능이 많이 떨어진다고 모델 카드에 적혀 있으니, 칸은 적고 분명하게 나누는 게 좋습니다.

> <strong>정리</strong>
>
> 분류는 "정해진 칸 중 하나에 넣기"예요. 칸을 잘 정하는 게 절반이고, AI는 칸마다 확률을 매겨서 제일 높은 데 넣습니다.

출처
- Google, Machine Learning Glossary, [developers.google.com/machine-learning/glossary](https://developers.google.com/machine-learning/glossary)
- convaiinnovations/laya (Hugging Face 모델 카드), [huggingface.co/convaiinnovations/laya](https://huggingface.co/convaiinnovations/laya)

## CHOICE로 고객 문의 분류하기

자, 그럼 고객 문의를 Laya한테 어떻게 물어볼까요? 세 가지만 넣으면 됩니다.

1. <strong>state</strong>: 판단할 글. 여기서는 고객 문의 본문이에요.
2. <strong>instructions</strong>: 무엇을 묻는지. "이 문의는 어느 부서가 처리해야 하나?"
3. <strong>criteria</strong>: 보기와 보기마다의 설명. 설명이 구체적일수록 잘 고릅니다.

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

- `choice`가 고른 칸, `probabilities`가 칸마다의 확률이에요. 확률을 다 더하면 1입니다.
- 같은 문의에 `score`(긴급도), `noul`(해지 위험) 질문을 한꺼번에 같이 물어볼 수도 있어요.
- 한국어 문의는요? Laya의 라우터는 글자를 보고 모델을 고르는데, 라틴 문자가 아닌 글(한글 같은)은 다국어 체크포인트로 보냅니다. 그래서 한국어 문의는 `laya-multilingual`이 답하게 돼요.

> <strong>정리</strong>
>
> CHOICE 질문은 "글(state) + 무엇을 묻는지(instructions) + 보기와 설명(criteria)" 세 개면 끝이에요. 답은 고른 칸이랑 칸마다의 확률로 옵니다.

출처: NandhaKishorM/laya (GitHub README), [github.com/NandhaKishorM/laya](https://github.com/NandhaKishorM/laya)

## confidence: 얼마나 확신하나

자, 여기서부터가 진짜 중요해요. 분류 모델은 답만 주는 게 아니라 <strong>얼마나 확신하는지</strong>도 같이 줍니다. Laya의 답에는 확신 관련 값이 두 개 있어요.

- <strong>answer_confidence</strong>: 고른 답의 확률이에요(보정을 거친 뒤 제일 높은 확률). 자동으로 처리할지 말지 정할 때 쓰는 값이 이거예요. Laya에서는 `min_confidence=`로 이 값에 문턱을 겁니다.
- <strong>confidence</strong>: 확률이 한쪽에 얼마나 몰려 있는지예요. 정확히는 "1 − 정규화한 엔트로피"로 계산합니다. 확률이 고르게 퍼져 있으면 낮고, 한 칸에 몰려 있으면 높아요.

예를 들어서 두 문의를 비교해 볼게요.

- "3월 요금이 두 번 결제됐어요. 환불해 주세요" → 결제 칸에 확률이 확 몰립니다. 확신이 높아요.
- "결제하려는데 앱이 자꾸 꺼져요" → 결제일까 기술 문제일까, 확률이 둘로 갈립니다(이를테면 결제 46%, 기술 41%). 확신이 낮아요.

후자 같은 문의를 자동으로 아무 데나 보내면 고객은 부서를 두 번 옮겨 다니게 되죠. 그래서 확신이 낮을 땐 사람이 한 번 보게 하는 게 핵심입니다.

> <strong>정리</strong>
>
> confidence는 "AI가 얼마나 자신 있는지"예요. 1등 칸의 확률이 높으면 맡기고, 확률이 갈리면 사람한테 넘깁니다.

출처: NandhaKishorM/laya (GitHub README), [github.com/NandhaKishorM/laya](https://github.com/NandhaKishorM/laya)

## 보정과 임계값: '90%'가 진짜 90%가 되게

자, 그런데 AI가 "90% 확신해요"라고 하면 그걸 믿어도 될까요? 이걸 맞춰 주는 게 <strong>보정(calibration)</strong>이에요.

> "Confidence calibration -- the problem of predicting probability estimates representative of the true correctness likelihood"

- 쉽게 말하면 "90%라고 한 답 100개를 모아 보면 실제로 90개가 맞아야 한다"는 거예요. 90%라고 해 놓고 70개만 맞으면 <strong>과신(over-confident)</strong>한 겁니다.

예를 들어서 두 모델한테 고객 문의 10건을 똑같이 보여 줬다고 해 볼게요. 두 모델 다 10건 모두에 "결제팀, 90% 확신"이라고 답했어요. 말만 들으면 둘이 똑같죠. 그런데 실제로 결제팀 문의가 맞았던 건 이렇습니다.

- <strong>정직한 모델</strong>: 10건 중 9건. 90%라고 했고 실제로도 90% 맞았어요. 말한 확신과 실제 정답률이 같으니까, 이 모델이 "90%"라고 하면 그 말을 그대로 믿어도 됩니다.
- <strong>과신한 모델</strong>: 10건 중 6건. 말은 90%인데 실제로는 60%예요. 아는 것보다 더 자신 있게 말한, 확신을 부풀린 모델이에요.

이게 왜 문제냐면요. "확신 80%가 넘으면 자동으로 배정"이라고 정해 뒀다고 해 볼게요. 둘 다 90%라고 했으니 10건이 전부 자동으로 넘어갑니다. 정직한 모델은 1건만 엉뚱한 팀으로 가지만, 과신한 모델은 4건이 엉뚱한 팀으로 가요. 확신 숫자는 같은데 결과가 완전히 다르죠. 일기예보로 치면 "비 올 확률 90%"라던 날 열 번 중 여섯 번만 비가 오는 예보예요. 그런 예보로는 우산을 챙길지 말지 정할 수가 없습니다. 그래서 확신 숫자를 믿고 쓰려면 먼저 정직하게 맞춰 놔야 해요.

- 요즘 신경망은 과신하는 경향이 있다는 게 2017년 논문으로 알려졌고, 이걸 고치는 간단하고 잘 듣는 방법이 <strong>온도 스케일링(temperature scaling)</strong>이에요. 숫자 하나(온도)로 확률 전체를 덜 뾰족하게, 혹은 더 뾰족하게 조절하는 손잡이라고 보시면 됩니다.
  - 예를 들어 과신한 모델이 어떤 문의에 "결제 97%, 기술 2%, 기타 1%"라고 했다고 해 볼게요. 온도를 2로 맞추면 "결제 80%, 기술 12%, 기타 8%"로 덜 뾰족해집니다. 1등은 그대로 결제예요. 온도는 순위는 안 바꾸고 확신의 크기만 실제에 맞게 낮춰 줍니다. (온도 2는 계산을 보여 주려고 고른 값이고, 실제 온도는 검증 데이터로 재서 정해요.)
- Laya도 받은 그대로는 과신합니다. 모델 카드에 대놓고 "Ships over-confident"라고 적혀 있어요. 질문 종류와 보기 개수마다 온도를 다시 맞추면 영어 모델의 평균 ECE(보정 오차)가 <strong>0.466 → 0.081</strong>, 다국어 모델은 <strong>0.314 → 0.106</strong>으로 줄어듭니다.

그다음이 <strong>임계값(threshold)</strong>이에요.

```python
if conf >= THRESHOLD:
    route_automatically(dept)
else:
    escalate_to_human_agent(dept, reason=f"Low confidence ({conf:.2f})")
```

> "A threshold is a policy you choose from measured accuracy at that coverage on your data, not a property of the model."

- 임계값은 모델에 들어 있는 값이 아니라 <strong>우리가 정하는 운영 정책</strong>이에요. 우리 데이터로 재 보고 "이 정도 확신이면 자동으로 보내도 틀리는 게 이만큼이구나"를 확인한 다음 정합니다. 예를 들어 "확신 0.8 이상이면 자동 배정, 그 아래는 상담원이 확인"처럼요. 0.8이라는 숫자 자체는 우리 데이터로 재서 정하는 거고요.
- 보기 개수가 다르면 같은 문턱을 그대로 쓰면 안 된다는 점도 README에 적혀 있어요. 보기 3개짜리 질문과 10개짜리 질문은 확률이 퍼지는 정도가 다르니까요.

> <strong>정리</strong>
>
> "90% 확신"이라고 했으면 실제로 열에 아홉은 맞아야 정직한 모델이에요. 말만 크게 하고 덜 맞으면 과신이고, 그 확신을 믿고 자동으로 넘기면 엉뚱한 팀으로 가는 문의가 늘어납니다. 그래서 확신을 실제 정답률에 맞춰 놓는 보정을 먼저 하고, 그 확신이 몇 이상일 때 자동으로 맡길지 정하는 임계값은 AI가 아니라 우리가 정합니다.

출처
- Guo, Pleiss, Sun 외, *On Calibration of Modern Neural Networks* (arXiv 1706.04599, 2017), [arxiv.org/abs/1706.04599](https://arxiv.org/abs/1706.04599)
- convaiinnovations/laya (Hugging Face 모델 카드), [huggingface.co/convaiinnovations/laya](https://huggingface.co/convaiinnovations/laya)
- NandhaKishorM/laya (GitHub README), [github.com/NandhaKishorM/laya](https://github.com/NandhaKishorM/laya)

## 학습 원리: 채점받으면서 확률을 고친다

자, 그럼 Laya를 우리 회사 문의에 맞게 가르치려면 어떻게 해야 할까요? 기본 원리는 사람이 문제집 푸는 거랑 똑같습니다.

1. 문의 하나와 <strong>정답 라벨</strong>(예: 결제)을 준비해요.
2. 모델이 칸마다 확률을 예측합니다.
3. 정답이랑 비교해서 <strong>채점</strong>해요.
4. 점수가 더 잘 나오는 쪽으로 모델 안의 숫자(가중치)를 <strong>조금 고칩니다</strong>.
5. 이걸 데이터 전체에 대해 여러 바퀴(epoch) 반복해요.

Laya는 여기서 채점 방식이 특별합니다. 이름이 <strong>RLCD</strong>(Reinforcement Learning for Calibrated Decisions)예요. 이름이 길어서 겁나 보이는데, 한 덩어리씩 떼어 보면 별거 없어요.

- <strong>RL</strong> (Reinforcement Learning, 강화학습): 정답을 그대로 따라 쓰는 게 아니라, 해 보고 받은 점수(보상)를 보고 점수가 오르는 쪽으로 배우는 방식이에요.
- <strong>C</strong> (Calibrated, 보정된): 앞에서 본 그 보정이요. 말한 확신과 실제 정답률이 맞는 상태.
- <strong>D</strong> (Decisions, 판단): Laya가 하는 choice·score·noul 판단이요.

그러니까 RLCD는 "확신이 정직한 판단을 하도록, 점수를 보면서 배우는 학습"이라는 뜻입니다.


> "The policy reports a distribution; exploration adds zero-mean Gaussian noise to the logits; the reward is a strictly proper scoring rule (log + spherical, plus ranked probability score for ordinal questions)."

- '엄격하게 적절한 채점 규칙(strictly proper scoring rule)'이라는 건, <strong>정직하게 확률을 말할 때 점수가 제일 높게</strong> 설계된 채점법이에요. 일기예보로 치면 "비 올 확률 70%"라고 했으면 그런 날 10번 중 7번 비가 와야 점수를 제일 많이 받는 겁니다. 그래서 일부러 부풀려 말하면 손해예요.
  - 숫자로 보면 이래요. 실제로 열 번 중 일곱 번 비가 오는 날씨에, 한 예보는 "70%"라고 하고 다른 예보는 "99%"라고 부풀렸다고 해 볼게요. Laya 보상에 들어가는 채점 규칙 중 하나인 로그 점수로 매기면 평균 점수가 70% 예보는 약 −0.61, 99% 예보는 약 −1.39예요. 마이너스라 헷갈리니 부호를 뒤집어 벌점으로 보면 0.61 대 1.39, 적을수록 좋은 거죠. 반대로 "50%"라고 소심하게 말해도 벌점이 약 0.69로 늘어납니다. 더 말해도, 덜 말해도 손해고 실제 그대로 말해야 벌점이 제일 적어요.
- 업데이트는 "REINFORCE with a group-mean baseline (GRPO-style)" 방식이에요. 예측에 잡음을 조금 섞어서 여러 번 답해 보게 하고, 평균보다 점수가 높았던 쪽으로 움직입니다.
- 공식 미세조정 노트북은 Kaggle T4 GPU 2장으로 4~6분 걸리고, 4바퀴(epoch) 돌아요. 그리고 노트북 코드를 보면 강화학습 손실에 정답 분포를 따라가는 교차 엔트로피 손실도 같이 씁니다. 모델 카드는 교차 엔트로피 없이 학습한다고 소개하니, 정확히는 "기본 학습은 RLCD이고, 공개 노트북은 거기에 교차 엔트로피를 같이 쓴다"고 보시면 됩니다.

왜 굳이 학습까지 시켜야 하냐면요. 기본 체크포인트는 처음 보는 업무 판단(typed-decisions 벤치마크)에서 정확도가 <strong>0.362</strong>로, 제일 많은 답만 찍는 기준선(0.461)보다도 낮아요. 같은 판단으로 미세조정한 `laya-typed-decisions`는 <strong>0.766</strong>까지 올라갑니다. 솔직히 기본 모델 그대로 쓰면 우리 업무는 잘 모르는 거예요. 우리 데이터로 가르쳐야 제값을 합니다.

> <strong>정리</strong>
>
> 학습은 "풀어 보고, 채점받고, 고치기"의 반복이에요. Laya의 학습법 RLCD는 "점수를 보며 배우는데(RL), 확신이 정직한(C) 판단(D)을 하도록" 채점해요. 확률을 실제 그대로 말해야 점수가 제일 높으니까, 답뿐 아니라 확신까지 같이 배웁니다.

출처
- convaiinnovations/laya (Hugging Face 모델 카드), [huggingface.co/convaiinnovations/laya](https://huggingface.co/convaiinnovations/laya)
- Laya 미세조정 노트북 (Kaggle 2×T4), [github.com/NandhaKishorM/laya/blob/main/notebooks/laya_finetune_typed_decisions_2xT4_kaggle.ipynb](https://github.com/NandhaKishorM/laya/blob/main/notebooks/laya_finetune_typed_decisions_2xT4_kaggle.ipynb)
- NandhaKishorM/laya (GitHub README), [github.com/NandhaKishorM/laya](https://github.com/NandhaKishorM/laya)

## 80/10/10: 데이터를 세 덩어리로 나누는 이유

자, 정답 달린 문의를 모았으면 그걸 몽땅 학습에 쓰면 될까요? 안 됩니다. 세 덩어리로 나눠요.

- <strong>학습(train)</strong>: 모델이 실제로 보고 공부하는 데이터. 교과서랑 연습문제예요.
- <strong>검증(validation)</strong>: 공부하는 중간에 실력을 재 보는 데이터. 모의고사예요. 온도를 맞추고(보정), 임계값을 정하고, 설정을 고를 때 여기서 잽니다.
- <strong>시험(test)</strong>: 다 끝난 뒤 딱 한 번 보는 데이터. 수능이에요. 모델이 한 번도 못 본 문제여야 진짜 실력이 나옵니다.

> "A training set that the model trains on."

> "A validation set performs the initial testing on the model as it is being trained."

> "A test set for evaluation of the trained model."

- 예를 들어 정답 달린 문의가 1,000건이면 80/10/10으로 학습 800건, 검증 100건, 시험 100건이 됩니다.
- <strong>80/10/10</strong>은 흔히 쓰는 비율 중 하나예요. 정답이 있는 건 아니고, 구글 머신러닝 단기 집중 과정(Machine Learning Crash Course)의 그림은 70/15/15 정도로 나눠요. 데이터가 적으면 검증·시험 몫을 조금 더 주기도 합니다.
- 왜 나누냐면요. 교과서 문제를 그대로 시험에 내면 외워서 다 맞히잖아요. 그러면 점수가 높아도 실력으로 푼 건지 문제를 외워서 맞힌 건지 알 수가 없어요. 검증 데이터도 너무 여러 번 들여다보면 거기에 맞춰져 버립니다.

> "The more you use the same data to make decisions about hyperparameter settings or other model improvements, the less confidence that the model will make good predictions on new data."

> "The only fair test of a model is against new examples, not duplicates."

<strong>Laya 공식 노트북은 실제로 이렇게 나눠요.</strong>

- 벤치마크의 `train` 1,200건 중 <strong>10%(최대 400건)를 보정용으로 먼저 떼어 둡니다.</strong> 이 몫은 학습에 한 번도 안 들어가요.
- 나머지로 학습하고, 떼어 둔 몫으로 온도를 맞춥니다. 노트북 주석이 이유를 이렇게 설명해요.

> "Temperatures fitted on items the run has already trained on measure the fit rather than the calibration"

이미 학습에 쓴 문제로 온도를 맞추면, 확신이 정직한지가 아니라 그 문제에 얼마나 익숙해졌는지만 보게 된다는 뜻이에요.

- 마지막으로 별도의 `test` 400건(판단 2,000개)으로 성적을 냅니다.
- 그러니까 비율로는 80/10/10이 아니지만, <strong>학습 / 보정·검증 / 시험을 서로 섞지 않는다</strong>는 원리는 똑같아요. 80/10/10은 원리를 보여 주는 대표 비율이고, 실제로는 데이터 양과 용도에 맞춰 이렇게 조정한다고 보시면 됩니다.

> <strong>정리</strong>
>
> 데이터는 공부용(80), 모의고사용(10), 수능용(10)으로 나눠요. 모의고사로 확신을 맞추고 문턱을 정하고, 수능은 마지막에 딱 한 번. 섞이면 점수가 높아도 실력인지 외운 덕인지 알 수 없어요.

출처
- Google, *Datasets: Dividing the original dataset* (Machine Learning Crash Course), [developers.google.com/machine-learning/crash-course/overfitting/dividing-datasets](https://developers.google.com/machine-learning/crash-course/overfitting/dividing-datasets)
- Laya 미세조정 노트북 (Kaggle 2×T4), [github.com/NandhaKishorM/laya/blob/main/notebooks/laya_finetune_typed_decisions_2xT4_kaggle.ipynb](https://github.com/NandhaKishorM/laya/blob/main/notebooks/laya_finetune_typed_decisions_2xT4_kaggle.ipynb)

## 더 알아볼 거리

여기까지 오셨으면 분류 모델의 뼈대는 다 잡으신 거예요. 실제로 써 보다 보면 궁금해질 만한 것들을 모아 둡니다.

- <strong>score와 noul 같이 쓰기</strong>: 같은 문의에서 긴급도(score)와 해지 위험(noul)을 한 번에 물어볼 수 있어요.
- <strong>언어별 성능 차이</strong>: 다국어 모델은 영어 모델보다 영어에서는 조금 약하고, 다른 언어에서는 훨씬 낫다는 벤치마크가 README에 있어요.
- <strong>Jev와 비교</strong>: Laya 공식 사이트는 Jev보다 6~8배 빠르고 보정이 3배 낫다고 주장합니다. 만든 쪽 주장이니 직접 재 보기 전에는 참고만 하세요.
- <strong>긴 문서</strong>: 4,000토큰 정도까지는 잘 답하고 그 이상은 들쭉날쭉하다고 README에 적혀 있어요.

출처
- NandhaKishorM/laya (GitHub README), [github.com/NandhaKishorM/laya](https://github.com/NandhaKishorM/laya)
- Laya 공식 사이트, [laya.convaiinnovations.com](https://laya.convaiinnovations.com/)
