# 7. 법규 / 개인정보 / 약관

> **목표**: Play Console 심사 통과 + 한국 법규 준수에 필요한 문서/페이지/UI 정비.
> **소요**: 1~2일 (변호사 검토 제외, 셀프 작성 기준)
> **사전 조건**: Play Console 가입 (§4), 정적 호스팅 환경

---

## 7-1. 호스팅이 필요한 페이지

다음 3개 URL을 **공개 호스팅**해야 합니다 (Play Console 등록 + 앱 내 노출).

| URL 환경변수 | 용도 |
|---|---|
| `VITE_PRIVACY_POLICY_URL` | 개인정보처리방침 |
| `VITE_TOS_URL` | 이용약관 |
| `VITE_SUPPORT_EMAIL` | 고객 지원 메일 (메일 주소만, URL 아님) |

### 7-1-1. 무료 호스팅 옵션 (난이도 순)
1. **Notion 공개 페이지** — 가장 간단. URL 짧게 만들려면 `notion.so/...` → `oopy.io` 같은 커스텀 도메인 매핑
2. **GitHub Pages** — 정적 HTML, 무료. https://docs.github.com/pages
3. **Firebase Hosting** — Firebase 프로젝트와 함께 관리 가능. 간단:
   ```bash
   firebase init hosting
   # public/ 디렉터리에 privacy.html, tos.html 만들고
   firebase deploy --only hosting
   ```
4. **Vercel / Netlify** — 정적 + 마크다운 자동 변환

> 1인 운영이면 Notion 공개 페이지가 가장 저렴 + 수정도 쉬움.

### 7-1-2. .env 입력
```env
VITE_PRIVACY_POLICY_URL=https://your-domain.com/privacy
VITE_TOS_URL=https://your-domain.com/tos
VITE_SUPPORT_EMAIL=support@your-domain.com
```

### 7-1-3. 앱 내 표시 (현재 상태)
현재는 `ENV.legal` 객체로 노출만 되어 있고 화면에 표시는 안 됩니다. **Settings 화면**(미구현, 향후 추가) 또는 **OfflineScene 하단** 같은 곳에 링크 노출 필요.

빠른 wiring 예시 — `MainScene` 하단에 약관 링크:
```typescript
// MainScene.ts create() 끝부분에
import { ENV } from '@/config/Env';

const privacyText = this.add
  .text(width - 20, height - 20, '개인정보처리방침', {
    fontFamily: DESIGN_TOKENS.font.family,
    fontSize: `${DESIGN_TOKENS.font.sizeSm}px`,
    color: DESIGN_TOKENS.color.textSecondary,
  })
  .setOrigin(1, 1)
  .setInteractive({ useHandCursor: true });
privacyText.on('pointerup', () => {
  if (ENV.legal.privacyPolicyUrl) {
    window.open(ENV.legal.privacyPolicyUrl, '_blank');
  }
});
```

---

## 7-2. 개인정보처리방침 작성

### 7-2-1. 필수 포함 항목 (KISA 개인정보보호법 + Play 정책)
1. **수집 항목**:
   - Firebase Auth uid (자동 생성, 익명 → Google 연동 시 이메일)
   - 게임 플레이 데이터 (닉네임, 레벨, 자원, 캐릭터 보유)
   - 광고 식별자 (AAID — Android Advertising ID)
   - 분석 데이터 (Firebase Analytics)
2. **수집 목적**: 서비스 제공, 게임 진행 저장, 광고 노출, 통계 분석
3. **보관 기간**: 회원 탈퇴 시 즉시 삭제 (`deleteAccount` callable)
4. **제3자 제공**: 없음 (단, 처리 위탁: Firebase / Google AdMob — 미국)
5. **이용자 권리**: 열람, 수정, 삭제 요청 가능 → 지원 이메일
6. **계정 삭제 절차**: 앱 내 설정 → "계정 삭제" 또는 지원 이메일로 요청
7. **연령 제한**: 만 14세 미만 가입 불가 (KISA 규정)
8. **변경 시 통지**: 7일 전 게임 내 공지

### 7-2-2. 템플릿 (마크다운)
샘플은 다음 사이트 참고:
- KISA 개인정보처리방침 작성 가이드: https://privacy.go.kr
- Google Play 가이드: https://support.google.com/googleplay/android-developer/answer/9859455

