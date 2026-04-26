# 선물 강제청산 시스템 설명서

> 이 문서는 선물 강제청산이 어떻게 동작하는지를 처음 보는 사람도 이해할 수 있도록 스토리 형식으로 설명합니다.

---

## 강제청산이란?

선물 거래에서는 **레버리지(빚)** 를 사용해서 거래합니다.
예를 들어 10배 레버리지로 비트코인을 샀다면, 가격이 10% 떨어지는 순간 투자한 돈이 전부 사라집니다.
이 시점에 거래소는 유저의 포지션을 강제로 청산시켜버립니다. 이것이 **강제청산**입니다.

거래소 입장에서는 유저의 손실이 증거금을 초과하기 전에 포지션을 닫아야 하기 때문에,
가격이 **청산가**에 도달하는 순간 즉시 처리해야 합니다.

---

## 청산가는 어떻게 계산되나요?

포지션을 열 때 청산가는 자동으로 계산됩니다.

```
LONG (매수) 포지션 청산가 = 진입가 × (1 - 1/레버리지 + 수수료율)
SHORT(매도) 포지션 청산가 = 진입가 × (1 + 1/레버리지 - 수수료율)
```

예시:
```
비트코인 진입가: 10,000원 / 레버리지: 10배
LONG 청산가 = 10,000 × (1 - 0.1 + 0.0005) = 9,005원
→ 비트코인 가격이 9,005원 이하로 내려오면 강제청산
```

수수료를 청산가에 미리 포함시킨 이유는, 청산 실행 시 수수료를 별도로 계산하지 않아도 되고
증거금이 마이너스가 되는 상황을 방지하기 위해서입니다.

---

## 전체 흐름 한눈에 보기

```
[서버 시작]
    ↓
DB에서 OPEN 포지션 심볼 복원 (BootstrapService)
    ↓
Registry에 심볼 등록, Scheduler 시작
    ↓
[실시간 운영]
바이낸스 WebSocket → 마크프라이스 틱 수신
    ↓
Coordinator → Registry 확인 → 스레드풀 → DB 조회 → 청산 판단 → 청산 실행
    ↓
[보험]
Scheduler가 1초마다 Coordinator에 재확인 요청
```

---

## 등장인물 소개

강제청산 시스템은 총 9개의 파일로 구성되어 있습니다.
각각의 역할을 사람에 비유해서 설명합니다.

| 파일 | 비유 | 역할 |
|---|---|---|
| `FuturesLiquidationRegistry` | 명단 관리자 | 어떤 심볼을 감시해야 하는지 기억 |
| `FuturesLiquidationBootstrapService` | 출근 준비 담당 | 서버 시작 시 명단 복원 |
| `FuturesLiquidationCoordinator` | 메인 감시원 | 가격 틱마다 청산 여부 판단 |
| `FuturesLiquidationScheduler` | 보조 감시원 | 1초마다 메인 감시원이 놓친 것 재확인 |
| `FuturesLiquidationExecutionService` | 집행관 | 실제 청산 처리 |
| `LiquidationPriceWindow` | 가격 메모장 | 처리 중 들어온 가격들을 기록 |
| `FuturesLiquidationEventListener` | 연락 담당자 | 포지션 오픈/청산 소식을 듣고 명단 갱신 |
| `PositionOpenedEvent` | 오픈 알림 메시지 | "새 포지션이 생겼어요" |
| `PositionClosedEvent` | 청산 알림 메시지 | "포지션이 닫혔어요" |

---

## 스토리 1 — 서버가 시작될 때

서버가 켜지면 `FuturesLiquidationBootstrapService`가 가장 먼저 일어납니다.

서버가 꺼져 있는 동안에도 유저들의 포지션은 DB에 그대로 남아있습니다.
하지만 강제청산 감시 목록(`FuturesLiquidationRegistry`)은 메모리에 있기 때문에 서버가 꺼지면 사라집니다.

그래서 Bootstrap이 DB를 열어 현재 OPEN 상태인 포지션들의 심볼 목록을 가져와서 Registry에 다시 등록합니다.

```
서버 시작
  → DB 조회: "현재 OPEN 포지션이 있는 심볼이 뭐야?"
  → [BTCUSDT, ETHUSDT, XRPUSDT] 반환
  → Registry에 등록
  → Scheduler 시작
  → 감시 준비 완료
```

이 작업이 없다면 서버를 재시작할 때마다 모든 포지션이 감시 대상에서 빠져
강제청산이 발생하지 않는 심각한 버그가 생깁니다.

---

## 스토리 2 — 유저가 포지션을 열 때

유저가 비트코인 LONG 포지션을 열면 `FuturesOrderService`에서 처리됩니다.

