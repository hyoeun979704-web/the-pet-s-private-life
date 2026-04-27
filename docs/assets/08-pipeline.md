# 08. Phaser에 통합하는 법 (Asset Pipeline)

> **목표**: 만든 PNG / OGG 파일을 게임 코드에서 실제로 쓰이도록 연결.
> **소요**: 1회 셋업 30분 ~ 1시간 + 자산 추가 시 1분/개
> **사전조건**: PNG 또는 OGG 파일이 손에 있음 (1개라도 OK — 검증용)

> 핵심 원리: `src/assets/` 에 파일 두면 → Vite 가 `dist/assets/` 로 복사 → Phaser `this.load.image('key', 'path')` 가 읽어서 메모리 캐시 → `this.add.image('key')` 로 화면에 표시. 끝.

---

## 📂 1) 폴더 구조 (이미 있음)

```
src/assets/
├── characters/         ← 캐릭터 PNG (chapter 02)
├── furniture/          ← 가구 PNG (chapter 03)
├── ui/                 ← UI 아이콘 PNG (chapter 04)
└── audio/              ← BGM/SFX OGG (chapter 05)

resources/              ← 앱 아이콘/스플래시 (chapter 06, capacitor-assets용)
├── icon.png
└── splash.png
```

> `src/assets/` 안의 파일은 게임 런타임에 로드됨.
> `resources/` 안의 파일은 빌드 시점에 안드로이드 네이티브 자원으로 변환됨 (게임 런타임 X).

---

## 🔑 2) Asset Key 상수 (권장)

PNG 경로를 코드 곳곳에 하드코딩하면 오타·이동 시 지옥. **상수로 묶기**.

`src/config/AssetKeys.ts` 만들기 (없으면):
```typescript
// Phaser cache key + 파일 경로를 한 곳에서 관리
const base = 'assets';

export const ASSET_KEYS = {
  // 캐릭터 (id × 상태)
  char: (id: string, state: 'idle' | 'sleep' | 'play' = 'idle') =>
    `char_${id}_${state}`,
  charPath: (id: string, state: 'idle' | 'sleep' | 'play' = 'idle') =>
    `${base}/characters/char_${id}_${state}.png`,

  // 가구 (id)
  furn: (id: string) => `furn_${id}`,
  furnPath: (id: string) => `${base}/furniture/furn_${id}.png`,

  // UI 아이콘
  ui: (name: string) => `ui_${name}`,
  uiPath: (name: string) => `${base}/ui/${name}.png`,

  // 사운드
  bgm: (track: string) => `bgm_${track}`,
  bgmPath: (track: string) => `${base}/audio/bgm_${track}.ogg`,
  sfx: (sfx: string) => `sfx_${sfx}`,
  sfxPath: (sfx: string) => `${base}/audio/sfx_${sfx}.ogg`,
} as const;
```

이후 어디서든:
```typescript
this.load.image(ASSET_KEYS.char('cat_munchkin'), ASSET_KEYS.charPath('cat_munchkin'));
this.add.image(x, y, ASSET_KEYS.char('cat_munchkin'));
```

---

## 📥 3) BootScene 또는 LoadingScene 에서 Preload

게임 시작 시 한 번에 모든 에셋 로드. 게임 중 끊김 방지.

`src/scenes/BootScene.ts` (또는 LoadingScene) `preload()`:

```typescript
import charactersData from '@/data/characters.json';
import furnitureData from '@/data/furniture.json';
import { ASSET_KEYS } from '@/config/AssetKeys';

preload(): void {
  // 1) 캐릭터 17종 × 2~3 상태
  for (const char of charactersData.characters) {
    this.load.image(
      ASSET_KEYS.char(char.id, 'idle'),
      ASSET_KEYS.charPath(char.id, 'idle')
    );
    this.load.image(
      ASSET_KEYS.char(char.id, 'sleep'),
      ASSET_KEYS.charPath(char.id, 'sleep')
    );
  }

  // 2) 가구 150종
  for (const furn of furnitureData.items) {
    this.load.image(ASSET_KEYS.furn(furn.id), ASSET_KEYS.furnPath(furn.id));
  }

  // 3) UI 아이콘 (chapter 04 list)
  const uiNames = [
    'icon_resource_snack', 'icon_resource_starDust',
    'icon_resource_magicStone', 'icon_resource_shard', 'icon_resource_coziness',
    'icon_level_normal', 'icon_level_rare', 'icon_level_legendary',
    'icon_ad_play',
    // ... 약 25종
  ];
  for (const name of uiNames) {
    this.load.image(ASSET_KEYS.ui(name), ASSET_KEYS.uiPath(name));
  }

  // 4) 사운드 — BGM 5 + SFX 11
  const bgmTracks = ['lobby', 'block_puzzle', 'merge_game', 'quiz', 'gacha'];
  for (const t of bgmTracks) {
    this.load.audio(ASSET_KEYS.bgm(t), ASSET_KEYS.bgmPath(t));
  }
  const sfxList = [
    'tap', 'place', 'merge', 'line_clear', 'gacha_roll',
    'gacha_normal', 'gacha_rare', 'gacha_legendary',
    'level_up', 'purchase', 'error',
  ];
  for (const s of sfxList) {
    this.load.audio(ASSET_KEYS.sfx(s), ASSET_KEYS.sfxPath(s));
  }

  // 5) 진행률 표시 (선택)
  this.load.on('progress', (value: number) => {
    // value ∈ [0, 1]
    console.log('loading', Math.round(value * 100), '%');
  });
}
```

