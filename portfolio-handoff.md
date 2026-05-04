# Portfolio Handoff

## 문서 목적
- 이 문서는 모의투자 자산/프로필 포트폴리오 작업을 다른 PC나 다른 세션에서 바로 이어가기 위한 handoff 문서다.
- 단순 구현 목록이 아니라, `설계 의도`, `확정된 정책`, `현재 구조`, `구현 완료 상태`, `남은 작업`, `주의할 점`까지 함께 정리한다.
- 작업 재개 시에는 이 문서를 먼저 읽고 현재 상태를 파악한 뒤 다음 구현이나 프론트 연동을 진행하면 된다.

## 작업 재개 시 사용하면 좋은 요청 예시
- "`portfolio-handoff.md` 먼저 읽고 현재 포트폴리오 구조와 정책을 파악한 뒤, 남은 작업을 이어서 진행해줘."
- "`portfolio-handoff.md` 기준으로 자산 API와 프로필 API 분리 상태를 점검하고, 프론트에 전달할 계약만 정리해줘."
- "`portfolio-handoff.md` 참고해서 모의투자 포트폴리오의 동시성/예외 정책 테스트 체크리스트부터 다시 만들어줘."

## 전체 설계 방향

### 1. 자산탭 API와 프로필 API를 명확히 분리
- 기존 포트폴리오 응답은 자산탭 상세 조회 성격이 강했다.
- 프론트 화면은 이미
  - 프로필 화면(`/me`, `/member/{memberId}`)
  - 자산탭 화면(`/assets`)
  로 책임이 나뉘어 있었다.
- 그래서 백엔드도 계약을 분리했다.
  - 자산탭: 상세 조회 전용
  - 프로필: 프로필 화면 전용

### 2. 계산 로직은 공용, 응답 DTO는 목적별 분리
- 계산식 자체는 `PortfolioCalculationService`에서 공통으로 계산한다.
- 외부 응답 계약은 아래처럼 분리했다.
  - `AssetPortfolioDetailResponseDto`
  - `ProfilePortfolioResponseDto`
- 즉 "로직 중복"은 피하고, "API 의미"만 분리하는 방향으로 갔다.

### 3. holdingRatio는 총자산 기준으로 통일
- 예전에는 백엔드 `holdingRatio`가 `전체 코인 평가금 대비` 기준이었다.
- 프론트 파이차트는 `총자산(현금 포함) 대비` 기준으로 계산하고 있었다.
- 현재는 프론트 기준에 맞춰 백엔드도 아래 식으로 통일했다.

```text
holdingRatio = coinTotalValue / totalAsset * 100
```

- 따라서 `holdingRatio`는 "코인 내부 점유율"이 아니라 "내 총자산 중 이 코인의 비중"을 뜻한다.

### 4. 과거 기록 스냅샷 기능은 이번 범위에서 제외
- 모의투자는 현재 기록만 보여준다.
- `PortfolioSnapshot` 기반의 과거 라운드/기록 기능은 현재 사용하지 않는다.
- 이번 작업의 "일관성"은 과거 시점을 저장하는 기능이 아니라, 이번 한 번의 조회 안에서 계산 기준을 최대한 맞추는 의미다.

### 5. 프로필 API는 현재 활성 MOCK 지갑 기준으로만 제공
- 내 프로필과 다른 회원 프로필 모두 현재 활성 MOCK 지갑만 대상으로 조회한다.
- ACTIVE 지갑이 없으면 과거 기록을 꺼내 보여주지 않는다.

## 확정된 정책

### 1. API 책임
- `GET /api/v1/asset/mock/portfolio`
  - 자산탭 상세 조회용
- `GET /api/v1/member/me/portfolio`
  - 내 프로필 포트폴리오 조회용
- `GET /api/v1/member/{memberId}/portfolio`
  - 다른 회원 프로필 포트폴리오 조회용

### 2. 프로필 API 응답 의미
- 회원 없음 / 탈퇴 회원: `404 Not Found`
- 회원은 존재하지만 활성 MOCK 지갑 없음: `204 No Content`
- 활성 MOCK 지갑 있음: `200 OK`

### 3. 자산탭 API 응답 의미
- 자산탭은 기존 자산 상세 조회 흐름을 유지한다.
- 활성 MOCK 지갑이 없으면 기존처럼 예외 메시지 기반으로 처리한다.
- 프로필 API와 자산탭 API는 "지갑 없음"의 의미를 다르게 둔다.

