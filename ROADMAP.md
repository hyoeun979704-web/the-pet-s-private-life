# 🐾 주인님의 사생활 — Claude Code 개발 계획 (v2)

> **v2 변경 요약**
> - 프로젝트 정체성/응답 규약/MVP 단계 신설
> - 자원 "3종 vs 5종" 모순 해소
> - PART 공통 실행 규약(DoD/산출물/에셋 스펙) 표준화
> - Firebase를 PART 3으로 앞당김(데이터 마이그레이션 부담 제거)
> - 법·보안·정책 체크리스트 추가
> - **[신규]** 에셋 생성 AI 파이프라인 / i18n / 분석 이벤트 / 성능·접근성 예산 / CI·CD·Crashlytics / 시즌 운영 스키마 / 소프트 런치 로드맵 / 사운드 전략 / KPI
> - 1인 사업가 운영 현실에 맞춘 권장치(단정값)로 공백 제거

---

## 📌 이 문서 사용법

이 문서는 Claude Code 세션의 **마스터 설계서**입니다.

1. 새 세션을 시작할 때 상단의 `🔖 MASTER PROMPT` 블록을 **항상 먼저** 전달합니다.
2. 각 PART에 들어갈 때는 해당 PART 섹션 + `📐 PART 공통 실행 규약`만 추가로 붙이면 됩니다.
3. 문서 내부에서 참조되는 수치/상수는 모두 이 문서 또는 `/src/config/Constants.ts`·`/src/data/*.json`에 한 번만 정의되며, 코드에 하드코딩하지 않습니다.

---

## 🔖 MASTER PROMPT (모든 세션 시작 시 전달)

```
당신은 "주인님의 사생활" 모바일 게임의 전속 개발자입니다.

[프로젝트 정체성]
- 장르: 반려동물(주인님) 힐링 시뮬레이션 / 아이소메트릭 2D
- 감성: 아기자기·따뜻·여성 친화적
- 제목의 "사생활"은 반려동물의 일상을 의미하며,
  성인/선정적 해석은 전면 배제합니다.

[운영 맥락]
- 개발 주체: 개발이 가능한 1인 사업가 (마케팅·디자인·개발 전담)
- 협업 도구: Claude Code
- 목표: MVP → α → β → 정식 출시 단계형 런칭

[응답 규약]
- 대화 응답: 한국어
- 코드/파일명/변수명/커밋: 영문 (Conventional Commits)
- 코드 스타일: ESLint(airbnb-base) + Prettier (2-space, semi)
- 모든 수치는 Constants.ts 또는 /data/*.json에만 존재 (하드코딩 금지)
- 파일 생성/수정 후에는 "추가/수정 파일 목록 + 이유 한 줄"을 반드시 요약
- 긴 응답에서는 단계마다 "✅ [단계명] 완료 — 다음 진행할까요?" 확인

[행동 원칙]
1. PART 공통 실행 규약(목표/단계/DoD/산출물/에셋 스펙)을 따른다.
2. DoD 중 하나라도 미달이면 PART를 "완료"라고 선언하지 않는다.
3. 불확실하면 임의 구현 대신 질문한다.
4. 실행 전에 기술 스택·프로젝트 구조·이전 PART 산출물을 확인한다.

지시된 PART 외의 범위에는 손대지 않습니다.
```

---

## 🎯 프로젝트 정체성 (최우선 해석 기준)

| 항목 | 값 (1인 개발 권장치) |
|---|---|
| 장르 | 반려동물 힐링 시뮬레이션 (아이소메트릭 2D) |
| 타깃 유저 | 한국 20~40대 여성 중심 / 전체이용가 지향 |
| 플레이 패턴 | 하루 10분 내외 캐주얼 세션 / 주 4~5회 접속 목표 |
| 수익 모델 | **β: 광고 전용** (IAP off) → **정식: 광고 + 소액 IAP 병행** (광고제거 패키지·스타터팩) |
| 출시 전략 | 한국 선행 → 일본/대만 → 영어권 (소프트 런치 로드맵 참조) |
| 예상 런칭 범위 | 이 문서의 "런칭 콘텐츠 기준" 참조 |

> **주의**: 타이틀의 "사생활"은 반려동물의 일상을 의미. 광고 타기팅·스토어 설명에서 오해되지 않도록 서브타이틀(예: "우리 집 주인님의 비밀 일상")을 병기합니다.

