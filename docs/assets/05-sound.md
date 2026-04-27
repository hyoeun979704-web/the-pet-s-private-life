# 05. 사운드 (BGM 5 + SFX 11)

> **목표**: BGM 5곡 + SFX 11종 = 총 16개 오디오 파일
> **소요**: 2~3일
> **사전조건**: 다른 에셋 진행 중 병렬 작업 가능

> 사운드는 **마지막에 한 번에 몰아서** 작업하는 게 효율적. AI 생성 도구로 1시간이면 BGM 5곡 다 가능.

---

## 📐 공통 스펙

| 항목 | 값 |
|---|---|
| 포맷 | **`.ogg`** (Vorbis, 안드로이드 친화) |
| BGM 비트레이트 | 128kbps |
| SFX 비트레이트 | 96kbps |
| 위치 | `src/assets/audio/` |
| 총 용량 | **≤ 15MB** (ROADMAP 성능 예산) |

> WAV/MP3로 받았으면 변환 필수. 무료 변환:
> - Audacity: File → Export → Export as OGG
> - 명령어: `ffmpeg -i in.wav -c:a libvorbis -q:a 4 out.ogg` (q:a 4 ≈ 128kbps)

---

## 🎵 1) BGM 5곡

| ID | 파일명 | 분위기 | 길이 | 권장 도구 |
|---|---|---|---|---|
| `lobby` | `bgm_lobby.ogg` | 따뜻, 차분, 메인 화면 | 60초 루프 | Suno AI |
| `block_puzzle` | `bgm_block_puzzle.ogg` | 경쾌, 가벼움 | 30~45초 루프 | Suno AI |
| `merge_game` | `bgm_merge_game.ogg` | 차분, 부드러움 | 60초 루프 | Suno AI |
| `quiz` | `bgm_quiz.ogg` | 두근거림, 집중 | 30~45초 루프 | Suno AI |
| `gacha` | `bgm_gacha.ogg` | 기대감, 부드러움 | 30초 루프 | Suno AI |

### Suno AI 프롬프트 예시

#### `bgm_lobby`
```
Cute cozy K-pop lullaby, soft piano + ukulele,
warm indoor cafe vibe, no vocals, gentle, 120bpm, loopable
```

#### `bgm_block_puzzle`
```
Bright cheerful 8-bit chiptune, light bouncy melody,
puzzle game soundtrack, no vocals, 130bpm, energetic but soft
```

#### `bgm_merge_game`
```
Soft jazz piano lounge, lo-fi beats, relaxing,
no vocals, 90bpm, ambient comfortable
```

#### `bgm_quiz`
```
Subtle quiz show melody, light marimba and synth,
mild tension building, no vocals, 110bpm, anticipation
```

#### `bgm_gacha`
```
Magical sparkle music box, twinkling chime,
hopeful playful, no vocals, 100bpm, surprise reveal feel
```

### 루프 처리 팁
1. Suno에서 30~60초 받기
2. Audacity에서 시작/끝의 무음 제거
3. **Crossfade**: 마지막 1초를 앞 1초와 겹치게 → seamless loop
4. Export OGG (Quality 4)

---

## 🔊 2) SFX 11종

| ID | 파일명 | 트리거 | 길이 | 비고 |
|---|---|---|---|---|
| `tap` | `sfx_tap.ogg` | 일반 버튼 클릭 | 0.1~0.3초 | 가벼운 "탁" |
| `place` | `sfx_place.ogg` | 가구 배치 성공 | 0.3초 | "툭" 떨어지는 느낌 |
| `merge` | `sfx_merge.ogg` | 머지 합치기 | 0.5초 | "샤랑" 합쳐지는 |
| `line_clear` | `sfx_line_clear.ogg` | 블록 라인 클리어 | 0.6초 | "사라랑" 청량 |
| `gacha_roll` | `sfx_gacha_roll.ogg` | 캡슐 굴리기 | 1~2초 | 굴리는 소리 |
| `gacha_result_normal` | `sfx_gacha_normal.ogg` | 일반 결과 | 0.5초 | "딩" 가벼움 |
| `gacha_result_rare` | `sfx_gacha_rare.ogg` | 희귀 결과 | 1초 | "디링" 화려함 |
| `gacha_result_legendary` | `sfx_gacha_legendary.ogg` | 전설 결과 | 1.5초 | "팡파레" 특별함 |
| `level_up` | `sfx_level_up.ogg` | 레벨업 | 1초 | 짧은 팡파레 |
| `purchase` | `sfx_purchase.ogg` | 구매/획득 성공 | 0.5초 | "딩동" |
| `error` | `sfx_error.ogg` | 오류/실패 | 0.3초 | 둔탁한 "두두" |

### SFX 소스 추천 (직접 만들기보다 외부 사용 권장)

#### 1) Freesound.org (무료, CC0/CC-BY)
- 가입 후 `tap`, `pop`, `coin`, `magic chime` 등 검색
- **License: Creative Commons 0** 필터 ⭐ (저작자 표시 필요 없음)
- 다운로드 → Audacity로 길이 조정 → OGG 변환

