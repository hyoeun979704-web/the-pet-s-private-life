# 📚 HANDOFF — 상세 가이드

`HANDOFF.md`의 9개 섹션을 한 번에 처리할 수 있도록 단계별로 풀어쓴 문서들입니다. **위에서 아래로 차례대로** 처리하세요. 각 문서 끝에 "다음 단계" 링크가 있습니다.

## 작업 순서

| # | 문서 | 예상 소요 | 사전 조건 |
|---|---|---|---|
| 1 | [Firebase 프로젝트 세팅](./01-firebase.md) | 60~90분 | Google 계정, 결제카드 (Blaze) |
| 2 | [Capacitor / Android 빌드](./02-capacitor.md) | 90~120분 | Android Studio 설치, JDK 17+ |
| 3 | [AdMob 광고](./03-admob.md) | 30~45분 | §1 완료, AdMob 계정 |
| 4 | [IAP (Google Play Billing)](./04-iap.md) | 60~90분 | Play Console 개발자 계정 ($25) |
| 5 | [Crashlytics + Analytics](./05-analytics-crashlytics.md) | 30~60분 | §1 완료 |
| 6 | [에셋 (그래픽 + 사운드)](./06-assets.md) | 수일~수주 | Midjourney/Suno 구독, Figma |
| 7 | [법규 / 개인정보 / 약관](./07-legal.md) | 1~2일 | URL 호스팅 환경 (정적 호스팅 OK) |
| 8 | [프로덕션 부트스트랩 wiring](./08-prod-bootstrap.md) | 4~6시간 | §1, §3, §5 완료 |
| 9 | [출시 전 최종 체크](./09-launch-checklist.md) | 0.5일 | 위 8개 모두 완료 |

## 빠른 참조

- **환경변수 한 번에 보고 싶다**: [01-firebase.md §1-2](./01-firebase.md#1-2-앱-등록-7개-키-수집) + [03-admob.md §3-1](./03-admob.md#3-1-앱-id--광고-단위-id) + [05-analytics-crashlytics.md](./05-analytics-crashlytics.md) + [07-legal.md](./07-legal.md)
- **에셋만 외주 맡기고 싶다**: [06-assets.md](./06-assets.md) 의 표를 그대로 발주서에 사용
- **출시 D-1 체크리스트**: [09-launch-checklist.md](./09-launch-checklist.md)

## 약속

- 각 단계 끝에 **"다음 단계"** 링크 + **검증 명령** 포함
- 모든 외부 콘솔 단계는 **버튼 라벨**까지 표기 (Firebase 콘솔이 한국어로 가정)
- 코드 변경이 필요하면 **파일 경로 + 패치 블록** 제공