---

## 🛠 기술 스택

```
프레임워크     Phaser.js 3 + TypeScript (strict mode)
앱 래핑        Capacitor 6 (Android 우선)
백엔드         Firebase (Auth + Firestore + Storage + Analytics + Crashlytics)
서버 로직      Firebase Cloud Functions (자원 증감 검증)
광고           Google AdMob (보상형만)
결제           Google Play Billing (Capacitor 플러그인 경유)
빌드           Vite
패키지 관리    npm
해상도 기준    1920×1080 (가로 고정 Landscape)
최소 Android   API 26 (Android 8.0)
목표 프레임    60 FPS (저사양은 30 FPS 폴백)
오프라인       전체 불가 / 네트워크 미연결 시 안내 화면 표시
```

---

## 📁 프로젝트 구조

```
src/
├── main.ts                  # 진입점
├── config/
│   ├── GameConfig.ts        # Phaser 설정
│   ├── FirebaseConfig.ts    # Firebase 설정
│   ├── Constants.ts         # 전역 상수
│   └── Env.ts               # .env 로드 래퍼
├── scenes/
│   ├── BootScene.ts         # 초기 로딩
│   ├── LoadingScene.ts      # 로딩 화면 (TMI/팁)
│   ├── MainScene.ts         # 메인 마을
│   ├── TutorialScene.ts     # 튜토리얼 (5씬)
│   ├── OfflineScene.ts      # 오프라인 안내
│   ├── minigames/
│   │   ├── BlockPuzzleScene.ts
│   │   ├── MergeGameScene.ts
│   │   └── QuizScene.ts
│   └── ui/
│       ├── ShopScene.ts
│       ├── GachaScene.ts
│       └── DexScene.ts      # 도감
├── systems/
│   ├── EconomySystem.ts     # 자원 관리
│   ├── FatigueSystem.ts     # 피로도
│   ├── PlacementSystem.ts   # 배치
│   ├── ExpansionSystem.ts   # 방 확장
│   ├── GachaSystem.ts       # 가챠
│   ├── AdSystem.ts          # AdMob
│   ├── IAPSystem.ts         # 인앱 결제
│   ├── SaveSystem.ts        # Firebase 저장
│   ├── MigrationSystem.ts   # 세이브 버전 마이그레이션
│   ├── AnalyticsSystem.ts   # 이벤트 로깅
│   └── I18nSystem.ts        # 다국어
├── entities/
│   ├── Character.ts
│   ├── Furniture.ts
│   └── Room.ts
├── data/
│   ├── characters.json      # 17종
│   ├── furniture.json       # 150개 (런칭 기준)
│   ├── quiz.json            # 300문항
│   ├── rooms.json
│   ├── loading_texts.json
│   ├── seasons.json         # 시즌/이벤트 콘텐츠
│   └── locales/
│       ├── ko.json
│       ├── ja.json          # 일본 진출 대비 스켈레톤
│       └── en.json          # 영어권 진출 대비 스켈레톤
├── ui/
│   ├── HUD.ts
│   ├── BottomNav.ts
│   ├── Modal.ts
│   ├── FatigueBar.ts
│   └── ResourceBar.ts
└── utils/
    ├── IsometricUtil.ts
    ├── DepthSort.ts
    ├── NetworkUtil.ts
    └── Logger.ts            # Crashlytics 연동
```

---

## 📣 Claude 응답 규약 (요약)

- **언어**: 대화는 한국어 / 코드·식별자는 영문
- **스타일**: ESLint airbnb-base + Prettier (2-space, semi, single-quote)
- **커밋**: Conventional Commits (`feat:`, `fix:`, `chore:` 등)
- **타입**: `tsconfig.json`에서 `strict: true`, `noUncheckedIndexedAccess: true`
- **수치**: 전부 `Constants.ts` 또는 `/data/*.json`. 코드에 매직 넘버 금지
- **테스트**: Vitest. 각 PART DoD에 최소 1개 유닛테스트 포함
- **응답 패턴**:
  1. 구현 전: "이번 단계에서 건드릴 파일 목록 + 이유" 선언
  2. 구현 중: 단계별 "✅ 완료 — 다음 진행할까요?"
  3. 구현 후: 추가/수정된 파일 표 + 테스트 결과 요약

---

## 🌍 세계관 요약