#### 2) Zapsplat.com (무료, 회원가입)
- 게임 전용 SFX 카테고리 풍부
- 무료 플랜 라이선스: 게임 출처 명시 필요 (`audio/LICENSES.md`)

#### 3) BFXR (무료, 직접 생성)
http://www.bfxr.net — 8-bit 효과음 생성기. 브라우저에서 슬라이더 조정 → WAV export → OGG 변환

#### 4) ElevenLabs Sound Effects (유료, 좋음)
"cute pop sound for game button"처럼 텍스트로 SFX 생성. 결과 품질 매우 좋음.

---

## 📜 라이선스 출처 기록 (필수)

`src/assets/audio/LICENSES.md` 작성:

```markdown
# Audio Asset Licenses

## BGM
| 파일 | 출처 | 라이선스 | 비고 |
|---|---|---|---|
| bgm_lobby.ogg | Suno AI (생성) | Suno Pro 상업 이용 | 2026-XX-XX 생성 |
| bgm_block_puzzle.ogg | Suno AI | Suno Pro | |
| ... | | | |

## SFX
| 파일 | 출처 | 라이선스 | 비고 |
|---|---|---|---|
| sfx_tap.ogg | freesound.org/people/USER/sounds/12345 | CC0 | |
| sfx_place.ogg | Zapsplat | Zapsplat Free + attribution | |
| ... | | | |
```

⚠️ Play Console 심사 시 사운드 출처를 직접 묻진 않지만, **분쟁 시 증빙용**으로 필수.

---

## 🔌 코드 통합

`src/systems/SoundManager.ts` 가 이미 만들어져 있어요. 통합은 매우 단순:

### 1) BootScene 또는 LoadingScene에 preload
```typescript
preload(): void {
  // BGM
  this.load.audio('bgm_lobby', 'assets/audio/bgm_lobby.ogg');
  this.load.audio('bgm_block_puzzle', 'assets/audio/bgm_block_puzzle.ogg');
  // ... 5곡

  // SFX
  this.load.audio('sfx_tap', 'assets/audio/sfx_tap.ogg');
  // ... 11종
}
```

### 2) 어댑터 작성 (간단)
`src/adapters/PhaserSoundAdapter.ts`:
```typescript
import type { SoundAdapter } from '@/systems/SoundManager';

export class PhaserSoundAdapter implements SoundAdapter {
  constructor(private scene: Phaser.Scene) {}

  async playBgm(track: string, volume: number): Promise<void> {
    this.scene.sound.play(`bgm_${track}`, { loop: true, volume });
  }

  async stopBgm(): Promise<void> {
    this.scene.sound.stopAll();
  }

  async playSfx(sfx: string, volume: number): Promise<void> {
    this.scene.sound.play(`sfx_${sfx}`, { volume });
  }
}
```

### 3) `initProdServices` 또는 main.ts 에서:
```typescript
const sound = new SoundManager({ adapter: new PhaserSoundAdapter(scene), gameState });
// 메인 씬 진입 시
sound.playBgm('lobby');
// 미니게임 진입 시
sound.playBgm('block_puzzle');
// 버튼 클릭 시
sound.playSfx('tap');
```

---

## 📊 작업 우선순위

### MUST (β 출시)
- [ ] `bgm_lobby` (메인 BGM 1곡)
- [ ] `sfx_tap` (모든 버튼)
- [ ] `sfx_place` (가구 배치)
- [ ] `sfx_error` (실패)

### SHOULD (정식 출시)
- [ ] BGM 5곡 풀세트
- [ ] `sfx_merge` / `sfx_line_clear` / `sfx_level_up`
- [ ] `sfx_gacha_roll` / `sfx_gacha_result_*` 3종

### NICE (폴리싱)
- [ ] `sfx_purchase`

---

## ✅ 완료 기준

각 사운드:
- [ ] `.ogg` 포맷, 알맞은 비트레이트
- [ ] 파일명 정확히 `bgm_*.ogg` / `sfx_*.ogg`
- [ ] `src/assets/audio/` 에 배치
- [ ] `LICENSES.md` 에 출처 기록
- [ ] BootScene preload 추가

전체:
- [ ] 총 용량 ≤ 15MB
- [ ] 안드로이드 폰 실기에서 재생 확인 (가끔 .ogg 호환 이슈)

---

## 💡 팁

- **음량 통일**: Audacity의 "Effect → Normalize → -3dB"로 모든 파일 통일. 중구난방 음량은 폴리싱 안 된 느낌의 가장 큰 원인
- **루프 검증**: 게임 30분 돌려두고 BGM 끊김 없는지 확인
- **Settings 화면**: BGM/SFX 볼륨 조절 슬라이더는 PART 13 폴리싱 (현재 SoundManager는 이미 settings.bgmVolume / sfxVolume 읽음)
- **mp3 폴백**: 일부 안드로이드 OGG 디코더 이슈 있으면 mp3 사본도 함께 두고 Phaser가 자동 폴백:
  ```typescript
  this.load.audio('bgm_lobby', ['assets/audio/bgm_lobby.ogg', 'assets/audio/bgm_lobby.mp3']);
  ```

---

다음 챕터:
→ [06. 스토어 자산](./06-store.md)
