# 1. Firebase 프로젝트 세팅

> **목표**: Cloud Functions가 배포 가능한 Firebase 프로젝트 + Web/Android 앱 등록 + Auth/Firestore/Functions/Analytics/Crashlytics 활성화 + 보안 규칙 배포까지.
> **소요**: 60~90분 (결제 카드 등록 단계 제외)
> **결과물**: `.env` 의 `VITE_FIREBASE_*` 7개 값 + `firestore.rules`/`functions` 배포 완료

---

## 1-1. 프로젝트 생성

1. https://console.firebase.google.com 접속, Google 계정 로그인
2. **"프로젝트 추가"** 클릭
3. 프로젝트 이름: `the-pets-private-life` (또는 자유롭게)
   - 프로젝트 ID는 자동 생성됨. 마음에 안 들면 옆 연필 아이콘으로 수정 (소문자/숫자/하이픈만)
4. **Google Analytics**: "사용 설정" 권장 (나중에 추가하기보다 처음부터)
5. Analytics 계정 선택: 새로 만들기 → 위치 `대한민국`
6. **"프로젝트 만들기"** → 30~60초 대기

### 1-1-1. 위치(리전) 변경 — 중요
프로젝트가 만들어지면 좌측 톱니바퀴(설정) → **프로젝트 설정** → **일반** 탭 하단 → **기본 GCP 리소스 위치** 가 비어 있습니다.
- 클릭 → `asia-northeast3` (서울) 선택 → **완료**
- ⚠️ 이 설정은 **한 번 정하면 변경 불가**. 한국 유저면 서울이 latency 최소.

---

## 1-2. 앱 등록 (7개 키 수집)

### Web 앱 등록
1. 콘솔 좌측 사이드바 → **프로젝트 개요** 옆 톱니바퀴 → **프로젝트 설정**
2. 하단 **내 앱** 섹션 → **`</>`** (웹 아이콘) 클릭
3. 앱 닉네임: `tpp-web` (자유)
4. **"이 앱의 Firebase 호스팅도 설정"**: 체크 안 함 (게임은 Capacitor로 모바일만 배포)
5. **앱 등록** 클릭
6. 표시되는 `firebaseConfig` 객체에서 다음 7개 값을 `.env` 파일에 복사:

```env
# 프로젝트 루트의 .env 파일 (없으면 .env.example 복사해서 생성)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123:web:abc123
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

7. **"콘솔로 이동"** 클릭

### Android 앱 등록
1. 같은 **프로젝트 설정** → **내 앱** → **앱 추가** → **Android** 아이콘
2. **Android 패키지 이름**: `com.hyoeun979704.thepetsprivatelife`
   - ⚠️ `capacitor.config.ts`의 `appId` 와 정확히 일치해야 함
3. 앱 닉네임: `tpp-android`
4. SHA-1: 일단 비워둠 (Google 로그인 활성화 시 다시 등록 §1-3-2)
5. **앱 등록** 클릭
6. **`google-services.json`** 다운로드 → 일단 안전한 곳에 보관 (`§2 Capacitor`에서 `android/app/`에 배치)

---

## 1-3. 서비스 활성화

콘솔 좌측 사이드바에서 활성화:

### 1-3-1. Authentication
1. **빌드** → **Authentication** → **시작하기**
2. **로그인 방법** 탭
3. 다음 2개 사용 설정:
   - **익명** → 사용 설정 → 저장
   - **Google** → 사용 설정 → 프로젝트 지원 이메일 선택 → 저장

### 1-3-2. Google 로그인용 SHA-1 등록 (모바일 빌드 후로 미뤄도 OK)
나중에 `§2`에서 keystore 만든 후:
```bash
keytool -list -v -keystore release.keystore -alias tpp
# SHA-1 fingerprint를 복사
```
프로젝트 설정 → Android 앱 → **지문 추가** → SHA-1 붙여넣기 → 저장 → `google-services.json` **다시 다운로드**.

### 1-3-3. Firestore
1. **빌드** → **Firestore Database** → **데이터베이스 만들기**
2. **프로덕션 모드** 선택 (보안 규칙은 우리가 별도로 배포)
3. 위치: `asia-northeast3`
4. **사용 설정**

### 1-3-4. Cloud Functions (Blaze 플랜 필수)
1. **빌드** → **Functions** → **시작하기**
2. **결제 업그레이드** 안내 → **Blaze로 업그레이드**
3. 결제 계정 만들기 → 신용카드 등록
   - ⚠️ 사용량 알림 필수 설정 (월 $1 한도부터 시작 권장)
4. 활성화 후에는 별도 작업 없음 (배포는 §1-5에서)

### 1-3-5. Crashlytics
1. **출시 및 모니터링** → **Crashlytics** → **사용 설정**
2. 안드로이드 앱이 등록되어 있으면 자동 표시. **확인**.

### 1-3-6. Analytics
- §1-1에서 활성화했으면 자동. 콘솔 좌측 **분석** → **이벤트** 메뉴가 보이면 OK.

---

## 1-4. Firebase CLI 설치 + 로그인

로컬 터미널에서:
```bash
npm i -g firebase-tools     # 처음만
firebase login              # 브라우저 열림 → Google 인증
firebase use --add          # 프로젝트 선택
# 1) 위 §1-1 에서 만든 프로젝트 ID 선택
# 2) 별칭(alias) 입력: default
```

확인:
```bash
firebase projects:list      # 현재 프로젝트가 표시되어야 함
```

---

## 1-5. 배포 (보안 규칙 + Cloud Functions)

### 1-5-1. 첫 배포 사전 준비
프로젝트 루트에서 한 번만:
```bash
cd functions && npm install && cd ..
```
의존성 설치 (firebase-admin, firebase-functions). 5~10분 소요 가능.

### 1-5-2. 보안 규칙 배포
```bash
firebase deploy --only firestore:rules
```
완료 후 콘솔의 **Firestore → 규칙** 탭에서 다음 내용이 보이면 OK:
```
match /players/{uid} {
  allow read: if request.auth != null && request.auth.uid == uid;
  allow write: if false;
}
```

### 1-5-3. Cloud Functions 배포
```bash
firebase deploy --only functions
```
- 첫 배포는 5~10분 소요
- 배포 후 **빌드 → Functions → 대시보드**에서 7개 함수 확인:
  - `addResources`, `consumeFatigue`, `deleteAccount`, `initPlayer`, `purchaseFurniture`, `rollGacha`, `validatePurchase`

### 1-5-4. 배포 검증
콘솔 → **Firestore → 데이터** 탭에서 **+ 컬렉션 시작** → 컬렉션 ID `players` → 임시 문서 추가 시도:
- 클라이언트 권한으로는 **거부** 되어야 정상
- "Add document" 직접 시도 시 권한 오류 표시되면 보안 규칙 배포 성공

---

## 1-6. 에뮬레이터로 로컬 검증

```bash
firebase emulators:start
```

브라우저에서 http://localhost:4000 접속 → Auth/Firestore/Functions 모두 표시되면 OK.

별도 터미널에서:
```bash
npm run dev
```
- 게임이 에뮬레이터에 연결됨 (개발 빌드 자동)
- 콘솔 로그 `[firebase.signedIn] { uid: ... }` 확인

---

## 1-7. 체크리스트

- [ ] 프로젝트 생성 + 위치 `asia-northeast3` 설정
- [ ] Web 앱 등록 → 7개 키를 `.env`에 입력
- [ ] Android 앱 등록 → `google-services.json` 다운로드 (보관)
- [ ] Authentication: 익명 + Google 활성
- [ ] Firestore 활성 (프로덕션 모드)
- [ ] Cloud Functions: Blaze 결제 등록
- [ ] Crashlytics + Analytics 활성
- [ ] `firebase deploy --only firestore:rules` 성공
- [ ] `firebase deploy --only functions` 성공
- [ ] 에뮬레이터에서 게임 실행 → `firebase.signedIn` 로그 확인

---

## 다음 단계

→ [§2 Capacitor / Android 빌드](./02-capacitor.md)

## 자주 막히는 곳

- **"This region is not supported"**: GCP 리소스 위치를 처음 설정할 때 일부 리전이 비활성. `asia-northeast3` (Seoul) 또는 `asia-northeast1` (Tokyo) 사용.
- **`firebase deploy --only functions` 가 권한 에러**: `firebase login --reauth`
- **Functions 배포 시 "billing not enabled"**: Blaze 업그레이드 후 5분 대기 → 재시도
