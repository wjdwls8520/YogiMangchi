# Notification Handoff

## 문서 목적
- 이 문서는 알림 기능 작업을 다른 PC나 다른 세션에서 바로 이어가기 위한 handoff 문서다.
- 단순 구현 목록이 아니라, `설계 의도`, `확정된 정책`, `현재 구조`, `남은 작업`, `주의할 점`까지 함께 정리한다.
- 작업 재개 시에는 이 문서를 먼저 읽고 현재 상태를 파악한 뒤 다음 구현을 진행하면 된다.

## 작업 재개 시 사용하면 좋은 요청 예시
- "`docs/notification-handoff.md` 먼저 읽고 현재 알림 구조와 정책을 파악한 뒤, 남은 작업 중 팔로우 알림부터 이어서 진행해줘."
- "`docs/notification-handoff.md` 기준으로 현재 구현 상태를 점검하고, 아직 안 된 작업만 정리해줘."
- "`docs/notification-handoff.md` 참고해서 커뮤니티 알림 구조를 이해한 뒤 테스트 체크리스트부터 다시 만들어줘."

## 전체 설계 방향

### 1. 공통 알림 엔티티 사용
- 모든 알림은 공통 `Notification` 엔티티를 사용한다.
- 알림 종류는 `NotificationCategory`, `NotificationType`, `payload` 조합으로 확장한다.
- 메시지와 링크는 백엔드에서 완성하지 않고, 프론트에서 `type/category/payload`를 바탕으로 조립하는 방식으로 간다.

### 2. SSE는 공통 채널 1개 사용
- 회원당 SSE 채널은 하나로 유지한다.
- 여러 종류의 알림을 같은 채널로 보내되, `event name`을 분리해서 프론트가 빠르게 분기할 수 있게 했다.
- 예:
  - `NOTIFICATION_MOCK_ORDER_COMPLETED`
  - `NOTIFICATION_COMMUNITY_POST_COMMENT_CREATED`
  - `NOTIFICATION_COMMUNITY_POST_LIKED`

### 3. 도메인별 트랜잭션 전략 분리
- 트레이드 알림:
  - 정합성이 더 중요해서 `afterCommit + REQUIRES_NEW` 유지
- 커뮤니티 알림:
  - DB 커넥션 점유와 책임 분리를 고려해 `Facade + 순차 호출` 구조로 정리
  - 본작업 서비스는 저장/검증만 담당
  - 파사드가 `알림 저장 -> SSE 전송 -> 응답 조립`을 맡는다

### 4. Self 알림 미생성
- `actor == receiver` 인 경우 알림을 만들지 않는다.
- 예:
  - 내 게시글에 내가 댓글
  - 내 댓글에 내가 좋아요
  - 내 게시글에 내가 좋아요

## 구현 완료 상태

### 1. 공통 알림 기능
- SSE 구독 API 구현 완료
- heartbeat 전송 및 끊어진 emitter 정리 완료
- 알림 목록 조회 API 완료
- 알림 상태 조회 API 완료
- 확인(check) API 완료
- 단건 읽음 / 다건 읽음 / 전체 읽음 / 단건 삭제 / 다건 삭제 / 읽은 알림 삭제 완료
- `NotificationState` 분리 완료
- `hasNew`, `hasUnread`, `newCount`, `unreadCount` 기반 상태 관리 완료

### 2. 트레이드 알림
- 시장가 체결 알림 완료
- 지정가 체결 알림 완료
- 카테고리/이벤트명 분리 완료
- 지갑 표기(`(모의투자)`, `(트레이딩-현물)` 등) payload 반영 완료
- 현재 범위:
  - 체결 알림만 완료
  - 부분 체결 / 취소 알림은 아직 미구현

### 3. 커뮤니티 댓글 알림
- 게시글 댓글 알림 완료
- 대댓글 알림 완료
- target 지정 답글 알림 완료
- 댓글 내용 preview(40자, 줄바꿈/공백 정리) 유틸 적용 완료
- `ReplyService -> ReplyCreatedResultDto -> CommunityReplyFacadeService -> NotificationService -> NotificationSseService` 구조 완성

