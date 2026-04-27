# 03. 가구 150종

> **목표**: 거실 + 침실에 배치 가능한 가구 150개 일러스트
> **소요**: 2~3주 (캐릭터보다 양 많음, 단 비슷한 디자인 변형으로 빨리 끝낼 수 있음)
> **사전조건**: [01. 스타일 가이드](./01-style-guide.md), 캐릭터 5종 끝낸 후 시작 권장 (스타일 안정화)

---

## 📐 공통 스펙

| 항목 | 값 |
|---|---|
| 파일명 | `furn_{category}_{id}.png` 또는 `furn_{id}.png` |
| 크기 | **128×128 px** (정사각, 아이소 다이아몬드 기준) |
| 포맷 | PNG, 알파 채널, 투명 배경 |
| category | `floor` (바닥 가구) / `wall` (벽 가구) / `decor` (장식) |
| 위치 | `src/assets/furniture/` |
| 작업 해상도 | 512×512 권장 → 128×128로 다운샘플 |

---

## 🎯 우선순위: MVP 5종 (이미 데이터에 있음)

먼저 이 5개부터 만들어서 **PlacementDemoScene** 테스트:

| id | category | grade | footprint | 설명 |
|---|---|---|---|---|
| `furn_rug_basic` | floor | normal | 2×2 | 분홍 러그 (`#FFC8DD`) |
| `furn_cushion_cat` | floor | normal | 1×1 | 크림색 둥근 쿠션 (`#FAEDCB`) |
| `furn_lamp_warm` | decor | rare | 1×1 | 따뜻한 조명 (`#A0C4FF`) |
| `furn_bed_pet` | floor | rare | 2×3 | 펫 침대 (`#B9FBC0`) |
| `furn_tree_cherry` | decor | legendary | 2×2 | 벚꽃 나무 (`#FFADAD`) |

**Phase 1 검증 끝나면 145개 추가.**

---

## 🗂 145개 추가 작업 가이드

### 카테고리 비율 권장

| 카테고리 | 개수 | 예시 |
|---|---|---|
| floor | 75 (50%) | 러그, 쿠션, 책상, 의자, 침대, 캣타워, 식기, 화분 |
| wall | 45 (30%) | 벽시계, 액자, 거울, 시계, 벽지, 커튼, 벽 선반 |
| decor | 30 (20%) | 조명, 식물, 인형, 책, 작은 소품 |

### 등급 비율

| 등급 | 개수 |
|---|---|
| normal | 90 (60%) |
| rare | 45 (30%) |
| legendary | 15 (10%) |

### Footprint 비율

| 크기 | 개수 | 비고 |
|---|---|---|
| 1×1 | 90 (60%) | 작은 소품, 조명, 인형 |
| 2×2 | 45 (30%) | 일반 가구, 의자, 작은 식탁 |
| 2×3 또는 큰 것 | 15 (10%) | 침대, 큰 가구 |

---

## 🔥 카테고리별 아이디어 30선 (시작 트리거)

### 🪑 floor (75개 목표)
- 러그 (분홍/하늘/크림 3색)
- 쿠션 (다양한 색)
- 펫 침대 (소/중/대)
- 캣타워 (1단/2단/3단)
- 사료 그릇 / 물통
- 화분 (다양한 식물)
- 작은 책상 / 의자
- 펫 하우스 (집 모양)
- 장난감 박스
- 스크래처
- 캣휠
- 햄스터 케이지
- 새장
- 화분 받침
- 좌식 테이블
- ... (50개 더)

### 🖼 wall (45개 목표)
- 벽시계 (다양한 디자인)
- 액자 (정사각/세로)
- 거울 (원형/아치형)
- 벽 선반 (1단/2단)
- 커튼 (체크/플로럴)
- 벽지 (포인트 벽지 4~5종)
- 게시판 (코르크)
- 벽등
- 벽 인형
- ... (35개 더)

### 🌿 decor (30개 목표)
- 미니 화분 (다양한 식물)
- 캔들
- 작은 인형
- 책 (1권 / 책쌓기)
- 사진 액자 (작은 것)
- 작은 조명
- 음악 박스
- 모래시계
- 보석상자
- ... (20개 더)

---

## ⚡ 빠른 양산 팁

### 변형 전략 (1개 만들면 3~5개 가능)
하나의 디자인을 만들고 **색상만 바꿔서** 여러 개 등록:
- `furn_rug_pink` (`#FFC8DD`)
- `furn_rug_cream` (`#FAEDCB`)
- `furn_rug_blue` (`#A0C4FF`)
- `furn_rug_green` (`#B9FBC0`)
- `furn_rug_peach` (`#FFADAD`)

5개 데이터 항목 vs 1개 작업. 150개를 30~40개 디자인으로 커버 가능.

### Photoshop 액션 활용
1. 베이스 디자인 1장 PSD로 저장
2. Hue/Saturation 레이어로 색상 변형 5종 생성
3. 일괄 export PNG (action recorder 사용)

### Niji 일괄 생성
같은 프롬프트를 변수만 바꿔 한 번에 5~10개 생성:
```
isometric 30 degree angle, [furniture] in pastel color,
flat design, transparent background, mobile game asset
--niji 6 --ar 1:1 --quality 1
```
변수에 `pink rug`, `cream rug`, `lamp`, `bed`... 차례로.

---

## 📋 데이터 입력 (코드 측 작업)

새 가구 추가 시 두 곳 모두 업데이트해야 합니다.

### 1) `src/data/furniture.json`
```json
{
  "id": "furn_new_chair",
  "nameKey": "furniture.new_chair",
  "category": "floor",
  "grade": "normal",
  "footprintW": 1,
  "footprintH": 1,
  "priceSnack": 15,
  "cozyScore": 4,
  "colorHex": "#FFC8DD"
}
```

### 2) `functions/src/shared/furnitureCatalog.ts`
```typescript
furn_new_chair: { snack: 15 },
```

저장 후 검증:
```powershell
npm run test -- furniture-catalog-sync
```
2 tests pass면 양쪽 일치.

### 3) i18n 키 (`src/data/locales/ko.json`)
```json
"furniture": {
  "new_chair": "포근한 의자"
}
```

---

## ✅ 완료 기준

각 가구에 대해:
- [ ] 128×128 px PNG, 알파 채널, 투명 배경
- [ ] 파일명 정확히 `furn_{id}.png`
- [ ] `src/assets/furniture/` 에 배치
- [ ] `furniture.json` + `furnitureCatalog.ts` + `ko.json` 3곳 업데이트
- [ ] `npm run test` 통과
- [ ] 게임에서 PlacementDemoScene 들어가 팔레트에 보이고 배치 가능

전체:
- [ ] MVP 5종 (Phase 1)
- [ ] 추가 145종 (Phase 3)

---

## 💡 팁

- **Footprint 시각화**: 2×2 가구는 작업 시 256×256(2배수) 캔버스에서 그리고 다운샘플
- **방향성 통일**: 의자/책상은 모두 "왼쪽 위에서 오른쪽 아래로 그림자" 방향
- **그림자**: 가구 아래 살짝 회색 타원 그림자 (alpha 30%)로 통일
- **벽 가구**: 벽에 붙는 부분이 평평하게 그려야 자연스러움. 시점은 정면 약간 위에서

---

다음 챕터:
→ [04. UI 아이콘 + 미니게임 자산](./04-ui-icons.md)
