# 4. IAP (Google Play Billing)

> **목표**: Play Console에 4개 SKU 등록 → 영수증 검증 Cloud Function 완성 → Capacitor 결제 플러그인 어댑터 작성.
> **소요**: 60~90분 (Play Console 개발자 가입 미포함)
> **사전 조건**: §1, §2 완료 + Play Console 개발자 계정 ($25 일회성)

> ⚠️ ROADMAP에 따라 **β 단계에서는 IAP 비활성** (`IAPSystem({ enabled: false })`). 이 문서의 작업은 **정식 출시 직전**에 완성하면 됩니다. 다만 SKU 등록은 Play Console 검토에 시간이 걸려서 미리 해두는 게 좋아요.

---

## 4-1. Play Console 가입 + 앱 등록

### 4-1-1. 개발자 계정
1. https://play.google.com/console 접속
2. Google 계정으로 가입 ($25 일회성 결제)
3. 신원 확인 (며칠 걸릴 수 있음)
4. 가입 완료 후 좌측 **모든 앱** → **앱 만들기**

### 4-1-2. 앱 만들기
1. 앱 이름: `주인님의 사생활`
2. 기본 언어: `한국어 - ko-KR`
3. 앱/게임: **게임**
4. 무료/유료: **무료**
5. 약관 동의 체크 → **앱 만들기**

### 4-1-3. 앱 콘텐츠 사전 작성 (필수 항목들)
좌측 **정책 → 앱 콘텐츠** 메뉴에서 다음 항목 채우기:
- 개인정보처리방침 URL ([§7 참고](./07-legal.md))
- 광고 사용 여부: **예 / 광고 포함**
- 앱 액세스: **모든 기능을 무료로 사용 가능**
- 콘텐츠 등급 설문: 전체이용가 답변
- 타겟층: 만 13세 이상
- 데이터 안전 섹션 ([§7 참고](./07-legal.md))

> 위 항목들이 모두 끝나야 출시 트랙(internal/closed/open/production) 사용 가능.

---

## 4-2. SKU 등록

좌측 **수익 창출 → 인앱 상품** → **인앱 상품**.

### 4-2-1. 비공개 키 다운로드 사전 작업
앱이 처음 등록되면 **App Bundle 1개 이상 업로드** 후에 SKU를 만들 수 있습니다.
1. §2-5에서 만든 `app-release.aab` 를 **테스트 → 내부 테스트** 트랙에 업로드
2. 테스터 추가 (본인 이메일)
3. 검토 통과 후 (수십 분~몇 시간) SKU 메뉴 활성화

### 4-2-2. 4개 SKU 만들기
**인앱 상품 만들기** 클릭 → 다음을 각각 등록:

#### SKU 1 — 스타터 팩
| 필드 | 값 |
|---|---|
| 제품 ID | `com.hyoeun979704.tpp.starter_pack` |
| 이름 | `스타터 팩` |
| 설명 | `간식 500 + 별먼지 100 + 마법돌 5 + 가챠권 3` |
| 상태 | 활성 |
| 가격 | ₩4,900 (다른 국가는 자동 환산) |
| 라이프사이클 | **사용 후 소멸 (consumable)** ❌ → **소멸되지 않음 (non_consumable)** ⭕ |

> ⚠️ **중요**: starter_pack은 1회만 구매 가능하므로 비소모성. 코드의 `iapSkus.json`과 일치 확인.

#### SKU 2 — 광고 제거
| 필드 | 값 |
|---|---|
| 제품 ID | `com.hyoeun979704.tpp.remove_ads` |
| 이름 | `광고 제거 패키지` |
| 설명 | `보상형 광고 외 모든 광고를 제거합니다.` |
| 가격 | ₩9,900 |
| 라이프사이클 | **소멸되지 않음 (non_consumable)** |

#### SKU 3 — 마법돌 소형
| 필드 | 값 |
|---|---|
| 제품 ID | `com.hyoeun979704.tpp.magic_stone_small` |
| 이름 | `마법돌 6개` |
| 설명 | `마법돌 6개를 즉시 받습니다.` |
| 가격 | ₩1,900 |
| 라이프사이클 | **사용 후 소멸 (consumable)** |

#### SKU 4 — 마법돌 중형
| 필드 | 값 |
|---|---|
| 제품 ID | `com.hyoeun979704.tpp.magic_stone_medium` |
| 이름 | `마법돌 18개` |
| 설명 | `마법돌 18개를 즉시 받습니다.` |
| 가격 | ₩4,900 |
| 라이프사이클 | **사용 후 소멸 (consumable)** |