### 4. updatedAt 의미
- `updatedAt`는 실시간 시세가 마지막으로 바뀐 시각이 아니다.
- `updatedAt`는 지갑 또는 보유자산 구성이 마지막으로 변경된 시각이다.
- 계산 기준:

```text
updatedAt = max(wallet.updatedAt, holdings[].updatedAt)
```

### 5. 조회 일관성 정책
- "과거 기록 스냅샷"은 사용하지 않는다.
- 대신 이번 한 번의 조회 안에서는 가능한 한 같은 기준으로 계산한다.
- 적용 내용:
  - wallet/holdings 조회는 `REPEATABLE_READ`
  - 시세는 종목별 반복 조회 대신, 한 번에 모아 읽어 같은 가격 집합으로 계산

### 6. 동시성 정책
- 회원당 동시에 ACTIVE 상태인 MOCK 지갑은 1개만 허용한다.
- `participateMock()`는 코드 검증 + DB 유니크 인덱스로 2중 방어한다.
- `giveUpMock()`는 주문 생성/체결과 같은 지갑 락 경로를 사용한다.

## 구현 완료 상태

### 1. DTO / API 분리
- 기존 `PortfolioResponseDto`를 자산탭용 `AssetPortfolioDetailResponseDto`로 분리 완료
- 프로필용 `ProfilePortfolioResponseDto` 신규 추가 완료
- `HoldingResponseDto`는 현재 자산/프로필 양쪽에서 공용 재사용 중

### 2. 컨트롤러 분리
- `MockAssetController`
  - 자산탭용 `/asset/mock/portfolio` 유지
- `MemberController`
  - `/member/me/portfolio`
  - `/member/{memberId}/portfolio`
  추가 완료

### 3. 서비스 분리
- 자산탭:
  - `MockAssetService#getMyMockPortfolio`
- 프로필:
  - `MemberPortfolioService#getMyProfilePortfolio`
  - `MemberPortfolioService#getMemberProfilePortfolio`
- 계산 공통:
  - `PortfolioCalculationService#calculatePortfolio`

### 4. holdingRatio 계산 수정 완료
- 기존:

```text
coinTotalValue / totalCoinValue * 100
```

- 변경 후:

```text
coinTotalValue / totalAsset * 100
```

### 5. 조회 일관성 개선 완료
- `MockAssetService#getMyMockPortfolio`에 `REPEATABLE_READ` 적용 완료
- `MemberPortfolioService#getMyProfilePortfolio`에 `REPEATABLE_READ` 적용 완료
- `MemberPortfolioService#getMemberProfilePortfolio`에 `REPEATABLE_READ` 적용 완료
- `PortfolioCalculationService`에서 종목 가격을 `findAllBySymbols(...)`로 한 번에 읽도록 변경 완료

### 6. 프로필 API 응답 정책 반영 완료
- 회원 없음/탈퇴 회원은 `MemberException.memberNotFound()`로 `404`
- 지갑 없음은 `Optional.empty()` 반환 후 컨트롤러에서 `204 No Content`
- Swagger 설명도 `200/204/404` 의미에 맞게 갱신 완료

### 7. 동시성 보강 완료
- `participateMock()`
  - `saveAndFlush()`
  - `DataIntegrityViolationException` 처리
  - DB partial unique index 추가
- `giveUpMock()`
  - `findByMemberIdAndTypeAndStatusForUpdate(...)` 사용
  - 지갑 단위 직렬화 보강

### 8. 주석/Swagger 설명 보강 완료
- DTO, controller, service에 현재 설계 기준 설명 추가 완료
- 특히 서비스 메서드별 역할과 응답 의미를 추적할 수 있도록 주석 보강 완료

## 현재 구조

### 1. 주요 DTO
- `was/src/main/java/com/yogimangchi/domain/asset/dto/response/AssetPortfolioDetailResponseDto.java`
- `was/src/main/java/com/yogimangchi/domain/member/dto/response/ProfilePortfolioResponseDto.java`
- `was/src/main/java/com/yogimangchi/domain/asset/dto/response/HoldingResponseDto.java`

### 2. 주요 서비스
- `was/src/main/java/com/yogimangchi/domain/asset/service/PortfolioCalculationService.java`
- `was/src/main/java/com/yogimangchi/domain/asset/service/mock/MockAssetService.java`
- `was/src/main/java/com/yogimangchi/domain/member/service/MemberPortfolioService.java`