```
플레이어    집사
캐릭터      주인님 (반려동물들)
핵심 서사   집사가 자리를 비운 사이, 주인님이 영역 본능으로 집을 가꾸는 이야기
감성        아기자기하고 따뜻한 힐링
시점        아이소메트릭 2D
```

---

## 💰 경제 시스템

### 자원 5종 (주자원 3 + 파생 자원 2)

| 분류 | 자원 | 변수명 | 획득처 | 주요 용도 |
|---|---|---|---|---|
| 주자원 | 🍖 간식 | `snack` | 블록 퍼즐, 일일 미션 | 일반 가구 구매 |
| 주자원 | ⭐ 별먼지 | `starDust` | 머지게임 | 희귀 가구 + 방 확장 도구 + 피로도 아이템 |
| 주자원 | 🔮 마법돌 | `magicStone` | 퀴즈, 레벨업 보상 | 가챠 + 한정 아이템 |
| 파생 | 🧩 마법돌 조각 | `magicShard` | 퀴즈 부산물 | 조각 3 + 별먼지 3 → 마법돌 1 |
| 파생 | 🎫 가챠권 | `gachaTicket` | 퀴즈 만점, 레벨업 | 가챠 직접 사용 |

### 일일 획득 한도

```typescript
const DAILY_LIMITS = {
  snack: 200,
  starDust: 50,
  quizSessions: 1,   // 광고 시청 시 +1
};
```

### 자원 합성

```typescript
// 마법돌 조각 → 마법돌
if (magicShard >= 3 && starDust >= 3) {
  magicShard -= 3;
  starDust -= 3;
  magicStone += 1;
}
```

> **⚠️ 보안 주의**: 위 로직은 UI 반영용이며, **실제 증감은 반드시 Cloud Functions에서 검증**합니다. 클라이언트에서 Firestore에 자원을 직접 write하는 것은 금지.

---

## 🐾 피로도 시스템

```typescript
const FATIGUE_CONFIG = {
  base: 10,
  levelBonus: 1,
  recoveryMinutes: 30,
  costs: {
    blockPuzzle: 1,
    mergeGame: 2,
    quiz: 4,
  },
};

const FATIGUE_ITEMS = {
  smallSnack:   { restore: 2,  cost: { starDust: 10 } },
  niceSnack:    { restore: 5,  cost: { starDust: 20 } },
  specialSnack: { restore: 10, cost: { starDust: 40 } },
};

const AD_FATIGUE_RESTORE = 3; // 하루 3회
```

---

## 🎰 가챠 시스템

```typescript
const GACHA_CONFIG = {
  cost: { magicStone: 1 },
  pityLimit: 20,            // 20회 천장 (희귀 이상 확정)
  rates: {
    normal:    0.70,
    rare:      0.25,
    legendary: 0.05,
  },
  duplicate: 'shard',
};
```

> **법적 고지**: 구글 플레이/한국 확률형 아이템 정보공개 정책에 따라 **확률표는 게임 내 메뉴에 반드시 노출**합니다. PART 7에서 `GachaRatesScene` 구현 필수.

---

## 🐱 캐릭터 데이터 구조 (17종)

```typescript
interface Character {
  id: string;
  nameKo: string;
  species: 'cat' | 'dog' | 'hamster' | 'hedgehog' | 'parrot';
  breed: string;
  grade: 'normal' | 'rare' | 'legendary';
  fatigueMax: number;             // normal:10, rare:12, legendary:15
  fatigueRecoveryBonus: number;
  tmi: string;                    // 도감 TMI (플레이스홀더)
  personality: string;
  idleAnim: string;
  sleepAnim: string;
  tiredAnim: string;
  spriteSheet: string;
}
```

17종 목록은 v1과 동일: 고양이 5 / 강아지 6 / 햄스터 3 / 고슴도치 2 / 앵무새 2.

---

## 🏠 배치 시스템 / 🏘 방 확장 시스템

v1과 동일 (타일 64px, iso 30°, 겹치기 불가, 회전 가능, 되돌리기 1회, 창고 허용).
방 확장 조건도 v1 동일 (거실 해금 → 침실 Lv.4 → 주방 준비중).

---

## 🎮 미니게임 3종

v1과 동일. 단, **각 미니게임 시작/종료 시 분석 이벤트 필수**:

```typescript
// 예시
analytics.log('minigame_start', { type: 'block_puzzle', fatigue_before });
analytics.log('minigame_end', {
  type: 'block_puzzle',
  score, duration_sec, reward_snack, cleared: true,
});
```

