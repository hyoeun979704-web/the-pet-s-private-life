# 6. 에셋 (그래픽 + 사운드)

> **목표**: 캐릭터 17종 + 가구 150개 + UI 아이콘 + 사운드 16종 + 스토어 자산 제작.
> **소요**: 수일~수주 (외주/AI 활용에 따라 다름)
> **사전 조건**: 없음. 다른 §과 병렬 진행 가능.

> 본 섹션은 **외주 발주서**로 그대로 사용 가능하도록 표 형식으로 작성했습니다. ROADMAP §에셋 생성 AI 파이프라인 권장 도구도 함께 표기.

---

## 6-1. 캐릭터 17종

### 6-1-1. 스펙
- 파일명: `char_{species}_{breed}_{action}.png`
- action: `idle` (필수), `sleep` (필수), `tired` (선택, MVP는 idle 어두운 버전으로 대체 가능)
- 크기: **64×96 PNG** (단일 프레임) 또는 **256×256 atlas** (Phaser TexturePacker)
- 투명 배경
- 시점: 아이소메트릭 30°
- 컬러: `data/characters.json`의 `colorHex`를 메인으로 사용 (배경 X, 캐릭터 메인 컬러)

### 6-1-2. 작업 순서
1. **레퍼런스 3장** 확정: Niji Journey 또는 Midjourney v6로 스타일 가이드 결정
2. **17종 일러스트 원안**: 같은 스타일/각도로 일관성 유지
3. **Aseprite 또는 Photoshop**으로 픽셀 정렬 + 알파 정리
4. **idle 17종 → sleep 17종** 순으로 일괄 진행

### 6-1-3. 17종 목록 (작업표)

| 종 | 품종 (id) | 등급 | 메인 컬러 | idle | sleep | tired |
|---|---|---|---|---|---|---|
| 🐱 | 먼치킨 (`cat_munchkin`) | normal | `#FFC8DD` | ☐ | ☐ | ☐ |
| 🐱 | 페르시안 (`cat_persian`) | normal | `#FAEDCB` | ☐ | ☐ | ☐ |
| 🐱 | 스코티시폴드 (`cat_scottish_fold`) | rare | `#A0C4FF` | ☐ | ☐ | ☐ |
| 🐱 | 러시안블루 (`cat_russian_blue`) | rare | `#B9FBC0` | ☐ | ☐ | ☐ |
| 🐱 | 샴 (`cat_siamese`) | legendary | `#FFADAD` | ☐ | ☐ | ☐ |
| 🐶 | 비숑프리제 (`dog_bichon`) | normal | `#FFFFFF` | ☐ | ☐ | ☐ |
| 🐶 | 포메라니안 (`dog_pomeranian`) | normal | `#FFD580` | ☐ | ☐ | ☐ |
| 🐶 | 말티즈 (`dog_maltese`) | normal | `#F8F8F0` | ☐ | ☐ | ☐ |
| 🐶 | 웰시코기 (`dog_welsh_corgi`) | rare | `#E8A458` | ☐ | ☐ | ☐ |
| 🐶 | 시바견 (`dog_shiba`) | rare | `#D97F39` | ☐ | ☐ | ☐ |
| 🐶 | 골든리트리버 (`dog_golden_retriever`) | legendary | `#E8B75E` | ☐ | ☐ | ☐ |
| 🐹 | 골든햄스터 (`ham_golden`) | normal | `#F1C27D` | ☐ | ☐ | ☐ |
| 🐹 | 로보로브스키 (`ham_roborovski`) | rare | `#C8A97E` | ☐ | ☐ | ☐ |
| 🦔 | 일반 고슴도치 (`hedge_common`) | rare | `#8A7563` | ☐ | ☐ | ☐ |
| 🦔 | 알비노 고슴도치 (`hedge_albino`) | legendary | `#FDEEDC` | ☐ | ☐ | ☐ |
| 🦜 | 왕관앵무 (`parrot_cockatiel`) | rare | `#FFD66B` | ☐ | ☐ | ☐ |
| 🦜 | 사랑앵무 (`parrot_budgerigar`) | legendary | `#8AD8C4` | ☐ | ☐ | ☐ |

