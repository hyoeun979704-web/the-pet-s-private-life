# 9. 출시 전 최종 체크

> **목표**: 소프트 런치(β) → 정식 출시 사이의 모든 게이트를 한 번에 점검.
> **소요**: 0.5일 (반나절 차분히 한 줄씩 체크)
> **사전 조건**: §1~§8 모두 완료

---

## 9-1. 코드 / 테스트 (자동 검증)

프로젝트 루트에서 한 번에:
```bash
npm run lint && npm run typecheck && npm run test && npm run build
```
4개 모두 0 error여야 진행.

| 항목 | 상태 |
|---|---|
| ESLint 0 errors | ☐ |
| TypeScript strict 0 errors | ☐ |
| Vitest 216+ tests pass | ☐ |
| Vite build 성공 | ☐ |

**Cloud Functions 별도 검증**:
```bash
cd functions && npm run lint && npm run build && cd ..
```
| 항목 | 상태 |
|---|---|
| Functions lint 통과 | ☐ |
| Functions tsc 통과 | ☐ |

**(선택) GitHub Actions 추가**:
`.github/workflows/ci.yml` 에 functions job 추가:
```yaml
- name: Functions install + build
  working-directory: functions
  run: |
    npm ci
    npm run build
    npm run lint
```

---

## 9-2. 콘텐츠 게이트 (런칭 기준)

| 항목 | 목표 | 상태 |
|---|---|---|
| 캐릭터 17종 idle 일러스트 | 17/17 | ☐ |
| 캐릭터 17종 sleep 일러스트 | 17/17 | ☐ |
| 캐릭터 i18n 51 키 (`char.*`) | 51/51 | ☐ |
| 가구 데이터 + 일러스트 | 150/150 | ☐ |
| 퀴즈 문항 | 300/300 | ☐ |
| 퀴즈 의료/과학 문항 출처 2건+ | 모든 해당 문항 | ☐ |
| BGM 5종 + SFX 11종 | 16/16 | ☐ |
| 사운드 라이선스 출처 기록 | `audio/LICENSES.md` 채움 | ☐ |
| 앱 아이콘 + 스플래시 | 1024 + 2732 | ☐ |
| 피처 그래픽 + 스크린샷 | 1 + 8장 이상 | ☐ |
| 스토어 짧은/자세한 설명 + 가챠 확률표 | 작성 완료 | ☐ |

---

## 9-3. 인프라 (Firebase + Play + AdMob)

### Firebase
- [ ] Blaze 결제 한도 알림 ($1, $10, $50 단계)
- [ ] Firestore 보안 규칙 배포 후 Tester로 write 거부 확인
- [ ] Cloud Functions 7개 배포 (`addResources`, `consumeFatigue`, `deleteAccount`, `initPlayer`, `purchaseFurniture`, `rollGacha`, `validatePurchase`, +`bumpQuizAllowance`)
- [ ] Functions 호출 한도 측정 (cold start 5~10s 첫 1회 후 정상)
- [ ] Crashlytics 활성화 + 강제 크래시 1회 → 콘솔 도착 확인
- [ ] Analytics DebugView 로 `tutorial_step` 이벤트 확인
- [ ] BigQuery 연결 (선택)

### Play Console
- [ ] 앱 콘텐츠 모든 항목 작성 완료 (개인정보, 등급, 광고, 데이터안전, 타겟층, 데이터 삭제 URL)
- [ ] 4개 SKU 등록 + 활성 (β에서는 IAP UI 차단이지만 SKU 등록은 미리)
- [ ] 내부 테스트 트랙에 첫 AAB 업로드 + 본인 검증
- [ ] (β) Closed 테스트 트랙 → 대만/홍콩 국가 선택 + 테스터 100명+
- [ ] (정식) Open 테스트 또는 Production 트랙

### AdMob
- [ ] App ID + 보상형 광고 단위 ID `.env` 입력
- [ ] 카테고리 5종 차단 (alcohol/dating/gambling/sexual/politics)
- [ ] 본인 폰 테스트 기기로 등록
- [ ] 신청 후 24~48h 후 실 광고 노출 확인

---

## 9-4. 최종 토글 (β → 정식)

| 토글 | β | 정식 |
|---|---|---|
| `IAPSystem({ enabled })` | `false` | `true` |
| 광고 ID | 테스트 | 실 ID |
| `VITE_ENV` | `production` | `production` |
| `VITE_RELEASE_STAGE` | `beta` | `production` |
| Play Console 트랙 | Closed | Open / Production |
| 출시 국가 | 대만 + 홍콩 | 한국 (Phase 1) → 일본/영어권 (Phase 2) |

---

## 9-5. KPI 모니터링 (출시 후 첫 7일)

매일 한 번 (오후 5시 권장) 체크:

| 지표 | 위치 | β 목표 | 정식 목표 |
|---|---|---|---|
| Crashlytics 크래시율 | Crashlytics 대시보드 | ≤ 1% | ≤ 0.5% |
| 튜토리얼 완주율 | Analytics → 퍼널 | ≥ 85% | ≥ 88% |
| D1 Retention | Analytics → 잠재고객 | ≥ 35% | ≥ 40% |
| D7 Retention | Analytics → 잠재고객 | ≥ 15% | ≥ 18% |
| ARPDAU | AdMob 보고서 + IAP | ≥ $0.05 | ≥ $0.10 |
| 평균 세션 시간 | Analytics 사용자 행동 | ≥ 8분 | ≥ 10분 |
| 일일 활성 사용자 (DAU) | Analytics 개요 | (베이스라인) | 우상향 |

