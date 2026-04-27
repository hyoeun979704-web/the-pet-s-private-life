# 07. 캐릭터 텍스트 (i18n 51 키)

> **목표**: 17종 × 3 키(name / tmi / personality) = **총 51개** 한국어 카피
> **소요**: 1~2일 (집중하면 반나절)
> **사전조건**: 캐릭터 일러스트가 있으면 어울리는 톤이 잡혀서 더 좋음 (없어도 OK)

> 코드는 이미 다 `i18n.t('char.{id}.name')` 형태로 키만 참조함. 본인은 `ko.json` 한 파일만 채우면 됨.

---

## 📂 파일 위치

```
src/data/locales/ko.json   ← 여기에 추가
src/data/locales/en.json   ← 영어권 출시 시
src/data/locales/ja.json   ← 일본 출시 시
```

> β 출시(대만/홍콩) 단계는 **한국어만** 있어도 무방. 영어/일본어는 글로벌 확장 단계에서.

---

## 🔑 키 구조

각 캐릭터마다 3개 키:

```json
{
  "char.cat_munchkin.name": "먼치킨 보스",
  "char.cat_munchkin.personality": "도도하지만 외로움 잘 탐",
  "char.cat_munchkin.tmi": "다리가 짧아서 점프는 잘 못하지만 자존심은 누구보다 높다."
}
```

| 키 | 길이 가이드 | 어디에 노출 |
|---|---|---|
| `name` | **5~8자** | 캐릭터 카드, 도감 헤더, 가챠 결과 |
| `personality` | **15~25자** | 도감 한 줄 소개 |
| `tmi` | **40~80자** (1~2 문장) | 도감 상세 페이지 |

---

## 🎨 톤·매너 가이드

### 톤
- **따뜻함 + 약간의 유머** (마케팅 페르소나: 20~40대 여성, 힐링 + 짠한 감성)
- **반려동물에 대한 애정** 있되 "주인님" 호칭으로 위트
- 너무 어린이틱 X (이모지 남발 X), 너무 차가움 X

### 어조
- "~다", "~함" 종결 (구어체보다 약간 정돈된 느낌)
- 또는 "~예요", "~네요" (좀 더 친근)
- **두 어조 섞지 말기** — 게임 전체 통일

> 추천: `~함/~함` 톤 (도감 카드에 잘 어울림)

### 등급별 차별화
| 등급 | 분위기 |
|---|---|
| 일반 | 친근, 일상적 |
| 희귀 | 약간 신비, 매력 어필 |
| 전설 | 우아 / 강렬 / 전설적 |

---

## 📋 17종 작성 템플릿

> **체크박스 + 빈 칸**. 본인이 한 줄씩 채우면 끝.
> 예시 카피는 영감 용도. 본인 감각으로 수정 권장.

### 🐱 고양이 (5종)

#### 1. cat_munchkin (일반) — 분홍 #FFC8DD
```json
"char.cat_munchkin.name": "먼치킨 보스",
"char.cat_munchkin.personality": "다리는 짧아도 카리스마는 길다",
"char.cat_munchkin.tmi": "점프는 못해도 거실 한복판에서 영역 표시는 누구보다 단호하다."
```
- [ ] name (5~8자)
- [ ] personality (15~25자)
- [ ] tmi (40~80자)

#### 2. cat_persian (일반) — 베이지 #FAEDCB
```json
"char.cat_persian.name": "페르시안 공주",
"char.cat_persian.personality": "느긋하고 우아한 진정한 귀족",
"char.cat_persian.tmi": "하루 18시간을 잠으로 보내며, 깨어있는 6시간 중 5시간은 그루밍 중."
```
- [ ] 3개 키

#### 3. cat_scottish_fold (희귀) — 파랑 #A0C4FF
```json
"char.cat_scottish_fold.name": "스코티시 접힘귀",
"char.cat_scottish_fold.personality": "귀가 접혀있어도 매력은 안 접힘",
"char.cat_scottish_fold.tmi": "사람 옆에 꼭 붙어 있길 좋아하는, 의외로 사교적인 고양이."
```
- [ ] 3개 키

#### 4. cat_russian_blue (희귀) — 민트 #B9FBC0
```json
"char.cat_russian_blue.name": "러시안 블루",
"char.cat_russian_blue.personality": "조용하고 도도한 푸른 그림자",
"char.cat_russian_blue.tmi": "에메랄드빛 눈동자와 은빛 털이 햇살에 비치면 작은 보석 같다."
```
- [ ] 3개 키