### 7-2-3. 추천 워크플로
1. KISA 가이드의 표준 양식 다운로드
2. 우리 게임 정보로 채움 (위 7-2-1 체크리스트)
3. **변호사 검토 권장** (1인 사업자라도 출시 전 1회는 안전)
4. Notion에 게시 → URL을 .env에 입력

---

## 7-3. 이용약관 작성

### 7-3-1. 필수 포함 항목
1. **서비스 정의**: 게임명, 플랫폼
2. **이용자 의무**: 제3자 권리 침해 금지, 부정 행위 (해킹, 다중 계정) 금지
3. **운영자 의무**: 24시간 서비스 노력, 점검 통지
4. **결제 / 환불**:
   - IAP는 Google Play 정책에 따름
   - 7일 이내 미사용 환불 가능
5. **확률형 아이템**: 가챠 확률표 게임 내 노출, 본 약관에도 동일하게 명시
6. **계정 정지 조건**: 약관 위반 시
7. **분쟁 해결**: 한국 법원, 한국 법

### 7-3-2. 가챠 확률 공시 (한국 게임산업법 — 2024.03 시행)
2024년 3월부터 한국에서 운영하는 게임은 **확률형 아이템 정보 공시 의무**:
- 게임 내, 광고, 약관 **3곳 모두**에 동일한 확률 공개
- `GachaRatesScene`이 게임 내 노출 담당
- 약관에는 다음 표 포함:

```
[가챠 확률 공시]

| 등급 | 확률 |
|---|---|
| 일반 | 70.00% |
| 희귀 | 25.00% |
| 전설 | 5.00% |

- 1회 비용: 마법돌 1개
- 천장: 20회 연속 일반 시 다음 뽑기 희귀+ 확정
- 중복 시 자동으로 마법돌 조각으로 변환
```

> 위 표는 `Constants.GACHA_CONFIG` + `data/characters.json`을 출처로 작성. 약관과 게임 내 표시가 어긋나지 않도록 `economy-sync.test.ts`로 가드되어 있음.

---

## 7-4. Play Console 정책 항목

### 7-4-1. 콘텐츠 등급 질의서
**정책 → 앱 콘텐츠 → 콘텐츠 등급** → IARC 질의서 작성:
- 폭력성: 없음
- 성적 콘텐츠: 없음
- 도박: 가챠 있음 → **무료 통화로 진행** 답변 (마법돌은 게임 내 무료 획득 가능 → 실제 도박 아님)
- 약물: 없음
- 결과: **전체이용가** 자동 분류

### 7-4-2. 데이터 안전 섹션
**정책 → 앱 콘텐츠 → 데이터 안전**:

| 데이터 카테고리 | 수집? | 공유? | 목적 |
|---|---|---|---|
| 사용자 ID | 예 | 아니오 | 계정 관리 |
| 광고 ID | 예 | 예 (AdMob) | 광고 |
| 앱 활동 — 게임 진행 | 예 | 아니오 | 진행 저장 |
| 앱 정보 및 성능 — 충돌 로그 | 예 | 아니오 | 안정성 |
| 앱 정보 및 성능 — 진단 정보 | 예 | 아니오 | 분석 |

암호화: **전송 중 암호화 (HTTPS)** 체크 ✓
데이터 삭제 요청 가능: **예** + URL 또는 메일 (`deleteAccount` 안내 페이지)

### 7-4-3. 광고
**정책 → 앱 콘텐츠 → 광고**:
- 앱에 광고가 포함되어 있나요? **예**
- 광고 ID 사용? **예**

### 7-4-4. 타겟 사용자층
**정책 → 앱 콘텐츠 → 타겟 사용자층**:
- 만 13세 이상 (소프트 런치 단계는 만 18세 이상으로 시작 권장)
- 정식 출시 시 만 13세 또는 만 14세 (KISA 규정)
- 어린이 대상 앱 정책: **아니오**

### 7-4-5. 정부 앱
- 아니오

### 7-4-6. 뉴스 앱
- 아니오

### 7-4-7. 코로나19 추적
- 아니오

---

## 7-5. 계정 삭제 페이지

Play Console은 **앱 외부에서도 접근 가능한 계정 삭제 안내 페이지** URL을 요구합니다.

