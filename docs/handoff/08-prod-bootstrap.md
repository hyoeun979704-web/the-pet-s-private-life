# 8. 프로덕션 부트스트랩 wiring

> **목표**: dev 어댑터(Mock/Console)를 모두 실제 어댑터로 교체하고, `main.ts`가 `VITE_ENV` 에 따라 dev/prod 분기.
> **소요**: 4~6시간 (어댑터들이 §3, §4, §5에서 이미 준비된 상태)
> **사전 조건**: §1, §3, §4, §5 의 어댑터 클래스 작성 완료

---

## 8-1. 전체 그림

현재 `src/main.ts`:
```
i18n.init() → initFirebase() → initDevServices(devGrantFn) → new Phaser.Game
```

목표:
```
i18n.init() → initFirebase() → ensurePlayerDoc()
  → ENV.isDev ? initDevServices() : initProdServices()
  → new Phaser.Game
```

`initProdServices`는 다음을 dev에서 prod로 교체:
- SaveBackend: `MemorySaveBackend` → `FirestoreSaveBackend`
- grantFn: 로컬 mergeGrantLocal → `addResources` callable
- AdAdapter: `MockAdAdapter` → `CapacitorAdMobAdapter`
- AnalyticsTransport: `ConsoleTransport` → `FirebaseAnalyticsTransport`
- (선택) IAP: 활성화 + 어댑터 + validateFn
- CrashReporter: `Noop` → `CapacitorCrashlyticsAdapter`

---

## 8-2. `getFirebaseFunctions` 익스포트 추가 (필요 시)

`src/config/FirebaseConfig.ts` 가 이미 `functions` 변수를 갖고 있고 `getFirebaseFunctions` 도 export 됩니다. 확인:
```bash
grep "getFirebaseFunctions" src/config/FirebaseConfig.ts
```
없다면 다음 추가:
```typescript
export function getFirebaseFunctions(): Functions | null {
  return functions;
}
```

---

## 8-3. 프로덕션 grantFn

`src/adapters/prodGrantFn.ts` 새로 생성:
```typescript
import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '@/config/FirebaseConfig';
import type { GrantFn, GrantResult } from '@/systems/EconomySystem';
import { logger } from '@/utils/Logger';

export const prodGrantFn: GrantFn = async (source, deltas) => {
  const functions = getFirebaseFunctions();
  if (!functions) {
    return { ok: false, reason: 'offline' };
  }
  try {
    const fn = httpsCallable<
      { source: string; deltas: Record<string, number> },
      { ok: boolean; granted?: Record<string, number> }
    >(functions, 'addResources');
    const res = await fn({ source, deltas: deltas as Record<string, number> });
    if (res.data.ok) {
      return { ok: true, granted: res.data.granted };
    }
    return { ok: false, reason: 'server-denied' };
  } catch (err) {
    logger.error('grant.callable.failed', { source, err: String(err) });
    return { ok: false, reason: 'server-denied', error: err };
  }
};
```

> 서버가 grant를 처리하면 Firestore의 player doc도 갱신됨. 클라의 GameState는 별도로 grant 직후 패치하지 않음 (옵티미스틱) — 다음 부팅 시 `SaveSystem.load`로 동기화.
> 더 즉각적인 UI 반영을 원하면 server response를 받아 GameState.patch로 똑같이 반영. (현재 dev `mergeGrantLocal` 패턴)

---

## 8-4. `initProdServices` 작성

`src/systems/GameServices.ts` 에 추가:

```typescript
import { httpsCallable } from 'firebase/functions';
import { CapacitorAdMobAdapter } from '@/adapters/AdMobAdapter';
import { CapacitorCrashlyticsAdapter } from '@/adapters/CapacitorCrashlyticsAdapter';
import {
  CapacitorIapAdapter,        // §4
} from '@/adapters/CapacitorIapAdapter';
import { FirebaseAnalyticsTransport, bindAnalyticsUser } from '@/adapters/FirebaseAnalyticsTransport';
import { prodGrantFn } from '@/adapters/prodGrantFn';
import { validateFnProd } from '@/adapters/validateFn';
import {
  currentUser,
  ensurePlayerDoc,
  FirestoreSaveBackend,
  getFirebaseFunctions,
} from '@/config/FirebaseConfig';
import { CrashReporter } from '@/systems/CrashReporter';
import { IAPSystem } from '@/systems/IAPSystem';
// ... 기타 imports

export async function initProdServices(): Promise<GameServices> {
  if (services) return services;

  // 1) ensurePlayerDoc — 첫 로그인 시 /players/{uid} 생성
  const ensureRes = await ensurePlayerDoc();
  if (!ensureRes.ok) {
    throw new Error('ensurePlayerDoc failed; user cannot start');
  }

  // 2) Auth uid
  const uid = currentUser()?.uid ?? '';
  if (!uid) throw new Error('no auth uid after ensurePlayerDoc');

  // 3) SaveSystem (Firestore)
  const backend = new FirestoreSaveBackend();
  const saveSystem = new SaveSystem({ backend, saveRetries: 3 });
  const initial = await saveSystem.load(uid);
  const gameState = new GameState(initial, saveSystem);

  // 4) Analytics (Firebase transport)
  const analytics = new AnalyticsSystem({
    transport: new FirebaseAnalyticsTransport(),
    crashFromLogger: true,
  });
  bindAnalyticsUser(uid);

  // 5) Crashlytics
  const crashReporter = new CrashReporter({ adapter: new CapacitorCrashlyticsAdapter() });
  crashReporter.start();
  crashReporter.setUid(uid);

  // 6) Economy with server-routed grantFn
  const economy = new EconomySystem({
    grantFn: prodGrantFn,
    getSave: () => gameState.get(),
    gameState,
  });

  // 7) Ads — real AdMob adapter
  const ads = new AdSystem({
    adapter: new CapacitorAdMobAdapter(),
    gameState,
    analytics,
  });

  // 8) Tutorial
  const tutorial = new TutorialSystem({ gameState, analytics });

  // 9) IAP — beta 단계는 enabled: false
  const RELEASE_STAGE = (import.meta.env.VITE_RELEASE_STAGE ?? 'beta') as 'beta' | 'production';
  const iap = new IAPSystem({
    adapter: new CapacitorIapAdapter(),
    gameState,
    validateFn: validateFnProd,
    enabled: RELEASE_STAGE === 'production',
  });

  services = { saveSystem, gameState, economy, ads, analytics, tutorial };
  // iap, crashReporter는 services 인터페이스에 추가하거나
  // 별도 export 함수로 노출 (Settings 씬에서 호출용)
  return services;
}
```

### 8-4-1. GameServices 인터페이스에 IAP / Crash 추가
```typescript
export interface GameServices {
  saveSystem: SaveSystem;
  gameState: GameState;
  economy: EconomySystem;
  ads: AdSystem;
  analytics: AnalyticsSystem;
  tutorial: TutorialSystem;
  iap?: IAPSystem;          // 추가
  crashReporter?: CrashReporter; // 추가
}
```

테스트가 깨지지 않도록 옵셔널로. `getServices()` 사용처에서 `services.iap?.purchase(...)` 처럼 옵셔널 체이닝.

---

## 8-5. `main.ts` 분기

```typescript
import Phaser from 'phaser';
import { createGameConfig } from '@/config/GameConfig';
import { ENV } from '@/config/Env';
import { initFirebase } from '@/config/FirebaseConfig';
import { i18n } from '@/systems/I18nSystem';
import { initDevServices, initProdServices } from '@/systems/GameServices';
import { logger } from '@/utils/Logger';
// ... 기존 dev grantFn import

async function bootstrap(): Promise<void> {
  try {
    await i18n.init();
    await initFirebase();

    if (ENV.isDev) {
      // 기존 dev 흐름
      const devGrantFn = /* 기존 mergeGrantLocal 기반 */;
      initDevServices(devGrantFn);
    } else {
      await initProdServices();
    }

    const game = new Phaser.Game(createGameConfig());
    logger.info('game.bootstrapped', { version: game.config.gameVersion });
  } catch (err) {
    logger.error('bootstrap.failed', err);
  }
}

bootstrap();
```

---

## 8-6. quiz_extra_session 서버 측 (PART 9 이월 작업)

광고 시청 후 퀴즈 1회 추가 세션 기능은 현재 클라이언트만 동작 (`mergeGrantLocal`이 quizSessionsUsed--). 프로덕션에서는 서버에서 처리해야 합니다.

### 8-6-1. 새 Cloud Function `bumpQuizAllowance`
`functions/src/bumpQuizAllowance.ts` 생성:
```typescript
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { playerDocRef, requireAuthUid } from './util';

export const bumpQuizAllowance = onCall(async (req) => {
  const uid = requireAuthUid(req);
  const ref = playerDocRef(uid);
  return ref.firestore.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new HttpsError('not-found', 'player document missing');
    }
    const data = snap.data() ?? {};
    const daily = (data.dailyLimits as {
      adsUsed?: Record<string, number>;
      quizSessionsUsed?: number;
    } | undefined) ?? {};
    const used = daily.adsUsed?.quiz_extra_session ?? 0;
    if (used < 1) {
      throw new HttpsError(
        'failed-precondition',
        'must watch quiz_extra_session ad first',
      );
    }
    // Decrement quizSessionsUsed by 1, floor at 0.
    const next = Math.max(0, (daily.quizSessionsUsed ?? 0) - 1);
    tx.update(ref, { 'dailyLimits.quizSessionsUsed': next });
    return { ok: true };
  });
});
```

`functions/src/index.ts`에 export 추가, 배포.

### 8-6-2. 클라이언트에서 호출
`QuizScene.tryAdExtraSession` 수정:
```typescript
// 기존:
// await services.gameState.patch((d) => ({
//   ...d,
//   dailyLimits: { ...d.dailyLimits, quizSessionsUsed: max(0, ... - 1) }
// }));

// 변경:
const fn = httpsCallable(getFirebaseFunctions()!, 'bumpQuizAllowance');
await fn({});
// 서버가 처리 → 다음 SaveSystem.load 시점에 quizSessionsUsed 반영됨
// 즉시 UI 반영하려면 GameState.patch도 같이 수행 (옵티미스틱)
```

---

## 8-7. SaveSystem 자동 저장 throttle (선택)

현재 `gameState.patch` 마다 즉시 SaveSystem.save가 발동. 트래픽이 많으면 throttle 추가:

```typescript
// SaveSystem 내부에 추가
private pendingSave: Promise<SaveResult> | null = null;
private throttleTimer: ReturnType<typeof setTimeout> | null = null;

async saveThrottled(data: SaveData, delayMs = 200): Promise<SaveResult> {
  if (this.throttleTimer) clearTimeout(this.throttleTimer);
  return new Promise((resolve) => {
    this.throttleTimer = setTimeout(async () => {
      const res = await this.save(data);
      resolve(res);
    }, delayMs);
  });
}
```

GameState.patch가 saveThrottled를 호출하도록 옵션 추가.

> MVP는 그냥 즉시 save로 시작 → 트래픽 분석 후 도입 결정.

---

## 8-8. 백그라운드 진입 시 강제 저장

Phaser scene이 일시정지되거나 앱이 백그라운드로 가면 강제 save:
```typescript
// main.ts 또는 GameServices에서
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      const svc = getServices();
      if (svc) {
        svc.saveSystem.save(svc.gameState.get()).catch(() => undefined);
      }
    }
  });
}
```

---

## 8-9. 환경별 빌드 스크립트

`package.json`:
```json
"scripts": {
  "build:dev": "VITE_ENV=development npm run build",
  "build:beta": "VITE_ENV=production VITE_RELEASE_STAGE=beta npm run build",
  "build:prod": "VITE_ENV=production VITE_RELEASE_STAGE=production npm run build"
}
```

이렇게 하면:
- dev 빌드: 모든 mock/console
- beta 빌드: 실 어댑터 + IAP 비활성
- prod 빌드: 실 어댑터 + IAP 활성

---

## 8-10. 체크리스트

### 어댑터 작성
- [ ] §3 `CapacitorAdMobAdapter`
- [ ] §4 `CapacitorIapAdapter` + `validateFnProd`
- [ ] §5 `CapacitorCrashlyticsAdapter` + `FirebaseAnalyticsTransport`
- [ ] `prodGrantFn` 작성

### Wiring
- [ ] `initProdServices` 추가 (위 §8-4 그대로)
- [ ] `GameServices` 인터페이스에 `iap` / `crashReporter` 옵셔널 추가
- [ ] `main.ts` 분기 처리
- [ ] `bumpQuizAllowance` Cloud Function 작성 + 배포
- [ ] QuizScene wiring 변경

### 테스트
- [ ] `npm run build:beta` 성공
- [ ] AAB → internal 트랙 업로드 → 본인 폰에서 실행
- [ ] 첫 진입: `ensurePlayerDoc` 성공 로그
- [ ] 미니게임 1회 → 서버 grant 호출 → Firestore 콘솔에서 자원 증가 확인
- [ ] 광고 시청 시도 → 테스트 광고 표시 → 보상 적용
- [ ] (정식) IAP 테스트 결제 → 영수증 검증 → 자원 지급

### 백업
- [ ] visibility change 강제 저장 wiring
- [ ] (선택) saveThrottled 도입

---

## 다음 단계

→ [§9 출시 전 최종 체크](./09-launch-checklist.md)

## 자주 막히는 곳

- **`ensurePlayerDoc`이 권한 거부**: Cloud Function이 배포 안 됐거나 Firebase 프로젝트 ID 미스매치. `firebase deploy --only functions:initPlayer` 재실행
- **`prodGrantFn` 마다 timeout**: Cloud Functions cold start (첫 호출 5~10초). 두 번째부터 빠름. 사용자 체감을 위해 미니게임 진입 시점에 미리 ping (warmup)
- **Crashlytics에 진짜 크래시는 도착하는데 logger.error는 안 옴**: `CrashReporter.start()` 누락. `initProdServices`에서 호출 확인
- **dev 빌드가 prod 행동을 함**: `VITE_ENV` 가 `.env.production` 같은 파일에서 leak. `npm run build:dev` 사용 + `import.meta.env` 한 번만 캐시
