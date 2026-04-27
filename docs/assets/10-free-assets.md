# 10. 무료 에셋 모음 (0원 출시 가능한가?)

> **목적**: 한 푼도 안 쓰고 받을 수 있는 자산 큐레이션. 라이선스 안전한 것만.
> **결론**: 본 게임은 **UI·사운드·폰트는 무료로 100% 가능**. 캐릭터·가구는 톤 일관성 때문에 AI($10) 권장.

---

## 🚦 라이선스 한 번에 이해하기

| 라이선스 | 상업 OK? | 출처 명시? | 우리 게임 사용 |
|---|---|---|---|
| **CC0 / Public Domain** | ✅ | 의무 X | 100% 안전 ⭐ |
| **CC-BY** | ✅ | 의무 ⭐ | OK (LICENSES.md 기록) |
| **CC-BY-SA** | ✅ | 의무 + 같은 라이선스 | 게임 자체 라이선스 영향 X — 자산만 표시 |
| **CC-BY-NC** | ❌ 비상업만 | — | **사용 불가** (Play Store 출시 = 상업) |
| **MIT / Apache** | ✅ | 의무 | OK (주로 폰트·코드) |

> **꿀팁**: 다운로드 직후 `src/assets/{종류}/LICENSES.md` 에 즉시 기록. 나중에 잊으면 분쟁 시 증빙 불가.

---

## 🎨 1) UI 아이콘 — **무료로 충분** ⭐⭐⭐