---

## 🎬 4) 사용 예시

### 캐릭터 표시
```typescript
// MainScene.create()
this.add.image(400, 300, ASSET_KEYS.char('cat_munchkin', 'idle'));
```

### 가구 배치
```typescript
const sprite = this.add.image(x, y, ASSET_KEYS.furn('rug_basic'));
sprite.setOrigin(0.5, 1.0); // 가구는 보통 발치 기준
```

### UI 버튼 with 아이콘
```typescript
this.add.image(20, 20, ASSET_KEYS.ui('icon_resource_snack'));
this.add.text(40, 16, String(snack), { fontSize: '16px' });
```

### BGM 재생 (SoundManager 통해)
```typescript
sound.playBgm('lobby'); // SoundManager 가 ASSET_KEYS.bgm('lobby') 자동 매핑
```

---

## ⚠️ 5) 흔한 오류 + 해결

### 5-1. `Image not found in cache` 또는 `Failed to process file: image`
**원인**: `this.load` 등록 안 됐거나, 파일 경로 오타

**확인 순서**:
1. `src/assets/characters/char_cat_munchkin_idle.png` 실제로 있는지 (대소문자 정확히)
2. preload 에 `this.load.image(...)` 호출했는지
3. 호출 키 `ASSET_KEYS.char('cat_munchkin')` 와 표시 시 `this.add.image(... 'char_cat_munchkin_idle')` 일치하는지
4. 브라우저 DevTools → Network → 404 나는 PNG 있는지

### 5-2. PNG 가 깨진 픽셀로 표시
**원인**: 파일이 실제로 PNG 가 아님 (확장자만 바뀜)

해결: 이미지 뷰어로 열어보기. 안 열리면 GIMP / Photoshop 에서 다시 PNG 로 export.

### 5-3. OGG 가 안드로이드에서만 안 들림
**원인**: 일부 안드로이드 OGG 디코더 불안정

해결: `.mp3` 사본도 함께 준비 → Phaser fallback:
```typescript
this.load.audio(ASSET_KEYS.bgm('lobby'), [
  ASSET_KEYS.bgmPath('lobby'),                          // .ogg
  ASSET_KEYS.bgmPath('lobby').replace('.ogg', '.mp3'),  // fallback
]);
```

### 5-4. iOS / 사파리 에서 첫 사운드 무음
**원인**: 브라우저 자동 재생 정책. 사용자 인터랙션 후에만 재생 가능.

해결: 첫 화면에 "탭하여 시작" 같은 진입 버튼 → 그 후 BGM 시작. 이미 코드에 처리되어 있음 (BootScene → 사용자 입력 후 LoadingScene).

### 5-5. APK / AAB 빌드 후 에셋이 안 보임
**원인**: Capacitor `cap sync` 안 됨 — 새 에셋이 안드로이드 webview 디렉토리에 복사 안 됨

해결:
```bash
npm run build
npx cap sync android
cd android && ./gradlew bundleRelease
```

`cap sync` 가 dist/ → android/app/src/main/assets/public/ 로 복사함.

---

## 🚀 6) 성능 최적화

### 6-1. Texture Atlas (선택, 캐릭터 17종 × 2 상태가 부담되면)
PNG 34장을 매번 로드 X → 한 장의 큰 atlas + JSON metadata 로 묶기.

도구:
- **TexturePacker** (유료, 베스트)
- **free-tex-packer** (무료, 웹) https://free-tex-packer.com/app/

```typescript
this.load.atlas('characters', 'assets/characters.png', 'assets/characters.json');
this.add.image(x, y, 'characters', 'cat_munchkin_idle'); // frame name
```

> 단, atlas 만들면 캐릭터 1종 추가 시마다 atlas 재생성 필요. **17종 다 끝난 후** 도입 권장.