### 4. 커뮤니티 좋아요 알림
- 게시글 좋아요 알림 완료
- 댓글 좋아요 알림 완료
- 좋아요는 `최초 1회만 알림` 정책 적용 완료
- `NotificationDedupeState` 도입 완료
- 좋아요도 댓글과 마찬가지로 파사드 구조로 정리 완료
  - `LikeService -> PostLikeCreatedResultDto / ReplyLikeCreatedResultDto -> CommunityLikeFacadeService -> NotificationService -> NotificationSseService`
- receiver 활성 여부 확인(`findActiveById`)까지 반영 완료

### 5. 커뮤니티 팔로우 알림
- 팔로우 알림 완료
- payload 확정 완료
  - `actorMemberId`
  - `actorNickname`
  - `actorProfileImageUrl`
- 팔로우도 파사드 구조로 정리 완료
  - `FollowService -> FollowCreatedResultDto -> FollowFacadeService -> NotificationService -> NotificationSseService`
- receiver 활성 여부 확인(`findActiveById`) 반영 완료
- `NotificationDedupeState.lastNotifiedAt` 기반 쿨타임 재알림 정책 반영 완료
- 쿨타임 기간 `1일`로 최종 확정

## 확정된 정책

### 1. 공통 정책
- 메시지/링크는 프론트 조립형
- 백엔드는 `category`, `type`, `payload`, `eventName` 중심으로 제공
- 알림 목록 조회는 `receiver` 기준이다
- `actorMemberId`는 행동한 사람이지, 알림을 받는 사람이 아니다

### 2. 커뮤니티 댓글 정책
- 게시글 댓글: 게시글 작성자에게 알림
- 대댓글: `targetReplyMemberId` 우선, 없으면 `parentReplyMemberId`
- self 알림 없음
- 댓글/답글은 매번 알림 생성
- payload는 최소 조립 가능 정보만 포함
  - `actorNickname`
  - `actorProfileImageUrl`
  - `postId`, `replyId`, `parentReplyId`, `targetReplyId`
  - `replyContentPreview`

### 3. 좋아요 정책
- 게시글 좋아요: 최초 1회만 알림
- 댓글 좋아요: 최초 1회만 알림
- 좋아요 취소 후 재좋아요해도 다시 알림 보내지 않음
- self 좋아요는 알림 없음
- self 좋아요는 `dedupe_state` row도 만들지 않음

### 4. 팔로우 정책
- 팔로우 알림은 구현 완료
- 좋아요처럼 무조건 최초 1회 고정이 아니라 `쿨타임 기반 재알림` 정책을 사용
- 쿨타임은 `1일`로 최종 확정
- 같은 actor가 같은 receiver를 다시 팔로우하더라도
  - 현재 팔로우 상태에서 중복 요청이면 알림 없음
  - 언팔로우 후 재팔로우라도 쿨타임 이내면 알림 없음
  - 언팔로우 후 재팔로우 시 쿨타임이 지나면 다시 알림 허용

### 5. 신고/운영 알림 정책
- 아직 미구현
- 커뮤니티 일반 알림과 분리된 `운영/제재 알림` 성격으로 다룰 예정

### 6. 묶음 알림 정책
- 아직 미구현
- 방향은 확정:
  - 댓글은 묶지 않음
  - 좋아요만 묶음 알림 후보
- 나중에 `group_state`, `lastEventAt`, update/create SSE 정책을 함께 고려해야 함

## 현재 구조

### 1. 주요 레이어
- `ReplyService`, `LikeService`
  - 본작업 저장/검증/카운트 반영 담당
- `CommunityReplyFacadeService`, `CommunityLikeFacadeService`
  - 유스케이스 전체 흐름 조립
  - 알림 저장과 SSE 전송 연결
- `NotificationService`
  - 알림 row 저장
  - payload JSON 직렬화
  - receiver 검증 / dedupe 판단
- `NotificationSseService`
  - SSE 구독 / heartbeat / 전송 담당