### 7-5-1. 페이지 작성 (호스팅 페이지에 포함)
```markdown
# 계정 삭제 안내

주인님의 사생활 게임의 계정을 삭제하려면 다음 중 하나를 선택하세요.

## 방법 1: 앱 내 삭제
1. 게임 실행
2. 설정 → "계정 삭제"
3. 확인

## 방법 2: 이메일 요청
다음 정보와 함께 [support@your-domain.com](mailto:support@your-domain.com) 으로 메일을 보내주세요.
- Google 계정 이메일
- 사용 중인 닉네임 (있다면)

## 삭제 범위
- 모든 게임 진행 데이터
- 닉네임, 캐릭터, 자원
- 결제 영수증 (회계 보관 의무에 따라 5년간 보관 후 삭제)

## 삭제 시점
- 즉시 삭제 (요청 후 24시간 이내)
- 백업 시스템에서 30일 후 완전 삭제
```

### 7-5-2. Play Console 등록
**정책 → 앱 콘텐츠 → 데이터 안전** 섹션의 "데이터 삭제 옵션" → URL 입력.

### 7-5-3. 앱 내 wiring (코드 작성 필요)
현재는 Cloud Function `deleteAccount`만 준비됨. 호출하는 UI 작성 필요:
```typescript
// 예: SettingsScene.ts (미구현, 향후 작성)
import { httpsCallable } from 'firebase/functions';

async function onDeleteAccount(): Promise<void> {
  // 1) 확인 모달
  // 2) httpsCallable(functions, 'deleteAccount')()
  // 3) 성공 시 signOut + 메인으로
}
```

---

## 7-6. 14세 미만 차단

KISA 규정상 만 14세 미만은 가입 시 부모 동의 절차가 필요. 단순화 방법은 **만 14세 미만 가입 차단**.

### 7-6-1. 가입 흐름에 추가 (UI 작성 필요)
- 첫 진입 시 생년월일 입력 또는 "만 14세 이상입니까?" 체크박스
- "예"가 아니면 가입 거부

ROADMAP §보안·법규 체크리스트의 "14세 미만 접근 정책" 항목.

### 7-6-2. 데이터 안전과 일치
Play Console "타겟 사용자층"에서 만 13세 미만 포함하지 않도록 답변.

---

## 7-7. 광고 ID 정책 (Android 12+)

`AD_ID` 권한이 매니페스트에 있으면 Play Console 심사 시 추가 질문이 떠요.
- "광고 ID를 사용하나요?" → **예**
- 사용 목적: **광고**, **분석**, **개인 맞춤 광고** 중 해당 모두

---

## 7-8. 체크리스트

### 호스팅 / 환경변수
- [ ] 개인정보처리방침 페이지 호스팅 + URL 확보
- [ ] 이용약관 페이지 호스팅 + URL 확보
- [ ] 지원 이메일 셋업 (자동 응답 권장)
- [ ] `.env`에 3개 입력
- [ ] 앱 내 약관 링크 wiring (간단 텍스트 버튼)

### 문서 작성
- [ ] 개인정보처리방침 KISA 가이드 기반 작성
- [ ] 이용약관 작성 (가챠 확률표 포함)
- [ ] 계정 삭제 안내 페이지 작성
- [ ] (권장) 변호사 검토 1회

### Play Console
- [ ] 콘텐츠 등급 질의서 (전체이용가 결과)
- [ ] 데이터 안전 섹션 채움
- [ ] 광고 사용 답변
- [ ] 타겟 사용자층 답변 (만 14세 이상)
- [ ] 데이터 삭제 옵션 URL 입력

### 코드
- [ ] 가입 흐름에 14세 미만 차단 (UI 작성)
- [ ] Settings 화면에 계정 삭제 버튼 + `deleteAccount` 호출 (UI 작성)
- [ ] AndroidManifest `AD_ID` 권한 (§3-3-1에서 추가)

---

## 다음 단계

→ [§8 프로덕션 부트스트랩 wiring](./08-prod-bootstrap.md)

## 자주 막히는 곳

- **Play Console 심사 시 "데이터 안전 섹션 불일치"**: 매니페스트의 권한과 답변 내용이 불일치. AD_ID 권한 있는데 광고 답변 누락이 가장 흔함
- **가챠 확률 공시 미공개로 한국 검토 거부**: 약관 + 게임 내 GachaRatesScene + 스토어 자세한 설명 **3곳 모두**에 같은 표 포함 필수
- **개인정보처리방침 URL 접속 불가**: Notion 공개 페이지가 비공개로 설정되어 있을 수 있음. 시크릿 브라우저로 확인
