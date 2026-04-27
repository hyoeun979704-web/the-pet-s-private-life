# 01. 스타일 가이드

> **목표**: 모든 후속 에셋이 따라야 할 시각적 헌법. 한 번 정하고 17 캐릭터 + 150 가구가 다 끝날 때까지 안 바꿈.
> **소요**: 1~2시간 (결정만 하면 끝)

---

## 🎨 디자인 토큰 (확정)

이미 `src/config/Constants.ts` 에 정의돼 있어요. **모든 에셋은 이 색만 사용**합니다.

### 메인 컬러
| 용도 | HEX | 미리보기 |
|---|---|---|
| Primary (메인 핑크) | `#FFC8DD` | 🩷 |
| Primary Dark | `#E8A4BF` | 🌸 |
| Secondary (크림) | `#FAEDCB` | 🍦 |
| Accent (하늘) | `#A0C4FF` | 🩵 |
| Success (연두) | `#B9FBC0` | 🍃 |
| Danger (살구) | `#FFADAD` | 🌷 |

### 기본 / 텍스트
| 용도 | HEX |
|---|---|
| 텍스트 (메인) | `#3A2E2A` |
| 텍스트 (보조) | `#7A6A66` |
| 배경 | `#FFF7F2` |
| 배경 (대안) | `#F3E8E2` |

### 사용 규칙
- 캐릭터 한 마리는 **메인 컬러 1 + 보조 컬러 1** 정도로 단순화
- 가구는 **메인 컬러 + 텍스트 색** 조합 권장
- UI 그라데이션 금지, 단색 또는 미세 패턴만

---

## 🌟 톤 & 무드

### 한 문장 정의
> **"여성 친화적, 아기자기, 따뜻한 힐링 — 새벽 4시에도 봐도 마음 편한 그림"**

### 참고 키워드
- ✅ Niji Journey
- ✅ Korean kawaii illustration
- ✅ Pastel palette
- ✅ Hand-drawn imperfection (살짝 들쭉날쭉한 선이 더 따뜻함)
- ❌ 채도 높은 비비드 컬러
- ❌ 그라데이션 / 광택 / 메탈 효과
- ❌ 사실주의 사진풍

### 비교 레퍼런스 (같은 종류 게임 중 우리 톤에 가까운 것)
- "고양이 마을" / "동물의 숲"의 캐릭터 일러스트
- 일러스트레이터 lihjyongi, ヨシタケシンスケ 의 동물 그림체
- "Cozy Grove" UI 톤

---

## 🖼 시점 & 비율

| 항목 | 값 |
|---|---|
| 시점 | **아이소메트릭 30°** (캐릭터/가구 모두) |
| 캐릭터 크기 | **64×96 px** (가로 × 세로) |
| 가구 크기 | **128×128 px** (정사각, 아이소 다이아몬드 기준) |
| 배경 | **투명** (알파 채널 PNG) |
| 외곽선 | 굵은 검은 윤곽선 (1~2px) — 일관 적용 |

### 아이소 30° 가이드
- 가로:세로 = 2:1 다이아몬드
- 캐릭터는 약간 정면 (전면 45° + 약간 위에서) 으로 그려도 통일감 있음
- 한 번 결정한 각도는 17종 모두 동일

---

## 📌 스타일 레퍼런스 3장 고정

> **가장 중요**: 마음에 드는 첫 캐릭터 1장을 "정답"으로 삼고 모든 후속 작업 시 옆에 띄워놓기. 같은 작가가 같은 도구로 그려도 시기별로 톤이 미묘하게 달라짐.

### 권장 워크플로
1. Niji/MJ로 5장 생성 → 마음에 드는 1장 선택
2. 그 1장을 `docs/assets/REFERENCE.png` 로 저장
3. 후속 작업 시:
   - Niji: `--sref [URL]` 또는 `--cref [URL]` 파라미터로 강제
   - 손그림: 듀얼 모니터에 항상 띄워놓기
4. 17종 다 끝날 때까지 바꾸지 않기

---

## 🔤 폰트

코드에서 정의:
```css
font-family: "Pretendard", "Noto Sans KR", sans-serif;
```

- **Pretendard** — 한국어 무료, 모던, 가독성 최고 ([페이지](https://github.com/orioncactus/pretendard))
- **Noto Sans KR** — 폴백, Google Fonts

UI는 코드 안에서 텍스트를 그리니까 폰트 파일은 선택사항이에요. 다만 스토어 스크린샷·피처 그래픽 만들 때는 같은 폰트 사용 권장.

---

## ✏️ AI 프롬프트 템플릿 (재사용)

### Niji Journey 캐릭터 베이스
```
isometric 30 degree angle, full body cute [캐릭터 종류],
big eyes, pastel color palette,
solid color #FFC8DD background, transparent for export,
warm cozy hand-drawn aesthetic, mobile game asset,
soft outline, no gradient, --niji 6 --ar 2:3 --quality 1
```

변수만 갈아끼우기:
- `[캐릭터 종류]` → "munchkin cat sitting", "shiba inu standing", ...

### 가구 베이스
```
isometric 30 degree angle, [가구 이름],
pastel color palette matching #FFC8DD theme,
flat design with subtle texture, transparent background,
mobile game furniture asset, top-down 3/4 view,
soft outline, no shadow, --niji 6 --ar 1:1 --quality 1
```

변수: `[가구 이름]` → "round cushion", "wooden lamp", ...

---

## ✅ 시작 전 체크리스트

다음 항목 결정 후 다음 챕터로 넘어가세요:

- [ ] 메인 일러스트 도구 정함 (Niji / MJ / 손그림)
- [ ] 사운드 도구 정함 (Suno / Freesound / 직접 작곡)
- [ ] 편집 도구 정함 (Photoshop / Aseprite / Photopea / Affinity)
- [ ] 백그라운드 제거 도구 (Remove.bg / Photoshop / Photopea)
- [ ] 작업 폴더 정함 (예: `~/Documents/tpp-assets/`)
- [ ] 프로젝트 안 `src/assets/` 4개 하위 폴더 만들었음
  ```powershell
  cd C:\Users\qazws\Documents\the-pet-s-private-life\the-pet-s-private-life
  mkdir src\assets\characters, src\assets\furniture, src\assets\ui, src\assets\audio
  ```

---

다음 챕터:
→ [02. 캐릭터 17종](./02-characters.md)
