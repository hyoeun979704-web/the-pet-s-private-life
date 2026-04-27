# 02. 캐릭터 17종

> **목표**: 17종 캐릭터 일러스트 (idle 필수, sleep 필수, tired 선택)
> **소요**: 1~2주 (도구 숙련도에 따라)
> **사전조건**: [01. 스타일 가이드](./01-style-guide.md) 결정 완료

---

## 📐 공통 스펙

| 항목 | 값 |
|---|---|
| 파일명 | `char_{species}_{breed}_{action}.png` |
| 크기 | **64×96 px** (가로 × 세로) |
| 포맷 | PNG (알파 채널, 투명 배경) |
| action | `idle` (필수), `sleep` (필수), `tired` (선택) |
| 시점 | 아이소 30°, 약간 위에서 |
| 배경 | 완전 투명 (`#000000` alpha 0%) |
| 위치 | `src/assets/characters/` |

> 작업은 **고해상도 (256×384)** 로 하고 마지막에 64×96으로 다운샘플 권장. 아이콘처럼 선명도 잃지 않음.

---

## 🎬 액션별 차이

| Action | 설명 | 만드는 법 |
|---|---|---|
| `idle` | 깨어있고 움직이는 평상시 | **새로 그리기** (각 캐릭터의 메인 페르소나) |
| `sleep` | 눈 감고 몸 웅크리기 | idle 베이스에 눈 닫고 살짝 둥글린 자세 |
| `tired` (선택) | 처진 자세 + 어두운 톤 | idle을 색조 보정 (alpha 0.7) 으로 갈음해도 OK |

> MVP는 `idle` + `sleep` 만 만들고, `tired` 는 코드에서 idle에 alpha 0.6 적용해서 대체 가능. 우리 코드 `moodAlpha` 함수가 이미 그렇게 동작.

---

## 📋 17종 작업표

### 🐱 고양이 5종

| # | 품종 | id | 등급 | 메인 컬러 | 프롬프트 키워드 | idle | sleep |
|---|---|---|---|---|---|---|---|
| 1 | 먼치킨 | `cat_munchkin` | normal | `#FFC8DD` 핑크 | "munchkin cat, short legs, big eyes, pink fur" | ☐ | ☐ |
| 2 | 페르시안 | `cat_persian` | normal | `#FAEDCB` 크림 | "persian cat, fluffy long fur, flat face, cream color" | ☐ | ☐ |
| 3 | 스코티시폴드 | `cat_scottish_fold` | rare | `#A0C4FF` 하늘 | "scottish fold cat, folded ears, round face, blue-gray" | ☐ | ☐ |
| 4 | 러시안블루 | `cat_russian_blue` | rare | `#B9FBC0` 연두 | "russian blue cat, sleek silver-blue coat, green eyes" | ☐ | ☐ |
| 5 | 샴 | `cat_siamese` | legendary | `#FFADAD` 살구 | "siamese cat, slender, color-point markings, blue eyes" | ☐ | ☐ |

### 🐶 강아지 6종

| # | 품종 | id | 등급 | 메인 컬러 | 프롬프트 키워드 | idle | sleep |
|---|---|---|---|---|---|---|---|
| 6 | 비숑프리제 | `dog_bichon` | normal | `#FFFFFF` 흰 | "bichon frise, fluffy white curly fur, black button nose" | ☐ | ☐ |
| 7 | 포메라니안 | `dog_pomeranian` | normal | `#FFD580` 황금 | "pomeranian, fluffy golden orange double coat, fox-like" | ☐ | ☐ |
| 8 | 말티즈 | `dog_maltese` | normal | `#F8F8F0` 미백 | "maltese, silky white long fur, small black eyes" | ☐ | ☐ |
| 9 | 웰시코기 | `dog_welsh_corgi` | rare | `#E8A458` 갈색 | "welsh corgi, short legs, brown-white markings, smile" | ☐ | ☐ |
| 10 | 시바견 | `dog_shiba` | rare | `#D97F39` 적황 | "shiba inu, curled tail, fox-like, red-tan coat, smug face" | ☐ | ☐ |
| 11 | 골든리트리버 | `dog_golden_retriever` | legendary | `#E8B75E` 황금 | "golden retriever, long golden fur, friendly big smile" | ☐ | ☐ |

### 🐹 햄스터 2종

| # | 품종 | id | 등급 | 메인 컬러 | 프롬프트 키워드 | idle | sleep |
|---|---|---|---|---|---|---|---|
| 12 | 골든햄스터 | `ham_golden` | normal | `#F1C27D` 골드 | "golden hamster, plump cheeks full of seeds, brown-orange" | ☐ | ☐ |
| 13 | 로보로브스키 | `ham_roborovski` | rare | `#C8A97E` 베이지 | "roborovski hamster, tiny, sandy beige, cute white belly" | ☐ | ☐ |

### 🦔 고슴도치 2종

