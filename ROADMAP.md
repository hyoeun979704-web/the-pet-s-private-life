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