DB에 포지션이 저장되고 트랜잭션이 커밋된 후,
`PositionOpenedEvent`라는 알림 메시지가 발행됩니다.

```
유저: "비트코인 LONG 포지션 열겠습니다"
  → DB에 포지션 저장
  → 트랜잭션 커밋 성공
  → "BTCUSDT 포지션 열렸어요" 알림 발행
  → FuturesLiquidationEventListener가 알림 수신
  → Registry에 BTCUSDT 등록 (보유자 수 +1)
  → Scheduler에 "감시 시작해" 신호
```

**커밋 성공 후에만 Registry에 등록하는 이유:**
DB 저장이 실패해서 롤백됐는데 Registry에만 등록된 상태가 되면,
존재하지 않는 포지션을 계속 감시하는 문제가 생깁니다.
커밋이 확정된 후에 등록함으로써 DB와 메모리가 항상 일치하도록 보장합니다.

**보유자 수로 관리하는 이유:**
만약 유저A와 유저B가 모두 BTCUSDT 포지션을 들고 있다면,
유저A가 청산되더라도 유저B의 포지션이 남아있으므로 감시를 계속해야 합니다.
단순히 있냐/없냐가 아니라 몇 명이 보유 중인지를 세어야 올바른 타이밍에 감시를 해제할 수 있습니다.

```
유저A 오픈 → BTCUSDT 보유자 수: 1
유저B 오픈 → BTCUSDT 보유자 수: 2
유저A 청산 → BTCUSDT 보유자 수: 1 (감시 유지)
유저B 청산 → BTCUSDT 보유자 수: 0 → 감시 해제
```

---

## 스토리 3 — 실시간 가격 감시

바이낸스 WebSocket에서 마크프라이스 틱이 들어오면
`BinanceFuturesApiService`가 받아서 `FuturesLiquidationCoordinator`에 전달합니다.

```
바이낸스: "BTCUSDT 마크프라이스 48,000원"
  → Coordinator: "BTCUSDT 감시 대상이야?" → Registry 확인
  → 감시 대상 아니면: 즉시 종료 (DB 조회 없음)
  → 감시 대상이면: 처리 시작
```

Registry 확인은 메모리에서 즉시 이루어지므로 DB를 전혀 건드리지 않습니다.
심볼이 20개인데 3개만 포지션이 있다면,
나머지 17개 심볼의 틱은 Registry에서 바로 걸러져 스레드풀까지 도달하지 않습니다.

---

## 스토리 4 — 가격 범위 누적 (PriceWindow)

Coordinator가 틱을 받으면 가장 먼저 하는 일은 가격을 `LiquidationPriceWindow`에 누적하는 것입니다.

왜 가격 하나가 아니라 범위로 관리할까요?

실제 청산 처리(DB 조회, 청산 실행)는 시간이 걸립니다.
그 사이에 틱이 계속 들어오는데, 처리 중인 심볼은 새 틱을 처리할 수 없습니다.
이때 들어온 틱들을 그냥 버리면 중간에 청산가를 지나친 가격을 놓칠 수 있습니다.

```
틱1: 50,000원 → 처리 시작
틱2: 48,000원 → 처리 중, PriceWindow에 누적
틱3: 47,000원 → 처리 중, PriceWindow에 누적

PriceWindow = { 최솟값: 47,000, 최댓값: 50,000, 최신값: 47,000 }

처리 완료 → PriceWindow 꺼냄
→ 청산가 48,500원인 포지션 → 최솟값(47,000) <= 청산가(48,500) → 청산 트리거
```

PriceWindow가 없었다면 틱2, 틱3이 처리 중에 유실되어
청산가 48,500원짜리 포지션을 놓쳤을 것입니다.

---

## 스토리 5 — 중복 처리 방지

같은 심볼이 동시에 두 번 처리되면 어떻게 될까요?
같은 포지션을 두 스레드가 동시에 청산하려 할 수 있습니다.

이를 막기 위해 `markProcessing()`이라는 잠금 장치가 있습니다.

```
스레드A: BTCUSDT 처리 시작 → markProcessing("BTCUSDT") → true (잠금 성공)
스레드B: BTCUSDT 처리 시도 → markProcessing("BTCUSDT") → false (이미 잠김) → 즉시 종료
스레드A: 처리 완료 → unmarkProcessing("BTCUSDT") → 잠금 해제
```

처리가 끝난 후에는 반드시 잠금을 해제해야 합니다.
해제하지 않으면 그 심볼은 영원히 처리되지 않는 상태가 됩니다.
이를 방지하기 위해 `finally` 블록에서 무조건 해제합니다.

