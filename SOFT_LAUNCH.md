# 🚀 소프트 런치 체크리스트 (β · 대만/홍콩)

ROADMAP §단계별 출시 스코프 §β 기준. 한국 정식 출시 전에 대만/홍콩에서 라이브 데이터를 모아 광고 단가·리텐션·튜닝을 검증하는 단계.

## 콘텐츠 게이트

- [ ] 캐릭터 17종 데이터 + 일러스트 70%+ 완성
- [ ] 가구 150개 중 100개+ 등록
- [ ] 퀴즈 300문항 중 200+ 검증 완료 (`sources` 필드 2건+ 입력)
- [ ] 미니게임 3종 모두 안정 (`tests` green + 수동 30분 플레이 확인)
- [ ] 가챠 확률 공시(GachaRatesScene) 실기 표시 확인

## 수익 모델

- [x] 광고: 보상형 5종 모두 활성 (`AdSystem.canWatch` 확인)
- [ ] **IAP: 비활성** — `initServices` 호출 시 `enabled: false` 전달 또는 IAP 카탈로그 노출 차단
- [ ] AdMob 콘솔: 카테고리 필터 (alcohol/dating/gambling/sexual/politics) 적용
- [ ] AdMob 테스트 광고 ID로 internal track 빌드 검증 → live ID 교체

## i18n

- [ ] 대만 간체 중국어 (또는 한국어) 임시 운용 결정
- [x] `tests/i18n-completeness.test.ts` 통과 (한국어 100%)
- [ ] 추가 로케일 (`zh-Hant.json`) 추가 시 같은 키 구조 유지
- [ ] `i18n.t` 폴백이 사용되는 위치를 grep으로 점검 (운영 중 노출 위험)

## 분석

- [x] `AnalyticsSystem` 11개 이벤트 코드 wiring 완료
- [ ] Firebase Analytics 전송 transport 교체 (현재 ConsoleTransport)
- [ ] Firebase 콘솔에서 다음 funnel 등록:
  - tutorial: `tutorial_step` 5단계 → `tutorial_complete`
  - retention: D1 / D7 dashboards
- [ ] BigQuery export 활성화 (선택, 광고 ROI 분석용)

## 보안 / 법규

- [x] Firestore 규칙: 클라이언트 write deny, Cloud Functions만 자원 변경
- [x] Cloud Functions: cap·whitelist·daily limit·session limit 검증
- [x] `deleteAccount` callable 제공
- [ ] 개인정보처리방침 URL 호스팅 (`VITE_PRIVACY_POLICY_URL`)
- [ ] 14세 미만 가입 차단 정책 텍스트 + 가입 흐름 점검
- [ ] Google Play 콘텐츠 등급 질의서 작성 (전체이용가)
- [ ] 가챠 확률 공시 위치: 가챠 화면 + 메인 메뉴 모두에서 도달 가능 확인

## 기술

- [ ] `npx cap add android` → `cap sync android` → 시그니처 키 생성
- [ ] CI: GitHub Actions에 functions 워크스페이스 lint/build job 추가
- [ ] 프로덕션 services bootstrap (`initProdServices`) 작성: `addResources` callable + `FirestoreSaveBackend` + 실제 AdMob 어댑터 + Crashlytics 어댑터
- [ ] Crashlytics dSYM/매핑 업로드 (Android는 ProGuard mapping)
- [ ] 첫 진입 로딩 ≤ 5s (Wi-Fi) 측정
- [ ] 메인 씬 메모리 ≤ 300MB 측정 (Android Profiler)

## KPI 목표 (β 기준)

| 지표 | 목표 |
|---|---|
| 튜토리얼 완주율 | ≥ 85% |
| D1 Retention | ≥ 35% |
| D7 Retention | ≥ 15% |
| ARPDAU (광고만) | ≥ $0.05 |
| Crashlytics 크래시율 | ≤ 1% |

## 운영

- [ ] 응대 채널: `VITE_SUPPORT_EMAIL` 자동응답 + 1일 1회 점검
- [ ] 시즌 데이터(`data/seasons.json`) 핫스왑 절차 문서화
- [ ] 일일 점검 루틴 (Crashlytics + Analytics 대시보드 5분)

---

체크리스트 항목이 끝나는 대로 정식 출시(한국) 단계로 승급.
