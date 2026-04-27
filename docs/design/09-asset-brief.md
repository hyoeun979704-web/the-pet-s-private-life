# 09. 에셋 제작자 브리프 (1페이지 요약)

> **읽는 시간**: 5분
> **목적**: 외주·프리랜서·AI 작업자에게 메일 첨부할 만한 한 장 짜리 요약.

---

## 🎮 게임 한 줄

**"주인님의 사생활"** — 집사가 자리를 비운 사이, 우리 집 주인님(반려동물)이 영역 본능으로 집을 가꾸는 따뜻한 힐링 시뮬레이션. **20~40대 여성** 타겟, **Android, 가로 풀스크린 (1920×1080)**.

---

## 🎨 비주얼 톤 (한 줄)

**"늦은 오후, 따뜻한 카페에서 차 한 잔 마시며 보는 풍경"**

- 분홍 #FFC8DD + 베이지 #FAEDCB + 라벤더 블루 #A0C4FF
- 부드러운 라인, 셀 셰이딩 2~3단계
- 채도 낮은 파스텔 (원색·네온 X)
- 캐릭터: deformed/chibi, 머리:몸 = 2:3
- 배경: 아이소메트릭 30°, 따뜻한 우드 + 패브릭

---

## 📦 납품 자산 (총 250개 ±)

### 캐릭터 (34~51 PNG)
- **17종 × idle / sleep** = 34장 (필수)
- **17종 × play** = 17장 (선택)
- 1024×1024 px / 알파 채널 PNG / 캐릭터만 격리
- → [상세](./04-characters.md) + [스펙](../assets/02-characters.md)

### 가구 (150 PNG)
- 바닥 75 / 벽 45 / 소품 30
- 256×256 또는 512×512 / 알파 채널 PNG
- → [스펙](../assets/03-furniture.md)

### UI 아이콘 (약 25 PNG)
- 자원 5 + 등급 3 + 광고 1 + 미니게임 16
- 32×32 ~ 128×128 / 알파 채널 PNG
- → [스펙](../assets/04-ui-icons.md)

### 배경 (5~10 PNG)
- 거실 1 (필수) / 침실 1 / 미니게임 3 / 가챠 1
- 1920×1080 PNG
- → [디렉션](./05-spaces.md)

### 사운드 (16 OGG)
- BGM 5곡 + SFX 11종
- OGG (Vorbis), 총 ≤ 15MB
- → [디렉션](./08-sound-direction.md) + [스펙](../assets/05-sound.md)

### 스토어 자산 (약 12개)
- 앱 아이콘 1024×1024
- 스플래시 2732×2732
- 피처 그래픽 1024×500
- 스크린샷 8장
- → [스펙](../assets/06-store.md)

---

## 🎯 등장 캐릭터 17종

| # | 종 | 등급 | 컬러 키 |
|---|---|---|---|
| 1 | 먼치킨 (cat_munchkin) | 일반 | 분홍 |
| 2 | 페르시안 (cat_persian) | 일반 | 베이지 |
| 3 | 스코티시폴드 (cat_scottish_fold) | 희귀 | 회파랑 |
| 4 | 러시안블루 (cat_russian_blue) | 희귀 | 회청 |
| 5 | 샴 (cat_siamese) | 전설 ⭐ | 살구 |
| 6 | 비숑 (dog_bichon) | 일반 | 흰 |
| 7 | 포메라니안 (dog_pomeranian) | 일반 | 주황 |
| 8 | 말티즈 (dog_maltese) | 일반 | 아이보리 |
| 9 | 웰시코기 (dog_welsh_corgi) | 희귀 | 갈색 |
| 10 | 시바 (dog_shiba) | 희귀 | 진갈색 |
| 11 | 골든리트리버 (dog_golden_retriever) | 전설 ⭐ | 금색 |
| 12 | 골든햄스터 (ham_golden) | 일반 | 황토 |
| 13 | 로보로브스키 (ham_roborovski) | 희귀 | 모래 |
| 14 | 보통고슴도치 (hedge_common) | 희귀 | 회갈 |
| 15 | 알비노고슴도치 (hedge_albino) | 전설 ⭐ | 백색 |
| 16 | 코카틸 (parrot_cockatiel) | 희귀 | 노랑 |
| 17 | 사랑앵무 (parrot_budgerigar) | 전설 ⭐ | 청록 |

---

## ⏰ 권장 작업 순서 (양산 전략)

```
Week 1:  파이프라인 검증 + 거실 배경 + 캐릭터 1종
Week 2:  캐릭터 5종 (MVP) + 자원 아이콘 5종
Week 3:  캐릭터 12종 (전체 17 중 12종) + UI 아이콘
Week 4:  남은 캐릭터 5종 + 가구 50종 + 침실
Week 5:  가구 100종 + 미니게임 자산
Week 6:  미니게임 배경 + 가챠 + 사운드 (Suno 1일)
Week 7:  스토어 자산 (스크린샷·피처그래픽) + 폴리싱
```

---

## 💰 예상 견적 가이드 (참고)