---

## 📢 광고 시스템

v1 정책 유지(보상형만, 강제 없음, 실패 시 무보상).
추가 규약:
- **광고 필터**: AdMob 설정에서 `alcohol`, `dating`, `gambling`, `sexual` 카테고리 차단
- **광고 실패 fallback**: 3회 연속 로드 실패 시 "잠시 후 다시 시도해주세요" 토스트

---

## 🛡 보안·개인정보·법규 체크리스트

출시 전에 모두 체크.

- [ ] Google Play 콘텐츠 등급: 전체이용가 대상 질의서 제출
- [ ] AdMob 광고 카테고리 필터링 적용
- [ ] 개인정보처리방침 URL 준비 (한국어/영어)
- [ ] 14세 미만 접근 정책 (KISA 개인정보보호법 준수)
- [ ] **Firestore 보안 규칙**: 클라이언트 자원 증감 write 차단 → Cloud Functions 경유
- [ ] 계정 삭제 요청 플로우 (Play 콘솔 필수)
- [ ] 확률형 아이템 확률 공시 (게임 내 + 스토어 설명)
- [ ] 퀴즈 "동물 건강/과학" 문항: 출처 2곳 이상 교차검증 후 배포
- [ ] 결제: SKU 정의 → 테스트 트랙 검증 → 영수증 서버 검증

### Firestore 보안 규칙 초안

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /players/{uid} {
      // 본인 문서만 읽기
      allow read: if request.auth != null && request.auth.uid == uid;

      // 클라이언트는 직접 write 불가 (자원/레벨/경험치/가챠 등 모두 서버 경유)
      allow write: if false;
    }

    // 공개 설정(예: 공지) 읽기 전용
    match /public/{doc} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

> 자원 증감은 Callable Cloud Functions(`addResources`, `consumeFatigue`, `rollGacha`)에서만 수행.

---

## 🌐 국제화(i18n) 구조

### 원칙

- **코드에 한글 리터럴 금지**. 모든 사용자 향 문자열은 `t('key')` 경유.
- 번역 키는 `screen.component.variant` 형식 (예: `shop.buy.confirm`).
- 초기에는 `ko.json`만 실사용, `ja.json`/`en.json`은 스켈레톤만 유지.

### 예시

```json
// src/data/locales/ko.json
{
  "shop": {
    "buy": {
      "confirm": "정말 구매하시겠어요?",
      "success": "구매 완료! 🎉"
    }
  }
}
```

```typescript
// 사용
i18n.t('shop.buy.confirm');
```

### 로케일 결정 순서

1. 유저가 설정 화면에서 수동 선택한 값
2. 디바이스 OS 언어
3. 기본값 `ko`

---

## 📊 분석 이벤트 설계 (Firebase Analytics)

### 필수 이벤트 (출시 전 반드시 구현)

| 이벤트명 | 언제 | 주요 파라미터 |
|---|---|---|
| `tutorial_step` | 튜토리얼 각 씬 진입 | `step_id`, `elapsed_sec` |
| `tutorial_complete` | 튜토리얼 종료 | `total_sec` |
| `session_start` / `session_end` | 앱 켜기/끄기 | `duration_sec` |
| `minigame_start` / `minigame_end` | 미니게임 | `type`, `score`, `duration_sec` |
| `resource_gain` / `resource_spend` | 자원 증감 | `type`, `amount`, `source` |
| `gacha_roll` | 가챠 1회 | `pity`, `result_grade`, `is_new` |
| `level_up` | 레벨업 | `new_level` |
| `ad_request` / `ad_impression` / `ad_reward` | 광고 | `placement`, `filled` |
| `iap_purchase` | 결제 완료 | `sku`, `price_krw` |
| `room_expand` | 방 확장 | `room_id`, `cozy_score` |
| `crash` | 예외 | `scene`, `message` (Crashlytics 연동) |

### 대시보드 초기 세팅

출시 직후 확인할 3대 지표:
1. **D1/D7/D30 Retention**
2. **ARPDAU** (Ad + IAP)
3. **튜토리얼 완주율** (`tutorial_step` funnel)

---

## ⚡ 성능 예산 & 접근성

### 성능 예산