### 4-2-3. 검증
프로젝트 루트에서:
```bash
npm run test -- iap-sku-sync
```
3 tests pass면 클라/서버 productId 일치 확인 완료.

---

## 4-3. Google Play Developer API + 서비스 계정

영수증 검증을 위한 사전 작업.

### 4-3-1. Google Cloud Console에서 API 활성화
1. https://console.cloud.google.com 접속
2. Firebase 프로젝트와 **같은 프로젝트** 선택
3. **API 및 서비스 → 라이브러리** → "Google Play Android Developer API" 검색 → **사용**

### 4-3-2. 서비스 계정 생성
1. **API 및 서비스 → 사용자 인증 정보** → **사용자 인증 정보 만들기 → 서비스 계정**
2. 이름: `play-iap-verifier`, ID 자동 생성
3. 역할: 비워둠 (Play Console에서 별도 부여)
4. **완료**

### 4-3-3. 서비스 계정 키 다운로드
1. 만든 서비스 계정 클릭 → **키** 탭
2. **키 추가 → 새 키 만들기 → JSON**
3. JSON 파일 다운로드 → **절대 git commit 금지**

### 4-3-4. Play Console 권한 부여
1. Play Console → **사용자 및 권한** → **새 사용자 초대**
2. 이메일: 위 서비스 계정 이메일 (`...@your-project.iam.gserviceaccount.com`)
3. 권한: **재무 데이터 보기** + **앱 정보 보기**
4. **초대 보내기**

### 4-3-5. Cloud Functions에 키 등록
```bash
firebase functions:secrets:set PLAY_SERVICE_ACCOUNT_KEY
# 프롬프트에 JSON 파일 전체 내용 붙여넣기
```

---

## 4-4. validatePurchase Cloud Function 완성

`functions/src/validatePurchase.ts`를 다음으로 교체:

```typescript
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { google } from 'googleapis';
import { requireAuthUid } from './util';

const PLAY_SERVICE_ACCOUNT_KEY = defineSecret('PLAY_SERVICE_ACCOUNT_KEY');
const PACKAGE_NAME = 'com.hyoeun979704.thepetsprivatelife';
const ALLOWED_PRODUCT_PREFIX = 'com.hyoeun979704.tpp.';

interface Payload {
  productId: string;
  purchaseToken: string;
}

export const validatePurchase = onCall<Payload>(
  { secrets: [PLAY_SERVICE_ACCOUNT_KEY] },
  async (req) => {
    requireAuthUid(req);
    const { productId, purchaseToken } = req.data ?? ({} as Payload);
    if (typeof productId !== 'string' || !productId.startsWith(ALLOWED_PRODUCT_PREFIX)) {
      throw new HttpsError('invalid-argument', 'unknown productId');
    }
    if (typeof purchaseToken !== 'string' || purchaseToken.length < 8) {
      throw new HttpsError('invalid-argument', 'invalid purchase token');
    }

    const credentials = JSON.parse(PLAY_SERVICE_ACCOUNT_KEY.value());
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });
    const androidpublisher = google.androidpublisher({ version: 'v3', auth });

    try {
      const res = await androidpublisher.purchases.products.get({
        packageName: PACKAGE_NAME,
        productId,
        token: purchaseToken,
      });
      // purchaseState: 0=구매됨, 1=취소됨, 2=대기 중
      if (res.data.purchaseState !== 0) {
        throw new HttpsError('failed-precondition', 'purchase not completed');
      }
      // acknowledgement: 1=ack됨, 0=ack 필요
      // ack는 클라이언트가 acknowledgePurchase로 처리. 여기서는 검증만.
      return { ok: true, productId, orderId: res.data.orderId };
    } catch (err) {
      throw new HttpsError('internal', 'verification failed', err);
    }
  },
);
```

`functions/package.json`에 의존성 추가:
```bash
cd functions
npm i googleapis
cd ..
```

배포:
```bash
firebase deploy --only functions:validatePurchase
```

---

## 4-5. Capacitor 결제 플러그인

```bash
npm i @capacitor-community/in-app-purchases
npx cap sync android
```

> ⚠️ Capacitor 결제 플러그인 생태계가 자주 바뀝니다. 위 패키지가 없으면 `cordova-plugin-purchase` 같은 대체재 검토. 인터페이스만 맞으면 어댑터로 흡수 가능.