#### 5. cat_siamese (전설) — 살구 #FFADAD
```json
"char.cat_siamese.name": "샴 왕족",
"char.cat_siamese.personality": "왕족의 풍모, 그러나 수다는 폭주",
"char.cat_siamese.tmi": "고대 시암 왕국의 사원에서 살았다는 전설. 의외로 말 많고 애교 많다."
```
- [ ] 3개 키

---

### 🐶 강아지 (6종)

#### 6. dog_bichon (일반) — 흰 #FFFFFF
```json
"char.dog_bichon.name": "비숑 솜뭉치",
"char.dog_bichon.personality": "온통 사랑이고 온통 보송보송",
"char.dog_bichon.tmi": "구름 같은 털 안에 작은 심장이 콩닥콩닥. 누구든 안고 싶어진다."
```
- [ ] 3개 키

#### 7. dog_pomeranian (일반) — 주황 #FFD580
```json
"char.dog_pomeranian.name": "포메 폭탄",
"char.dog_pomeranian.personality": "작지만 우주에서 가장 활기차다",
"char.dog_pomeranian.tmi": "체구는 손바닥만 한데 짖는 소리만큼은 도베르만급이라는 평."
```
- [ ] 3개 키

#### 8. dog_maltese (일반) — 아이보리 #F8F8F0
```json
"char.dog_maltese.name": "말티즈 천사",
"char.dog_maltese.personality": "다정하고 사람을 좋아하는 만년 친구",
"char.dog_maltese.tmi": "주인이 외출하면 현관에서 한 시간을 기다려준다는 의리파."
```
- [ ] 3개 키

#### 9. dog_welsh_corgi (희귀) — 갈색 #E8A458
```json
"char.dog_welsh_corgi.name": "코기 식빵",
"char.dog_welsh_corgi.personality": "짧은 다리로 세상을 정복한다",
"char.dog_welsh_corgi.tmi": "엘리자베스 여왕의 평생 친구였던 견종. 엉덩이가 식빵 같다."
```
- [ ] 3개 키

#### 10. dog_shiba (희귀) — 진갈색 #D97F39
```json
"char.dog_shiba.name": "시바 도련님",
"char.dog_shiba.personality": "독립적이지만 의외로 츤데레",
"char.dog_shiba.tmi": "표정이 풍부하기로 유명. 인터넷 밈의 절반을 책임지는 견종."
```
- [ ] 3개 키

#### 11. dog_golden_retriever (전설) — 금색 #E8B75E
```json
"char.dog_golden_retriever.name": "골든 리트리버",
"char.dog_golden_retriever.personality": "햇살 같은 사랑을 무한 공급",
"char.dog_golden_retriever.tmi": "세상 모든 사람을 친구로 여기는 천성. 가족이 슬프면 가만히 옆에 앉는다."
```
- [ ] 3개 키

---

### 🐹 햄스터 (2종)

#### 12. ham_golden (일반) — 황토 #F1C27D
```json
"char.ham_golden.name": "골든 햄찌",
"char.ham_golden.personality": "양 볼 가득 행복을 쟁이는 재주꾼",
"char.ham_golden.tmi": "체중의 두 배에 달하는 먹이를 볼주머니에 채워 옮길 수 있다."
```
- [ ] 3개 키

#### 13. ham_roborovski (희귀) — 모래색 #C8A97E
```json
"char.ham_roborovski.name": "로보 햄찌",
"char.ham_roborovski.personality": "세상에서 가장 빠른 작은 발",
"char.ham_roborovski.tmi": "햄스터 중 최소 종으로 4cm. 쳇바퀴를 하룻밤에 10km 달린다."
```
- [ ] 3개 키

---

### 🦔 고슴도치 (2종)

#### 14. hedge_common (희귀) — 회갈색 #8A7563
```json
"char.hedge_common.name": "고슴도치 친구",
"char.hedge_common.personality": "수줍지만 따뜻한 가시 친구",
"char.hedge_common.tmi": "낯선 환경에서 자기 가시에 입을 비비는 '안팅(anting)' 행동을 한다."
```
- [ ] 3개 키

#### 15. hedge_albino (전설) — 백색 #FDEEDC
```json
"char.hedge_albino.name": "흰눈 고슴도치",
"char.hedge_albino.personality": "달빛 아래 빛나는 흰 보석",
"char.hedge_albino.tmi": "유전적 알비노. 빛에 민감해 어두운 방을 더 좋아하는 야행성."
```
- [ ] 3개 키