| 항목 | 목표값 |
|---|---|
| 초기 APK 크기 | **≤ 80 MB** (OBB 없이) |
| 첫 진입 로딩 | **≤ 5초** (Wi-Fi), **≤ 10초** (LTE) |
| FPS (중사양 이상) | 60 |
| FPS (Android 8, 2GB RAM) | 30 이상 유지 |
| 메인 씬 메모리 | ≤ 300 MB |
| 에셋 텍스처 최대 | 2048×2048 (POT) |

> 위반 시 조치: 텍스처 아틀라스화 / lazy load / `image/webp` 사용 / 스프라이트시트 통합.

### 접근성 기준

- 텍스트 최소 색상 대비 **4.5:1** (WCAG AA)
- 기본 폰트 18pt, 설정에서 "큰 글자" 옵션 제공 (+20%)
- 탭 히트박스 최소 **44×44 dp**
- 색상 단독 정보 전달 금지 (예: 자원 부족 표시는 색 + 아이콘 + 텍스트)
- 애니메이션 감소 옵션 (설정 → 이펙트 off)

---

## 💾 세이브 데이터 & 마이그레이션

```typescript
const SAVE_SCHEMA_VERSION = 1;

interface SaveData {
  schemaVersion: number;      // 필수
  playerId: string;
  level: number;
  exp: number;
  resources: Resources;
  rooms: RoomState[];
  characters: OwnedCharacter[];
  furniture: OwnedFurniture[];
  dailyLimits: DailyLimitTracker;
  gachaPity: number;
  lastLogin: Timestamp;
  settings: GameSettings;
  locale: 'ko' | 'ja' | 'en';
}
```

### 마이그레이션 규칙

```typescript
// src/systems/MigrationSystem.ts
type Migrator = (data: any) => any;

const MIGRATIONS: Record<number, Migrator> = {
  // 1 -> 2: magicShard 필드 추가
  2: (data) => ({ ...data, resources: { ...data.resources, magicShard: 0 } }),
  // 3 -> 4: ...
};

export function migrate(data: any): SaveData {
  let d = data;
  while (d.schemaVersion < SAVE_SCHEMA_VERSION) {
    const next = d.schemaVersion + 1;
    d = MIGRATIONS[next](d);
    d.schemaVersion = next;
  }
  return d as SaveData;
}
```

> 스키마 변경 시 반드시 `SAVE_SCHEMA_VERSION` 증가 + 마이그레이터 추가 + Vitest로 이전 버전 → 최신 변환 테스트.

---

## 📅 시즌 & 이벤트 콘텐츠 운영

### 스키마 (seasons.json)

```json
{
  "seasons": [
    {
      "id": "season_2026_spring",
      "nameKo": "벚꽃 시즌",
      "startAt": "2026-03-20T00:00:00+09:00",
      "endAt":   "2026-04-20T23:59:59+09:00",
      "themeColors": { "primary": "#FFC8DD", "secondary": "#FAEDCB" },
      "limitedCharacters": ["cat_sakura_munchkin"],
      "limitedFurniture": ["cherry_blossom_tree", "sakura_rug"],
      "limitedQuizTrack": "spring_animals",
      "rewards": { "login7days": { "magicStone": 3 } }
    }
  ]
}
```

### 운영 원칙

- 시즌은 **JSON 교체 + 서버 토글**만으로 on/off. 앱 업데이트 불필요.
- 한정 캐릭터/가구는 도감에 "기간 한정" 라벨 표시.
- 시즌 종료 후 1년 뒤 재등장 가능(복각).

---

## 🔊 사운드 & 음악 전략

### 역할 분담

| 종류 | 용도 | 권장 소스 |
|---|---|---|
| BGM (메인) | 마을, 로비 | Suno AI 자체 생성 (상업 이용 플랜) |
| BGM (미니게임) | 블록/머지/퀴즈 | Suno AI 또는 [freepd.com] |
| SFX (탭/구매/가챠) | 인터랙션 | [freesound.org] CC0 선별, [zapsplat.com] |
| 보이스 | 캐릭터 울음 | 실제 샘플 구매(Pond5) 또는 AI 생성 |

### 기술 규약

- 포맷: `.ogg` (안드로이드 친화)
- BGM 비트레이트 128kbps, SFX 96kbps
- 총 사운드 용량 **≤ 15 MB**
- 모든 파일에 **라이선스 출처**를 `/audio/LICENSES.md`에 기록

---

## 🎨 에셋 생성 AI 파이프라인 (1인 운영 특화)