총 **idle 17 + sleep 17 + tired 17 = 51 파일**. tired 생략 시 34 파일.

### 6-1-4. 캐릭터별 텍스트 (외주 별도 항목)
3 × 17 = 51 키 작성:
- `char.{id}.name` — 화면 표시명 (예: "먼치킨")
- `char.{id}.tmi` — 도감 TMI (1~2문장)
- `char.{id}.personality` — 성격 한 줄

i18n 키는 `src/data/locales/ko.json` 의 `char` 네임스페이스에 추가.

---

## 6-2. 가구 (런칭 150개)

### 6-2-1. 스펙
- 파일명: `furn_{category}_{id}.png`
- 카테고리: `floor` / `wall` / `decor`
- 크기: **128×128 PNG**, 투명 배경
- 2배수(256×256)로 작업 후 다운샘플 권장

### 6-2-2. MVP 5종 (이미 데이터 있음)
| id | category | grade | 비고 |
|---|---|---|---|
| `furn_rug_basic` | floor | normal | 2×2 핑크 러그 |
| `furn_cushion_cat` | floor | normal | 1×1 크림색 쿠션 |
| `furn_lamp_warm` | decor | rare | 1×1 따뜻한 조명 |
| `furn_bed_pet` | floor | rare | 2×3 펫 침대 |
| `furn_tree_cherry` | decor | legendary | 2×2 벚꽃 나무 |

### 6-2-3. 추가 145개 작업 가이드
- ROADMAP §단계별 출시 스코프 §정식 출시: **150개**
- 카테고리 비율 권장: floor 50% / wall 30% / decor 20%
- 등급 비율: normal 60% / rare 30% / legendary 10%
- 가격은 `furniture.json` + `functions/src/shared/furnitureCatalog.ts` 에 입력 필요 — 양쪽 모두 수정 후 `npm run test -- furniture-catalog-sync` 통과 확인

### 6-2-4. 바닥 타일
- `tile_floor_01.png` 64×32 iso diamond, 단색 + 약간의 패턴

---

## 6-3. 미니게임 / UI

### 6-3-1. 블록 퍼즐
| 파일 | 크기 | 비고 |
|---|---|---|
| `block_snack_0.png` | 64×64 | 핑크 간식 (`#FFC8DD`) |
| `block_snack_1.png` | 64×64 | 크림 간식 (`#FAEDCB`) |
| `block_snack_2.png` | 64×64 | 하늘 간식 (`#A0C4FF`) |
| `bg_puzzle_board.png` | 800×800 | 보드 배경 (밝은 패턴) |

### 6-3-2. 머지 게임
| 파일 | 크기 | 비고 |
|---|---|---|
| `merge_stardust_1.png` ~ `merge_stardust_10.png` | 64×64 | `data/mergeLevels.json` colorHex 참조 |

### 6-3-3. 퀴즈
| 파일 | 크기 | 비고 |
|---|---|---|
| `bg_quiz_card.png` | 900×500 | 카드 배경 |
| `icon_option_correct.png` | 48×48 | 초록 체크 |
| `icon_option_wrong.png` | 48×48 | 빨간 X |

### 6-3-4. 가챠
| 파일 | 크기 | 비고 |
|---|---|---|
| `gacha_capsule.png` | 256×256 | 캡슐 |
| `gacha_grade_n.png` | 96×96 | 일반 (회색~크림) |
| `gacha_grade_r.png` | 96×96 | 희귀 (파랑) |
| `gacha_grade_l.png` | 96×96 | 전설 (금색) |

