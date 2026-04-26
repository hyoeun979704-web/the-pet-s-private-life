# 3. AdMob 광고

> **목표**: AdMob 앱 등록 → 광고 단위 ID 생성 → Capacitor 플러그인 연동 → `MockAdAdapter`를 실제 어댑터로 교체.
> **소요**: 30~45분
> **사전 조건**: §1, §2 완료

---

## 3-1. 앱 ID + 광고 단위 ID

1. https://apps.admob.com 접속, Google 계정 로그인
2. 처음이면 AdMob 가입 절차 (국가/시간대/통화)
3. 좌측 **앱** → **앱 추가** → "지원되는 플랫폼에 게시했나요?" → **아니요** (아직 미출시)
4. 플랫폼: **Android**
5. 앱 이름: `주인님의 사생활`
6. 사용자 측정항목 사용 설정: **예** (Firebase Analytics 연결)
7. **앱 추가** 클릭

### 3-1-1. App ID 복사
앱이 만들어지면 **앱 ID** 표시:
```
ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
```
이 값을 `.env`에 입력:
```env
VITE_ADMOB_APP_ID_ANDROID=ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
```

### 3-1-2. 광고 단위 생성
1. 좌측 **광고 단위** → **시작하기**
2. 광고 형식: **보상형**
3. 광고 단위 이름: `tpp_rewarded_main`
4. **광고 단위 만들기** → ID 복사:
   ```
   ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ
   ```
5. `.env`에 입력:
   ```env
   VITE_ADMOB_AD_UNIT_REWARDED=ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ
   ```

> MVP는 단일 광고 단위로 5개 placement 모두 사용. 향후 슬롯별 단위가 필요하면 `data/adPlacements.json`에 `adUnitId` 필드 추가하고 어댑터에서 분기.

---

## 3-2. 광고 카테고리 차단 (ROADMAP §광고 시스템)

ROADMAP은 다음 5개 카테고리 차단을 요구합니다:
- `alcohol` (주류)
- `dating` (데이팅)
- `gambling` (도박)
- `sexual` (성인)
- `politics` (정치/사회 이슈)

### 3-2-1. AdMob 콘솔 차단
1. AdMob 콘솔 → 좌측 **차단 컨트롤** → **모든 앱**
2. **광고 콘텐츠** 탭
3. **민감한 카테고리** 섹션 확인:
   - **알코올** → 차단
   - **데이팅** → 차단
   - **도박/베팅** → 차단
   - **성적인 콘텐츠** → 차단
   - **정치 / 사회적 이슈** → 차단
4. **저장**

### 3-2-2. 콘텐츠 등급
같은 메뉴 → **광고 콘텐츠 등급** → **G (전체이용가)** 선택 → 저장

---

## 3-3. Capacitor AdMob 플러그인 설치

```bash
npm i @capacitor-community/admob
npx cap sync android
```

### 3-3-1. AndroidManifest 권한 추가
`android/app/src/main/AndroidManifest.xml`:
```xml
<manifest ...>
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
  <!-- 새로 추가 -->
  <uses-permission android:name="com.google.android.gms.permission.AD_ID" />

  <application ...>
    <!-- 새로 추가 (AdMob App ID) -->
    <meta-data
      android:name="com.google.android.gms.ads.APPLICATION_ID"
      android:value="ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"/>
    <!-- ... -->
  </application>
</manifest>
```
⚠️ `meta-data` 의 value는 §3-1-1의 App ID를 **하드코딩**해야 함 (Capacitor가 빌드 타임에 .env를 못 봄). 환경별로 두 manifest를 운영하거나, `gradle`에서 BuildConfig로 주입.

가장 간단한 방법: 디버그/릴리즈 한 ID를 모두 manifest에 직접.

### 3-3-2. Capacitor 어댑터 작성
`src/adapters/AdMobAdapter.ts` 새로 만들기:

```typescript
import { AdMob, RewardAdPluginEvents, type RewardAdOptions } from '@capacitor-community/admob';
import { ENV } from '@/config/Env';
import type { AdAdapter, AdPlacementId } from '@/systems/AdSystem';
import { logger } from '@/utils/Logger';

const TEST_REWARDED = 'ca-app-pub-3940256099942544/5224354917';

let initialized = false;

export class CapacitorAdMobAdapter implements AdAdapter {
  async showRewarded(_placementId: AdPlacementId): Promise<boolean> {
    if (!initialized) {
      await AdMob.initialize({
        testingDevices: [],
        initializeForTesting: ENV.isDev,
      });
      initialized = true;
    }
    const adId = ENV.isDev ? TEST_REWARDED : ENV.admob.adUnitRewarded;
    if (!adId) return false;

    const options: RewardAdOptions = { adId };
    try {
      await AdMob.prepareRewardVideoAd(options);
    } catch (err) {
      logger.error('admob.prepare.failed', err);
      return false;
    }

    return new Promise<boolean>((resolve) => {
      let rewarded = false;
      const sub1 = AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
        rewarded = true;
      });
      const sub2 = AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        sub1.remove();
        sub2.remove();
        sub3.remove();
        resolve(rewarded);
      });
      const sub3 = AdMob.addListener(RewardAdPluginEvents.FailedToLoad, () => {
        sub1.remove();
        sub2.remove();
        sub3.remove();
        resolve(false);
      });
      AdMob.showRewardVideoAd().catch(() => {
        sub1.remove();
        sub2.remove();
        sub3.remove();
        resolve(false);
      });
    });
  }
}
```

### 3-3-3. 프로덕션 부트스트랩에서 어댑터 교체
`§8 Prod bootstrap` 에서 다룹니다. 미리 보면:
```typescript
const ads = new AdSystem({
  adapter: new CapacitorAdMobAdapter(),  // MockAdAdapter 대신
  gameState,
  analytics,
});
```

---

## 3-4. 테스트 광고 ID

### 3-4-1. 개발 빌드는 항상 테스트 광고
위 `CapacitorAdMobAdapter`의 `ENV.isDev ? TEST_REWARDED : ...` 로직이 처리.

Google이 제공하는 테스트 ID:
- 보상형: `ca-app-pub-3940256099942544/5224354917`
- (다른 광고 형식이 필요하면 https://developers.google.com/admob/android/test-ads 참조)

### 3-4-2. 테스트 기기 등록 (출시 빌드에서도 본인은 테스트 광고)
실제 광고 ID로 빌드한 후 본인 폰에서는 항상 테스트 광고가 뜨게 하려면:
1. 본인 폰에서 빌드 실행 → `adb logcat | grep "Use RequestConfiguration"` 으로 테스트 기기 ID 추출
2. AdMob 콘솔 → **설정** → **테스트 기기** → ID 추가

이렇게 해야 본인이 테스트할 때 광고 정책 위반(자기 광고 클릭)을 피함.

---

## 3-5. ads.txt (선택, 권장)

웹 사이트가 있으면 (예: 개인정보처리방침 호스팅 도메인) `/ads.txt` 파일을 루트에 두세요:
```
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```
AdMob 콘솔의 **앱** → **앱 설정** → 영문/숫자 publisher ID로 작성.
모바일 앱은 `app-ads.txt` 가 별도지만 MVP에서는 우선순위 낮음 (출시 후 권장).

---

## 3-6. 광고 정책 위반 방지

ROADMAP §광고 + AdMob 정책의 핵심:
- **클릭 유도 금지**: "광고 보면 보상!" 텍스트는 OK, "광고 클릭하면 보상!"은 위반
- **광고 강제 금지**: 보상형은 항상 사용자 선택
- **자기 클릭 금지**: 본인 폰에서 실 광고 클릭 → 계정 정지 위험 (§3-4-2 테스트 기기 등록 필수)
- **시청 완료 후만 보상**: `Rewarded` 이벤트 받기 전엔 보상 적용 금지 — `CapacitorAdMobAdapter`가 보장

---

## 3-7. 체크리스트

- [ ] AdMob 앱 등록 + App ID `.env` 입력
- [ ] 보상형 광고 단위 1개 생성 + ID `.env` 입력
- [ ] 카테고리 5종 차단 + 콘텐츠 등급 G
- [ ] `npm i @capacitor-community/admob`
- [ ] AndroidManifest에 `AD_ID` 권한 + `meta-data` App ID 추가
- [ ] `src/adapters/AdMobAdapter.ts` 작성
- [ ] 본인 폰 ID를 AdMob 테스트 기기로 등록
- [ ] §8 prod-bootstrap에서 어댑터 swap (이 시점에서는 코드만 준비)

---

## 다음 단계

→ [§4 IAP (Google Play Billing)](./04-iap.md)

## 자주 막히는 곳

- **광고가 한 번도 뜨지 않음**: 신규 앱은 AdMob 활성화에 24~48시간 걸림. 그 사이엔 테스트 광고만 동작
- **`AdMob.initialize`가 즉시 throw**: AndroidManifest에 `meta-data` App ID 누락. 빌드 시 manifest merger 로그 확인
- **테스트 광고는 잘 뜨는데 실 광고는 안 뜸**: AdMob 정책 검토 미통과. 콘솔 → **정책** 탭 확인