| 카테고리 | 외주 견적 | AI 활용 시 | 자체 |
|---|---|---|---|
| 캐릭터 17종 (idle+sleep) | 100~250만원 | 30~80만원 (Niji+보정) | 무료 |
| 가구 150종 | 75~200만원 | 30~70만원 | 무료 |
| 배경 5장 | 25~80만원 | 10~30만원 | 무료 |
| UI 25개 | 15~30만원 | 5~10만원 | 무료 |
| 사운드 16개 | 50~150만원 | 10~30만원 (Suno+Freesound) | 무료 |

> 본 프로젝트는 **AI + 자체 제작** 가정으로 설계됨. 외주 견적은 참고용.

---

## 🚫 절대 안 됨 (Hard NOs)

- ❌ 사람 캐릭터 (얼굴) — 동물이 주인공
- ❌ 무기·전투·피
- ❌ 술·담배·약물
- ❌ 도박장·카지노 비주얼 (가챠는 마법 캡슐)
- ❌ 너무 어린이틱한 톤 — 성인 여성이 즐길 미감
- ❌ 슬픔 (눈물·아픈 표정·죽음)
- ❌ 검정·순흑·네온 컬러
- ❌ 긴장·자극적인 사운드

---

## ✅ 첫 작업 체크리스트

작업 시작 전:

- [ ] [01. 컨셉](./01-concept.md) 읽음 (5분)
- [ ] [02. 타겟 & 톤](./02-target-tone.md) 읽음 (5분)
- [ ] [04. 캐릭터](./04-characters.md) 또는 작업 카테고리 챕터 읽음
- [ ] [`docs/assets/`](../assets/) 해당 카테고리 스펙 확인 (해상도·파일명)
- [ ] 색 팔레트 다운로드 또는 메모 (#FFC8DD 외 9색)
- [ ] 톤 무드보드 1개 만들기 (핀터레스트 등)
- [ ] **시범 작업 1개** 만들어 확인 받기 (양산 전 합의 필수)

---

## 📞 커뮤니케이션

작업 중 막히면:

| 상황 | 해결 |
|---|---|
| 톤이 맞는지 모르겠음 | 02-target-tone.md "어울리나?" 한 문장 자가 점검 |
| 캐릭터 디테일 헷갈림 | 04-characters.md 종별 블록 확인 |
| 정확한 픽셀·파일명 | docs/assets/ 해당 챕터 (스펙 정확) |
| 코드 통합 | docs/assets/08-pipeline.md (BootScene 자동 로드) |

---

## 🎁 납품 형식 (최종)

### 파일명 규칙
```
char_{species}_{breed}_{state}.png      e.g. char_cat_munchkin_idle.png
furn_{category}_{name}.png               e.g. furn_floor_rug_basic.png
icon_{category}_{name}.png               e.g. icon_resource_snack.png
bgm_{name}.ogg                           e.g. bgm_lobby.ogg
sfx_{name}.ogg                           e.g. sfx_tap.ogg
```

### 폴더 구조
```
src/assets/
├── characters/
├── furniture/
├── ui/
└── audio/
```

### 압축
- PNG: TinyPNG 1차 압축 권장 (70~80% 절감)
- OGG: Vorbis q:a 4 (≈ 128kbps BGM, 96kbps SFX)
- 총 패키지 ≤ 80MB (ROADMAP 성능 예산)

---

## 🌟 마무리

이 게임은 **하루 10분 짜리 따뜻한 발견**을 만드는 게임입니다.
모든 자산은 **그 10분이 따뜻하도록** 만들어주시면 됩니다.

> **"이게 늦은 오후, 따뜻한 거실에서 차 한 잔 마시며 보는 풍경에 어울리나?"**

이 한 문장이 가장 강한 필터.

---

## 🔗 모든 문서 한눈에

### 디자인 (WHY)
- [00. README](./README.md)
- [01. 컨셉](./01-concept.md)
- [02. 타겟 & 톤](./02-target-tone.md)
- [03. 플레이 루프](./03-gameplay-loop.md)
- [04. 캐릭터 17종](./04-characters.md)
- [05. 공간 & 배경](./05-spaces.md)
- [06. 미니게임 비주얼](./06-minigames.md)
- [07. UI/UX 톤](./07-ui-ux.md)
- [08. 사운드 디렉션](./08-sound-direction.md)
- [09. 1페이지 브리프 (현재 문서)](./09-asset-brief.md)

### 에셋 (HOW)
- [에셋 README](../assets/README.md)
- [01. 스타일 가이드](../assets/01-style-guide.md)
- [02. 캐릭터 스펙](../assets/02-characters.md)
- [03. 가구 스펙](../assets/03-furniture.md)
- [04. UI 아이콘 스펙](../assets/04-ui-icons.md)
- [05. 사운드 스펙](../assets/05-sound.md)
- [06. 스토어 자산](../assets/06-store.md)
- [07. 캐릭터 텍스트 (i18n 51키)](../assets/07-text-content.md)
- [08. Phaser 통합](../assets/08-pipeline.md)