### 역할 분담

| 에셋 종류 | 주 도구 | 보조 도구 | 품질 관리 |
|---|---|---|---|
| 캐릭터 일러스트 원안 | Midjourney v6 | Niji Journey | 스타일 레퍼런스 3장 고정 |
| 캐릭터 스프라이트 | Midjourney → Photoshop/Aseprite 리드로우 | ControlNet | 아이소 각도 30° 통일 |
| 가구 아이콘 | Midjourney + `--no background` | Remove.bg | 2배수 크기 제작 → 다운샘플 |
| 배경 타일 | Stable Diffusion + LoRA | Hand-touch | 타일링 검증 필수 |
| UI 버튼/아이콘 | Figma 자체 | Lucide + 커스텀 | 디자인 토큰 팔레트 고정 |
| BGM | Suno AI | FreePD | 저작권 확인 후 사용 |

### 생성 후 필수 체크리스트

- [ ] 파일명 규칙 일치 (예: `char_cat_munchkin_idle_01.png`)
- [ ] 해상도 / POT(Power of Two) 정합
- [ ] 투명 배경 여부
- [ ] 톤 일관성 (디자인 토큰 팔레트 이내)
- [ ] 라이선스 출처 기록 (`/assets/LICENSES.md`)

> **경고**: 실제 유명 캐릭터/연예인/브랜드 스타일 프롬프트 사용 금지.

---

## 🚀 CI/CD & 크래시 리포팅

### GitHub Actions 초기 구성

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
```

### 안드로이드 빌드 (수동 트리거)

```yaml
# .github/workflows/android.yml
name: Android Build
on: { workflow_dispatch: {} }
jobs:
  build-apk:
    runs-on: ubuntu-latest
    steps:
      # 서명키는 GitHub Secrets에서 base64 복원
      # gradle assembleRelease → AAB 업로드
```

### Crashlytics

- `Logger.error()`는 내부적으로 `Crashlytics.recordException`을 호출.
- Firestore 접근 실패, 광고 로드 실패, IAP 예외 모두 기록.
- 주 1회 Crashlytics 대시보드 점검 루틴.

---

## 🎬 튜토리얼 구조 (5씬)

v1과 동일. 각 씬 진입/종료 시 `tutorial_step` 이벤트 전송.

---

## 📱 로딩 화면

v1과 동일. TMI 텍스트는 `loading_texts.json`에서 로드, 미보유 캐릭터는 실루엣.

---

## 🎨 디자인 시스템

v1과 동일한 디자인 토큰 유지. 단, **모든 색상 HEX는 `Constants.ts`의 `DESIGN_TOKENS`에서만 참조**.

---

## 🪜 단계별 출시 스코프

### MVP (내부 테스트)

- 거실 1개 / 캐릭터 5종(등급별 1~2) / 가구 30개 / 퀴즈 30문항
- 미니게임 1종(블록 퍼즐)
- 광고·IAP 없음 / 저장은 Firebase
- 목표: 핵심 루프(플레이→자원→배치→만족) 검증

### α (클로즈드 베타)

- 침실 해금 / 캐릭터 10종 / 가구 80개 / 퀴즈 100문항
- 미니게임 3종 / 가챠 / 피로도 광고만
- 목표: 리텐션 D1 30% / 튜토리얼 완주 80%

### β (오픈 베타) — 소프트 런치

- 대만 + 홍콩 출시 (한국어 + 간체 중국어 임시)
- 콘텐츠 70% 완성
- **수익 모델: 광고 전용** (보상형 5종 전부 활성, IAP는 비활성)
- 목적: 광고 수익 단가·채움율 검증 + 리텐션 데이터 확보 (IAP 도입 판단 근거)
- 목표: ARPDAU $0.05 이상, D7 15%

### 정식 출시 (한국)

- 문서 "런칭 콘텐츠 기준" 전체
- 광고 5종 전체 + IAP 2~3종
- 목표: D30 7% 이상, 월 ARPDAU $0.10 이상

### 글로벌 확장

- 일본 → 영어권 순차. i18n 데이터만 추가.

> 각 단계 종료 시 별도 "다음 단계로 진행" 명령을 내릴 것.

---

## 📊 KPI & 성공 기준

| 지표 | MVP | α | β | 정식 |
|---|---|---|---|---|
| 튜토리얼 완주율 | - | ≥ 80% | ≥ 85% | ≥ 88% |
| D1 Retention | - | ≥ 30% | ≥ 35% | ≥ 40% |
| D7 Retention | - | - | ≥ 15% | ≥ 18% |
| D30 Retention | - | - | - | ≥ 7% |
| 평균 세션 시간 | - | ≥ 6분 | ≥ 8분 | ≥ 10분 |
| ARPDAU | - | - | ≥ $0.05 | ≥ $0.10 |
| Crashlytics 크래시율 | - | ≤ 2% | ≤ 1% | ≤ 0.5% |

---

## 📦 런칭 콘텐츠 기준 (정식 출시)

```
공간        방 2개 (거실 + 침실), 3번째 방 "업데이트 준비중"
캐릭터      17종
가구        150개
미니게임    3종
퀴즈 DB     300문항
언어        ko (ja·en은 스켈레톤)
```

---

## 📐 PART 공통 실행 규약

**모든 PART는 아래 5개 섹션을 반드시 채운 뒤 착수합니다.**

```
1) 목표(Goal)
   - 이 PART로 달성할 기능을 한 문장으로.