### 2. 내부 DTO를 따로 둔 이유
- `ReplyDetailDto`, `LikeResponseDto`는 API 응답용
- 내부 알림 처리에는 응답보다 더 많은 정보가 필요함
- 그래서 아래 내부 결과 DTO를 둠
  - `ReplyCreatedResultDto`
  - `PostLikeCreatedResultDto`
  - `ReplyLikeCreatedResultDto`
- 이 DTO는
  - 알림 생성 재료
  - 응답 변환 재료
  를 동시에 담는다

### 3. 좋아요 구조 변경 이유
- 초기에는 `LikeService` 안에서
  - 좋아요 저장
  - 알림 저장
  - SSE 전송
  을 모두 처리했음
- 이후 점검 결과:
  - 알림 저장 실패가 좋아요를 롤백시킬 수 있음
  - SSE가 커밋 전에 먼저 나갈 수 있음
- 그래서 댓글과 같은 방식으로 파사드 구조로 정리함

## Dedupe / State 설계

### 1. `NotificationDedupeState`를 둔 이유
- 좋아요/팔로우처럼 같은 사람이 반복 행동을 할 때 알림 중복을 제어하기 위해 사용
- 알림 테이블만 보고 중복 여부를 판단하면
  - 알림 삭제
  - 좋아요 토글
  상황에서 정책이 흔들릴 수 있음

### 2. 현재 사용 방식
- 좋아요:
  - `insert ... on conflict do nothing`
  - 성공하면 최초 알림
  - 실패하면 이미 보낸 적 있는 알림이라 스킵
- 팔로우:
  - 최초 알림은 `insert ... on conflict do nothing`
  - 기존 row가 있으면 `lastNotifiedAt` 기준 쿨타임 계산 후 재알림
  - 쿨타임은 `1일`
  - 재알림 가능 시 `lastNotifiedAt`을 조건부 update로 갱신

### 3. 핵심 필드 의미
- `notificationType`
  - 어떤 알림의 dedupe 상태인지
- `actor`
  - 행동한 사람
- `receiver`
  - 알림 받은 사람
- `targetType`
  - `POST`, `REPLY`, `MEMBER`
- `targetId`
  - 대상 리소스 id
- `firstNotifiedAt`
  - 최초 알림 발생 시각
- `lastNotifiedAt`
  - 마지막 알림 발생 시각

## 활성 receiver 확인을 넣은 이유
- 좋아요 알림은 이제 `NotificationService`에서 receiver를 `findActiveById()`로 다시 조회한다.
- 팔로우 알림도 `NotificationService`에서 receiver를 `findActiveById()`로 다시 조회한다.
- 목적:
  - 탈퇴 회원(`deleteYn = 'Y'`)에게 알림 row가 쌓이지 않게 하기 위함
  - 탈퇴 회원에게 `dedupe_state` row도 쌓이지 않게 하기 위함
- 즉 비활성 receiver면:
  - 알림 생성 안 함
  - dedupe 저장 안 함
  - SSE 전송 안 함

## SSE 이벤트명 규칙

### 1. 트레이드
- `NOTIFICATION_MOCK_ORDER_COMPLETED`
- `NOTIFICATION_TRADE_ORDER_COMPLETED`
- `NOTIFICATION_CONTEST_ORDER_COMPLETED`

### 2. 커뮤니티
- `NOTIFICATION_COMMUNITY_POST_COMMENT_CREATED`
- `NOTIFICATION_COMMUNITY_REPLY_COMMENT_CREATED`
- `NOTIFICATION_COMMUNITY_POST_LIKED`
- `NOTIFICATION_COMMUNITY_REPLY_LIKED`
- `NOTIFICATION_COMMUNITY_FOLLOW_CREATED`

## 현재 확인된 테스트 결과

### 1. 댓글 알림
- 게시글 댓글 알림 정상
- 대댓글 알림 정상
- target 지정 답글 알림 정상
- payload 값 정상
- self 알림 스킵 정상

### 2. 좋아요 알림
- 게시글 좋아요 첫 알림 정상
- 댓글 좋아요 첫 알림 정상
- self 좋아요 스킵 정상
- 좋아요 취소 후 재좋아요 시 재알림 없음
- dedupe_state row 정상 생성
- receiver 계정 기준으로만 조회/수신되는 것 확인 완료