| # | 품종 | id | 등급 | 메인 컬러 | 프롬프트 키워드 | idle | sleep |
|---|---|---|---|---|---|---|---|
| 14 | 일반 고슴도치 | `hedge_common` | rare | `#8A7563` 갈색 | "european hedgehog, brown spines, soft round body" | ☐ | ☐ |
| 15 | 알비노 고슴도치 | `hedge_albino` | legendary | `#FDEEDC` 미백 | "albino hedgehog, white spines, pink ears and nose, red eyes" | ☐ | ☐ |

### 🦜 앵무새 2종

| # | 품종 | id | 등급 | 메인 컬러 | 프롬프트 키워드 | idle | sleep |
|---|---|---|---|---|---|---|---|
| 16 | 왕관앵무 | `parrot_cockatiel` | rare | `#FFD66B` 노랑 | "cockatiel, yellow crest feathers, gray body, orange cheek" | ☐ | ☐ |
| 17 | 사랑앵무 | `parrot_budgerigar` | legendary | `#8AD8C4` 민트 | "budgerigar parakeet, mint green feathers, blue tail" | ☐ | ☐ |

**총 작업량**: 17 × 2 = **34 파일** (idle + sleep)
선택: + 17 (tired) = 51 파일

---

## 🔁 작업 권장 순서

### 1) 파이프라인 검증 (Phase 1)
**가장 먼저 한 종만 완성**해서 게임에 통합:
- ✅ 고양이 #1 먼치킨 idle 1장
- → [`08-pipeline.md`](./08-pipeline.md) 참고해 Phaser에 로딩
- → 화면에 잘 보이면 양산 시작

### 2) 종별 일괄 작업 (Phase 2~3)
하루는 고양이 5종 idle 다, 다음 날은 강아지 6종 idle 다... 시기 섞지 말기.

권장 일정 (1인, 하루 4~6시간 작업 기준):
- Day 1: 고양이 5종 idle
- Day 2: 강아지 6종 idle
- Day 3: 햄스터 2 + 고슴도치 2 + 앵무새 2 idle (총 6)
- Day 4: 모든 17종 sleep (idle 베이스 변형이라 빠름)
- Day 5: 보정 + 컬러 조정 + 폴더 정리

---

## 🛠 추천 워크플로 (Niji 기준)

### Step 1. 프롬프트 템플릿
01 스타일 가이드의 베이스에 위 표의 키워드 삽입:
```
isometric 30 degree angle, full body cute munchkin cat sitting,
short legs, big eyes, pink fur, big eyes, pastel color palette,
solid color #FFC8DD background, warm cozy hand-drawn aesthetic,
mobile game asset, soft outline, no gradient,
--niji 6 --ar 2:3 --quality 1 --sref [REFERENCE_URL]
```

### Step 2. 4장 생성 → 1장 선택 → 업스케일
- Niji 4-grid 중 마음에 드는 1장 → "U" (upscale)

### Step 3. 배경 제거
- [Remove.bg](https://www.remove.bg/) — 무료 · 빠름 · 잘됨
- 또는 Photoshop "주제 선택" → 마스크
- 결과: 알파 채널 PNG

### Step 4. 사이즈 조정
- Photoshop 또는 Photopea(무료, 웹)에서 64×96 px로 다운샘플
- "Image → Image Size → Resample: Nearest Neighbor (선명함 유지)"

### Step 5. 파일명 규칙대로 저장
```
char_cat_munchkin_idle.png
```
→ `src/assets/characters/` 에 배치

---

## 🌙 sleep 변형 만드는 법

idle PSD를 복제 + 다음 변형:
1. **눈을 닫는다** (검은 선 두 개)
2. **자세를 동그랗게** (말려 있는 자세) — 또는 같은 자세에 'Z' 표시 추가
3. **약간 어둡게** (전체 brightness -10%, saturation -10%)

Niji로 새로 생성하면 일관성이 깨지기 쉬우니 **idle 베이스를 직접 변형하는 게 안전**.

---

## ✅ 완료 기준

각 캐릭터에 대해:
- [ ] 64×96 px PNG, 알파 채널, 배경 완전 투명
- [ ] 파일명 정확히 `char_{species}_{breed}_{action}.png`
- [ ] `src/assets/characters/` 에 배치
- [ ] 한 번 게임 실행해서 화면에 깨지지 않고 보임 ([08-pipeline.md](./08-pipeline.md))

전체:
- [ ] 17 × idle = 17 파일
- [ ] 17 × sleep = 17 파일
- [ ] (선택) 17 × tired = 17 파일

---

## 💡 팁

- **종별 톤 통일**: 5종 고양이는 모두 같은 자세(앉아있기) 권장. 등급 차이는 색깔/디테일로만 표현
- **귀여움 가산점**: 코끝/볼터치 살짝 핑크색, 눈에 작은 하이라이트
- **legendary 차별화**: 살짝 아우라(반짝임) 또는 별 1~2개 추가, 단 너무 화려하면 톤 깨짐
- **수염/털**: 한 마리에 너무 디테일 살리면 64×96에서 뭉개짐 → 단순화 권장

---

다음 챕터:
→ [03. 가구 150종](./03-furniture.md)