### 추천 1순위
| 사이트 | 라이선스 | 강점 |
|---|---|---|
| **[Game-icons.net](https://game-icons.net)** ⭐⭐⭐ | CC-BY 3.0 | 4000+ 게임 아이콘, 검색 강력 |
| **[Kenney UI Packs](https://kenney.nl/assets?q=ui)** ⭐⭐⭐ | CC0 | UI 풀세트, 출처 의무 X |
| **[Lucide Icons](https://lucide.dev)** | ISC (MIT 비슷) | 시스템 아이콘 (설정·뒤로 등) |
| **[Heroicons](https://heroicons.com)** | MIT | UI 시스템 아이콘 |
| **[Iconoir](https://iconoir.com)** | MIT | 1000+ 무료 아이콘 |

### 우리 게임에 매핑
- **자원 아이콘 5개** (간식/별먼지/마법돌/조각/티켓) → Game-icons.net 검색 키워드: `cookie`, `star`, `gem`, `crystal-shard`, `ticket`
- **시스템 아이콘** (설정/닫기/뒤로/도움말) → Lucide 또는 Heroicons
- **메뉴 아이콘** (가구/가챠/도감/미니게임) → Kenney + 본인 색칠

> **작업법**: SVG 다운 → Figma 또는 Inkscape에서 색만 우리 팔레트로 교체 → PNG export.

---

## 🎵 2) BGM — 무료 가능 (출처 의무 있음)

### 추천
| 사이트 | 라이선스 | 강점 |
|---|---|---|
| **[Incompetech (Kevin MacLeod)](https://incompetech.com)** ⭐⭐⭐ | CC-BY 3.0 | 게임 BGM 정석, 수천 곡 |
| **[Free Music Archive](https://freemusicarchive.org)** | 다양 (CC-BY, CC0) | 인디 음악 많음 |
| **[OpenGameArt 음악](https://opengameart.org/art-search-advanced?field_art_type_tid%5B%5D=12)** | 다양 (CC0 필터) | 게임용 |
| **[Pixabay Music](https://pixabay.com/music/)** | Pixabay License (CC0 비슷) | 출처 의무 X ⭐ |
| **[YouTube Audio Library](https://www.youtube.com/audiolibrary)** | CC0 또는 출처 | 카테고리·기분별 검색 |

### 우리 게임에 매핑 (5곡)
- **`bgm_lobby`** (따뜻 카페) → Incompetech 키워드: `cozy`, `acoustic`, `relaxing`
- **`bgm_block_puzzle`** (경쾌) → `puzzle`, `chiptune`, `playful`
- **`bgm_merge_game`** (차분) → `lo-fi`, `ambient`, `meditation`
- **`bgm_quiz`** (호기심) → `quiz show`, `light tension`
- **`bgm_gacha`** (마법) → `magical`, `music box`, `fairy`

### 출처 표기 양식 (CC-BY)
`src/assets/audio/LICENSES.md`:
```markdown
## bgm_lobby.ogg
- 출처: "Carefree" by Kevin MacLeod (https://incompetech.com)
- 라이선스: CC BY 3.0 (https://creativecommons.org/licenses/by/3.0/)
- 변경: 30초 루프 추출, 볼륨 정규화
```

---

## 🔊 3) SFX — **100% 무료로 충분** ⭐⭐⭐

### 추천 1순위
| 사이트 | 라이선스 | 강점 |
|---|---|---|
| **[Freesound.org](https://freesound.org)** ⭐⭐⭐ | 다양 (CC0 필터 가능) | 50만+ SFX |
| **[Kenney Audio](https://kenney.nl/assets/category:Audio)** ⭐⭐⭐ | CC0 | UI·게임 SFX 팩 |
| **[OpenGameArt SFX](https://opengameart.org/art-search-advanced?field_art_type_tid%5B%5D=13)** | 다양 (CC0 필터) | 게임용 |
| **[Mixkit Free SFX](https://mixkit.co/free-sound-effects/)** | Mixkit License | 출처 의무 X |
| **[BFXR](https://www.bfxr.net)** | 직접 생성, 무료 | 8-bit 효과음 |

### Freesound 검색 팁
- **로그인 필수** (CC0 다운로드)
- 검색 시 사이드바에서 **License: Creative Commons 0** 필터 ⭐
- 키워드 영어로: `tap`, `pop`, `coin`, `magic chime`, `level up`

### 우리 게임 11종 매핑
| 우리 SFX | 검색 키워드 | 추천 사이트 |
|---|---|---|
| `sfx_tap` | `ui click`, `wooden tap` | Kenney UI Audio CC0 |
| `sfx_place` | `soft drop`, `cushion` | Freesound CC0 |
| `sfx_merge` | `magic chime`, `sparkle` | Freesound |
| `sfx_line_clear` | `glass chime`, `success` | Freesound |
| `sfx_gacha_roll` | `capsule roll`, `gachapon` | Freesound |
| `sfx_gacha_normal` | `ding`, `bell single` | Freesound |
| `sfx_gacha_rare` | `chime double`, `magic` | Freesound |
| `sfx_gacha_legendary` | `fanfare short`, `victory` | Freesound |
| `sfx_level_up` | `level up`, `power up` | BFXR + Freesound |
| `sfx_purchase` | `cash register soft`, `ding dong` | Freesound |
| `sfx_error` | `wrong answer soft`, `gentle fail` | Freesound |

> **30분 작업법**: Freesound 로그인 → CC0 필터 → 위 11개 키워드 검색 → 다운 → Audacity로 OGG 변환 + 정규화. 끝.

---

## 🔤 4) 폰트 (한글) — 모두 무료, 상업 OK

### 이미 게임에 적용됨
- **[Pretendard](https://github.com/orioncactus/pretendard)** ⭐ — Open Font License, 깔끔
- **[Noto Sans KR](https://fonts.google.com/noto/specimen/Noto+Sans+KR)** — Apache, fallback

### 추가 옵션 (스토어 자산 / 마케팅용)
| 폰트 | 출처 | 라이선스 |
|---|---|---|
| **[눈누 (noonnu.cc)](https://noonnu.cc)** ⭐⭐⭐ | 한글 무료 폰트 큐레이션 | 폰트별 명시 (상업 필터 필수) |
| **카페24 폰트 시리즈** | 카페24 | 상업 OK |
| **G마켓 산스** | G마켓 | 상업 OK |
| **본명조 / 본고딕 (Source Han)** | Adobe | OFL (무료) |

> 게임 내부 폰트는 이미 잘 잡혀 있음. 스토어 그래픽·피처 그래픽에 임팩트 폰트 필요할 때 사용.

---

## 🛋️ 5) 가구 — 무료는 톤 안 맞을 가능성 높음

### 시도해볼 만한 무료 출처
| 사이트 | 라이선스 | 적합도 |
|---|---|---|
| **[Kenney "Furniture Kit"](https://kenney.nl/assets/furniture-kit)** | CC0 | 3D 모델 — 톤 안 맞음 |
| **[OpenGameArt "isometric furniture"](https://opengameart.org/content/search?keys=isometric+furniture)** | 다양 | 일부 OK |
| **[Itch.io 무료 자산](https://itch.io/game-assets/free/tag-furniture)** | 다양 | 인디 톤 |
| **[Pixabay Vectors](https://pixabay.com/vectors/search/furniture/)** | Pixabay License | 일부 OK, 톤 다양 |

### 현실적인 전략
- 무료 자산 50개 받아 **본인 톤으로 보정** (어도비 일러스트레이터, Figma)
- 또는 무료로 못 채우면 → **Niji Journey $10/월** 1개월만 양산

> 가구 150종 톤 일관성이 게임 완성도의 80%. 여기서 타협 X.

---

## 🐱 6) 캐릭터 — 무료 거의 불가능

### 현실
- 17종 × idle/sleep = 34장
- 무료 자산은 톤이 다 다름 → 게임 일관성 깨짐
- "귀여운 동물 일러스트 무료" 검색 결과는 대부분 **CC-BY-NC** (비상업)

### 무료 시도해볼 곳
| 사이트 | 비고 |
|---|---|
| **[OpenGameArt "cat"](https://opengameart.org/art-search-advanced?keys=cat)** | 픽셀 위주, 우리 톤 X |
| **[Kenney Animal Pack](https://kenney.nl/assets?q=animal)** | 3D, 우리 톤 X |

### 추천 대안
- **Niji Journey** $10 1개월 → 17종 다 양산 (가장 가성비)
- **본인이 그리기** (Procreate $10 일회성) — 시간 들임
- **크몽 외주** — 캐릭터 5종만 30만원, 나머지 12종은 본인

---

## 🌅 7) 배경 — 보정 전제로 무료 가능

### 추천
| 사이트 | 라이선스 | 비고 |
|---|---|---|
| **[Pixabay](https://pixabay.com/illustrations/search/cozy%20room/)** | Pixabay License | 검색: `cozy interior illustration` |
| **[Unsplash](https://unsplash.com)** | Unsplash License | 사진 (레퍼런스용) |
| **[Pexels](https://pexels.com)** | Pexels License | 사진 + 일러스트 |
| **[Vecteezy 무료](https://vecteezy.com/free-vector/cozy-room)** | Vecteezy License | 출처 의무 (무료 플랜) |

### 작업법
1. Pixabay 에서 일러스트 거실 1~2장 다운
2. Photoshop / Figma 로 색 톤만 우리 팔레트로 변환
3. 가구 격자 영역 비우기
4. → 완성

---

## 📦 8) 0원 풀패키지 워크플로 (현실 버전)

```
[Day 1] 폰트 — Pretendard (이미 적용됨, 0초)
[Day 1] UI 아이콘 — Game-icons.net + Kenney (1~2시간)
[Day 2] SFX 11종 — Freesound CC0 필터 + Kenney (30분~1시간)
[Day 2] BGM 5곡 — Incompetech (출처 명시 + 30분)
[Day 3-4] 배경 — Pixabay + 본인 보정 (반나절)
[Day 5-?] 가구 — Kenney + OpenGameArt + 보정 (1~2주)
[Week 2-?] 캐릭터 — 여기는 타협 어려움
```

### 가장 큰 병목: 캐릭터
- 17종 통일된 톤이 무료로는 거의 불가능
- 추천: 캐릭터만 **Niji Journey $10/월 1개월** ⭐
- → 그러면 사실상 **$10으로 풀패키지 가능**

---

## 🎯 우리 게임 0원 출시 결론

### 가능한 영역 (100% 무료)
- ✅ UI 아이콘
- ✅ SFX 11종 (Freesound CC0)
- ✅ BGM 5곡 (Incompetech CC-BY)
- ✅ 폰트 (Pretendard)

### 약간 손이 가는 영역 (무료 + 보정)
- ⚠️ 배경 (Pixabay + 보정)
- ⚠️ 가구 일부 (Kenney + 보정)

### 무료로 어려운 영역
- ❌ 캐릭터 17종 (Niji Journey $10 권장)
- ❌ 가구 풀세트 150종 (양산 한계)

### 최종 추천
**$10 + 무료** 조합이 가성비 최고:
- Niji Journey 1개월 ($10) → 캐릭터 17종 + 가구 100종
- 나머지 모두 무료 (UI·사운드·BGM·폰트·배경)
- 총 비용: **약 1.4만원**

---

## 📚 라이선스 기록 템플릿

작업 시작 전에 이 파일들 만들기:

`src/assets/audio/LICENSES.md`
`src/assets/ui/LICENSES.md`
`src/assets/furniture/LICENSES.md`
`src/assets/characters/LICENSES.md`

각각 양식:
```markdown
# {category} Asset Licenses

| 파일 | 출처 | 라이선스 | 변경 사항 | 다운 일자 |
|---|---|---|---|---|
| sfx_tap.ogg | freesound.org/people/USER/sounds/12345 | CC0 | OGG 변환, -3dB | 2026-04-27 |
| icon_resource_snack.png | game-icons.net/lorc/cookie | CC-BY 3.0 | 색 변경 (#FFC8DD) | 2026-04-27 |
```

---

## 🔗 빠른 북마크 (한 줄 모음)

### 무료 1순위
- 게임 아이콘: https://game-icons.net
- UI/사운드 종합: https://kenney.nl
- SFX: https://freesound.org
- BGM: https://incompetech.com
- 한글 폰트: https://noonnu.cc

### 무료 2순위
- 일러스트: https://opengameart.org
- 사진: https://pixabay.com
- BGM: https://freemusicarchive.org
- BGM 출처 의무 X: https://pixabay.com/music/

### 라이선스 도움
- CC0 설명: https://creativecommons.org/publicdomain/zero/1.0/
- CC-BY 설명: https://creativecommons.org/licenses/by/4.0/

---

다음 → [에셋 README](./README.md) 로 돌아가기 또는 [09. 유료 마켓플레이스](./09-marketplaces.md)