### 3. 팔로우 알림
- 첫 팔로우 알림 정상
- 현재 팔로우 상태에서 중복 요청 시 재알림 없음
- 언팔로우 후 즉시 재팔로우 시 쿨타임 이내 재알림 없음
- 쿨타임 이후 재팔로우 시 재알림 정상
- self 팔로우 방어 정상
- receiver 비활성 계정일 때 알림/`dedupe_state` 미생성 확인
- SSE 이벤트명 `NOTIFICATION_COMMUNITY_FOLLOW_CREATED` 정상

## 남은 작업 우선순위

### 1순위: 신고/운영 알림
- 일반 커뮤니티 알림과 분리된 운영 알림 설계
- receiver, category, type, payload 정책 정리 후 구현

### 2순위: 좋아요 묶음 알림
- 댓글은 제외
- 좋아요만 묶음 후보
- `group_state`, `lastEventAt`, update/create SSE 정책 필요

### 3순위: 실시간 UX 이벤트
- 저장형 알림과 별개
- 예:
  - 게시글 상세에서 `새 댓글이 있습니다`
  - 목록에서 `새 글이 있습니다`

## 주의할 점
- `actorMemberId`와 `receiver`를 혼동하지 말 것
- 알림 목록 조회는 항상 `receiver` 기준
- self 알림은 생성하지 않음
- 좋아요는 최초 1회, 댓글은 매번
- 메시지/링크는 프론트 조립형 유지
- 좋아요와 댓글 모두 지금은 파사드 구조로 정리되어 있음
- 트레이드는 `afterCommit + REQUIRES_NEW`, 커뮤니티는 `Facade + 순차 호출`

## 관련 주요 파일

### 커뮤니티 댓글
- `was/src/main/java/com/yogimangchi/domain/community/service/ReplyService.java`
- `was/src/main/java/com/yogimangchi/domain/community/facade/CommunityReplyFacadeService.java`
- `was/src/main/java/com/yogimangchi/domain/community/dto/result/ReplyCreatedResultDto.java`

### 커뮤니티 좋아요
- `was/src/main/java/com/yogimangchi/domain/community/service/LikeService.java`
- `was/src/main/java/com/yogimangchi/domain/community/facade/CommunityLikeFacadeService.java`
- `was/src/main/java/com/yogimangchi/domain/community/dto/result/PostLikeCreatedResultDto.java`
- `was/src/main/java/com/yogimangchi/domain/community/dto/result/ReplyLikeCreatedResultDto.java`

### 커뮤니티 팔로우
- `was/src/main/java/com/yogimangchi/domain/member/service/FollowService.java`
- `was/src/main/java/com/yogimangchi/domain/member/facade/FollowFacadeService.java`
- `was/src/main/java/com/yogimangchi/domain/member/dto/result/FollowCreatedResultDto.java`
- `was/src/main/java/com/yogimangchi/domain/notification/dto/payload/FollowCreatedNotificationPayload.java`

### 알림 공통
- `was/src/main/java/com/yogimangchi/domain/notification/service/NotificationService.java`
- `was/src/main/java/com/yogimangchi/domain/notification/service/NotificationSseService.java`
- `was/src/main/java/com/yogimangchi/domain/notification/entity/Notification.java`
- `was/src/main/java/com/yogimangchi/domain/notification/entity/NotificationState.java`
- `was/src/main/java/com/yogimangchi/domain/notification/entity/NotificationDedupeState.java`
- `was/src/main/java/com/yogimangchi/domain/notification/repository/NotificationDedupeStateRepository.java`

## 빌드 확인
- 최근 구조 변경 후 `was` 디렉터리에서 아래 명령으로 컴파일 확인 완료

```bash
./gradlew.bat compileJava
```

## 메모
- 자동화 테스트는 아직 작성하지 않았음
- 현재는 수동 테스트와 구조 점검 중심으로 진행 중
- 팔로우 알림까지 구현 및 수동 검증 완료
- 다음 세션에서는 이 문서를 먼저 읽고, 남은 작업 중 `신고/운영 알림`부터 이어가는 것이 가장 자연스럽다