---

### 🦜 앵무새 (2종)

#### 16. parrot_cockatiel (희귀) — 노랑 #FFD66B
```json
"char.parrot_cockatiel.name": "코카틸 가수",
"char.parrot_cockatiel.personality": "세레나데 부르는 노란 음유시인",
"char.parrot_cockatiel.tmi": "휘파람을 자유자재로 따라하며, 좋아하는 멜로디는 평생 기억한다."
```
- [ ] 3개 키

#### 17. parrot_budgerigar (전설) — 청록 #8AD8C4
```json
"char.parrot_budgerigar.name": "버거리갈 박사",
"char.parrot_budgerigar.personality": "세상의 모든 단어를 외우는 천재",
"char.parrot_budgerigar.tmi": "조류 중 가장 많은 어휘를 학습할 수 있어 1,700단어 이상을 외운 사례가 있다."
```
- [ ] 3개 키

---

## ✍️ 작성 팁

### 1) name (이름)
- 종 + 별명 패턴이 외우기 쉬움 ("먼치킨 보스", "포메 폭탄")
- 감정·외형 키워드 1개만 ("천사", "도련님", "공주")
- 너무 길면 카드 UI에서 잘림 — **최대 8자** 권장

### 2) personality (한 줄 소개)
- **공식**: `[형용사] + [반전/특징]`
  - "도도하지만 외로움 잘 탐"
  - "작지만 우주에서 가장 활기차다"
- 반전이 들어가면 캐릭터에 정 붙음

### 3) tmi (재미있는 정보)
- **사실 기반** + **약간의 과장**
  - 실제 견종/묘종 특성을 한 가지 + 위트 있게
  - 너무 정직하면 백과사전 같음 → 마지막에 가벼운 한 마디 붙이기
- "...이라고 한다", "...의 평", "...된다" 등 객관적 어조가 잘 어울림
- 과학적 정보 (예: 햄스터의 볼주머니, 알비노 유전)는 신뢰감 + 교육적 느낌

---

## 🌐 다국어 (선택, β 이후)

### `en.json` 영어 카피 가이드
- `name`: 한국어 의역보다 **음역 + 별명** ("Munchkin Boss", "Bichon Cloud")
- `tmi`: 영어권 사용자에게 익숙한 사실 위주
- 영어는 한국어보다 **표현이 직설적** — 따뜻함은 그대로 + 위트는 살짝 줄여도 OK

### `ja.json` 일본어 카피 가이드
- 일본어는 **존댓말체** 권장 (「〜です」「〜ます」)
- 한국어 위트가 일본어로 잘 안 옮겨짐 → 더 다정한 톤으로 재해석
- 캐릭터 이름은 카타카나 + 한자 혼용 ("マンチカン親分")

### 자동 번역 주의
- DeepL / GPT가 1차 번역은 가능하지만 **반드시 검수**
- 어색한 표현은 캐릭터 매력을 깎아먹음

---

## 🔍 작성 후 검증

`ko.json` 에 추가 후:
```bash
npm run test -- i18n
```

`tests/i18n-completeness.test.ts` 가 51 키 모두 존재하는지 자동 검증.

빠진 키가 있으면:
```
Missing key: char.dog_shiba.tmi
```
형태로 알려줌.

---

## ✅ 완료 기준

- [ ] `ko.json` 에 51개 키 모두 채움
- [ ] `npm run test -- i18n` 통과
- [ ] 도감 화면에서 17종 모두 정상 노출 (실기 또는 dev에서)
- [ ] 가챠 결과 화면에서 이름이 잘림 없이 표시 (8자 이내)
- [ ] (선택) 영어 / 일본어 51개씩

---

## 💡 팁

- **한 번에 다 쓰지 말기**: 한 종마다 1~5분 → 17종 = 1~2시간이지만, 30분 쓰고 잠깐 환기. 비슷한 톤만 반복되면 단조로움
- **체크리스트 활용**: 위 17개 블록 한 캐릭터씩 끝낼 때마다 체크
- **친구 1명에게 보여주기**: "이 중에 누가 제일 매력 있어?" 라고 물으면 무미건조한 카피 발견됨
- **AI 보조**: ChatGPT에 "이 캐릭터 톤으로 tmi 한 줄 더 써줘" 라고 요청하면 5종 변형이 빠르게 나옴 — 그 중 하나를 골라 다듬기

---

다음 챕터:
→ [08. Phaser에 통합하는 법](./08-pipeline.md)