---

## 스토리 6 — 청산 판단 및 실행

스레드풀 안에서 실제 청산 판단이 이루어집니다.

```
DB에서 BTCUSDT OPEN 포지션 전체 조회
  → 포지션A: LONG, 청산가 47,500원
  → 포지션B: LONG, 청산가 46,000원
  → 포지션C: SHORT, 청산가 51,000원

PriceWindow = { 최솟값: 47,000, 최댓값: 50,000 }

판단:
  포지션A: LONG → 최솟값(47,000) <= 청산가(47,500) → 청산 트리거 ✅
  포지션B: LONG → 최솟값(47,000) <= 청산가(46,000) → 미달 ❌
  포지션C: SHORT → 최댓값(50,000) >= 청산가(51,000) → 미달 ❌
```

트리거된 포지션A의 청산은 `FuturesLiquidationExecutionService`가 처리합니다.

청산 처리 순서:
1. 포지션 조회 (비관적 락 — 동시에 두 번 청산되는 것을 DB 수준에서 방지)
2. 이미 청산된 포지션이면 스킵 (다른 스레드가 먼저 처리한 경우)
3. 지갑 조회 (비관적 락 — 잔고 동시 수정 방지)
4. 실현손익 계산
5. 정산금액 = 증거금 + 실현손익 (양수이면 지갑에 반환)
6. 포지션 CLOSE 상태로 전환
7. Registry 보유자 수 -1

강제청산은 항상 전량 청산입니다. 부분 청산은 없습니다.

---

## 스토리 7 — 보조 스케줄러의 역할

WebSocket은 완벽하지 않습니다.
네트워크 문제로 잠깐 끊기거나 틱이 누락될 수 있습니다.
이런 상황에서 청산이 누락되는 것을 방지하기 위해 `FuturesLiquidationScheduler`가 존재합니다.

```
매 1초마다
  → Registry에서 감시 중인 심볼 목록 조회
  → 각 심볼에 대해 Coordinator에 재확인 요청
  → Coordinator: 이미 처리 중이면 즉시 return (부담 없음)
  → Coordinator: 놓친 것이 있으면 처리 시작
```

틱이 정상적으로 오고 있다면 Coordinator가 이미 처리 중이므로
스케줄러의 요청은 즉시 return되어 실제 부담은 거의 없습니다.

WebSocket이 끊겼다가 재연결되는 그 짧은 순간,
스케줄러가 마지막으로 저장된 가격을 기준으로 청산 여부를 재확인합니다.

스케줄러는 감시할 심볼이 하나도 없으면 자동으로 멈추고,
새 포지션이 생기면 다시 시작합니다. 불필요할 때는 아예 동작하지 않습니다.

---

## 스토리 8 — 유저가 직접 포지션을 닫을 때

유저가 직접 포지션을 청산하면 `FuturesOrderService`에서 처리됩니다.

```
유저: "BTCUSDT LONG 포지션 청산하겠습니다"
  → DB 포지션 상태 CLOSE로 변경
  → 트랜잭션 커밋 성공
  → "BTCUSDT 포지션 닫혔어요" 알림 발행
  → FuturesLiquidationEventListener가 알림 수신
  → Registry BTCUSDT 보유자 수 -1
  → 보유자 수가 0이 되면 감시 목록에서 제거
  → Scheduler에 "감시할 심볼 없으면 멈춰" 신호
```

부분 청산의 경우 포지션이 아직 존재하므로 알림을 발행하지 않습니다.
완전히 청산되었을 때만 알림을 발행합니다.

---

## 전체 구성 요약

```
[포지션 오픈]
FuturesOrderService → PositionOpenedEvent → FuturesLiquidationEventListener
                                               → Registry.register()
                                               → Scheduler.refreshSchedule()

[실시간 감시]
Binance WebSocket → BinanceFuturesApiService
                     → Coordinator.onPriceTick()
                         → Registry.isWatched() (인메모리 필터)
                         → Registry.updatePriceWindow() (가격 누적)
                         → Registry.markProcessing() (중복 방지)
                         → ExecutorService (비동기 스레드풀)
                             → DB 조회 (OPEN 포지션 목록)
                             → 청산가 비교
                             → ExecutionService.executeLiquidation() (청산 실행)
                             → Registry.deregister()

[보험]
Scheduler (1초마다) → Coordinator.requestReplay() → 동일한 경로

[포지션 완전 청산]
FuturesOrderService → PositionClosedEvent → FuturesLiquidationEventListener
                                              → Registry.deregister()
                                              → Scheduler.stopIfIdle()

[서버 재시작]
FuturesLiquidationBootstrapService → DB 조회 → Registry 복원 → Scheduler 시작
```