### 4-5-1. CapacitorIapAdapter 작성
`src/adapters/CapacitorIapAdapter.ts`:
```typescript
import { InAppPurchases } from '@capacitor-community/in-app-purchases';
import iapData from '@/data/iapSkus.json';
import type { IapAdapter, PurchasedReceipt } from '@/systems/IAPSystem';
import type { IapSku, IapSkuId } from '@/entities/IapSku';
import { logger } from '@/utils/Logger';

const SKUS = iapData.skus as unknown as IapSku[];
const PRODUCT_ID_TO_SKU = new Map(SKUS.map((s) => [s.productId, s.id as IapSkuId]));

export class CapacitorIapAdapter implements IapAdapter {
  async purchase(productId: string): Promise<PurchasedReceipt | null> {
    try {
      const result = await InAppPurchases.purchaseProduct({ productIdentifier: productId });
      // result.transaction → purchase token / order id
      const skuId = PRODUCT_ID_TO_SKU.get(productId);
      if (!skuId) return null;
      return {
        productId,
        purchaseToken: result.transaction?.transactionId ?? '',
        skuId,
      };
    } catch (err) {
      logger.error('iap.purchase.cap.failed', err);
      return null;
    }
  }

  async queryEntitlements(): Promise<PurchasedReceipt[]> {
    try {
      const restored = await InAppPurchases.restorePurchases();
      return (restored.transactions ?? []).flatMap((t) => {
        const skuId = PRODUCT_ID_TO_SKU.get(t.productIdentifier);
        if (!skuId) return [];
        return [{
          productId: t.productIdentifier,
          purchaseToken: t.transactionId,
          skuId,
        }];
      });
    } catch (err) {
      logger.error('iap.restore.failed', err);
      return [];
    }
  }
}
```

### 4-5-2. validateFn 작성
`src/adapters/validateFn.ts`:
```typescript
import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '@/config/FirebaseConfig'; // 추가 필요
import type { ValidateFn } from '@/systems/IAPSystem';

export const validateFnProd: ValidateFn = async (receipt) => {
  const functions = getFirebaseFunctions();
  if (!functions) return { ok: false };
  try {
    const fn = httpsCallable(functions, 'validatePurchase');
    const res = await fn({
      productId: receipt.productId,
      purchaseToken: receipt.purchaseToken,
    });
    return { ok: (res.data as { ok: boolean }).ok === true };
  } catch (err) {
    return { ok: false, error: err };
  }
};
```

`FirebaseConfig.ts`에 이미 `getFirebaseFunctions` 가 export 되어 있음 — 그걸 import.

---

## 4-6. β/정식 토글

`src/systems/GameServices.ts` 의 `initProdServices`에서:

```typescript
import { CapacitorIapAdapter } from '@/adapters/CapacitorIapAdapter';
import { validateFnProd } from '@/adapters/validateFn';

const RELEASE_STAGE = 'beta'; // 'beta' | 'production'

const iap = new IAPSystem({
  adapter: new CapacitorIapAdapter(),
  gameState,
  validateFn: validateFnProd,
  enabled: RELEASE_STAGE === 'production', // β에서 false
});
```

ROADMAP의 단계 전환 시점:
- β: `enabled: false` → IAP UI 숨김
- 정식: `enabled: true` → 결제 플로우 활성화

---

## 4-7. 체크리스트

- [ ] Play Console 개발자 계정 가입
- [ ] 앱 등록 + 콘텐츠 사전 작성 완료
- [ ] 첫 AAB 내부 테스트 트랙 업로드
- [ ] 4개 SKU 등록 (productId 일치 확인 + `iap-sku-sync` 통과)
- [ ] Google Play Developer API 활성화
- [ ] 서비스 계정 + JSON 키 + Cloud Functions secret 등록
- [ ] Play Console에서 서비스 계정에 권한 부여
- [ ] `validatePurchase` Cloud Function 실 검증 코드로 교체
- [ ] `firebase deploy --only functions:validatePurchase`
- [ ] `npm i @capacitor-community/in-app-purchases`
- [ ] `CapacitorIapAdapter` + `validateFnProd` 작성
- [ ] §8 prod-bootstrap 에서 IAPSystem 인스턴스 생성

---

## 다음 단계

→ [§5 Crashlytics + Analytics](./05-analytics-crashlytics.md)

## 자주 막히는 곳

- **"This product is not available"**: 인앱 상품을 활성화하지 않았거나, AAB가 같은 트랙에 올라가지 않은 상태. internal 트랙도 SKU 활성에 필요.
- **`androidpublisher.purchases.products.get` 401**: 서비스 계정 권한 미부여. Play Console **사용자 및 권한**에서 부여 후 30분 정도 propagation 대기
- **결제는 됐는데 앱이 못 받음**: `acknowledgePurchase` 누락. 비소모성/구독은 3일 안에 ack 필요. 플러그인의 `finishTransaction` 또는 `acknowledge` 메서드 호출.