### 6-3-5. 자원 / 레벨 아이콘
| 파일 | 크기 | 비고 |
|---|---|---|
| `icon_resource_snack.png` | 48×48 | 🍖 |
| `icon_resource_starDust.png` | 48×48 | ⭐ |
| `icon_resource_magicStone.png` | 48×48 | 🔮 |
| `icon_resource_magicShard.png` | 48×48 | 🧩 |
| `icon_resource_gachaTicket.png` | 48×48 | 🎫 |
| `icon_level_star.png` | 32×32 | 레벨 표시용 |
| `icon_ad.png` | 24×24 | 광고 시청 버튼 |

> 현재 코드는 위 아이콘 자리에 이모지를 직접 사용 중. 아이콘 추가 시 `Constants.ts` 또는 각 씬에서 `this.add.image` 로 교체.

---

## 6-4. 사운드 (BGM 5 + SFX 11)

### 6-4-1. BGM
| ID | 파일 | 비고 (분위기) |
|---|---|---|
| `lobby` | `bgm_lobby.ogg` | 메인 화면 — 따뜻, 차분 |
| `block_puzzle` | `bgm_block_puzzle.ogg` | 경쾌, 짧은 루프 |
| `merge_game` | `bgm_merge_game.ogg` | 차분, 조용한 BGM |
| `quiz` | `bgm_quiz.ogg` | 두근거림 (질문 모드) |
| `gacha` | `bgm_gacha.ogg` | 기대감, 부드러움 |

- 포맷: `.ogg` (안드로이드 친화)
- 비트레이트: 128kbps
- 길이: 30~60초 루프, seamless

### 6-4-2. SFX
| ID | 파일 | 비고 |
|---|---|---|
| `tap` | `sfx_tap.ogg` | 일반 버튼 |
| `place` | `sfx_place.ogg` | 가구 배치 |
| `merge` | `sfx_merge.ogg` | 머지 합치기 |
| `line_clear` | `sfx_line_clear.ogg` | 블록 라인 클리어 |
| `gacha_roll` | `sfx_gacha_roll.ogg` | 캡슐 굴리기 |
| `gacha_result_normal` | `sfx_gacha_normal.ogg` | 일반 결과 |
| `gacha_result_rare` | `sfx_gacha_rare.ogg` | 희귀 결과 |
| `gacha_result_legendary` | `sfx_gacha_legendary.ogg` | 전설 결과 (특별) |
| `level_up` | `sfx_level_up.ogg` | 레벨업 팡파르 |
| `purchase` | `sfx_purchase.ogg` | 구매 성공 |
| `error` | `sfx_error.ogg` | 오류 / 실패 |

- 포맷: `.ogg`, 96kbps
- 길이: 0.2~1.5초

### 6-4-3. 총 용량 제약
- ROADMAP 성능 예산: 사운드 ≤ **15MB** (전체)
- 압축: `ffmpeg -i in.wav -c:a libvorbis -q:a 4 out.ogg`

### 6-4-4. 라이선스 출처 기록
모든 파일에 대해 `audio/LICENSES.md` 작성:
```markdown
| 파일 | 출처 | 라이선스 |
|---|---|---|
| bgm_lobby.ogg | Suno AI (생성) | Suno 상업 플랜 |
| sfx_tap.ogg | freesound.org/people/.../sounds/12345 | CC0 |
```

### 6-4-5. 권장 도구
- **BGM**: Suno AI ($10/월 상업 플랜) — 프롬프트 한국어 OK
- **SFX**: freesound.org (CC0 필터), zapsplat.com (계정 가입 시 무료)
- **편집**: Audacity (무료) — 노멀라이즈 + 페이드인/아웃 + 루프 정렬

---

## 6-5. 스토어 등록 자산

### 6-5-1. 앱 아이콘
- **Android adaptive icon**: foreground 1024×1024 + background 1024×1024 (또는 단색)
- 파일 위치: `resources/icon.png` (foreground) — `@capacitor/assets` 가 자동 변환
- 안전 영역: 중앙 660×660 픽셀에 핵심 요소 배치 (안드로이드 시스템이 자르거나 마스킹)

