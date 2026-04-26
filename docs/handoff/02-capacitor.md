# 2. Capacitor / Android 빌드

> **목표**: Android 디버그 빌드 → 시그니처 키 생성 → 출시용 AAB 빌드까지.
> **소요**: 90~120분 (Android Studio 첫 실행이 오래 걸림)
> **사전 조건**: §1 완료, JDK 17+, Android Studio 설치

---

## 2-0. 사전 도구 설치

### macOS / Windows / Linux 공통
1. **JDK 17** 설치
   - macOS: `brew install openjdk@17`
   - Windows: [Adoptium](https://adoptium.net) installer
   - 확인: `java -version` → `17.x.x` 표시
2. **Android Studio** 설치 (https://developer.android.com/studio)
3. Android Studio 첫 실행 시:
   - "Standard" 설치 → SDK 자동 다운로드 (~2GB, 시간 걸림)
   - SDK 도구에서 **Android SDK Build-Tools 34.0.0** 이상 + **Android SDK Platform 34** 이상 확인

### 환경변수 설정
```bash
# macOS / Linux: ~/.zshrc 또는 ~/.bashrc 끝에 추가
export ANDROID_HOME=$HOME/Library/Android/sdk    # macOS
# export ANDROID_HOME=$HOME/Android/Sdk          # Linux
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools

# 새 터미널 열기 또는 source ~/.zshrc
adb --version  # 표시되면 OK
```

---

## 2-1. Android 프로젝트 생성

프로젝트 루트에서:
```bash
npm run build           # dist/ 생성 — 필수
npx cap add android     # android/ 폴더가 만들어짐
```

생성된 `android/` 디렉터리는 git에 커밋합니다 (이미 .gitignore가 빌드 산출물만 무시하도록 설정됨).

### 2-1-1. google-services.json 배치
§1에서 다운로드한 파일을:
```
android/app/google-services.json
```
경로에 배치합니다. **절대 git에 commit 금지** (이미 차단됨).

### 2-1-2. 첫 동기화
```bash
npx cap sync android
```
이후 `src/` 또는 `dist/` 변경 시마다 이 명령을 실행해 안드로이드 프로젝트에 반영.

### 2-1-3. 디버그 빌드 시도
```bash
cd android
./gradlew assembleDebug
cd ..
```
처음은 Gradle wrapper 다운로드 + 의존성 받느라 10~20분 걸립니다.

성공하면 `android/app/build/outputs/apk/debug/app-debug.apk` 생성.

---

## 2-2. 안드로이드 매니페스트 점검

`android/app/src/main/AndroidManifest.xml` 열고 확인:

### 2-2-1. 필수 권한
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```
이미 Capacitor가 자동 추가합니다.

### 2-2-2. AdMob 권한 (§3에서 사용)
```xml
<uses-permission android:name="com.google.android.gms.permission.AD_ID" />
```
나중에 §3에서 추가.

### 2-2-3. SDK 버전
`android/variables.gradle`:
```gradle
ext {
  minSdkVersion = 26     // ROADMAP 요구사항
  compileSdkVersion = 34
  targetSdkVersion = 34
}
```
`compileSdkVersion`/`targetSdkVersion`은 항상 최신 권장.

---

## 2-3. 시그니처 키 생성 (출시용)

### 2-3-1. keystore 생성
프로젝트 루트에서:
```bash
keytool -genkey -v -keystore release.keystore \
  -alias tpp -keyalg RSA -keysize 2048 -validity 10000
```
질문에 답:
- 비밀번호: 강력한 것 (최소 16자, 메모장 따로 보관)
- 이름/조직: 본인 정보
- 도시/시도: 본인 거주
- 국가 코드: `KR`

⚠️ **이 파일을 잃어버리면 앱 업데이트 불가능**. 다음 3곳에 백업:
1. 로컬 외장 SSD/USB
2. 클라우드 (1Password, Bitwarden 등 비밀번호 매니저의 secure note에 base64로 인코딩 저장)
3. 종이 인쇄 (sha-256 해시 표기)

```bash
# base64 인코딩 (클라우드 보관용)
base64 -i release.keystore > release.keystore.b64
# 복원:
# base64 -d release.keystore.b64 > release.keystore
```

### 2-3-2. .gitignore 확인
다음 패턴이 .gitignore에 있어야 함 (이미 설정됨):
```
*.keystore
*.jks
key.properties
```

### 2-3-3. key.properties 작성
`android/key.properties` 새로 만들기 (커밋 금지):
```properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=tpp
storeFile=../../release.keystore
```

### 2-3-4. build.gradle 수정
`android/app/build.gradle` 최상단에 추가:
```gradle
def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

`android { ... }` 블록 안에 `signingConfigs` 추가:
```gradle
android {
    signingConfigs {
        release {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## 2-4. Google 로그인용 SHA-1 등록

§2-3 keystore 생성 후:
```bash
keytool -list -v -keystore release.keystore -alias tpp
# 비밀번호 입력 → SHA-1: AB:CD:EF:... 복사
```

Firebase 콘솔에서:
1. **프로젝트 설정** → **내 앱** → Android 앱 선택
2. **지문 추가** → SHA-1 붙여넣기 → 저장
3. **`google-services.json` 다운로드** → `android/app/`에 덮어쓰기
4. `npx cap sync android`

⚠️ 디버그 빌드용 SHA-1도 추가하면 편함:
```bash
keytool -list -v -keystore ~/.android/debug.keystore \
  -alias androiddebugkey -storepass android -keypass android
# 이 SHA-1도 Firebase 콘솔에 추가
```

---

## 2-5. 출시용 AAB 빌드

### 2-5-1. 빌드
```bash
npm run build           # dist/ 갱신
npx cap sync android
cd android
./gradlew bundleRelease
cd ..
```

성공하면:
```
android/app/build/outputs/bundle/release/app-release.aab
```
이 파일이 Play Console에 업로드할 결과물.

### 2-5-2. 로컬 설치 테스트 (실기기)
AAB는 Play Store에만 업로드. 로컬 테스트는 APK로:
```bash
./gradlew assembleRelease
adb install android/app/build/outputs/apk/release/app-release.apk
```
실기기 USB 연결 후. 또는 Android Studio AVD로.

---

## 2-6. 스플래시 + 앱 아이콘

§6에서 자세히 다루지만, 코드만 미리 준비:

```bash
npm i -D @capacitor/assets
```

`resources/` 폴더 생성 후:
- `resources/icon.png` (1024×1024, 패딩 없음)
- `resources/splash.png` (2732×2732, 중앙 로고만)

```bash
npx capacitor-assets generate --android
npx cap sync android
```

자동으로 모든 사이즈로 리사이즈됩니다. 실 에셋은 §6에서 채우면 됨.

---

## 2-7. 체크리스트

- [ ] JDK 17 설치 + Android Studio 설치
- [ ] `npm run build && npx cap add android` 성공
- [ ] `google-services.json` 배치 + cap sync
- [ ] `./gradlew assembleDebug` 성공 (APK 생성)
- [ ] keystore 생성 + 3중 백업
- [ ] `key.properties` 작성 (커밋 금지 확인)
- [ ] `build.gradle`에 signingConfigs 추가
- [ ] release SHA-1을 Firebase에 등록 + `google-services.json` 갱신
- [ ] `./gradlew bundleRelease` → AAB 생성

---

## 다음 단계

→ [§3 AdMob 광고](./03-admob.md)

## 자주 막히는 곳

- **"SDK location not found"**: 프로젝트 루트에 `android/local.properties` 만들고 `sdk.dir=/Users/.../Library/Android/sdk` 줄 추가
- **Gradle 다운로드 실패**: 네트워크 프록시 문제. `gradle.properties`에 `org.gradle.daemon=true` 추가
- **`cap sync` 후 화면이 흰색**: `dist/` 가 비어있음. `npm run build` 다시 실행 후 sync
- **`bundleRelease` 시그니처 오류**: `key.properties` 의 `storeFile` 경로가 상대경로면 `android/app/`에서 본 상대경로로 작성 (예: `../../release.keystore`)