### 3. 주요 컨트롤러
- `was/src/main/java/com/yogimangchi/domain/asset/controller/v1/mock/MockAssetController.java`
- `was/src/main/java/com/yogimangchi/domain/member/controller/v1/MemberController.java`

### 4. 주요 동시성/예외 관련 파일
- `was/src/main/java/com/yogimangchi/domain/asset/index/AssetCreateInitializer.java`
- `was/src/main/java/com/yogimangchi/domain/asset/repository/AssetRepository.java`
- `was/src/main/java/com/yogimangchi/global/exception/member/MemberException.java`
- `was/src/main/java/com/yogimangchi/global/exception/GlobalExceptionHandler.java`

### 5. 프론트에서 현재 쓰는 주요 화면
- `web/app/(default)/assets/page.tsx`
- `web/app/(default)/me/page.tsx`
- `web/app/(default)/member/[memberId]/page.tsx`

## 프론트 화면 기준 필수 데이터

### 1. 자산탭 포트폴리오 상세
- `cashBalance`
- `lockedMoney`
- `totalCashAsset`
- `totalBuyAmount`
- `totalCoinValue`
- `totalAsset`
- `totalProfit`
- `totalRoi`
- `holdings[].symbol`
- `holdings[].quantity`
- `holdings[].availableQuantity`
- `holdings[].lockedQuantity`
- `holdings[].averageBuyPrice`
- `holdings[].currentPrice`
- `holdings[].buyAmount`
- `holdings[].coinTotalValue`
- `holdings[].profit`
- `holdings[].roi`
- `holdings[].holdingRatio`
- `holdings[].isPriceStale`

### 2. 프로필 포트폴리오
- `/me` 화면 기준으로 현재 모의투자 값은 모두 내려주는 정책으로 정리됨
- 현재 `ProfilePortfolioResponseDto`에 포함되는 핵심 값
  - `assetType`
  - `holdingCount`
  - `seedMoney`
  - `cashBalance`
  - `totalBuyAmount`
  - `totalCoinValue`
  - `totalAsset`
  - `totalProfit`
  - `totalRoi`
  - `updatedAt`
  - `holdings`
- 공개 프로필도 현 시점에서는 같은 정책 범위로 본다.

## 동시성 / 정합성 메모

### 1. ACTIVE MOCK 지갑 유일성
- 인덱스명: `ux_assets_mock_active_member`
- 의미:

```sql
asset_type = 'MOCK' AND status = 'ACTIVE'
```

- 같은 회원은 위 조건의 지갑을 동시에 1개만 가질 수 있다.

### 2. 같은 잠금 경로 의미
- 주문 생성/체결/취소와 포기 로직이 같은 지갑 자원에 손을 대므로, 같은 지갑 row를 먼저 잠그는 경로로 맞췄다.
- 현재 `giveUpMock()`도 `for update`로 지갑을 먼저 읽는다.
- 목적:
  - 포기 중 주문 생성
  - 포기 중 체결 반영
  같은 경합에서 상태가 엇갈리지 않게 하기 위함

### 3. N+1 관련 상태
- 자산 조회 / 프로필 조회는 현재 전형적인 JPA N+1 문제는 아니다.
- 현재 조회 흐름은 대략
  - 회원 확인 1회
  - 활성 지갑 조회 1회
  - holdings 조회 1회
  - 가격은 메모리 저장소에서 symbol 목록 기준 1회
- 다만 완전한 과거 스냅샷 기능이 아니라, "이번 요청 안에서 계산 기준을 최대한 맞춘다" 수준으로 보는 것이 맞다.

## 예외 / 응답 정책 정리

### 1. 프로필 API
- 비로그인 `/member/me/portfolio`: `401`
- 회원 없음 또는 탈퇴 회원: `404`
- 회원은 있지만 활성 MOCK 지갑 없음: `204`
- 정상 조회: `200`

### 2. 자산탭 API
- 비로그인: 인증 정책에 따름
- 활성 MOCK 지갑 없음: 기존 비즈니스 예외 메시지 유지
- 정상 조회: `200`

## 빌드 및 검증 상태
- 최근 구조 변경 후 `was` 디렉터리에서 아래 명령으로 컴파일 확인 완료