### 6-5-2. 스플래시
- 2732×2732 PNG
- 중앙에 로고만 (시스템이 다양한 비율로 크롭)
- 배경색은 `Constants.DESIGN_TOKENS.color.bg` 와 일치 권장

### 6-5-3. Play Console 자산
| 항목 | 크기 | 개수 |
|---|---|---|
| 피처 그래픽 | 1024×500 | 1 (필수) |
| 스크린샷 (휴대폰) | 1080×1920 또는 1920×1080 | 최소 2, 권장 8 |
| 스크린샷 (7" 태블릿) | 선택 | 0~8 |
| 프로모션 비디오 | YouTube 링크 | 0~1 (선택) |

### 6-5-4. 짧은 설명 / 자세한 설명
- 짧은 설명: 80자 이내 ("우리 집 주인님의 비밀 일상 — 아기자기 힐링 시뮬레이션")
- 자세한 설명: 4000자
  - 게임 소개 + 핵심 루프 + 캐릭터 종류 + **확률형 아이템 확률표** (한국 법규)

### 6-5-5. 스토어 ASO (App Store Optimization)
- 제목 키워드: 반려동물, 힐링, 시뮬레이션, 고양이, 강아지
- 카테고리: 시뮬레이션
- 태그: 반려동물 키우기, 인테리어, 동물 게임

---

## 6-6. 에셋 통합 워크플로

1. **에셋 폴더 구조** (Capacitor 호환):
   ```
   src/assets/
     characters/
     furniture/
     ui/
     audio/
   ```
2. **Phaser preload**: `BootScene` 또는 `LoadingScene`에서:
   ```typescript
   this.load.image('char_cat_munchkin_idle', 'assets/characters/char_cat_munchkin_idle.png');
   this.load.audio('bgm_lobby', 'assets/audio/bgm_lobby.ogg');
   ```
3. 에셋 키는 `Constants.ts`의 `ASSET_KEYS` 같은 상수로 관리 (오타 방지)

> 현재 코드는 `add.rectangle/circle/text` 로 placeholder만 사용. 실제 에셋 도입은 폴리싱 단계의 마지막 작업.

---

## 6-7. 체크리스트

- [ ] 스타일 레퍼런스 3장 확정
- [ ] 캐릭터 17종 idle 완료
- [ ] 캐릭터 17종 sleep 완료
- [ ] 캐릭터 i18n 51 키 작성
- [ ] 가구 MVP 5종 + 추가 145종
- [ ] `furniture-catalog-sync` 테스트 통과
- [ ] 미니게임 UI 16개 (블록3 + 머지10 + 퀴즈3)
- [ ] 가챠 UI 4개
- [ ] 자원/레벨/광고 아이콘 7개
- [ ] BGM 5곡
- [ ] SFX 11종
- [ ] `audio/LICENSES.md` 출처 기록 완비
- [ ] 앱 아이콘 1024×1024
- [ ] 스플래시 2732×2732
- [ ] 피처 그래픽 1024×500
- [ ] 스크린샷 8개 이상
- [ ] 스토어 짧은/자세한 설명 + 확률 공시 포함

---

## 다음 단계

→ [§7 법규 / 개인정보 / 약관](./07-legal.md)

## 자주 막히는 곳

- **`@capacitor/assets generate` 가 splash 못 만듦**: `resources/splash.png` 가 정사각형이 아니거나 알파 채널 누락
- **사운드 파일이 안드로이드에서 안 나옴**: `.mp3` 보다 `.ogg` 권장. 그래도 안 되면 `audio` 키를 lazy load로 분리
- **캐릭터 일관성 안 맞음**: Midjourney에서 `--seed` + `--style raw` + 같은 prompt prefix 강제