### 6-2. 이미지 압축
```bash
npm i -D imagemin imagemin-pngquant
```

또는 더 간단히:
- **TinyPNG** https://tinypng.com (웹, 드래그&드롭, PNG 파일 70~80% 압축)
- 한 번에 50개씩 batch 가능 (무료)

캐릭터 17종 + 가구 150 = 약 200 PNG 를 TinyPNG 한 번 돌리면 **합쳐서 80MB → 20MB** 수준.

### 6-3. WebP 변환 (Android only)
PNG 보다 25~35% 더 가벼움:
```bash
cwebp char_cat_munchkin_idle.png -q 85 -o char_cat_munchkin_idle.webp
```

Phaser 는 webp 도 자동 인식. iOS Safari 14+ 이상 지원 → 안드로이드 출시면 안전.

---

## 🧪 7) 검증 절차

새 에셋을 1개 추가했을 때:

### 7-1. 파일 자체 검증
```bash
# 파일이 정확한 위치에 있는지
ls src/assets/characters/char_cat_munchkin_idle.png

# 파일 크기 합리적인지 (1024×1024 PNG ≈ 100~500KB)
ls -lh src/assets/characters/
```

### 7-2. dev 서버에서 노출
```bash
npm run dev
```
브라우저 → DevTools Network → 해당 PNG 가 200 으로 로드되는지

### 7-3. 빌드 후 dist/ 에 포함되는지
```bash
npm run build
ls dist/assets/characters/
```

### 7-4. 안드로이드 실기 검증
```bash
npx cap sync android
cd android && ./gradlew installDebug
```
폰에서 실행 → 캐릭터 등장하는지

---

## 📊 8) 자산 추가 워크플로 (한 번 익히면 1분 작업)

```
[A] 새 에셋 만든다 (예: char_dog_shiba_idle.png)
        ↓
[B] src/assets/characters/ 에 정확한 이름으로 저장
        ↓
[C] (이미 BootScene 에 char loop 있으면 자동) — characters.json 에 등록만 되어있으면 됨
        ↓
[D] npm run dev 로 확인
        ↓
[E] git add + commit + push
```

> characters.json 과 furniture.json 에 데이터만 등록되어 있으면, BootScene 의 for-loop 가 자동으로 PNG 를 로드. **새 코드 추가 거의 없음**.

---

## ✅ 완료 기준

- [ ] `src/config/AssetKeys.ts` 작성
- [ ] BootScene 또는 LoadingScene `preload()` 에 4종 자산(char/furn/ui/audio) 모두 로드
- [ ] 1종 캐릭터 + 1종 가구 + 1종 UI + 1종 BGM 으로 dev 서버에서 시각·청각 확인
- [ ] `npm run build && npx cap sync android` 후 실기에서도 정상
- [ ] (선택) TinyPNG batch 압축
- [ ] (선택) Texture atlas 도입 (캐릭터 다 끝난 후)

---

## 💡 팁

- **캐릭터 1종 → 풀 17종 → atlas 도입** 순서. 처음부터 atlas 만들지 말기 (재생성 잦음)
- **404 에러는 십중팔구 파일명 오타**. 대소문자 / 언더스코어 / 확장자 한 글자만 달라도 안 됨
- **에셋이 빠르게 늘어날 때**: 위 BootScene 의 for-loop 가 빛을 발함. characters.json 에 한 줄 추가 + PNG 를 정확한 이름으로 두기만 하면 자동 로드
- **개발 단계 placeholder**: 본인이 일러스트 만들기 전에는 `https://placecats.com/200/200` 같은 mock URL 로 구조 검증 → 실제 PNG 들어오면 그대로 교체
- **AAB 80MB 초과 경고**: chapter 06 의 ROADMAP 성능 예산. 사운드 비트레이트 ↓ + 이미지 webp 변환이 첫 대응. atlas + tree-shaking 은 마지막 수단

---

## 🎉 Asset 작업 가이드 끝!

다음 단계는 다시 [HANDOFF](../handoff/) 의 §4 IAP / §5 Crashlytics / §7 법규 / §8 Prod Bootstrap / §9 출시 체크.

자산 만들면서 에셋 작업 가이드의 다른 챕터도 자유롭게 오가며 참고:
- [01. 스타일 가이드](./01-style-guide.md)
- [02. 캐릭터 17종](./02-characters.md)
- [03. 가구 150종](./03-furniture.md)
- [04. UI 아이콘](./04-ui-icons.md)
- [05. 사운드](./05-sound.md)
- [06. 스토어 자산](./06-store.md)
- [07. 캐릭터 텍스트](./07-text-content.md)