```bash
./gradlew.bat compileJava
```

- 전체 `./gradlew.bat test`는 기존 `contextLoads()`의 AWS/S3 초기화 이슈로 아직 실패 가능성이 있다.
- 따라서 현재는 타겟 테스트 또는 컴파일 검증 중심으로 보고 있다.

## 프론트 연동 메모
- 프론트는 화면을 바꾸지 않고 API 계약만 바꿔 연결하는 방향이다.
- `204 No Content`는 현재 프론트 공통 fetch 유틸에서 `null`로 처리 가능하다.
- 따라서 프로필 API는
  - 값이 있으면 `200 + JSON`
  - 값이 없으면 `204 + body 없음`
  으로 사용하는 정책을 그대로 적용할 수 있다.

## 남은 작업 우선순위

### 1순위: 프론트 API 교체
- `/me` 화면을 `member/me/portfolio` 기준으로 연결
- 공개 프로필 화면을 `member/{memberId}/portfolio` 기준으로 연결
- `204` 수신 시 빈 상태 UI 처리 정책 확인

### 2순위: 테스트 보강
- `participateMock()` 동시 요청 테스트
- `giveUpMock()`와 주문 생성/체결 경합 테스트
- 프로필 API의 `200/204/404` 계약 테스트
- `holdingRatio` 계산식 검증
- `updatedAt` 계산 검증

### 3순위: 프로필 노출 범위 재검토
- 현재는 `/me` 화면 요구치를 기준으로 프로필도 비교적 상세한 값을 내려준다.
- 이후 정책이 바뀌면 `ProfileHoldingResponseDto` 분리 여부를 다시 검토할 수 있다.

## 주의할 점
- `holdingRatio`를 다시 코인 내부 비중으로 되돌리지 말 것
- `updatedAt`를 시세 갱신 시각으로 오해하지 말 것
- 프로필 API의 `204`와 회원 없음 `404` 의미를 섞지 말 것
- 자산탭 API와 프로필 API는 같은 계산 로직을 쓰더라도 응답 책임은 계속 분리할 것
- `PortfolioSnapshot`은 현재 범위 밖 기능이므로, 이번 조회 로직에 섞지 말 것
- 동시성 보강 시에는 지갑을 기준으로 같은 락 경로를 유지할 것

## 관련 주요 파일
- `was/src/main/java/com/yogimangchi/domain/asset/controller/v1/mock/MockAssetController.java`
- `was/src/main/java/com/yogimangchi/domain/asset/dto/response/AssetPortfolioDetailResponseDto.java`
- `was/src/main/java/com/yogimangchi/domain/asset/dto/response/HoldingResponseDto.java`
- `was/src/main/java/com/yogimangchi/domain/asset/index/AssetCreateInitializer.java`
- `was/src/main/java/com/yogimangchi/domain/asset/repository/AssetRepository.java`
- `was/src/main/java/com/yogimangchi/domain/asset/service/PortfolioCalculationService.java`
- `was/src/main/java/com/yogimangchi/domain/asset/service/mock/MockAssetService.java`
- `was/src/main/java/com/yogimangchi/domain/member/controller/v1/MemberController.java`
- `was/src/main/java/com/yogimangchi/domain/member/dto/response/ProfilePortfolioResponseDto.java`
- `was/src/main/java/com/yogimangchi/domain/member/repository/MemberRepository.java`
- `was/src/main/java/com/yogimangchi/domain/member/service/MemberPortfolioService.java`
- `was/src/main/java/com/yogimangchi/global/exception/GlobalExceptionHandler.java`
- `was/src/main/java/com/yogimangchi/global/exception/member/MemberException.java`
- `web/app/(default)/assets/page.tsx`
- `web/app/(default)/me/page.tsx`
- `web/app/(default)/member/[memberId]/page.tsx`
- `web/lib/api/client.ts`

## 메모
- 현재 포트폴리오 작업은 "백엔드 구조 분리 + 응답 의미 정리 + 동시성 보강"까지 진행된 상태다.
- 프론트에 전달할 핵심은 아래 3가지다.
  - 자산탭은 상세 API 유지
  - 프로필은 새 프로필 API 사용
  - 프로필 API는 `200/204/404` 의미가 분리됨
- 다음 세션에서는 이 문서를 먼저 읽고, 프론트 연동 또는 테스트 보강부터 이어가는 것이 가장 자연스럽다.