2) 세부 단계(Steps)
   - 3~7개.
   - 각 단계 완료 시 "✅ [단계명] 완료 — 다음 진행할까요?" 확인.

3) 완료 기준(DoD)  ※ 모두 체크되어야 "완료"
   [ ] 주요 기능이 실제로 동작한다
   [ ] 유닛테스트(Vitest) ≥ 1개 통과
   [ ] 수치는 모두 Constants / JSON 외부화
   [ ] ESLint·TypeScript 에러 0
   [ ] 사용자 향 문자열은 i18n 키로 등록
   [ ] 관련 분석 이벤트(있다면) 전송 확인
   [ ] (해당 PART가 영구 데이터에 영향을 준다면) 마이그레이터 추가

4) 산출물(Artifacts)
   - 새로 생성/수정된 파일 목록과 한 줄 설명

5) 에셋 스펙표
   | 파일명 규칙 | 크기(px) | 확장자 | 개수 | 비고 |
```

---

## 🗂 PART별 개발 순서 (재조정판)

```
PART 0   프로젝트 초기 세팅
         - Phaser + TypeScript + Vite + ESLint/Prettier + Vitest
         - Capacitor Android
         - Firebase 초기 연동 (Auth 스텁 + Analytics + Crashlytics)
         - 디자인 토큰 / 공통 UI / i18n 스켈레톤
         - 네트워크 감지 + 오프라인 씬
         - GitHub Actions CI(lint/typecheck/test/build)

PART 1   아이소메트릭 배치 시스템
         - iso 그리드, Y축 깊이 정렬
         - 드래그앤드롭 배치 / 회전 / 창고 / 되돌리기

PART 2   캐릭터 시스템
         - 17종 데이터 / 자유이동 AI / 피로도 / 수면 / 상호작용

PART 3   Firebase Auth + Firestore 스키마 + 보안 규칙  ← ★ v1 대비 앞당김
         - 게스트/구글 로그인 / 게스트→계정 마이그레이션
         - SaveData v1 스키마 / MigrationSystem
         - 보안 규칙 + Cloud Functions 자원 증감

PART 4   경제 시스템 + 상점 + 레벨 확장
         - 자원 5종 / 일일 한도 / 아늑함 점수 / 방 확장

PART 5   블록 퍼즐 미니게임

PART 6   머지 미니게임

PART 7   퀴즈 미니게임 (+ 확률형 미포함이지만 확률 공시 UI는 PART 8로)

PART 8   가챠 시스템 + 확률 공시 화면

PART 9   광고 시스템 (AdMob)

PART 10  IAP (Google Play Billing)  ※ β에서는 비활성, 정식 출시 직전 활성화

PART 11  튜토리얼 (5씬)

PART 12  로딩 화면 + TMI + 시즌 시스템(skeleton)

PART 13  폴리싱
         - 사운드, 파티클, 성능 최적화
         - 앱 아이콘, 스플래시, 스토어 등록 자산
         - 개인정보처리방침 페이지, 계정 삭제 플로우

PART 14  소프트 런치 준비 (대만/홍콩)
         - 로케일 스켈레톤 활성화 테스트
         - 이벤트 수집/대시보드 점검
