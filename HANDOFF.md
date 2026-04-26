# 📋 HANDOFF — 수동 작업 목록 (코드 외 작업)

> 코드(216 tests green)는 완료. 출시까지 남은 항목은 **외부 콘솔 설정 / 에셋 / 키 / 문서**로 귀결됩니다. 이 문서를 위에서부터 차례대로 처리하면 됩니다.

> **🔍 각 섹션의 상세 가이드는 [`docs/handoff/`](./docs/handoff/) 에 있습니다.** 콘솔 버튼 라벨, 실행 명령, 코드 패치까지 단계별로 풀어쓴 문서입니다. 인덱스: [`docs/handoff/README.md`](./docs/handoff/README.md)

## 목차

1. [Firebase 프로젝트 세팅](#1-firebase-프로젝트-세팅)
2. [Capacitor / Android 빌드](#2-capacitor--android-빌드)
3. [AdMob 광고](#3-admob-광고)
4. [IAP (Google Play Billing)](#4-iap-google-play-billing)
5. [Crashlytics + Analytics](#5-crashlytics--analytics)
6. [에셋 (그래픽 + 사운드)](#6-에셋-그래픽--사운드)
7. [법규 / 개인정보 / 약관](#7-법규--개인정보--약관)
8. [프로덕션 부트스트랩 wiring](#8-프로덕션-부트스트랩-wiring)
9. [출시 전 최종 체크](#9-출시-전-최종-체크)

---

## 1. Firebase 프로젝트 세팅

### 1-1. 프로젝트 생성
- [ ] [Firebase Console](https://console.firebase.google.com) → "프로젝트 추가"
- [ ] 프로젝트 이름: `the-pets-private-life` (또는 자유)
- [ ] **위치(리전)**: `asia-northeast3` (Seoul) 권장

### 1-2. 앱 등록 (Android + Web)
- [ ] **Web 앱** 추가 → 설정에서 `apiKey`, `authDomain`, `projectId` 등 7개 키 복사 → `.env` 의 `VITE_FIREBASE_*` 7개 항목에 입력
- [ ] **Android 앱** 추가 → 패키지명 `com.hyoeun979704.thepetsprivatelife` (capacitor.config.ts와 일치)
- [ ] `google-services.json` 다운로드 → `android/app/` 에 배치 (cap add 이후)

### 1-3. 서비스 활성화
- [ ] **Authentication** → "익명" + "Google" 제공자 활성화
- [ ] **Firestore Database** → "프로덕션 모드"로 시작 → 위치 `asia-northeast3`
- [ ] **Cloud Functions** → 결제 카드 등록 (Blaze 플랜 필수, Cloud Functions 사용 위해)
- [ ] **Analytics** → 자동 활성화 확인

### 1-4. 배포
```bash
# 첫 배포 시
npx firebase login
npx firebase init   # 이미 firestore.rules / firebase.json 있음 — 기존 사용
cd functions && npm install && npm run build && cd ..
npx firebase deploy --only firestore:rules,functions
```
- [ ] 배포 후 `https://<project>.web.app` 또는 functions URL 확인
- [ ] Firestore 규칙 콘솔 페이지에서 **Tester**로 `players/{uid}` write 시도 → 거부 확인

### 1-5. 에뮬레이터 (개발용)
```bash
npx firebase emulators:start
```
- [ ] `http://localhost:4000` UI에서 Auth/Firestore/Functions 동작 확인

---

## 2. Capacitor / Android 빌드

### 2-1. Android 프로젝트 생성
```bash
npm run build                # dist/ 생성 필수 (Capacitor가 복사함)
npx cap add android          # android/ 폴더 생성
npx cap sync android         # 변경 동기화
```
- [ ] 안드로이드 스튜디오 또는 `cd android && ./gradlew assembleDebug`로 디버그 빌드 확인
- [ ] `android/app/google-services.json` 배치 (Firebase에서 다운받은 것)

### 2-2. 서명 키 생성 (출시용)
```bash
keytool -genkey -v -keystore release.keystore -alias tpp \
  -keyalg RSA -keysize 2048 -validity 10000
```
- [ ] `release.keystore` 파일은 **절대 git에 commit 금지** (.gitignore에서 차단됨)
- [ ] 안전한 곳에 백업 (분실 시 앱 업데이트 불가)
- [ ] `android/key.properties` 작성 (예시는 Capacitor 문서 참조)

### 2-3. 안드로이드 매니페스트
- [ ] `android/app/src/main/AndroidManifest.xml` 에 INTERNET 권한 확인
- [ ] minSdkVersion ≥ 26 (Android 8.0) 확인
- [ ] targetSdkVersion: 최신 (현재 34/35)
- [ ] App Bundle (.aab)로 빌드 — Play Store 요구사항

### 2-4. 안드로이드 권한 (필요 시)
- [ ] 광고 관련: `<uses-permission android:name="com.google.android.gms.permission.AD_ID"/>` (AdMob)
- [ ] (예정) 이미지 갤러리/카메라 권한은 현재 사용 안 함

---

## 3. AdMob 광고

### 3-1. AdMob 계정 + 앱 등록
- [ ] [AdMob Console](https://apps.admob.com) → 앱 추가 → 패키지명 입력
- [ ] **App ID** 확보 → `.env`의 `VITE_ADMOB_APP_ID_ANDROID`
- [ ] **광고 단위 ID (보상형)** 1개 생성 → `.env`의 `VITE_ADMOB_AD_UNIT_REWARDED`
  > MVP에서는 단일 광고 단위로 5개 placement 모두 사용. 나중에 슬롯별로 다른 ID를 쓸 거면 `Constants.ts` 또는 `data/adPlacements.json`에 `adUnitId` 필드 추가.

### 3-2. 카테고리 차단 (ROADMAP §광고 시스템)
- [ ] AdMob 콘솔 → 차단 컨트롤에서 다음 카테고리 차단:
  - `alcohol`, `dating`, `gambling`, `sexual`, `politics`
- [ ] 전체이용가 광고 정책 적용 (개발자 정책)

### 3-3. Capacitor AdMob 플러그인 설치
```bash
npm i @capacitor-community/admob
npx cap sync android
```
- [ ] `src/systems/AdSystem.ts`의 `MockAdAdapter` 자리에 실제 어댑터 작성:
  ```typescript
  // src/adapters/AdMobAdapter.ts (새로 작성)
  import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';
  import type { AdAdapter } from '@/systems/AdSystem';
  // showRewarded() 구현 — Capacitor 플러그인 API 호출
  ```
- [ ] `src/main.ts` 의 dev wiring을 `initProdServices` 분기로 교체 (자세한 내용은 §8)

### 3-4. 테스트 광고 ID
- [ ] 개발 빌드(`VITE_ENV=development`)에서는 [Google 테스트 광고 ID](https://developers.google.com/admob/android/test-ads) 강제 사용
  - `ca-app-pub-3940256099942544/5224354917` (보상형 테스트)
- [ ] 출시 빌드 직전에 실제 ID로 교체 → CI 환경변수로 분리 권장

---

## 4. IAP (Google Play Billing)

### 4-1. Play Console 상품 등록
- [ ] [Play Console](https://play.google.com/console) → 앱 등록 → 패키지명 일치
- [ ] **상품 등록** (`src/data/iapSkus.json`의 productId와 동일하게):
  | productId | 유형 | 가격 |
  |---|---|---|
  | `com.hyoeun979704.tpp.starter_pack` | 비소모성 | ₩4,900 |
  | `com.hyoeun979704.tpp.remove_ads` | 비소모성 | ₩9,900 |
  | `com.hyoeun979704.tpp.magic_stone_small` | 소모성 | ₩1,900 |
  | `com.hyoeun979704.tpp.magic_stone_medium` | 소모성 | ₩4,900 |

### 4-2. 영수증 검증 (Cloud Function 완성)
- [ ] [Google Play Developer API](https://developers.google.com/android-publisher) 활성화
- [ ] GCP 콘솔에서 서비스 계정 생성 → JSON 키 다운로드
- [ ] Play Console → API 액세스 → 서비스 계정 연결 + "재무 데이터 보기" 권한
- [ ] `functions/src/validatePurchase.ts`의 TODO 부분에 실제 검증 코드 추가:
  ```typescript
  import { google } from 'googleapis';
  // androidpublisher.purchases.products.get
  // 응답의 purchaseState === 0 (purchased) 확인
  ```
- [ ] 환경변수: Cloud Functions secret으로 서비스 계정 JSON 등록

### 4-3. Capacitor Billing 플러그인
```bash
npm i @capacitor-community/in-app-purchases
npx cap sync android
```
- [ ] `src/adapters/CapacitorIapAdapter.ts` 작성 (`IapAdapter` 인터페이스 구현)
- [ ] `IAPSystem({ enabled: ... })` β에서는 false, 정식 출시 직전 true로 토글

### 4-4. 영수증 보관 + 재시도
- [ ] 결제 후 검증 실패 시 영수증을 로컬에 저장하고 다음 부팅 시 재검증 — Capacitor 플러그인의 `acknowledgePurchase` 패턴 참조
- [ ] 비소모성(remove_ads)은 `restore` 흐름 필수 (Play Store 요구)

---

## 5. Crashlytics + Analytics

### 5-1. Crashlytics 활성화
- [ ] Firebase Console → Crashlytics → 활성화
- [ ] Capacitor 플러그인 설치:
  ```bash
  npm i @capacitor-firebase/crashlytics
  npx cap sync android
  ```
- [ ] `src/adapters/CapacitorCrashlyticsAdapter.ts` 작성 (`CrashlyticsAdapter` 구현)
  ```typescript
  import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics';
  // recordException → FirebaseCrashlytics.recordException
  // setCustomKey → FirebaseCrashlytics.setCustomKey
  ```
- [ ] `initProdServices`에서 `new CrashReporter({ adapter: ... }).start()`
- [ ] ProGuard/R8 매핑 파일 업로드 (Play Console에서 자동 또는 수동)

### 5-2. Firebase Analytics transport
- [ ] `src/adapters/FirebaseAnalyticsTransport.ts` 작성:
  ```typescript
  import { logEvent, getAnalytics } from 'firebase/analytics';
  import type { AnalyticsTransport, AnalyticsEvent } from '@/systems/AnalyticsSystem';
  export class FirebaseAnalyticsTransport implements AnalyticsTransport {
    send(e: AnalyticsEvent) {
      logEvent(getAnalytics(), e.name, e.params);
    }
  }
  ```
- [ ] `initProdServices`의 `transport`를 `FirebaseAnalyticsTransport`로 교체

### 5-3. Firebase 콘솔 설정
- [ ] **이벤트** → 다음 11개 이벤트 등록 확인:
  `tutorial_step`, `tutorial_complete`, `session_start`, `session_end`, `minigame_start`, `minigame_end`, `resource_gain`, `resource_spend`, `gacha_roll`, `level_up`, `ad_request`, `ad_impression`, `ad_reward`, `iap_purchase`, `room_expand`, `crash`
- [ ] **변환** → `tutorial_complete`, `iap_purchase` 변환으로 표시
- [ ] **잠재고객** → "튜토리얼 미완료자", "D7 잔존" 등 정의
- [ ] **퍼널** 등록:
  1. tutorial: 5단계 step + complete
  2. retention: D1/D7/D30 dashboards
  3. monetization: ad_impression → ad_reward 비율
- [ ] **BigQuery 연결** (선택): 광고 ROI 분석용

---

## 6. 에셋 (그래픽 + 사운드)

### 6-1. 캐릭터 17종 (PART 2 데이터 기준)

| 종 | 품종 | id | 등급 | 필요 에셋 |
|---|---|---|---|---|
| 🐱 | 먼치킨 | `cat_munchkin` | normal | idle/sleep/tired (아래 각각 64×96 PNG) |
| 🐱 | 페르시안 | `cat_persian` | normal | idle/sleep/tired |
| 🐱 | 스코티시폴드 | `cat_scottish_fold` | rare | idle/sleep/tired |
| 🐱 | 러시안블루 | `cat_russian_blue` | rare | idle/sleep/tired |
| 🐱 | 샴 | `cat_siamese` | legendary | idle/sleep/tired |
| 🐶 | 비숑프리제 | `dog_bichon` | normal | … |
| 🐶 | 포메라니안 | `dog_pomeranian` | normal | … |
| 🐶 | 말티즈 | `dog_maltese` | normal | … |
| 🐶 | 웰시코기 | `dog_welsh_corgi` | rare | … |
| 🐶 | 시바견 | `dog_shiba` | rare | … |
| 🐶 | 골든리트리버 | `dog_golden_retriever` | legendary | … |
| 🐹 | 골든햄스터 | `ham_golden` | normal | … |
| 🐹 | 로보로브스키 | `ham_roborovski` | rare | … |
| 🦔 | 일반 고슴도치 | `hedge_common` | rare | … |
| 🦔 | 알비노 고슴도치 | `hedge_albino` | legendary | … |
| 🦜 | 왕관앵무 | `parrot_cockatiel` | rare | … |
| 🦜 | 사랑앵무 | `parrot_budgerigar` | legendary | … |

**스펙**:
- 파일명: `char_{species}_{breed}_{idle|sleep|tired}.png`
- 크기: 64×96 (단일 프레임) 또는 256×256 스프라이트시트 + atlas JSON
- 투명 배경 PNG, 아이소 30°
- 색상은 `data/characters.json`의 `colorHex` 참고 (기본값)
- 라이선스 출처를 `assets/LICENSES.md`에 기록

### 6-2. 가구 (PART 1 데이터 5개 + PART 4 100개+)

| 파일명 규칙 | 크기 | 비고 |
|---|---|---|
| `furn_{category}_{id}.png` | 128×128 | 카테고리: `floor`, `wall`, `decor` |
| `tile_floor_01.png` | 64×32 (iso diamond) | 거실 바닥 타일 |

**MVP 5종 (이미 데이터 있음)**: `furn_rug_basic`, `furn_cushion_cat`, `furn_lamp_warm`, `furn_bed_pet`, `furn_tree_cherry`
**런칭 기준**: 150개 (PART 4 §스코프)

### 6-3. 미니게임 / UI

| 영역 | 파일명 규칙 | 크기 | 개수 |
|---|---|---|---|
| 블록 퍼즐 | `block_snack_{0\|1\|2}.png` | 64×64 | 3 (간식 모양 3색) |
| 블록 퍼즐 보드 | `bg_puzzle_board.png` | 800×800 | 1 |
| 머지 게임 | `merge_stardust_{1..10}.png` | 64×64 | 10 (단계별 색·디자인) |
| 퀴즈 카드 | `bg_quiz_card.png` | 900×500 | 1 |
| 가챠 | `gacha_capsule.png`, `gacha_grade_{n\|r\|l}.png` | 256×256 / 96×96 | 1 + 3 |
| 광고 | `icon_ad.png` | 24×24 | 1 |
| 자원 아이콘 | `icon_resource_{snack\|starDust\|magicStone\|magicShard\|gachaTicket}.png` | 48×48 | 5 |
| 레벨 아이콘 | `icon_level_star.png` | 32×32 | 1 |

### 6-4. 사운드 (ROADMAP §사운드 전략)

| 종류 | 파일 | 비고 |
|---|---|---|
| BGM (메인) | `bgm_lobby.ogg` | Suno AI 생성 권장, 128kbps, 루프 |
| BGM (블록) | `bgm_block_puzzle.ogg` | 경쾌, 짧은 루프 |
| BGM (머지) | `bgm_merge_game.ogg` | 차분 |
| BGM (퀴즈) | `bgm_quiz.ogg` | 두근거리는 |
| BGM (가챠) | `bgm_gacha.ogg` | 기대감 |
| SFX | `sfx_tap.ogg` 등 11종 (BgmTrackId/SfxId 참조) | 96kbps |

**총 사운드 용량 ≤ 15MB** (ROADMAP 성능 예산).
모든 파일 라이선스는 `audio/LICENSES.md`에 기록.

### 6-5. 스토어 등록 자산

| 항목 | 크기 | 비고 |
|---|---|---|
| 앱 아이콘 (안드로이드) | 512×512 PNG | adaptive icon (foreground+background 권장) |
| 피처 그래픽 | 1024×500 | Play Console 메인 배너 |
| 스크린샷 | 1080×1920 (세로) 또는 1920×1080 (가로) | 최소 2개, 권장 8개 |
| 짧은 설명 | 80자 이내 | 앱스토어 카드용 |
| 자세한 설명 | 4000자 | SEO 키워드 포함 |
| 프로모션 비디오 | 30초 ≤, YouTube 링크 | 선택 |

### 6-6. 스플래시 / 앱 시작 화면
- [ ] `resources/splash.png` 2732×2732 (Capacitor가 모든 사이즈로 리사이즈)
- [ ] `npx cordova-res android --skip-config --copy` 또는 `@capacitor/assets` 사용

---

## 7. 법규 / 개인정보 / 약관

### 7-1. 호스팅이 필요한 페이지
- [ ] **개인정보처리방침** — 정적 HTML 또는 Notion/노션 공개 페이지 → URL을 `.env`의 `VITE_PRIVACY_POLICY_URL`
  - 필수 항목: 수집하는 정보(uid, 닉네임, 광고ID), 보관기간, 제3자 제공(Firebase/AdMob), 삭제 절차(`deleteAccount` callable 안내), 14세 미만 정책
- [ ] **이용약관** — `.env`의 `VITE_TOS_URL`
  - 가챠 확률형 아이템 정보공개 정책 명시 (한국 게임산업법)
- [ ] **고객지원 이메일** — `.env`의 `VITE_SUPPORT_EMAIL`

### 7-2. Play Console 정책
- [ ] **콘텐츠 등급 질의서** 제출 (전체이용가)
- [ ] **데이터 안전 섹션** 작성:
  - 수집 데이터: 사용자 ID(uid), 게임 진행, 광고 식별자
  - 공유: AdMob, Firebase
- [ ] **계정 삭제 요청** 페이지 (Play 정책 필수):
  - URL 작성 (또는 앱 내 설정 화면에서 `deleteAccount` 호출)
  - Play Console에 URL 제출
- [ ] **광고 ID 정책** 동의 (AdMob 사용 시 자동 표시)

### 7-3. 한국 추가 사항
- [ ] **확률형 아이템 정보공개**: `GachaRatesScene` 게임 내 노출 + 스토어 자세한 설명에도 동일한 표 포함
- [ ] **KISA 개인정보보호법**: 14세 미만 회원가입 차단 (UI에서 연령 확인)
- [ ] **게임물관리위원회 등급분류**: 자체등급분류사업자(구글) 통한 출시면 별도 절차 없음 — 콘텐츠 등급 질의서로 충족

---

## 8. 프로덕션 부트스트랩 wiring

현재 `src/main.ts`는 dev 모드(`initDevServices`)만 사용합니다. 프로덕션은 별도 분기를 추가해야 합니다.

### 8-1. `src/systems/GameServices.ts`에 `initProdServices` 추가
다음 골격을 작성하세요:
```typescript
export async function initProdServices(): Promise<GameServices> {
  if (services) return services;

  // 1) ensurePlayerDoc — 첫 로그인 시 /players/{uid} 생성
  await ensurePlayerDoc();

  // 2) Firestore 백엔드
  const backend = new FirestoreSaveBackend();
  const saveSystem = new SaveSystem({ backend, saveRetries: 3 });

  // 3) 사용자별 SaveData 로드
  const uid = currentUser()?.uid ?? '';
  const initial = await saveSystem.load(uid);
  const gameState = new GameState(initial, saveSystem);

  // 4) addResources callable로 grantFn 구현
  const grantFn: GrantFn = async (source, deltas) => {
    const fn = httpsCallable(functions, 'addResources');
    const res = await fn({ source, deltas });
    // 서버가 success 반환하면 클라가 다시 patch (또는 Firestore 재읽기)
    return { ok: true, granted: deltas };
  };

  const economy = new EconomySystem({ grantFn, getSave: () => gameState.get(), gameState });
  const ads = new AdSystem({
    adapter: new AdMobAdapter(),     // §3-3에서 작성
    gameState,
  });
  const analytics = new AnalyticsSystem({
    transport: new FirebaseAnalyticsTransport(),  // §5-2
  });
  const tutorial = new TutorialSystem({ gameState, analytics });
  const crash = new CrashReporter({ adapter: new CapacitorCrashlyticsAdapter() }); // §5-1
  crash.start();

  services = { saveSystem, gameState, economy, ads, analytics, tutorial };
  return services;
}
```

### 8-2. `src/main.ts` 분기 처리
```typescript
async function bootstrap(): Promise<void> {
  await i18n.init();
  await initFirebase();
  if (ENV.isDev) {
    initDevServices(devGrantFn);
  } else {
    await initProdServices();
  }
  new Phaser.Game(createGameConfig());
}
```

### 8-3. quiz_extra_session 서버 측 연동 (PART 9 이월)
- [ ] `functions/src/addResources.ts`에 source `'quiz_extra_session'` 추가:
  - 광고 시청 후에만 호출 가능
  - `quizSessionsUsed--` 동작 (캡 늘림)
  - 별도 검증: `dailyLimits.adsUsed.quiz_extra_session` 가 1 이상이어야 함

### 8-4. `ensurePlayerDoc` 호출 타이밍
- [ ] `initFirebase`가 익명 로그인 → uid 확보 → `ensurePlayerDoc` 호출 순서로 보장
- [ ] 게스트 → Google 링크 후 `ensurePlayerDoc` 다시 호출 (멱등이라 안전)

### 8-5. SaveSystem 자동 저장 정책
- [ ] 현재는 `gameState.patch`마다 즉시 save. 트래픽이 많으면 100ms throttle 추가 검토
- [ ] 백그라운드 진입 시 `gameState.get()` 강제 저장 (Phaser PAUSE 이벤트 사용)

---

## 9. 출시 전 최종 체크

### 9-1. 코드 / 테스트 (현재 상태)
- [x] Vitest 216 / 216 통과
- [x] ESLint / TypeScript strict 0 errors
- [x] Vite build 성공
- [x] 9개 sync 테스트 (cross-workspace drift 가드)
- [ ] **수동**: GitHub Actions에 `cd functions && npm ci && npm run build` job 추가
- [ ] **수동**: `npx firebase emulators:exec --only functions,firestore "vitest run"` 같은 e2e 통합 테스트
- [ ] **수동**: 실기 30분 플레이 (튜토리얼 → 미니게임 3종 → 가챠 1회)

### 9-2. 콘텐츠 (런칭 기준)
- [ ] 캐릭터 17종 일러스트 + 스프라이트
- [ ] 가구 150개 일러스트
- [ ] 퀴즈 300문항 + 의료/과학 항목 출처 2건+
- [ ] 캐릭터 i18n 키 채움 (`char.{id}.name/tmi/personality` × 17 = 51 키)
- [ ] 사운드 BGM 5 + SFX 11

### 9-3. 인프라
- [ ] Firebase Blaze 결제 카드 + 한도 알림
- [ ] Firestore 보안 규칙 배포 후 emulator/Tester로 검증
- [ ] Cloud Functions 배포 + 호출 한도 (cold start) 측정
- [ ] 서명 키 안전 백업 (USB + 클라우드 2곳)

### 9-4. 마지막 토글
- [ ] `IAPSystem({ enabled: false })` (β) → `enabled: true` (정식)
- [ ] 광고 ID: 테스트 → 실 ID (CI 환경변수 분리 권장)
- [ ] `VITE_ENV=production` 으로 빌드
- [ ] AdMob 콘솔: "테스트 기기" 자기 폰 등록 (실 ID로 빌드해도 광고 노출 차단)

### 9-5. KPI 모니터링 (출시 후 첫 7일)
| 지표 | 매일 확인 | 목표 |
|---|---|---|
| Crashlytics 크래시율 | ✓ | ≤ 1% (β) / 0.5% (정식) |
| 튜토리얼 완주율 | ✓ | ≥ 85% |
| D1 Retention | ✓ | ≥ 35% |
| ARPDAU (광고만) | ✓ | ≥ $0.05 |
| 평균 세션 시간 | ✓ | ≥ 8분 |

### 9-6. 후속 PART 작업 (정식 출시 후)
- 시즌 콘텐츠(`data/seasons.json`) 운영 — 월 1회 시즌 교체
- 캐릭터 18종+ 추가 (콘텐츠 업데이트)
- 3번째 방(`room_kitchen`) 활성화
- 글로벌 확장: ja → en 로케일 완전 채움 후 출시 권한 확장
- 서버 부하 모니터링 + 함수별 SLO 설정

---

> 본 문서는 `claude/plan-development-roadmap-c9T6Y` 브랜치 기준. 각 항목 처리 후 체크박스 체크하면 진행 상황 추적 가능.