---

## 설계 포인트 정리

**왜 DB를 매 틱마다 조회하지 않나요?**

틱은 초당 수십 번 들어옵니다. 심볼이 20개라면 초당 수백 번의 DB 조회가 발생합니다.
Registry가 인메모리에서 "이 심볼 감시 대상이야?"를 먼저 걸러주기 때문에
DB 조회는 실제로 청산 판단이 필요한 심볼에서만 발생합니다.

**왜 카운트(숫자)로 관리하나요?**

여러 유저가 같은 심볼의 포지션을 들고 있을 때,
한 명이 청산되었다고 해서 감시를 해제하면 안 됩니다.
카운트가 정확히 0이 되었을 때만 감시를 해제함으로써
다른 유저의 포지션이 보호받습니다.

**왜 AFTER_COMMIT을 사용하나요?**

DB 저장이 실패해서 롤백되었는데 Registry에 등록이 된다면,
존재하지 않는 포지션을 감시하는 유령 상태가 됩니다.
트랜잭션이 성공적으로 커밋된 후에만 Registry를 변경함으로써
DB와 메모리의 일치를 보장합니다.



## 전체 흐름 분석

강제청산 트리거 경로
─────────────────────────────────────────────────────────────                                                                                                                  
[BinanceFuturesApiService] 마크프라이스 틱 수신
↓ onPriceTick(symbol, price)                                                                                                                                                 
[FuturesLiquidationCoordinator]                                                                                                                                                
↓ updatePriceWindow()   ← 틱 누락 없이 범위 누적                                                                                                                             
↓ isWatched() 확인      ← 감시 대상 없으면 즉시 return                                                                                                                       
↓ markProcessing()      ← 중복 처리 방지 게이트                                                                                                                              
↓ executorService.submit(processSymbol)  ← WebSocket 스레드 비블로킹                                                                                                         
[스레드풀 내부 processSymbol()]                                                                                                                                                
↓ drainPriceWindow()    ← 누적 가격 범위 꺼냄                                                                                                                                
↓ findAllOpenBySymbol() ← DB에서 OPEN 포지션 조회                                                                                                                            
↓ isLiquidationTriggered() ← LONG: min <= 청산가 / SHORT: max >= 청산가                                                                                                      
↓ executeLiquidation() (포지션별 독립 @Transactional)                                                                                                                        
[FuturesLiquidationExecutionService]                                                                                                                                           
↓ findByIdForUpdate()   ← 포지션 비관적 락                                                                                                                                   
↓ findByIdForUpdate()   ← 지갑 비관적 락                                                                                                                                     
↓ realizedPnl 계산                                                                                                                                                           
↓ wallet.addMoney(settlement)                                                                                                                                                
↓ position.reduce()     ← CLOSE 상태 전환                                                                                                                                    
↓ publishEvent(PositionClosedEvent)  ← 이벤트 발행 (커밋 전)                                                                                                                 
↓ [트랜잭션 커밋]                                                                                                                                                            
[FuturesLiquidationEventListener] AFTER_COMMIT                                                                                                                                 
↓ liquidationRegistry.deregister()  ← 커밋 확정 후 Registry 해제                                                                                                             
↓ liquidationScheduler.stopIfIdle() ← 감시 심볼 없으면 스케줄러 중지

유저 청산(FuturesOrderService) 경로도 동일한 AFTER_COMMIT 흐름 사용
                                                                                                                                                                                 
---                                                                                                                                                                            
흐름 이상 없음 — 확인된 보장 사항

┌────────────────────────────────────┬────────────────────────────────────────────────────────────────────────────┐
│              시나리오                │                                    동작                                     │                                                            
├────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
│ 강제청산 트랜잭션 롤백                   │ 커밋 전이므로 AFTER_COMMIT 미실행 → Registry 변화 없음 ✅                         │                                                            
├────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
│ 동시에 같은 포지션 두 번 청산 시도         │ findByIdForUpdate 락 + PositionStatus != OPEN 체크로 두 번째 즉시 스킵 ✅        │                                                            
├────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤                                                            
│ WebSocket 재연결 중 틱 없음            │ 스케줄러 1초마다 requestReplay → 마크프라이스 보정 후 처리 ✅                        │                                                            
├────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤                                                            
│ 서버 재시작                           │ FuturesLiquidationBootstrapService가 DB의 OPEN 포지션을 Registry에 복원 ✅      │
├────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤                                                            
│ 처리 중 새 틱 유입                     │ updatePriceWindow로 누적 → hasPendingPriceWindow 확인 후 루프 재진입 ✅          │
├────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤

