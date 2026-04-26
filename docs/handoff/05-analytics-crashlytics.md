# 5. Crashlytics + Analytics

> **목표**: Firebase Analytics + Crashlytics를 실제 transport에 연결.
> **소요**: 30~60분
> **사전 조건**: §1 완료

---

## 5-1. Crashlytics

### 5-1-1. Capacitor 플러그인 설치
```bash
npm i @capacitor-firebase/crashlytics
npx cap sync android
```

### 5-1-2. 어댑터 작성
`src/adapters/CapacitorCrashlyticsAdapter.ts`:
```typescript
import { FirebaseCrashlytics } from '@capacitor-firebase/crashlytics';
import type { CrashlyticsAdapter } from '@/systems/CrashReporter';

export class CapacitorCrashlyticsAdapter implements CrashlyticsAdapter {
  // eslint-disable-next-line class-methods-use-this
  recordException(message: string, data: Record<string, unknown> = {}): void {
    FirebaseCrashlytics.recordException({
      message: `${message} ${JSON.stringify(data)}`,
    }).catch(() => undefined);
  }

  // eslint-disable-next-line class-methods-use-this
  setCustomKey(key: string, value: string | number | boolean): void {
    FirebaseCrashlytics.setCustomKey({ key, value: String(value), type: 'string' })
      .catch(() => undefined);
  }
}
```

### 5-1-3. ProGuard 매핑 업로드 (자동 권장)
`android/app/build.gradle`에 자동 업로드 활성화:
```gradle
apply plugin: 'com.google.firebase.crashlytics'

android {
  buildTypes {
    release {
      // 위에서 이미 추가한 minify/shrink + ...
      firebaseCrashlytics {
        nativeSymbolUploadEnabled false
        mappingFileUploadEnabled true
      }
    }
  }
}
```
프로젝트 레벨 `android/build.gradle`:
```gradle
buildscript {
  dependencies {
    classpath 'com.google.firebase:firebase-crashlytics-gradle:2.9.9'
  }
}
```

### 5-1-4. 테스트
```typescript
// 디버그 빌드에서 강제 크래시
FirebaseCrashlytics.crash({ message: 'test crash' });
```
30분~24시간 안에 Firebase 콘솔 → Crashlytics에 표시되어야 함.

---

## 5-2. Firebase Analytics transport

이미 `firebase` SDK가 설치되어 있으므로 추가 패키지 불필요.

### 5-2-1. transport 작성
`src/adapters/FirebaseAnalyticsTransport.ts`:
```typescript
import { logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { getFirebaseAnalytics } from '@/config/FirebaseConfig';
import type { AnalyticsEvent, AnalyticsTransport } from '@/systems/AnalyticsSystem';

export class FirebaseAnalyticsTransport implements AnalyticsTransport {
  // eslint-disable-next-line class-methods-use-this
  send(event: AnalyticsEvent): void {
    const analytics = getFirebaseAnalytics();
    if (!analytics) return;
    // Firebase Analytics expects param values to be string/number/boolean.
    const cleaned: Record<string, string | number | boolean> = {};
    Object.entries(event.params).forEach(([k, v]) => {
      if (v === null || v === undefined) return;
      cleaned[k] = v;
    });
    logEvent(analytics, event.name, cleaned);
  }
}

export function bindAnalyticsUser(uid: string): void {
  const analytics = getFirebaseAnalytics();
  if (!analytics) return;
  setUserId(analytics, uid);
}

export function bindAnalyticsProperty(name: string, value: string): void {
  const analytics = getFirebaseAnalytics();
  if (!analytics) return;
  setUserProperties(analytics, { [name]: value });
}
```

### 5-2-2. prod 부트스트랩에 wiring (§8에서 자세히)
```typescript
const analytics = new AnalyticsSystem({
  transport: new FirebaseAnalyticsTransport(),
  crashFromLogger: true,
});
```

---

## 5-3. Firebase 콘솔에서 후속 설정

### 5-3-1. 이벤트 등록 확인
출시 후 첫 24시간 안에 Firebase 콘솔 → **Analytics → 이벤트** 에 다음 이벤트가 자동 등록됨:
- `tutorial_step`, `tutorial_complete`
- `session_start`, `session_end`
- `minigame_start`, `minigame_end`
- `resource_gain`, `resource_spend`
- `gacha_roll`
- `level_up`
- `ad_request`, `ad_impression`, `ad_reward`
- `iap_purchase`
- `room_expand`
- `crash`

자동 등록되는 항목 외에 **변환 이벤트 표시**:
- `tutorial_complete` → 변환으로 표시
- `iap_purchase` → 자동 변환

### 5-3-2. 잠재고객(Audience) 만들기
권장 잠재고객:
1. **튜토리얼 완료자**: `tutorial_complete` 발생
2. **D1 활성**: `session_start` 1회 + 가입일 1일 후 `session_start` 다시
3. **돌아오지 않은 유저**: `tutorial_complete` 후 7일 미접속

콘솔 → **잠재고객** → **잠재고객 만들기**에서 위 조건들 정의.

### 5-3-3. 퍼널 등록
**탐색 → 퍼널 탐색**:
- `tutorial_step` (S1) → `tutorial_step` (S2) → ... → `tutorial_complete`
- 이탈 단계 추적용

### 5-3-4. BigQuery 연결 (선택, 광고 ROI 분석용)
**프로젝트 설정 → 통합 → BigQuery → 연결**.
- 무료 티어: 월 1TB 쿼리. 작은 게임은 충분.
- 광고 단가가 정확해지면 ARPU/ROAS 계산이 매우 쉬워짐.

---

## 5-4. 디버그 모드 활성화 (개발 중 이벤트 즉시 확인)

### 5-4-1. Firebase 콘솔 디버그 뷰
`adb shell setprop debug.firebase.analytics.app com.hyoeun979704.thepetsprivatelife`
- 이렇게 하면 이벤트가 1분 안에 콘솔 **DebugView**에 표시
- 정상 모드에서는 24시간 지연

### 5-4-2. 테스트 흐름
1. 위 명령으로 디버그 모드 활성
2. 앱 실행 → 튜토리얼 한 단계 진행
3. Firebase 콘솔 → **Analytics → DebugView** → `tutorial_step` 이벤트 확인

---

## 5-5. 체크리스트

- [ ] `npm i @capacitor-firebase/crashlytics`
- [ ] `CapacitorCrashlyticsAdapter` 작성
- [ ] `android/build.gradle`에 Crashlytics gradle plugin 추가
- [ ] `FirebaseAnalyticsTransport` 작성
- [ ] `bindAnalyticsUser` 사용처 정해두기 (auth state change 시)
- [ ] §8 prod-bootstrap에서 transport / crash adapter swap
- [ ] 디버그 빌드에서 강제 크래시 → 콘솔 확인
- [ ] DebugView로 이벤트 즉시 확인
- [ ] 잠재고객 3종 + 퍼널 1개 등록

---

## 다음 단계

→ [§6 에셋 (그래픽 + 사운드)](./06-assets.md)

## 자주 막히는 곳

- **이벤트가 24시간 동안 안 보임**: §5-4 디버그 모드 활성화. 보통은 정상 (실시간 보고는 콘솔이 의도적으로 지연)
- **이벤트 이름 길이 오류**: Firebase Analytics 이벤트 이름 ≤ 40자, 파라미터 ≤ 100자. 우리 이벤트는 모두 안전 범위.
- **Crashlytics에 매핑 안 풀림 (난독화된 스택)**: `firebaseCrashlytics { mappingFileUploadEnabled true }` 누락 또는 Gradle 플러그인 미적용