```

> PART 3의 Firebase를 앞당긴 이유: 각 PART에서 생긴 데이터가 처음부터 올바른 스키마·검증 파이프로 쌓이게 하기 위해. 뒤로 미루면 임시 저장 코드가 여기저기 박혀 나중에 큰 마이그레이션 부담이 됨.

---

## ⚙️ 개발 원칙 (v2)

```
1. 데이터와 로직 분리
   모든 게임 수치는 /data/*.json 또는 Constants.ts에만.

2. 플레이스홀더 우선
   캐릭터 멘트·TMI·퀴즈 문제는 더미로 시작, 나중에 JSON 교체.

3. 에셋 교체 가능 구조
   모든 스프라이트는 키값 참조. 경로는 Constants.ts 한 곳만.

4. 서버 신뢰, 클라이언트 불신
   자원/재화 증감은 Cloud Functions. 클라 write 금지.

5. i18n 우선
   사용자 향 문자열은 항상 t('key'). 한글 리터럴 금지.

6. 분석 이벤트 기본 탑재
   새 기능마다 최소 1개 이상의 분석 이벤트를 정의·전송.

7. 모든 영구 데이터에는 스키마 버전
   SaveData, 시즌 상태, 설정 등 모두 schemaVersion 필드.

8. 오류 처리 일관성
   Firebase 실패 → 오프라인 안내
   광고 실패 → 조용히 토스트
   저장 실패 → 3회 재시도 후 알림 + Crashlytics 기록

9. PART 완료 시
   - DoD 체크리스트 전부 ✅
   - 에셋 규격표 출력
   - 다음 PART 시작 전 에셋 확인 대기
```

---

## 📋 PART 0 시작 명령어 (v2)

```
위 문서(특히 MASTER PROMPT와 PART 공통 실행 규약)를 숙지했으면, PART 0을 시작해줘.

[PART 0 목표]
1. Phaser.js 3 + TypeScript(strict) + Vite + ESLint(airbnb-base) + Prettier + Vitest 프로젝트 생성
2. /src 폴더 구조 생성 (빈 파일 포함)
3. Constants.ts 디자인 토큰 설정
4. Capacitor Android 설정
5. Firebase 초기 연동 (Auth 스텁 + Analytics + Crashlytics)
6. 네트워크 감지 유틸리티 + 오프라인 안내 씬
7. i18n 스켈레톤(ko.json 기본, ja/en 빈 파일)
8. BootScene → LoadingScene → MainScene 기본 흐름
9. GitHub Actions CI: lint / typecheck / test / build

[PART 0 DoD]
[ ] `npm run dev` 시 Phaser 빈 씬 렌더링
[ ] `npm run build` 에러 0
[ ] `npm run lint` / `npm run typecheck` 에러 0
[ ] `npm run test` 샘플 1개 통과
[ ] `npx cap sync android` 성공
[ ] Firebase Anonymous Auth 1회 성공 로그
[ ] 네트워크 차단 시 OfflineScene 표시
[ ] CI 워크플로우가 GitHub에서 green

[응답 규약 재확인]
- 대화는 한국어, 코드/식별자는 영문
- 각 단계 완료 시 "✅ [단계명] 완료 — 다음 진행할까요?" 확인
- PART 0 완료 후 에셋 규격표를 표 형식으로 출력
```

---

## 📎 부록 A — 환경 변수(.env.example)

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

VITE_ADMOB_APP_ID_ANDROID=
VITE_ADMOB_AD_UNIT_REWARDED=

VITE_ENV=development
```

> `.env`는 절대 커밋하지 않음. `.env.example`만 저장소에 포함.

---

## 📎 부록 B — 브랜치 & 릴리즈 전략 (1인 기준 단순화)

- `main`: 항상 배포 가능 상태
- `dev`: 다음 릴리즈용 통합 브랜치
- `feat/part-0-bootstrap` 등 PART 단위 브랜치
- 릴리즈 태그: `v0.1.0-mvp`, `v0.2.0-alpha`, `v0.5.0-soft`, `v1.0.0`

---

## 📎 부록 C — 다음 문서가 필요한 시점

이 계획서가 커버하지 않는 후속 문서:
- `MARKETING.md` — 스토어 설명, 스크린샷 콘티, ASO 키워드
- `COMMUNITY.md` — 디스코드/카카오채널 운영 규칙
- `LIVEOPS.md` — 시즌 기획 템플릿, 업데이트 캘린더

정식 출시 1개월 전에 별도 작성 권장.