### 9-5-1. 빨간 신호 → 대응
- **크래시율 > 1%**: 24시간 내 핫픽스 빌드 → internal 트랙 검증 → production 출시
- **튜토리얼 완주율 < 70%**: 5단계 중 어디서 이탈하는지 퍼널 확인 → 해당 단계 UX 수정
- **D1 < 25%**: 첫인상 문제 (스플래시/로딩/메인 첫 화면). 스크린샷 + 비디오로 재점검
- **광고 fill rate < 50%**: AdMob 콘솔 → 광고 단위 → "필요 시 미디에이션 추가"

---

## 9-6. 운영 루틴

### 매일 (5분)
- [ ] Crashlytics 신규 이슈 확인
- [ ] Analytics 어제 DAU + ARPDAU 기록 (스프레드시트)
- [ ] 지원 이메일 확인

### 매주 (30분)
- [ ] AdMob 수익 추이
- [ ] Cloud Functions 사용량 (Blaze 비용)
- [ ] Firestore 사용량 (read/write)
- [ ] 퍼널 최적화 후보 1건 정리

### 매월
- [ ] 시즌 콘텐츠(`data/seasons.json`) 교체 — 월 1회 시즌 권장
- [ ] 업데이트 빌드 (콘텐츠 추가 또는 버그픽스)
- [ ] 고객 지원 응답 시간 평균 점검 (목표 24시간 내)

---

## 9-7. 후속 PART (정식 출시 후 로드맵)

### Phase 2 (정식 출시 후 1개월)
- [ ] **3번째 방** (`room_kitchen`) 활성화 — 데이터만 채우면 되므로 빠름
- [ ] 캐릭터 18종+ 추가 (시즌 한정)
- [ ] 머지 게임 Lv.11+ (확장)

### Phase 3 (글로벌 확장)
- [ ] **일본 출시** — `ja.json` 100% 완성 + 일본 ASO
- [ ] **영어권 출시** — `en.json` 100% + Google Play 다국가 활성

### Phase 4 (정착 후)
- [ ] 길드/소셜 기능 검토
- [ ] 친구 초대 보상 (referral)
- [ ] 라이브 이벤트 (시즌 쿠폰 코드 등)

---

## 9-8. 백업 & 복구 시나리오

### Firestore 백업
- [ ] Firebase 콘솔 → Firestore → **가져오기/내보내기** → 일일 자동 export 설정 (Cloud Storage 버킷에 저장)
- [ ] 보관 기간: 30일

### 서명 키 백업
- [ ] §2-3-1의 3중 백업 위치 점검
- [ ] 비밀번호 매니저 secure note 갱신 일자 기록

### 롤백 절차 (출시 후 심각한 버그)
1. Play Console → 출시 → 새 버전 만들기 → 직전 빌드의 AAB 다시 업로드
2. 또는 출시 → 출시 단계적 롤아웃 → 비율 0%로 일시 중단

### Cloud Functions 롤백
```bash
firebase functions:list   # 배포 이력
firebase deploy --only functions:addResources --force
# 또는 git revert 후 재배포
```

---

## 9-9. 출시 D-1 마지막 체크

- [ ] 모든 §1~§8 체크박스 완료
- [ ] 마지막 prod 빌드: `npm run build:prod && npx cap sync android && cd android && ./gradlew bundleRelease`
- [ ] AAB 파일 크기 ≤ 80MB (ROADMAP §성능 예산)
- [ ] 본인 폰에서 production AAB 설치 → 30분 플레이 (모든 미니게임 + 가챠 + 결제 1회)
- [ ] Cloud Functions 콜드 스타트 1회 워밍업 (warmup endpoint 호출)
- [ ] 백업 키 위치 다시 한 번 확인
- [ ] 출시 알림 채널 (디스코드/카카오/SNS) 준비

---

## 9-10. 출시 D-Day

| 시간 | 작업 |
|---|---|
| 09:00 | Play Console에서 Production 트랙으로 promote |
| 09:30 | 검토 통과 대기 (수 시간~24h) |
| (검토 통과) | 단계적 롤아웃 시작 (10% 권장) |
| +6h | 크래시율 / 튜토리얼 완주율 1차 점검 |
| +24h | 정상이면 50%로 확장 |
| +48h | 100% 롤아웃 |

---

## 다음 단계

🎉 출시 후에는 정기 운영. [SOFT_LAUNCH.md](../../SOFT_LAUNCH.md) 와 본 문서의 §9-6 운영 루틴이 일상이 됩니다.

## 자주 막히는 곳

- **Play 검토 거부 — "데이터 안전 미스매치"**: §7-4-2 답변과 매니페스트 권한이 어긋남. AD_ID 권한이 있는데 광고 답변 안 했거나, INTERNET 외 권한이 데이터 안전에 안 적힘
- **Play 검토 거부 — "확률형 아이템 미공개"**: 약관 + 게임 내 + 스토어 설명 3곳 일치 필수
- **출시 직후 크래시 폭증**: 로컬에서 보지 못한 안드로이드 버전이슈일 가능성. Crashlytics에서 stacktrace 확인 → 단계적 롤아웃 비율 0%로 일시 중단 → 핫픽스
- **AAB 80MB 초과**: 사운드 압축 (192kbps → 96kbps), 이미지 webp 변환, manualChunks 점검
